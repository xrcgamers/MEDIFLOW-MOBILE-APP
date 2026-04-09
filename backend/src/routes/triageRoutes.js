const express = require("express");
const { assessTriage } = require("../controllers/triageController");

const router = express.Router();

router.post("/assess", assessTriage);

module.exports = router;