//

const express = require("express");
const {
  generateImageForSlide,
  generateSlidesForEvents,
} = require("../controllers/history/history");

const router = express.Router();

router.post("/generateImage", generateImageForSlide);
router.post("/generateSlides", generateSlidesForEvents);

module.exports = router;
