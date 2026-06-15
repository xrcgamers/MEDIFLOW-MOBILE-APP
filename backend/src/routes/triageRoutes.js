const express = require("express");
const {
  createTriageForPatient,
  getPatientTriageHistory,
} = require("../controllers/triageController");

const router = express.Router();

router.post("/patients/:patientId/triage", createTriageForPatient);
router.get("/patients/:patientId/triage-history", getPatientTriageHistory);

module.exports = router;