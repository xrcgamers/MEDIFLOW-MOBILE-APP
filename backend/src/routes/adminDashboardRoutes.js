const express = require("express");
const {
  getAdminDashboardSummary,
} = require("../controllers/adminDashboardController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.get(
  "/summary",
  requireAuth,
  authorizeRoles("ADMIN"),
  getAdminDashboardSummary
);

module.exports = router;