const express = require("express");
const {
  getIncomingIncidents,
  reviewIncident,
} = require("../controllers/emergencyNurseController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/incidents", requireAuth, getIncomingIncidents);
router.patch("/incidents/:incidentId/review", requireAuth, reviewIncident);

module.exports = router;