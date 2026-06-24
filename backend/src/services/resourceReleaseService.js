const prisma = require("../config/prisma");

function deriveInventoryStatus(item, availableQuantity) {
  if (item.status === "INACTIVE") return "INACTIVE";

  if (availableQuantity === null || availableQuantity === undefined) {
    return item.status || "AVAILABLE";
  }

  const available = Number(availableQuantity);
  const current = Number(item.currentQuantity || 0);
  const categoryName = String(item.category?.name || "").toUpperCase();

  if (available <= 0) return "RESERVED";

  if (["IMAGING", "THEATRE"].includes(categoryName) && available >= 1) {
    return "AVAILABLE";
  }

  if (available <= 2) return "CRITICAL";
  if (current > 0 && available / current <= 0.25) return "LOW";
  if (available <= 5) return "LOW";

  return "AVAILABLE";
}

async function releasePatientReusableResources({
  tx = prisma,
  patientId,
  categories = ["BED", "IMAGING", "THEATRE"],
  reason = "Reusable resource released.",
  changedByUserId = null,
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

    const restoredQuantity =
      item.availableQuantity === null || item.availableQuantity === undefined
        ? null
        : Number(item.availableQuantity) + Number(allocation.reservedQuantity || 1);

    const nextStatus =
      restoredQuantity === null
        ? item.status
        : deriveInventoryStatus(item, restoredQuantity);

    await tx.resourceAllocation.update({
      where: {
        id: allocation.id,
      },
      data: {
        allocationStatus: "RELEASED",
        releasedAt: new Date(),
        releaseReason: reason,
      },
    });

    await tx.resourceItem.update({
      where: {
        id: item.id,
      },
      data: {
        availableQuantity: restoredQuantity,
        status: nextStatus,
        statusEvents: {
          create: {
            oldStatus: item.status,
            newStatus: nextStatus,
            relatedPatientId: patientId,
            changedByUserId,
            note: reason,
          },
        },
      },
    });

    const currentFulfilled = Number(allocation.resourceRequest.fulfilledQuantity || 0);
    const releasedQuantity = Number(allocation.reservedQuantity || 1);
    const nextFulfilled = Math.max(0, currentFulfilled - releasedQuantity);

    await tx.resourceRequest.update({
      where: {
        id: allocation.resourceRequestId,
      },
      data: {
        fulfilledQuantity: nextFulfilled,
        requestStatus:
          nextFulfilled <= 0 ? "REQUESTED" : "PARTIALLY_ALLOCATED",
      },
    });
  }

  return allocations.length;
}

module.exports = {
  deriveInventoryStatus,
  releasePatientReusableResources,
};