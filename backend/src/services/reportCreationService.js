const path = require("path");
const prisma = require("../config/prisma");

function generateTrackingCode() {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `MDF-${randomPart}`;
}

async function createIncidentReport({
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
  uploadedFile,
}) {
  const trackingCode = generateTrackingCode();

  return prisma.incident.create({
    data: {
      trackingCode,
      incidentType,
      subIncidentType,
      otherIncidentType,
      autoLocationText,
      manualLocationText,
      resolvedLocationText: autoLocationText || manualLocationText || "",
      latitude: latitude !== null && latitude !== "" ? Number(latitude) : null,
      longitude: longitude !== null && longitude !== "" ? Number(longitude) : null,
      estimatedVictimCount: Number(estimatedVictimCount),
      phoneNumber,
      notes,
      status: "RECEIVED",
      statusHistory: {
        create: [
          {
            status: "RECEIVED",
            note: "Incident received from public report.",
          },
        ],
      },
      mediaAttachments: {
        create: [
          {
            filePath: `/uploads/${path.basename(uploadedFile.path)}`,
            mimeType: uploadedFile.mimetype || "image/jpeg",
            fileSize: uploadedFile.size || null,
          },
        ],
      },
    },
    include: {
      statusHistory: true,
      mediaAttachments: true,
    },
  });
}

module.exports = {
  createIncidentReport,
};