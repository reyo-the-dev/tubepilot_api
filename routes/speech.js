const express = require("express");
const {
  convertTextToSpeech,

  getTimeStamps,
} = require("../controllers/speechController");
const {
  generateVideo,
} = require("../controllers/video_controller/video_controller");
const { generateImageEndpoint } = require("../controllers/imageController");
const router = express.Router();

router.post("/", convertTextToSpeech);
// router.post("/generateScript", generateScript);
router.post("/getTimeStamps", getTimeStamps);
router.post("/generateVideo", generateVideo);
router.post("/image", generateImageEndpoint);

module.exports = router;
