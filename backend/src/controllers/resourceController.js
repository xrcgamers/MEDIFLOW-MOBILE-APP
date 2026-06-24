const prisma = require("../config/prisma");

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function deriveInventoryStatus({ status, currentQuantity, availableQuantity }) {
  if (status === "INACTIVE") return "INACTIVE";
  if (status === "RESERVED") return "RESERVED";

  const available = toNumberOrNull(availableQuantity);
  const current = toNumberOrNull(currentQuantity);

  if (available === null) return status || "AVAILABLE";
  if (available <= 0) return "RESERVED";
  if (available <= 2) return "CRITICAL";

  if (current !== null && current > 0) {
    const ratio = available / current;
    if (ratio <= 0.25) return "LOW";
  }

  if (available <= 5) return "LOW";

  return "AVAILABLE";
}

async function getResourceCategories(req, res) {
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
}

async function getResources(req, res) {
  try {
    const { categoryName } = req.query;

    const items = await prisma.resourceItem.findMany({
      where: categoryName
        ? {
            category: {
              name: categoryName,
            },
          }
        : {},
      include: {
        category: true,
        allocations: {
          orderBy: { allocatedAt: "desc" },
          take: 3,
        },
        statusEvents: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: [
        {
          category: {
            name: "asc",
          },
        },
        {
          label: "asc",
        },
      ],
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resources",
      error: error.message,
    });
  }
}

async function createResourceItem(req, res) {
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

    const category = await prisma.resourceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Resource category not found",
      });
    }

    const parsedCurrent = toNumberOrNull(currentQuantity);
    const parsedAvailable = toNumberOrNull(availableQuantity);

    const finalStatus = deriveInventoryStatus({
      status,
      currentQuantity: parsedCurrent,
      availableQuantity: parsedAvailable,
    });

    const created = await prisma.resourceItem.create({
      data: {
        categoryId,
        label: label.trim(),
        subType: subType ? String(subType).trim() : null,
        status: finalStatus,
        currentQuantity: parsedCurrent,
        availableQuantity: parsedAvailable,
        unitOfMeasure: unitOfMeasure ? String(unitOfMeasure).trim() : null,
        location: location ? String(location).trim() : null,
        managedByRole: managedByRole ? String(managedByRole).trim() : null,
      },
      include: {
        category: true,
        statusEvents: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create resource item",
      error: error.message,
    });
  }
}

async function updateResourceItem(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.resourceItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    const {
      categoryId,
      label,
      subType,
      status,
      currentQuantity,
      availableQuantity,
      unitOfMeasure,
      location,
      managedByRole,
    } = req.body;

    const parsedCurrent =
      currentQuantity !== undefined
        ? toNumberOrNull(currentQuantity)
        : existing.currentQuantity;

    const parsedAvailable =
      availableQuantity !== undefined
        ? toNumberOrNull(availableQuantity)
        : existing.availableQuantity;

    const finalStatus = deriveInventoryStatus({
      status: status ?? existing.status,
      currentQuantity: parsedCurrent,
      availableQuantity: parsedAvailable,
    });

    const updated = await prisma.resourceItem.update({
      where: { id },
      data: {
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(label !== undefined ? { label: label.trim() } : {}),
        ...(subType !== undefined
          ? { subType: subType ? String(subType).trim() : null }
          : {}),
        status: finalStatus,
        ...(currentQuantity !== undefined ? { currentQuantity: parsedCurrent } : {}),
        ...(availableQuantity !== undefined ? { availableQuantity: parsedAvailable } : {}),
        ...(unitOfMeasure !== undefined
          ? { unitOfMeasure: unitOfMeasure ? String(unitOfMeasure).trim() : null }
          : {}),
        ...(location !== undefined
          ? { location: location ? String(location).trim() : null }
          : {}),
        ...(managedByRole !== undefined
          ? { managedByRole: managedByRole ? String(managedByRole).trim() : null }
          : {}),
      },
      include: {
        category: true,
        statusEvents: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update resource item",
      error: error.message,
    });
  }
}

async function deleteResourceItem(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.resourceItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    try {
      await prisma.resourceItem.delete({
        where: { id },
      });

      return res.json({
        success: true,
        data: { id, deleted: true },
      });
    } catch {
      const updated = await prisma.resourceItem.update({
        where: { id },
        data: { status: "INACTIVE" },
        include: { category: true },
      });

      return res.json({
        success: true,
        data: {
          ...updated,
          deleted: false,
          deactivated: true,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete resource item",
      error: error.message,
    });
  }
}

async function addResourceAction(req, res) {
  try {
    const { id } = req.params;
    const { actionType, note = "" } = req.body;

    if (!actionType) {
      return res.status(400).json({
        success: false,
        message: "Action type is required",
      });
    }

    const existing = await prisma.resourceItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    const nextStatus =
      actionType === "MARK_INACTIVE"
        ? "INACTIVE"
        : actionType === "MARK_RESERVED"
        ? "RESERVED"
        : existing.status;

    const updatedResource = await prisma.resourceItem.update({
      where: { id },
      data: {
        status: nextStatus,
        statusEvents: {
          create: {
            eventType: actionType,
            note,
            actorUserId: req.user?.id || null,
          },
        },
      },
      include: {
        category: true,
        statusEvents: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    return res.json({
      success: true,
      data: updatedResource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record resource action",
      error: error.message,
    });
  }
}

module.exports = {
  getResourceCategories,
  getResources,
  createResourceItem,
  updateResourceItem,
  deleteResourceItem,
  addResourceAction,
  deriveInventoryStatus,
};