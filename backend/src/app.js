const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const triageRoutes = require("./routes/triageRoutes");
const resourceRoutes = require("./routes/resourceRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/staff/triage", triageRoutes);
app.use("/api/staff/resources", resourceRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;