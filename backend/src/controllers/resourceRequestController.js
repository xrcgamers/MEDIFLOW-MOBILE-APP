const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");
const {
  resolveResourceDelayAlerts,
} = require("../services/automationResolutionService");
const { runAndStoreAiPriority } = require("../services/aiPriorityService");
const {
  ensureIncidentQueuePriority,
} = require("../services/incidentQueueService");

function mapCategoryToSection(categoryName) {
  switch (categoryName) {
    case "BLOOD":
      return "BLOOD_BANK_STAFF";
    case "IMAGING":
      return "IMAGING_STAFF";
    case "THEATRE":
      return "THEATRE_STAFF";
    case "BED":
      return "BED_MANAGER";
    default:
      return null;
  }
}

function normalizeQuantity(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function deriveInventoryStatus(item, availableQuantity) {
  if (item.status === "INACTIVE") return "INACTIVE";

  if (availableQuantity === null || availableQuantity === undefined) {
    return item.status || "AVAILABLE";
  }

  const available = Number(availableQuantity);
  const current = Number(item.currentQuantity || 0);
  const categoryName = String(item.category?.name || "").toUpperCase();
  const unit = String(item.unitOfMeasure || "").toLowerCase();

  const reusable =
    ["IMAGING", "THEATRE"].includes(categoryName) ||
    ["unit", "units", "room", "rooms", "machine", "scanner"].includes(unit);

  if (available <= 0) return "RESERVED";
  if (reusable && available >= 1) return "AVAILABLE";
  if (available <= 2) return "CRITICAL";
  if (current > 0 && available / current <= 0.25) return "LOW";
  if (available <= 5) return "LOW";

  return "AVAILABLE";
}

async function releaseReusablePatientAllocations({
  tx,
  patientId,
  categories,
  reason,
  changedByUserId,
}) {
  const allocations = await tx.resourceAllocation.findMany({
    where: {
      allocationStatus: "ACTIVE",
      resourceRequest: {
        patientId,
        resourceCategory: {
          name: {
            in: categories,
          },
        },
      },
    },
    include: {
      resourceItem: {
        include: {
          category: true,
        },
      },
      resourceRequest: {
        include: {
          resourceCategory: true,
        },
      },
    },
  });

  for (const allocation of allocations) {
    const item = allocation.resourceItem;

    const restoredQty =
      item.availableQuantity === null || item.availableQuantity === undefined
        ? null
        : Number(item.availableQuantity) + Number(allocation.reservedQuantity || 1);

    const nextStatus =
      restoredQty === null ? item.status : deriveInventoryStatus(item, restoredQty);

    await tx.resourceAllocation.update({
      where: { id: allocation.id },
      data: {
        allocationStatus: "RELEASED",
        releasedAt: new Date(),
        releaseReason: reason,
      },
    });

    await tx.resourceItem.update({
      where: { id: item.id },
      data: {
        availableQuantity: restoredQty,
        status: nextStatus,
        statusEvents: {
          create: {
            oldStatus: item.status,
            newStatus: nextStatus,
            relatedPatientId: patientId,
            changedByUserId: changedByUserId || null,
            note: reason,
          },
        },
      },
    });

    const nextFulfilled = Math.max(
      0,
      Number(allocation.resourceRequest.fulfilledQuantity || 0) -
        Number(allocation.reservedQuantity || 1)
    );

    await tx.resourceRequest.update({
      where: { id: allocation.resourceRequestId },
      data: {
        fulfilledQuantity: nextFulfilled,
        requestStatus: nextFulfilled <= 0 ? "REQUESTED" : "PARTIALLY_ALLOCATED",
      },
    });
  }

  return allocations.length;
}

async function getResourceRequests(req, res) {
  try {
    const {
      requestStatus,
      assignedSectionRole,
      resourceCategoryName,
      patientId,
      incidentId,
    } = req.query;

    const requests = await prisma.resourceRequest.findMany({
      where: {
        ...(requestStatus ? { requestStatus } : {}),
        ...(assignedSectionRole ? { assignedSectionRole } : {}),
        ...(patientId ? { patientId } : {}),
        ...(incidentId ? { incidentId } : {}),
        ...(resourceCategoryName
          ? { resourceCategory: { name: resourceCategoryName } }
          : {}),
      },
      include: {
        patient: true,
        incident: true,
        resourceCategory: true,
        primaryResourceItem: {
          include: {
            category: true,
          },
        },
        allocations: {
          include: {
            resourceItem: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            allocatedAt: "desc",
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource requests",
      error: error.message,
    });
  }
}

async function createPatientResourceRequest(req, res) {
  try {
    const { patientId } = req.params;

    const {
      resourceCategoryId,
      priority = null,
      requestReason,
      requestedQuantity = null,
      unitOfMeasureSnapshot = null,
    } = req.body;

    if (!resourceCategoryId || !requestReason) {
      return res.status(400).json({
        success: false,
        message: "resourceCategoryId and requestReason are required",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const resourceCategory = await prisma.resourceCategory.findUnique({
      where: { id: resourceCategoryId },
    });

    if (!resourceCategory) {
      return res.status(404).json({
        success: false,
        message: "Resource category not found",
      });
    }

    const assignedSectionRole = mapCategoryToSection(resourceCategory.name);

    if (!assignedSectionRole) {
      return res.status(400).json({
        success: false,
        message: `No section mapping configured for category ${resourceCategory.name}`,
      });
    }

    const request = await prisma.resourceRequest.create({
      data: {
        incidentId: patient.incidentId,
        patientId: patient.id,
        resourceCategoryId,
        assignedSectionRole,
        priority,
        requestReason,
        requestStatus: "REQUESTED",
        requestedQuantity: normalizeQuantity(requestedQuantity),
        approvedQuantity: null,
        fulfilledQuantity: 0,
        unitOfMeasureSnapshot,
      },
      include: {
        patient: true,
        incident: true,
        resourceCategory: true,
        primaryResourceItem: {
          include: {
            category: true,
          },
        },
        allocations: {
          include: {
            resourceItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: patient.id,
        incidentId: patient.incidentId,
        eventLabel: "Resource Requested",
        eventStatus: "REQUESTED",
        note: `${request.resourceCategory.name}: ${requestReason}`,
      },
    });

    const aiAssessment = await runAndStoreAiPriority(patient.incidentId);
    const queuePriority = await ensureIncidentQueuePriority(patient.incidentId);

    await createAuditLog({
      actionType: "RESOURCE_REQUEST_CREATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: patient.incidentId,
      patientId: patient.id,
      resourceRequestId: request.id,
      targetTable: "ResourceRequest",
      targetId: request.id,
      newValue: {
        requestStatus: request.requestStatus,
        assignedSectionRole,
        priority,
        requestedQuantity: request.requestedQuantity,
        approvedQuantity: null,
        fulfilledQuantity: request.fulfilledQuantity,
      },
      reason: requestReason,
    });

    return res.status(201).json({
      success: true,
      data: {
        request,
        aiAssessment,
        queuePriority,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create resource request",
      error: error.message,
    });
  }
}

async function updateResourceRequest(req, res) {
  try {
    const { requestId } = req.params;
    const {
      requestStatus,
      rejectionReason = null,
      priority,
      approvedQuantity,
      requestedQuantity,
      fulfilledQuantity,
      unitOfMeasureSnapshot,
    } = req.body;

    const existing = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        resourceCategory: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resource request not found",
      });
    }

    const updated = await prisma.resourceRequest.update({
      where: { id: requestId },
      data: {
        ...(requestStatus ? { requestStatus } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
        ...(approvedQuantity !== undefined
          ? { approvedQuantity: normalizeQuantity(approvedQuantity) }
          : {}),
        ...(requestedQuantity !== undefined
          ? { requestedQuantity: normalizeQuantity(requestedQuantity) }
          : {}),
        ...(fulfilledQuantity !== undefined
          ? { fulfilledQuantity: normalizeQuantity(fulfilledQuantity) }
          : {}),
        ...(unitOfMeasureSnapshot !== undefined ? { unitOfMeasureSnapshot } : {}),
        ...(requestStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
      include: {
        patient: true,
        incident: true,
        resourceCategory: true,
        primaryResourceItem: {
          include: {
            category: true,
          },
        },
        allocations: {
          include: {
            resourceItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (
      requestStatus &&
      [
        "PARTIALLY_ALLOCATED",
        "RESERVED",
        "IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ].includes(requestStatus)
    ) {
      await resolveResourceDelayAlerts(requestId);
    }

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: updated.patientId,
        incidentId: updated.incidentId,
        eventLabel: "Resource Request Updated",
        eventStatus: updated.requestStatus,
        note: updated.rejectionReason || updated.requestReason,
      },
    });

    const aiAssessment = await runAndStoreAiPriority(updated.incidentId);
    const queuePriority = await ensureIncidentQueuePriority(updated.incidentId);

    await createAuditLog({
      actionType: "RESOURCE_REQUEST_UPDATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: updated.incidentId,
      patientId: updated.patientId,
      resourceRequestId: updated.id,
      targetTable: "ResourceRequest",
      targetId: updated.id,
      oldValue: {
        requestStatus: existing.requestStatus,
        rejectionReason: existing.rejectionReason,
        priority: existing.priority,
        requestedQuantity: existing.requestedQuantity,
        approvedQuantity: existing.approvedQuantity,
        fulfilledQuantity: existing.fulfilledQuantity,
      },
      newValue: {
        requestStatus: updated.requestStatus,
        rejectionReason: updated.rejectionReason,
        priority: updated.priority,
        requestedQuantity: updated.requestedQuantity,
        approvedQuantity: updated.approvedQuantity,
        fulfilledQuantity: updated.fulfilledQuantity,
      },
      reason: "Section workflow updated request.",
    });

    return res.json({
      success: true,
      data: {
        request: updated,
        aiAssessment,
        queuePriority,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update resource request",
      error: error.message,
    });
  }
}

async function allocateResourceToRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { resourceItemId, reservedQuantity = 1 } = req.body;

    if (!resourceItemId) {
      return res.status(400).json({
        success: false,
        message: "resourceItemId is required",
      });
    }

    const qty = Number(reservedQuantity || 1);

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "reservedQuantity must be greater than zero",
      });
    }

    const request = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        resourceCategory: true,
        patient: true,
        allocations: true,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Resource request not found",
      });
    }

    const requestedQuantity = Number(request.requestedQuantity || qty);
    const alreadyFulfilled = Number(request.fulfilledQuantity || 0);
    const remainingQuantity = requestedQuantity - alreadyFulfilled;

    if (remainingQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "This request has already received the requested quantity",
      });
    }

    if (qty > remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate more than requested. Remaining quantity is ${remainingQuantity}.`,
      });
    }

    const item = await prisma.resourceItem.findUnique({
      where: { id: resourceItemId },
      include: {
        category: true,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    if (item.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected resource item is inactive",
      });
    }

    if (
      item.availableQuantity !== null &&
      item.availableQuantity !== undefined &&
      item.availableQuantity < qty
    ) {
      return res.status(400).json({
        success: false,
        message: "Not enough available quantity in selected stock entry",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const categoryName = request.resourceCategory.name;

      if (categoryName === "IMAGING") {
        await releaseReusablePatientAllocations({
          tx,
          patientId: request.patientId,
          categories: ["BED"],
          reason: "Bed released automatically because patient moved to imaging.",
          changedByUserId: req.user?.id || null,
        });
      }

      if (categoryName === "THEATRE") {
        await releaseReusablePatientAllocations({
          tx,
          patientId: request.patientId,
          categories: ["BED", "IMAGING"],
          reason:
            "Reusable allocation released automatically because patient moved to theatre.",
          changedByUserId: req.user?.id || null,
        });
      }

      const nextAvailableQuantity =
        item.availableQuantity === null || item.availableQuantity === undefined
          ? null
          : item.availableQuantity - qty;

      const nextStatus =
        nextAvailableQuantity === null
          ? item.status
          : deriveInventoryStatus(item, nextAvailableQuantity);

      const allocation = await tx.resourceAllocation.create({
        data: {
          resourceRequestId: request.id,
          resourceItemId: item.id,
          reservedQuantity: qty,
          unitOfMeasureSnapshot: request.unitOfMeasureSnapshot || item.unitOfMeasure,
          allocationStatus: "ACTIVE",
          allocatedByUserId: req.user?.id || null,
        },
        include: {
          resourceItem: {
            include: {
              category: true,
            },
          },
        },
      });

      await tx.resourceItem.update({
        where: { id: item.id },
        data: {
          availableQuantity: nextAvailableQuantity,
          status: nextStatus,
          statusEvents: {
            create: {
              oldStatus: item.status,
              newStatus: nextStatus,
              relatedPatientId: request.patientId,
              changedByUserId: req.user?.id || null,
              note: `${qty} ${item.unitOfMeasure || ""} allocated to request.`,
            },
          },
        },
      });

      const fulfilledQuantity = alreadyFulfilled + qty;

      const updatedRequest = await tx.resourceRequest.update({
        where: { id: request.id },
        data: {
          primaryResourceItemId: item.id,
          fulfilledQuantity,
          approvedQuantity: fulfilledQuantity,
          requestStatus:
            fulfilledQuantity >= requestedQuantity
              ? "RESERVED"
              : "PARTIALLY_ALLOCATED",
        },
        include: {
          patient: true,
          incident: true,
          resourceCategory: true,
          primaryResourceItem: {
            include: {
              category: true,
            },
          },
          allocations: {
            include: {
              resourceItem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      await tx.patientTimelineEvent.create({
        data: {
          patientId: request.patientId,
          incidentId: request.incidentId,
          eventLabel: "Resource Allocated",
          eventStatus: updatedRequest.requestStatus,
          note: `${request.resourceCategory.name} allocated from ${
            item.subType || item.label
          }. Quantity: ${qty}.`,
        },
      });

      return {
        allocation,
        request: updatedRequest,
      };
    });

    await resolveResourceDelayAlerts(requestId);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to allocate resource",
      error: error.message,
    });
  }
}

async function releaseResourceAllocation(req, res) {
  try {
    const { allocationId } = req.params;
    const { releaseReason = "", restoreStock = true } = req.body;

    const allocation = await prisma.resourceAllocation.findUnique({
      where: { id: allocationId },
      include: {
        resourceItem: {
          include: {
            category: true,
          },
        },
        resourceRequest: true,
      },
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Allocation not found",
      });
    }

    if (allocation.allocationStatus !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Allocation is already released",
      });
    }

    const released = await prisma.$transaction(async (tx) => {
      const updatedAllocation = await tx.resourceAllocation.update({
        where: { id: allocationId },
        data: {
          allocationStatus: "RELEASED",
          releasedAt: new Date(),
          releaseReason,
        },
      });

      if (
        restoreStock &&
        allocation.resourceItem.availableQuantity !== null &&
        allocation.resourceItem.availableQuantity !== undefined
      ) {
        const restoredQty =
          Number(allocation.resourceItem.availableQuantity) +
          Number(allocation.reservedQuantity || 1);

        const nextStatus = deriveInventoryStatus(
          allocation.resourceItem,
          restoredQty
        );

        await tx.resourceItem.update({
          where: { id: allocation.resourceItemId },
          data: {
            availableQuantity: restoredQty,
            status: nextStatus,
            statusEvents: {
              create: {
                oldStatus: allocation.resourceItem.status,
                newStatus: nextStatus,
                relatedPatientId: allocation.resourceRequest.patientId,
                changedByUserId: req.user?.id || null,
                note: releaseReason || "Allocation released and stock restored.",
              },
            },
          },
        });
      }

      const nextFulfilled = Math.max(
        0,
        Number(allocation.resourceRequest.fulfilledQuantity || 0) -
          Number(allocation.reservedQuantity || 1)
      );

      await tx.resourceRequest.update({
        where: { id: allocation.resourceRequestId },
        data: {
          fulfilledQuantity: nextFulfilled,
          requestStatus:
            nextFulfilled <= 0 ? "REQUESTED" : "PARTIALLY_ALLOCATED",
        },
      });

      return updatedAllocation;
    });

    return res.json({
      success: true,
      data: released,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to release allocation",
      error: error.message,
    });
  }
}

module.exports = {
  getResourceRequests,
  createPatientResourceRequest,
  updateResourceRequest,
  allocateResourceToRequest,
  releaseResourceAllocation,
};