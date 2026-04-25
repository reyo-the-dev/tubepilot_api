const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const {
  createJobandGenerateVideo,
} = require("../controllers/job/job.controller");
const {
  generateCarousalImage,
} = require("../controllers/job/image/image_job.conrroller");
const {
  genetateSlidesForNews,
} = require("../controllers/job/news/news.controller");
const router = express.Router();

router.post("/generateVideo", authenticate, createJobandGenerateVideo);
router.post("/generateCarousalImage", generateCarousalImage);

router.post("/news", genetateSlidesForNews);

module.exports = router;
