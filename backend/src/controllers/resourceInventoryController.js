const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");
const { ensureIncidentQueuePriority } = require("../services/incidentQueueService");
const { runAndStoreAiPriority } = require("../services/aiPriorityService");
const { resolveResourceDelayAlerts } = require("../services/automationResolutionService");

function isPooledCategory(categoryName) {
  return categoryName === "BLOOD" || categoryName === "BED";
}

function deriveStatusFromQuantities(item) {
  if (item.status === "INACTIVE") return "INACTIVE";

  const available = Number(item.availableQuantity ?? 0);
  const current = Number(item.currentQuantity ?? 0);

  if (available <= 0) return "CRITICAL";
  if (current > 0 && available <= Math.max(1, Math.floor(current * 0.25))) {
    return "LOW";
  }
  return "AVAILABLE";
}

function computeRequestStatus(request) {
  const target =
    request.approvedQuantity ??
    request.requestedQuantity;

  if (target === null || target === undefined) {
    return request.fulfilledQuantity > 0 ? "RESERVED" : "REQUESTED";
  }

  if (request.fulfilledQuantity <= 0) return "REQUESTED";
  if (request.fulfilledQuantity < target) return "PARTIALLY_ALLOCATED";
  return "RESERVED";
}

exports.getResourceCategories = async (req, res) => {
  try {
    const categories = await prisma.resourceCategory.findMany({
      orderBy: { name: "asc" },
    });

    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource categories",
      error: error.message,
    });
  }
};

exports.getResourceItems = async (req, res) => {
  try {
    const { categoryName, status } = req.query;

    const items = await prisma.resourceItem.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(categoryName ? { category: { name: categoryName } } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { name: "asc" } }, { subType: "asc" }, { label: "asc" }],
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource items",
      error: error.message,
    });
  }
};

exports.createResourceItem = async (req, res) => {
  try {
    const {
      categoryId,
      label,
      subType = null,
      status = "AVAILABLE",
      currentQuantity = null,
      availableQuantity = null,
      unitOfMeasure = null,
      location = null,
      managedByRole = null,
    } = req.body;

    if (!categoryId || !label) {
      return res.status(400).json({
        success: false,
        message: "categoryId and label are required",
      });
    }

    const created = await prisma.resourceItem.create({
      data: {
        categoryId,
        label,
        subType,
        status,
        currentQuantity,
        availableQuantity,
        unitOfMeasure,
        location,
        managedByRole,
      },
      include: {
        category: true,
      },
    });

    await createAuditLog({
      actionType: "RESOURCE_ITEM_CREATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      resourceItemId: created.id,
      targetTable: "ResourceItem",
      targetId: created.id,
      newValue: created,
      reason: "Resource item created.",
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create resource item",
      error: error.message,
    });
  }
};

exports.updateResourceItem = async (req, res) => {
  try {
    const { resourceItemId } = req.params;

    const existing = await prisma.resourceItem.findUnique({
      where: { id: resourceItemId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    const updated = await prisma.resourceItem.update({
      where: { id: resourceItemId },
      data: req.body,
      include: {
        category: true,
      },
    });

    await createAuditLog({
      actionType: "RESOURCE_ITEM_UPDATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      resourceItemId: updated.id,
      targetTable: "ResourceItem",
      targetId: updated.id,
      oldValue: existing,
      newValue: updated,
      reason: "Resource item updated.",
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update resource item",
      error: error.message,
    });
  }
};

exports.allocateResourceToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { resourceItemId, reservedQuantity = null } = req.body;

    if (!resourceItemId) {
      return res.status(400).json({
        success: false,
        message: "resourceItemId is required",
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

    const resourceItem = await prisma.resourceItem.findUnique({
      where: { id: resourceItemId },
      include: {
        category: true,
      },
    });

    if (!resourceItem) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    const pooled = isPooledCategory(request.resourceCategory.name);

    let qty = null;
    if (pooled) {
      qty = Number(reservedQuantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "reservedQuantity must be a positive number for pooled resources",
        });
      }

      const available = Number(resourceItem.availableQuantity ?? 0);
      if (qty > available) {
        return res.status(400).json({
          success: false,
          message: `Requested allocation exceeds available stock. Available: ${available}`,
        });
      }
    }

    let updatedItem;
    if (pooled) {
      const nextAvailable = Math.max(0, Number(resourceItem.availableQuantity ?? 0) - qty);

      updatedItem = await prisma.resourceItem.update({
        where: { id: resourceItem.id },
        data: {
          availableQuantity: nextAvailable,
          status: deriveStatusFromQuantities({
            ...resourceItem,
            availableQuantity: nextAvailable,
          }),
        },
      });
    } else {
      if (resourceItem.status !== "AVAILABLE") {
        return res.status(400).json({
          success: false,
          message: "Named resource is not available",
        });
      }

      updatedItem = await prisma.resourceItem.update({
        where: { id: resourceItem.id },
        data: {
          status: "RESERVED",
        },
      });
    }

    const allocation = await prisma.resourceAllocation.create({
      data: {
        resourceRequestId: request.id,
        resourceItemId: resourceItem.id,
        allocationStatus: "ACTIVE",
        allocatedByUserId: req.user?.id || null,
        reservedQuantity: pooled ? qty : null,
        unitOfMeasureSnapshot: request.unitOfMeasureSnapshot || resourceItem.unitOfMeasure,
      },
      include: {
        resourceItem: true,
      },
    });

    const activeAllocations = await prisma.resourceAllocation.findMany({
      where: {
        resourceRequestId: request.id,
        allocationStatus: "ACTIVE",
      },
    });

    const fulfilledQuantity = pooled
      ? activeAllocations.reduce((sum, item) => sum + Number(item.reservedQuantity ?? 0), 0)
      : activeAllocations.length > 0
      ? 1
      : 0;

    const nextRequestStatus = computeRequestStatus({
      ...request,
      fulfilledQuantity,
    });

    const updatedRequest = await prisma.resourceRequest.update({
      where: { id: request.id },
      data: {
        fulfilledQuantity,
        requestStatus: nextRequestStatus,
        ...(pooled ? {} : { primaryResourceItemId: resourceItem.id }),
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
        patientId: updatedRequest.patientId,
        incidentId: updatedRequest.incidentId,
        eventLabel: "Resource Allocated",
        eventStatus: updatedRequest.requestStatus,
        note: pooled
          ? `${updatedRequest.resourceCategory.name} allocated from ${resourceItem.subType || resourceItem.label}: ${qty} ${allocation.unitOfMeasureSnapshot || ""}`.trim()
          : `${updatedRequest.resourceCategory.name} reserved: ${resourceItem.subType || resourceItem.label}`,
      },
    });

    await createAuditLog({
      actionType: "RESOURCE_ALLOCATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: updatedRequest.incidentId,
      patientId: updatedRequest.patientId,
      resourceRequestId: updatedRequest.id,
      resourceItemId: updatedItem.id,
      targetTable: "ResourceAllocation",
      targetId: allocation.id,
      newValue: {
        allocationStatus: allocation.allocationStatus,
        resourceItemId: updatedItem.id,
        reservedQuantity: allocation.reservedQuantity,
      },
      reason: "Resource allocated to request.",
    });

    await resolveResourceDelayAlerts(updatedRequest.id);
    await runAndStoreAiPriority(updatedRequest.incidentId);
    await ensureIncidentQueuePriority(updatedRequest.incidentId);

    return res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to allocate resource to request",
      error: error.message,
    });
  }
};

