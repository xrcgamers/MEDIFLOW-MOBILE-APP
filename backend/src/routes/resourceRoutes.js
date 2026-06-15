const express = require("express");

const {
  getResources,
  addResourceAction,
} = require("../controllers/resourceController");

const {
  getResourceRequests,
  updateResourceRequest,
  allocateResourceToRequest,
  releaseResourceAllocation,
} = require("../controllers/resourceRequestController");

const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getResources);

router.get("/requests", requireAuth, getResourceRequests);

router.patch("/requests/:requestId", requireAuth, updateResourceRequest);

router.post(
  "/requests/:requestId/allocate",
  requireAuth,
  allocateResourceToRequest
);

router.post(
  "/allocations/:allocationId/release",
  requireAuth,
  releaseResourceAllocation
);

router.post("/:id/action", requireAuth, addResourceAction);

module.exports = router;