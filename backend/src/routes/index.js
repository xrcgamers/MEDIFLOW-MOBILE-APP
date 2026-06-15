const express = require("express");
const authRoutes = require("./authRoutes");
const reportRoutes = require("./reportRoutes");
const trackRoutes = require("./trackRoutes");
const staffRoutes = require("./staffRoutes");
const resourceRoutes = require("./resourceRoutes");
const triageRoutes = require("./triageRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const aiPriorityRoutes = require("./aiPriorityRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/track", trackRoutes);
router.use("/staff", staffRoutes);
router.use("/staff", resourceRoutes);
router.use("/staff", triageRoutes);
router.use("/staff", dashboardRoutes);
router.use("/staff", aiPriorityRoutes);

module.exports = router;