exports.releaseResourceAllocation = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { releaseReason = "Allocation released.", restoreStock = true } = req.body;

    const allocation = await prisma.resourceAllocation.findUnique({
      where: { id: allocationId },
      include: {
        resourceRequest: {
          include: {
            resourceCategory: true,
          },
        },
        resourceItem: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Resource allocation not found",
      });
    }

    const pooled = isPooledCategory(allocation.resourceRequest.resourceCategory.name);

    const releasedAllocation = await prisma.resourceAllocation.update({
      where: { id: allocation.id },
      data: {
        allocationStatus: "RELEASED",
        releasedAt: new Date(),
        releaseReason,
      },
    });

    let updatedItem = allocation.resourceItem;

    if (restoreStock) {
      if (pooled) {
        const restoredAvailable =
          Number(allocation.resourceItem.availableQuantity ?? 0) +
          Number(allocation.reservedQuantity ?? 0);

        updatedItem = await prisma.resourceItem.update({
          where: { id: allocation.resourceItem.id },
          data: {
            availableQuantity: restoredAvailable,
            status: deriveStatusFromQuantities({
              ...allocation.resourceItem,
              availableQuantity: restoredAvailable,
            }),
          },
        });
      } else {
        updatedItem = await prisma.resourceItem.update({
          where: { id: allocation.resourceItem.id },
          data: {
            status: "AVAILABLE",
          },
        });
      }
    }

    const activeAllocations = await prisma.resourceAllocation.findMany({
      where: {
        resourceRequestId: allocation.resourceRequest.id,
        allocationStatus: "ACTIVE",
      },
    });

    const fulfilledQuantity = pooled
      ? activeAllocations.reduce((sum, item) => sum + Number(item.reservedQuantity ?? 0), 0)
      : activeAllocations.length > 0
      ? 1
      : 0;

    const nextStatus =
      fulfilledQuantity <= 0
        ? "REQUESTED"
        : computeRequestStatus({
            ...allocation.resourceRequest,
            fulfilledQuantity,
          });

    const updatedRequest = await prisma.resourceRequest.update({
      where: { id: allocation.resourceRequest.id },
      data: {
        fulfilledQuantity,
        requestStatus: nextStatus,
        ...(activeAllocations.length === 0 ? { primaryResourceItemId: null } : {}),
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
        patientId: updatedRequest.patientId,
        incidentId: updatedRequest.incidentId,
        eventLabel: "Resource Allocation Released",
        eventStatus: updatedRequest.requestStatus,
        note: releaseReason,
      },
    });

    await createAuditLog({
      actionType: "RESOURCE_ALLOCATION_RELEASED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: updatedRequest.incidentId,
      patientId: updatedRequest.patientId,
      resourceRequestId: updatedRequest.id,
      resourceItemId: updatedItem.id,
      targetTable: "ResourceAllocation",
      targetId: releasedAllocation.id,
      newValue: {
        allocationStatus: releasedAllocation.allocationStatus,
        releasedAt: releasedAllocation.releasedAt,
        restoreStock,
      },
      reason: releaseReason,
    });

    await runAndStoreAiPriority(updatedRequest.incidentId);
    await ensureIncidentQueuePriority(updatedRequest.incidentId);

    return res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to release resource allocation",
      error: error.message,
    });
  }
};