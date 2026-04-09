const express = require("express");
const {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
} = require("../controllers/staffController");
const {
  getDashboardOverview,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/dashboard", getDashboardOverview);

router.get("/incidents", getIncidents);
router.get("/incidents/:id", getIncidentById);
router.patch("/incidents/:id/status", updateIncidentStatus);

module.exports = router;