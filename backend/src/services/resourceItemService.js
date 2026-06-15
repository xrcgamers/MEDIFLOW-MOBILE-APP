const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditService");

async function getResourceItems(filters = {}) {
  const { categoryName, status, managedByRole } = filters;

  return prisma.resourceItem.findMany({
    where: {
      ...(categoryName
        ? {
            category: {
              name: categoryName,
            },
          }
        : {}),
      ...(status ? { status } : {}),
      ...(managedByRole ? { managedByRole } : {}),
    },
    include: {
      category: true,
    },
    orderBy: [{ category: { name: "asc" } }, { label: "asc" }],
  });
}

async function createResourceItem({
  actorUserId,
  actorRole,
  categoryId,
  resourceCode,
  label,
  subType = null,
  status,
  currentQuantity = null,
  availableQuantity = null,
  unitOfMeasure = null,
  location = null,
  managedByRole = null,
}) {
  const created = await prisma.resourceItem.create({
    data: {
      categoryId,
      resourceCode,
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
    actionType: "RESOURCE_STATUS_CHANGED",
    actorUserId,
    actorRole,
    resourceItemId: created.id,
    targetTable: "ResourceItem",
    targetId: created.id,
    newValue: {
      resourceCode: created.resourceCode,
      label: created.label,
      status: created.status,
      currentQuantity: created.currentQuantity,
      availableQuantity: created.availableQuantity,
    },
    reason: "Resource item created.",
  });

  return created;
}

async function updateResourceItem({
  resourceItemId,
  actorUserId,
  actorRole,
  payload,
}) {
  const existing = await prisma.resourceItem.findUnique({
    where: { id: resourceItemId },
  });

  if (!existing) {
    throw new Error("Resource item not found.");
  }

  const updated = await prisma.resourceItem.update({
    where: { id: resourceItemId },
    data: {
      ...payload,
      lastUpdatedAt: new Date(),
    },
    include: {
      category: true,
    },
  });

  if (payload.status && payload.status !== existing.status) {
    await prisma.resourceStatusEvent.create({
      data: {
        resourceItemId,
        oldStatus: existing.status,
        newStatus: payload.status,
        changedByUserId: actorUserId,
        note: "Resource status updated.",
      },
    });
  }

  await createAuditLog({
    actionType: "RESOURCE_STATUS_CHANGED",
    actorUserId,
    actorRole,
    resourceItemId,
    targetTable: "ResourceItem",
    targetId: resourceItemId,
    oldValue: {
      status: existing.status,
      currentQuantity: existing.currentQuantity,
      availableQuantity: existing.availableQuantity,
      location: existing.location,
    },
    newValue: {
      status: updated.status,
      currentQuantity: updated.currentQuantity,
      availableQuantity: updated.availableQuantity,
      location: updated.location,
    },
    reason: "Resource item updated.",
  });

  return updated;
}

async function allocateResourceToRequest({
  requestId,
  resourceItemId,
  actorUserId,
  actorRole,
}) {
  const request = await prisma.resourceRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: true,
      resourceCategory: true,
      resourceItem: true,
    },
  });

  if (!request) {
    throw new Error("Resource request not found.");
  }

  const item = await prisma.resourceItem.findUnique({
    where: { id: resourceItemId },
    include: {
      category: true,
    },
  });

  if (!item) {
    throw new Error("Resource item not found.");
  }

  const allocation = await prisma.resourceAllocation.create({
    data: {
      resourceRequestId: requestId,
      patientId: request.patientId,
      resourceItemId,
      allocatedByUserId: actorUserId,
      allocationStatus: "ACTIVE",
    },
  });

  let nextStatus = item.status;
  let nextAvailableQuantity = item.availableQuantity;
  let nextCurrentQuantity = item.currentQuantity;

  if (item.category.name === "BLOOD") {
    if (typeof item.availableQuantity === "number") {
      nextAvailableQuantity = Math.max(0, item.availableQuantity - 1);
    }
    if (nextAvailableQuantity !== null && nextAvailableQuantity <= 0) {
      nextStatus = "CRITICAL";
    } else if (nextAvailableQuantity !== null && nextAvailableQuantity <= 5) {
      nextStatus = "LOW";
    }
  } else if (["BED", "IMAGING", "THEATRE"].includes(item.category.name)) {
    nextStatus = item.category.name === "BED" ? "OCCUPIED" : "IN_USE";
  }

  await prisma.resourceItem.update({
    where: { id: resourceItemId },
    data: {
      status: nextStatus,
      availableQuantity: nextAvailableQuantity,
      currentQuantity: nextCurrentQuantity,
      lastUpdatedAt: new Date(),
    },
  });

  await prisma.resourceRequest.update({
    where: { id: requestId },
    data: {
      resourceItemId,
      requestStatus: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });

  await prisma.resourceStatusEvent.create({
    data: {
      resourceItemId,
      oldStatus: item.status,
      newStatus: nextStatus,
      relatedPatientId: request.patientId,
      changedByUserId: actorUserId,
      note: `Allocated to ${request.patient.patientCode}`,
    },
  });

  await createAuditLog({
    actionType: "RESOURCE_ALLOCATION_CREATED",
    actorUserId,
    actorRole,
    incidentId: request.incidentId,
    patientId: request.patientId,
    resourceRequestId: requestId,
    resourceItemId,
    targetTable: "ResourceAllocation",
    targetId: allocation.id,
    newValue: {
      resourceRequestId: requestId,
      resourceItemId,
      allocationStatus: allocation.allocationStatus,
    },
    reason: "Resource allocated to patient.",
  });

  return allocation;
}

