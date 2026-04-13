const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const {
  createReport,
  getReportByTrackingCode,
} = require("../controllers/reportController");

const router = express.Router();

router.post("/", upload.single("photo"), createReport);
router.get("/:trackingCode", getReportByTrackingCode);

module.exports = router;