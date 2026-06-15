const prisma = require("../config/prisma");

exports.getDashboardOverview = async (req, res) => {
  try {
    const [
      totalIncidents,
      activeIncidents,
      totalPatients,
      pendingTriage,
      pendingResourceRequests,
      partialResourceRequests,
      reservedResourceRequests,
      openAlerts,
      lowOrCriticalResources,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({
        where: {
          status: {
            in: ["RECEIVED", "UNDER_REVIEW", "ACCEPTED", "RESPONSE_IN_PROGRESS"],
          },
        },
      }),
      prisma.patient.count(),
      prisma.patient.count({
        where: {
          isExcluded: false,
          status: "UNTRIAGED",
        },
      }),
      prisma.resourceRequest.count({
        where: {
          requestStatus: {
            in: ["REQUESTED", "APPROVED", "PARTIALLY_ALLOCATED", "RESERVED", "IN_PROGRESS", "DELAYED"],
          },
        },
      }),
      prisma.resourceRequest.count({
        where: {
          requestStatus: "PARTIALLY_ALLOCATED",
        },
      }),
      prisma.resourceRequest.count({
        where: {
          requestStatus: "RESERVED",
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
        totalIncidents,
        activeIncidents,
        totalPatients,
        pendingTriage,
        pendingResourceRequests,
        partialResourceRequests,
        reservedResourceRequests,
        openAlerts,
        lowOrCriticalResources,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard overview",
      error: error.message,
    });
  }
};