async function releaseResourceAllocation({
  allocationId,
  actorUserId,
  actorRole,
  releaseReason = null,
}) {
  const existing = await prisma.resourceAllocation.findUnique({
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

  if (!existing) {
    throw new Error("Resource allocation not found.");
  }

  const updatedAllocation = await prisma.resourceAllocation.update({
    where: { id: allocationId },
    data: {
      allocationStatus: "RELEASED",
      releasedAt: new Date(),
      releaseReason,
    },
  });

  let nextStatus = existing.resourceItem.status;
  let nextAvailableQuantity = existing.resourceItem.availableQuantity;

  if (existing.resourceItem.category.name === "BLOOD") {
    nextStatus = existing.resourceItem.availableQuantity <= 0 ? "CRITICAL" : existing.resourceItem.status;
  } else if (existing.resourceItem.category.name === "BED") {
    nextStatus = "AVAILABLE";
  } else if (["IMAGING", "THEATRE"].includes(existing.resourceItem.category.name)) {
    nextStatus = "AVAILABLE";
  }

  await prisma.resourceItem.update({
    where: { id: existing.resourceItemId },
    data: {
      status: nextStatus,
      availableQuantity: nextAvailableQuantity,
      lastUpdatedAt: new Date(),
    },
  });

  await prisma.resourceStatusEvent.create({
    data: {
      resourceItemId: existing.resourceItemId,
      oldStatus: existing.resourceItem.status,
      newStatus: nextStatus,
      relatedPatientId: existing.patientId,
      changedByUserId: actorUserId,
      note: releaseReason || "Resource released.",
    },
  });

  await createAuditLog({
    actionType: "RESOURCE_ALLOCATION_RELEASED",
    actorUserId,
    actorRole,
    incidentId: existing.resourceRequest.incidentId,
    patientId: existing.patientId,
    resourceRequestId: existing.resourceRequestId,
    resourceItemId: existing.resourceItemId,
    targetTable: "ResourceAllocation",
    targetId: allocationId,
    oldValue: {
      allocationStatus: existing.allocationStatus,
      releasedAt: existing.releasedAt,
    },
    newValue: {
      allocationStatus: updatedAllocation.allocationStatus,
      releasedAt: updatedAllocation.releasedAt,
      releaseReason: updatedAllocation.releaseReason,
    },
    reason: releaseReason || "Resource released.",
  });

  return updatedAllocation;
}

module.exports = {
  getResourceItems,
  createResourceItem,
  updateResourceItem,
  allocateResourceToRequest,
  releaseResourceAllocation,
};