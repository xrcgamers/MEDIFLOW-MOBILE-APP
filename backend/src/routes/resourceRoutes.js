const express = require("express");
const {
  getResources,
  addResourceAction,
} = require("../controllers/resourceController");

const router = express.Router();

router.get("/", getResources);
router.post("/:id/action", addResourceAction);

module.exports = router;