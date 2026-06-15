const prisma = require("../config/prisma");
const {
  getResourceItems,
  createResourceItem,
  updateResourceItem,
  allocateResourceToRequest,
  releaseResourceAllocation,
} = require("../services/resourceItemService");

exports.getResourceItems = async (req, res) => {
  try {
    const { categoryName, status, managedByRole } = req.query;

    const items = await getResourceItems({
      categoryName,
      status,
      managedByRole,
    });

    return res.json({
      success: true,
      data: items,
    });
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
      resourceCode,
      label,
      subType = null,
      status,
      currentQuantity = null,
      availableQuantity = null,
      unitOfMeasure = null,
      location = null,
      managedByRole = null,
    } = req.body;

    if (!categoryId || !resourceCode || !label || !status) {
      return res.status(400).json({
        success: false,
        message: "categoryId, resourceCode, label, and status are required",
      });
    }

    const created = await createResourceItem({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      categoryId,
      resourceCode,
      label,
      subType,
      status,
      currentQuantity: currentQuantity !== null ? Number(currentQuantity) : null,
      availableQuantity: availableQuantity !== null ? Number(availableQuantity) : null,
      unitOfMeasure,
      location,
      managedByRole,
    });

    return res.status(201).json({
      success: true,
      data: created,
    });
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

    const updated = await updateResourceItem({
      resourceItemId,
      actorUserId: req.user.id,
      actorRole: req.user.role,
      payload: req.body,
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update resource item",
      error: error.message,
    });
  }
};

exports.getResourceCategories = async (req, res) => {
  try {
    const categories = await prisma.resourceCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource categories",
      error: error.message,
    });
  }
};

exports.allocateResourceToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { resourceItemId } = req.body;

    if (!resourceItemId) {
      return res.status(400).json({
        success: false,
        message: "resourceItemId is required",
      });
    }

    const allocation = await allocateResourceToRequest({
      requestId,
      resourceItemId,
      actorUserId: req.user.id,
      actorRole: req.user.role,
    });

    return res.status(201).json({
      success: true,
      data: allocation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to allocate resource",
      error: error.message,
    });
  }
};

exports.releaseResourceAllocation = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { releaseReason = null } = req.body;

    const released = await releaseResourceAllocation({
      allocationId,
      actorUserId: req.user.id,
      actorRole: req.user.role,
      releaseReason,
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
};