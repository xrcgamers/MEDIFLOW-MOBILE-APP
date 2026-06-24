const express = require("express");

const {
  getAdminDashboard,
  getStaffUsers,
  getStaffRoles,
  createStaffUser,
  updateStaffUser,
  resetStaffPassword,
  deleteStaffUser,
  assignIncidentToEmergencyNurse,
  assignPatientToTriageNurse,
  getAuditLogs,
} = require("../controllers/adminController");

const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("ADMIN"));

router.get("/dashboard", getAdminDashboard);

router.get("/staff-users", getStaffUsers);
router.get("/staff-roles", getStaffRoles);
router.post("/staff-users", createStaffUser);
router.patch("/staff-users/:userId", updateStaffUser);
router.delete("/staff-users/:userId", deleteStaffUser);
router.post("/staff-users/:userId/reset-password", resetStaffPassword);

router.patch(
  "/incidents/:incidentId/assign-emergency-nurse",
  assignIncidentToEmergencyNurse
);

router.patch(
  "/patients/:patientId/assign-triage-nurse",
  assignPatientToTriageNurse
);

router.get("/audit-logs", getAuditLogs);

module.exports = router;