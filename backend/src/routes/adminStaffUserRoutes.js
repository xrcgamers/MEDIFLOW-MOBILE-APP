const express = require("express");
const {
  getStaffUsers,
  createStaffUser,
} = require("../controllers/adminStaffUserController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.get(
  "/staff-users",
  requireAuth,
  authorizeRoles("ADMIN"),
  getStaffUsers
);

router.post(
  "/staff-users",
  requireAuth,
  authorizeRoles("ADMIN"),
  createStaffUser
);

module.exports = router;