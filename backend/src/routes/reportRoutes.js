const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createReport,
  getReportByTrackingCode,
} = require("../controllers/reportController");

const {
  trackIncident,
  addPublicFollowUpNote,
} = require("../controllers/publicTrackingController");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "") || ".jpg";
    const fileName = `incident-${Date.now()}${extension}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.post("/", upload.single("photo"), createReport);
router.get("/track", trackIncident);
router.post("/track", trackIncident);
router.get("/:trackingCode", getReportByTrackingCode);
router.post("/:trackingCode/follow-up", addPublicFollowUpNote);

module.exports = router;