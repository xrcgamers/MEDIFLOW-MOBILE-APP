const express = require("express");
const {
  createReport,
  getReportByTrackingCode,
} = require("../controllers/reportController");

const router = express.Router();

router.post("/", createReport);
router.get("/:trackingCode", getReportByTrackingCode);

module.exports = router;