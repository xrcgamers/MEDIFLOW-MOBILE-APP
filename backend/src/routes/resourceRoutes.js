const express = require("express");
const { getResources } = require("../controllers/resourceController");

const router = express.Router();

router.get("/", getResources);

module.exports = router;