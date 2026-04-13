const prisma = require("../config/prisma");

function generateTrackingCode() {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `MDF-${randomPart}`;
}

exports.createReport = async (req, res) => {
  try {
    const {
      incidentType,
      otherIncidentType = "",
      autoLocationText = "",
      manualLocationText = "",
      latitude = null,
      longitude = null,
      victimCount,
      phoneNumber = "",
      notes = "",
    } = req.body;

    if (!incidentType) {
      return res.status(400).json({
        success: false,
        message: "Incident type is required",
      });
    }

    if (!autoLocationText && !manualLocationText) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    if (!victimCount || Number(victimCount) < 1) {
      return res.status(400).json({
        success: false,
        message: "Victim count must be 1 or more",
      });
    }

    const resolvedIncidentType =
      incidentType === "Other" ? otherIncidentType.trim() : incidentType;

    const resolvedLocationText =
      manualLocationText.trim() || autoLocationText.trim();

    const trackingCode = generateTrackingCode();

    const uploadedFile = req.file || null;

    const report = await prisma.report.create({
      data: {
        trackingCode,
        incidentType,
        otherIncidentType,
        resolvedIncidentType,
        autoLocationText,
        manualLocationText,
        resolvedLocationText,
        latitude: latitude !== null && latitude !== "" ? Number(latitude) : null,
        longitude: longitude !== null && longitude !== "" ? Number(longitude) : null,
        victimCount: Number(victimCount),
        phoneNumber,
        notes,
        mediaCount: uploadedFile ? 1 : 0,
        status: "Received",
        statusHistory: {
          create: [
            {
              label: "Received",
            },
          ],
        },
        mediaAttachments: uploadedFile
          ? {
              create: [
                {
                  fileName: uploadedFile.filename,
                  filePath: `/uploads/${uploadedFile.filename}`,
                  mimeType: uploadedFile.mimetype,
                  fileSize: uploadedFile.size,
                },
              ],
            }
          : undefined,
      },
      include: {
        statusHistory: true,
        mediaAttachments: true,
      },
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create report",
      error: error.message,
    });
  }
};

exports.getReportByTrackingCode = async (req, res) => {
  try {
    const { trackingCode } = req.params;

    const report = await prisma.report.findUnique({
      where: {
        trackingCode,
      },
      include: {
        statusHistory: {
          orderBy: {
            createdAt: "asc",
          },
        },
        mediaAttachments: true,
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};