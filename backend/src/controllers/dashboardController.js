const prisma = require("../config/prisma");

exports.getDashboardOverview = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const reportsReceivedToday = await prisma.report.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    const criticalCases = await prisma.triageAssessment.count({
      where: {
        urgency: "Critical",
      },
    });

    const emergencyBedsAvailable = await prisma.resourceItem.findFirst({
      where: {
        category: "beds",
        label: "Emergency Beds Available",
      },
    });

    const theatresReadyCount = await prisma.resourceItem.count({
      where: {
        category: "theatre",
        status: "Ready",
      },
    });

    const oNegative = await prisma.resourceItem.findFirst({
      where: {
        category: "blood",
        label: "O Negative",
      },
    });

    const newReports = await prisma.report.count({
      where: {
        status: "Received",
      },
    });

    const alerts = [];

    if (criticalCases > 0) {
      alerts.push({
        id: "alert-critical-cases",
        title: "Critical Cases Present",
        message: `${criticalCases} critical case(s) require urgent attention.`,
        level: "danger",
        actionLabel: "Open Triage",
        actionRoute: "/staff/triage",
      });
    }

    if (oNegative && oNegative.status === "Low") {
      alerts.push({
        id: "alert-blood-low",
        title: "Low Blood Stock",
        message: "O Negative blood stock is low.",
        level: "warning",
        actionLabel: "View Resources",
        actionRoute: "/staff/resources",
      });
    }

    if (newReports > 0) {
      alerts.push({
        id: "alert-new-reports",
        title: "New Reports Waiting",
        message: `${newReports} newly received report(s) need review.`,
        level: "info",
        actionLabel: "View Reports",
        actionRoute: "/staff/incidents",
      });
    }

    const stats = [
      {
        id: "stat-reports-today",
        label: "Reports Received Today",
        value: reportsReceivedToday,
        status: "info",
      },
      {
        id: "stat-critical-cases",
        label: "Critical Cases",
        value: criticalCases,
        status: criticalCases > 0 ? "danger" : "success",
      },
      {
        id: "stat-beds-available",
        label: "Emergency Beds Available",
        value: Number(emergencyBedsAvailable?.value || 0),
        status:
          Number(emergencyBedsAvailable?.value || 0) > 0 ? "success" : "warning",
      },
      {
        id: "stat-theatres-ready",
        label: "Theatres Ready",
        value: theatresReadyCount,
        status: theatresReadyCount > 0 ? "warning" : "danger",
      },
    ];

    res.json({
      success: true,
      data: {
        stats,
        alerts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview",
      error: error.message,
    });
  }
};