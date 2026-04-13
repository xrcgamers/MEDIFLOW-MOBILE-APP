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

    const highUrgencyCases = await prisma.triageAssessment.count({
      where: {
        urgency: "High",
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

    const latestCritical = await prisma.triageAssessment.findFirst({
      where: {
        urgency: "Critical",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        report: true,
      },
    });

    const allResources = await prisma.resourceItem.findMany();

    const lowBeds = Number(emergencyBedsAvailable?.value || 0);
    const lowBloodItems = allResources.filter(
      (item) =>
        item.category === "blood" &&
        (item.status === "Low" || item.status === "Critical")
    );

    const limitedStaffItems = allResources.filter(
      (item) =>
        item.category === "staff" &&
        (item.status === "Limited" ||
          item.status === "Off Duty" ||
          item.status === "Critical")
    );

    const resourceAlerts = [];

    if (lowBeds <= 2) {
      resourceAlerts.push({
        id: "resource-beds",
        title: "Emergency Beds Running Low",
        value: String(lowBeds),
        status: lowBeds === 0 ? "danger" : "warning",
        route: "/staff/resources",
        params: { section: "beds" },
      });
    }

    if (theatresReadyCount <= 1) {
      resourceAlerts.push({
        id: "resource-theatre",
        title: "Limited Theatre Readiness",
        value: String(theatresReadyCount),
        status: theatresReadyCount === 0 ? "danger" : "warning",
        route: "/staff/resources",
        params: { section: "theatre" },
      });
    }

    if (lowBloodItems.length > 0) {
      resourceAlerts.push({
        id: "resource-blood",
        title: "Blood Stock Attention Needed",
        value: String(lowBloodItems.length),
        status: lowBloodItems.some((item) => item.status === "Critical")
          ? "danger"
          : "warning",
        route: "/staff/resources",
        params: { section: "blood" },
      });
    }

    if (limitedStaffItems.length > 0) {
      resourceAlerts.push({
        id: "resource-staff",
        title: "Staff Coverage Constraints",
        value: String(limitedStaffItems.length),
        status: "warning",
        route: "/staff/resources",
        params: { section: "staff" },
      });
    }

    const alerts = [];

    if (criticalCases > 0) {
      alerts.push({
        id: "alert-critical-cases",
        title: "Critical Cases Present",
        message: latestCritical?.report?.trackingCode
          ? `${criticalCases} critical case(s) require urgent attention. Latest: ${latestCritical.report.trackingCode}.`
          : `${criticalCases} critical case(s) require urgent attention.`,
        level: "danger",
        actionLabel: "View Critical Reports",
        actionRoute: "/staff/incidents",
        actionParams: {
          priority: "Critical",
        },
      });
    }

    if (highUrgencyCases > 0) {
      alerts.push({
        id: "alert-high-urgency-cases",
        title: "High Urgency Cases Waiting",
        message: `${highUrgencyCases} high urgency case(s) should be reviewed promptly.`,
        level: "warning",
        actionLabel: "View High Urgency",
        actionRoute: "/staff/incidents",
        actionParams: {
          priority: "High",
        },
      });
    }

    if (oNegative && oNegative.status === "Low") {
      alerts.push({
        id: "alert-blood-low",
        title: "Low Blood Stock",
        message: "O Negative blood stock is low.",
        level: "warning",
        actionLabel: "View Blood Stock",
        actionRoute: "/staff/resources",
        actionParams: {
          section: "blood",
        },
      });
    }

    if (newReports > 0) {
      alerts.push({
        id: "alert-new-reports",
        title: "New Reports Waiting",
        message: `${newReports} newly received report(s) need review.`,
        level: "info",
        actionLabel: "View New Reports",
        actionRoute: "/staff/incidents",
        actionParams: {
          status: "Received",
        },
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
        id: "stat-high-urgency",
        label: "High Urgency Cases",
        value: highUrgencyCases,
        status: highUrgencyCases > 0 ? "warning" : "success",
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
        resourceAlerts,
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