const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const {
  generateScriptForSlides,
  generateImageForSlide,
  generateSlideFromTemplate,
} = require("../controllers/slide/query/slide.query.controller");

const router = express.Router();

router.post("/script/generate", generateScriptForSlides);
router.post("/image/generate", generateImageForSlide);
router.post("/slide/generate", generateSlideFromTemplate);

module.exports = router;
