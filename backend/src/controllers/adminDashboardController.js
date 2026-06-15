const prisma = require("../config/prisma");

exports.getAdminDashboardSummary = async (req, res) => {
  try {
    const [
      openIncidents,
      acceptedIncidents,
      patients,
      untriagedPatients,
      pendingResourceRequests,
      openAlerts,
      lowStockResources,
    ] = await Promise.all([
      prisma.incident.count({
        where: {
          status: {
            in: ["RECEIVED", "UNDER_REVIEW", "ACCEPTED", "RESPONSE_IN_PROGRESS"],
          },
        },
      }),

      prisma.incident.count({
        where: {
          status: "ACCEPTED",
        },
      }),

      prisma.patient.count({
        where: {
          isExcluded: false,
        },
      }),

      prisma.patient.count({
        where: {
          isExcluded: false,
          status: "UNTRIAGED",
        },
      }),

      prisma.resourceRequest.count({
        where: {
          requestStatus: {
            in: ["REQUESTED", "APPROVED", "PARTIALLY_ALLOCATED", "RESERVED", "IN_PROGRESS"],
          },
        },
      }),

      prisma.systemAlert.count({
        where: {
          status: "OPEN",
        },
      }),

      prisma.resourceItem.count({
        where: {
          status: {
            in: ["LOW", "CRITICAL"],
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        openIncidents,
        acceptedIncidents,
        patients,
        untriagedPatients,
        pendingResourceRequests,
        openAlerts,
        lowStockResources,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard summary",
      error: error.message,
    });
  }
};