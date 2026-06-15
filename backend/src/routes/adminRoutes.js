const express = require("express");
const {
  getAdminDashboard,
  getStaffUsers,
  getStaffRoles,
  createStaffUser,
  updateStaffUser,
  resetStaffPassword,
  getAuditLogs,
} = require("../controllers/adminController");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.use(authorizeRoles("ADMIN"));

router.get("/dashboard", getAdminDashboard);
router.get("/staff-users", getStaffUsers);
router.get("/staff-roles", getStaffRoles);
router.post("/staff-users", createStaffUser);
router.patch("/staff-users/:userId", updateStaffUser);
router.post("/staff-users/:userId/reset-password", resetStaffPassword);
router.get("/audit-logs", getAuditLogs);

module.exports = router;