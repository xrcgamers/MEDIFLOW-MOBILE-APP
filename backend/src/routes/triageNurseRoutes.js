const express = require("express");

const {
  getTriageQueue,
  claimPatient,
  releasePatientClaim,
} = require("../controllers/triageNurseController");

const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.get(
  "/patients",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE"),
  getTriageQueue
);

router.post(
  "/patients/:patientId/claim",
  requireAuth,
  authorizeRoles("TRIAGE_NURSE"),
  claimPatient
);

router.post(
  "/patients/:patientId/release",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE"),
  releasePatientClaim
);

module.exports = router;