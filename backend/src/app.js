const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const adminRoutes = require("./routes/adminRoutes");
const resourceInventoryRoutes = require("./routes/resourceInventoryRoutes");
const systemAlertRoutes = require("./routes/systemAlertRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const { authenticate } = require("./middleware/authenticate");
const { authorizeRoles } = require("./middleware/authorizeRoles");
const emergencyNurseRoutes = require("./routes/emergencyNurseRoutes");
const triageNurseRoutes = require("./routes/triageNurseRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const demoHealthRoutes = require("./routes/demoHealthRoutes");
const adminStaffUserRoutes = require("./routes/adminStaffUserRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/staff", authenticate, staffRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/resources", authenticate, resourceInventoryRoutes);
app.use("/api/alerts", authenticate, systemAlertRoutes);
app.use("/api/admin", authenticate, authorizeRoles("ADMIN"), adminRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/emergency-nurse", emergencyNurseRoutes);
app.use("/api/triage-nurse", triageNurseRoutes);
app.use("/api/demo-health", demoHealthRoutes);
app.use("/api/admin", adminStaffUserRoutes);

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message: "MediFlow backend is running",
  });
});

module.exports = app;