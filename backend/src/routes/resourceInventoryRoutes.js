const express = require("express");
const {
  getResourceItems,
  createResourceItem,
  updateResourceItem,
  getResourceCategories,
} = require("../controllers/resourceInventoryController");

const router = express.Router();

router.get("/categories", getResourceCategories);
router.get("/items", getResourceItems);
router.post("/items", createResourceItem);
router.patch("/items/:resourceItemId", updateResourceItem);

module.exports = router;