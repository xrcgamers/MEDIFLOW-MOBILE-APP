const prisma = require("../config/prisma");

exports.getDemoHealth = async (req, res) => {
  try {
    const [
      incidents,
      patients,
      resourceRequests,
      resourceItems,
      alerts,
      mediaAttachments,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.patient.count(),
      prisma.resourceRequest.count(),
      prisma.resourceItem.count(),
      prisma.systemAlert.count(),
      prisma.mediaAttachment.count(),
    ]);

    return res.json({
      success: true,
      data: {
        backend: "OK",
        database: "OK",
        counts: {
          incidents,
          patients,
          resourceRequests,
          resourceItems,
          alerts,
          mediaAttachments,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo health check failed",
      error: error.message,
    });
  }
};