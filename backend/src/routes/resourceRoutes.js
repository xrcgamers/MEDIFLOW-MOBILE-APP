const express = require("express");

const {
  getResourceCategories,
  getResources,
  createResourceItem,
  updateResourceItem,
  deleteResourceItem,
  addResourceAction,
} = require("../controllers/resourceController");

const {
  getResourceRequests,
  updateResourceRequest,
  allocateResourceToRequest,
  releaseResourceAllocation,
} = require("../controllers/resourceRequestController");

const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/categories", requireAuth, getResourceCategories);

router.get("/", requireAuth, getResources);

router.post(
  "/",
  requireAuth,
  authorizeRoles("ADMIN"),
  createResourceItem
);

router.patch(
  "/:id",
  requireAuth,
  authorizeRoles("ADMIN"),
  updateResourceItem
);

router.delete(
  "/:id",
  requireAuth,
  authorizeRoles("ADMIN"),
  deleteResourceItem
);

router.post(
  "/:id/action",
  requireAuth,
  addResourceAction
);

router.get(
  "/requests",
  requireAuth,
  getResourceRequests
);

router.patch(
  "/requests/:requestId",
  requireAuth,
  updateResourceRequest
);

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

module.exports = router;