const express = require("express");
const {
  generateScriptFromNews,
  generateSlideFromScript,
} = require("../controllers/job/news/news.controller");

// const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/script/generate", generateScriptFromNews);
router.post("/slide/generate", generateSlideFromScript);

module.exports = router;
