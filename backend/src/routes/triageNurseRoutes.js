const express = require("express");
const { getTriageQueue } = require("../controllers/triageNurseController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/patients", requireAuth, getTriageQueue);

module.exports = router;