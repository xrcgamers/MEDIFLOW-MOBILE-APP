const prisma = require("../config/prisma");

async function getSystemAlerts(req, res) {
  try {
    const { status = "OPEN" } = req.query;

    const alerts = await prisma.systemAlert.findMany({
      where: status ? { status } : {},
      include: {
        incident: true,
        patient: true,
        resourceRequest: {
          include: {
            resourceCategory: true,
            patient: true,
          },
        },
        resourceItem: {
          include: {
            category: true,
          },
        },
        resolvedByUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load system alerts",
      error: error.message,
    });
  }
}

async function resolveSystemAlert(req, res) {
  try {
    const { alertId } = req.params;

    const existing = await prisma.systemAlert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "System alert not found",
      });
    }

    const updated = await prisma.systemAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedByUser: {
          connect: {
            id: req.user.id,
          },
        },
      },
      include: {
        incident: true,
        patient: true,
        resourceRequest: {
          include: {
            resourceCategory: true,
            patient: true,
          },
        },
        resourceItem: {
          include: {
            category: true,
          },
        },
        resolvedByUser: true,
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resolve system alert",
      error: error.message,
    });
  }
}

async function runAutomationChecks(req, res) {
  try {
    const {
      runDelayAndLowStockChecks,
    } = require("../services/automationMonitorService");

    const alerts = await runDelayAndLowStockChecks();

    return res.json({
      success: true,
      data: {
        createdOrExistingAlerts: alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to run automation checks",
      error: error.message,
    });
  }
}

module.exports = {
  getSystemAlerts,
  resolveSystemAlert,
  runAutomationChecks,
};