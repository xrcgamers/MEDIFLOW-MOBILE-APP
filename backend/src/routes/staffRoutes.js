const express = require("express");

const {
  getIncidents,
  getIncidentById,
  analyzeIncidentPriority,
  updateIncidentStatus,
  addPatientToIncident,
  excludePatientFromIncident,
  getPatientById,
  reorderIncidentQueue,
  addCareUpdateToPatient,
  getIncidentThread,
  getPatientThread,
  getResourceRequestThread,
  postThreadMessage,
} = require("../controllers/staffController");

const { createPatientTriage } = require("../controllers/triageController");
const {
  createPatientResourceRequest,
} = require("../controllers/resourceRequestController");

const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

function mustBeFn(name, fn) {
  if (typeof fn !== "function") {
    throw new Error(
      `staffRoutes.js: "${name}" is not a function. Check the matching controller export.`
    );
  }

  return fn;
}

/**
 * INCIDENT QUEUE
 * Only Emergency Nurse and Admin should access incident queue data.
 */
router.get(
  "/incidents",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("getIncidents", getIncidents)
);

router.get(
  "/incidents/:id",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("getIncidentById", getIncidentById)
);

router.post(
  "/incidents/:id/analyze-priority",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("analyzeIncidentPriority", analyzeIncidentPriority)
);

router.patch(
  "/incidents/:id/status",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("updateIncidentStatus", updateIncidentStatus)
);

router.post(
  "/incidents/:id/patients",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("addPatientToIncident", addPatientToIncident)
);

router.post(
  "/incidents/:id/reorder-queue",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("reorderIncidentQueue", reorderIncidentQueue)
);

/**
 * PATIENT WORKSPACE
 * Triage Nurse works at patient level.
 */
router.get(
  "/patients/:patientId",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE", "EMERGENCY_NURSE"),
  mustBeFn("getPatientById", getPatientById)
);

router.post(
  "/patients/:patientId/exclude",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE"),
  mustBeFn("excludePatientFromIncident", excludePatientFromIncident)
);

router.post(
  "/patients/:patientId/care-update",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE"),
  mustBeFn("addCareUpdateToPatient", addCareUpdateToPatient)
);

router.post(
  "/patients/:patientId/triage",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE"),
  mustBeFn("createPatientTriage", createPatientTriage)
);

router.post(
  "/patients/:patientId/resource-requests",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE"),
  mustBeFn("createPatientResourceRequest", createPatientResourceRequest)
);

/**
 * COMMUNICATION THREADS
 */
router.get(
  "/incidents/:id/thread",
  requireAuth,
  authorizeRoles("ADMIN", "EMERGENCY_NURSE"),
  mustBeFn("getIncidentThread", getIncidentThread)
);

router.get(
  "/patients/:patientId/thread",
  requireAuth,
  authorizeRoles("ADMIN", "TRIAGE_NURSE", "EMERGENCY_NURSE"),
  mustBeFn("getPatientThread", getPatientThread)
);

router.get(
  "/resource-requests/:requestId/thread",
  requireAuth,
  authorizeRoles(
    "ADMIN",
    "TRIAGE_NURSE",
    "BLOOD_BANK_STAFF",
    "IMAGING_STAFF",
    "THEATRE_STAFF",
    "BED_MANAGER"
  ),
  mustBeFn("getResourceRequestThread", getResourceRequestThread)
);

router.post(
  "/threads/:threadId/messages",
  requireAuth,
  authorizeRoles(
    "ADMIN",
    "EMERGENCY_NURSE",
    "TRIAGE_NURSE",
    "BLOOD_BANK_STAFF",
    "IMAGING_STAFF",
    "THEATRE_STAFF",
    "BED_MANAGER"
  ),
  mustBeFn("postThreadMessage", postThreadMessage)
);

module.exports = router;