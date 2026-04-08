const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const {
  createJobandGenerateVideo,
} = require("../controllers/job/job.controller");
const router = express.Router();

router.post("/generateVideo", authenticate, createJobandGenerateVideo);

module.exports = router;
