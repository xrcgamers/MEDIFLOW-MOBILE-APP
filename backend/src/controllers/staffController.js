const prisma = require("../config/prisma");

exports.getIncidents = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        mediaAttachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch incidents",
      error: error.message,
    });
  }
};

exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: {
            createdAt: "asc",
          },
        },
        triageAssessments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch incident",
      error: error.message,
    });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note = "" } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        staffNote: note,
        statusHistory: {
          create: [
            {
              label: status,
            },
          ],
        },
      },
      include: {
        statusHistory: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update incident status",
      error: error.message,
    });
  }
};