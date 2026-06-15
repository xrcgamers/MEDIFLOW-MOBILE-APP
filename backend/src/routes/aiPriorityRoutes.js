const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { analyzeIncidentPriority } = require("../controllers/aiPriorityController");

const router = express.Router();

router.post("/incidents/:id/analyze-priority", authenticate, analyzeIncidentPriority);

module.exports = router;