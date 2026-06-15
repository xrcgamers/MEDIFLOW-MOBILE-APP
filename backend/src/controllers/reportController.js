const prisma = require("../config/prisma");
const { createIncidentReport } = require("../services/reportCreationService");

async function createReport(req, res) {
  try {
    console.log("REPORT BODY:", req.body);
    console.log("REPORT FILE:", req.file);

    const {
      incidentType,
      subIncidentType = null,
      otherIncidentType = "",
      autoLocationText = "",
      manualLocationText = "",
      latitude = null,
      longitude = null,
      estimatedVictimCount,
      phoneNumber = "",
      notes = "",
    } = req.body;

    if (!incidentType) {
      return res.status(400).json({
        success: false,
        message: "Incident type is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Camera photo is required",
      });
    }

    if (!manualLocationText && (!latitude || !longitude)) {
      return res.status(400).json({
        success: false,
        message: "Coordinates or manual location are required",
      });
    }

    if (!estimatedVictimCount || Number(estimatedVictimCount) < 1) {
      return res.status(400).json({
        success: false,
        message: "Estimated victim count must be 1 or more",
      });
    }

    if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const incident = await createIncidentReport({
      incidentType,
      subIncidentType,
      otherIncidentType,
      autoLocationText,
      manualLocationText,
      latitude,
      longitude,
      estimatedVictimCount: Number(estimatedVictimCount),
      phoneNumber: String(phoneNumber).trim(),
      notes,
      uploadedFile: req.file,
    });

    return res.status(201).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error("CREATE REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create report",
      error: error.message,
    });
  }
}

async function getReportByTrackingCode(req, res) {
  try {
    const { trackingCode } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { trackingCode },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        mediaAttachments: true,
      },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
}

module.exports = {
  createReport,
  getReportByTrackingCode,
};