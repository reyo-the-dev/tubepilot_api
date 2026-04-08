const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const {
  saveAudioVideoPreferences,
  getUserProjects,
} = require("../controllers/project/project.controller");
const router = express.Router();

router.get("/", authenticate, getUserProjects);

router.post("/saveAV", authenticate, saveAudioVideoPreferences);

module.exports = router;
