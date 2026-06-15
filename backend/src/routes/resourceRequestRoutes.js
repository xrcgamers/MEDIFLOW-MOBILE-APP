const express = require("express");
const {
  createPatientResourceRequest,
  getResourceRequests,
  updateResourceRequest,
} = require("../controllers/resourceRequestController");

const router = express.Router();

router.post("/patients/:patientId/resource-requests", createPatientResourceRequest);
router.get("/resource-requests", getResourceRequests);
router.patch("/resource-requests/:requestId", updateResourceRequest);

module.exports = router;