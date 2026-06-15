const express = require("express");
const {
  getResourceItems,
  createResourceItem,
  updateResourceItem,
  getResourceCategories,
  allocateResourceToRequest,
  releaseResourceAllocation,
} = require("../controllers/resourceItemController");

const router = express.Router();

router.get("/resource-categories", getResourceCategories);
router.get("/resource-items", getResourceItems);
router.post("/resource-items", createResourceItem);
router.patch("/resource-items/:resourceItemId", updateResourceItem);

router.post("/resource-requests/:requestId/allocate", allocateResourceToRequest);
router.post("/resource-allocations/:allocationId/release", releaseResourceAllocation);

module.exports = router;