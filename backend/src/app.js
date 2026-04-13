const express = require("express");
const cors = require("cors");
const path = require("path");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const triageRoutes = require("./routes/triageRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

app.use("/api/staff", requireAuth, staffRoutes);
app.use("/api/staff/triage", requireAuth, triageRoutes);
app.use("/api/staff/resources", requireAuth, resourceRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;