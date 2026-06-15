const express = require("express");
const {
  getSystemAlerts,
  resolveSystemAlert,
  runAutomationChecks,
} = require("../controllers/systemAlertController");

const router = express.Router();

router.get("/", getSystemAlerts);
router.post("/run-checks", runAutomationChecks);
router.patch("/:alertId/resolve", resolveSystemAlert);

module.exports = router;