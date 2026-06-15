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
        primaryResourceItem: true,
        allocations: {
          include: {
            resourceItem: true,
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
      approvedQuantity = null,
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
        approvedQuantity: normalizeQuantity(approvedQuantity),
        fulfilledQuantity: 0,
        unitOfMeasureSnapshot,
      },
      include: {
        patient: true,
        incident: true,
        resourceCategory: true,
        primaryResourceItem: true,
        allocations: {
          include: {
            resourceItem: true,
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
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
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
        approvedQuantity: request.approvedQuantity,
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
        primaryResourceItem: true,
        allocations: {
          include: {
            resourceItem: true,
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
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
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
        allocations: true,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Resource request not found",
      });
    }

    const item = await prisma.resourceItem.findUnique({
      where: { id: resourceItemId },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
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
      const allocation = await tx.resourceAllocation.create({
        data: {
          resourceRequestId: request.id,
          resourceItemId: item.id,
          reservedQuantity: qty,
          allocationStatus: "ACTIVE",
        },
        include: {
          resourceItem: true,
        },
      });

      const nextAvailableQuantity =
        item.availableQuantity === null || item.availableQuantity === undefined
          ? null
          : item.availableQuantity - qty;

      await tx.resourceItem.update({
        where: { id: item.id },
        data: {
          availableQuantity: nextAvailableQuantity,
          status:
            nextAvailableQuantity !== null && nextAvailableQuantity <= 0
              ? "RESERVED"
              : item.status,
        },
      });

      const fulfilledQuantity = Number(request.fulfilledQuantity || 0) + qty;
      const requestedQuantity = Number(request.requestedQuantity || qty);

      const updatedRequest = await tx.resourceRequest.update({
        where: { id: request.id },
        data: {
          primaryResourceItemId: item.id,
          fulfilledQuantity,
          requestStatus:
            fulfilledQuantity >= requestedQuantity
              ? "RESERVED"
              : "PARTIALLY_ALLOCATED",
        },
        include: {
          patient: true,
          incident: true,
          resourceCategory: true,
          primaryResourceItem: true,
          allocations: {
            include: {
              resourceItem: true,
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
          note: `${request.resourceCategory.name} allocated from selected inventory entry.`,
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
        resourceItem: true,
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
        await tx.resourceItem.update({
          where: { id: allocation.resourceItemId },
          data: {
            availableQuantity:
              allocation.resourceItem.availableQuantity +
              Number(allocation.reservedQuantity || 1),
            status: "AVAILABLE",
          },
        });
      }

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