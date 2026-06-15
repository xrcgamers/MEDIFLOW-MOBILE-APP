const prisma = require("../config/prisma");

async function trackIncident(req, res) {
  try {
    const source = req.method === "GET" ? req.query : req.body;
    const { trackingCode, phoneNumber } = source;

    if (!trackingCode || !String(trackingCode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Tracking code is required",
      });
    }

    const incident = await prisma.incident.findFirst({
      where: {
        trackingCode: String(trackingCode).trim(),
        ...(phoneNumber && String(phoneNumber).trim()
          ? { phoneNumber: String(phoneNumber).trim() }
          : {}),
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
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
      message: "Failed to track report",
      error: error.message,
    });
  }
}

async function addPublicFollowUpNote(req, res) {
  try {
    const { trackingCode } = req.params;
    const { note } = req.body;

    if (!note || !String(note).trim()) {
      return res.status(400).json({
        success: false,
        message: "Follow-up note is required",
      });
    }

    const incident = await prisma.incident.findUnique({
      where: { trackingCode },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const timestamp = new Date().toISOString();
    const existingNotes = incident.notes ? `${incident.notes}\n\n` : "";

    const updated = await prisma.incident.update({
      where: { trackingCode },
      data: {
        notes: `${existingNotes}[PUBLIC FOLLOW-UP ${timestamp}] ${String(note).trim()}`,
        publicStatusNote: "Public follow-up received and awaiting staff review.",
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        mediaAttachments: true,
      },
    });

    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: incident.id,
        status: incident.status,
        note: "Public follow-up note received.",
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add follow-up note",
      error: error.message,
    });
  }
}

module.exports = {
  trackIncident,
  addPublicFollowUpNote,
};