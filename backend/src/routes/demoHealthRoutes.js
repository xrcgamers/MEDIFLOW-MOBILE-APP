const express = require("express");
const { getDemoHealth } = require("../controllers/demoHealthController");

const router = express.Router();

router.get("/", getDemoHealth);

module.exports = router;