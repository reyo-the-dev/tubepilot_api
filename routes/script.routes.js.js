const express = require("express");
const {
  generateScript,
  createtAndSaveScript,
  getProjectById,
} = require("../controllers/script.controller");
const authenticate = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/generate", authenticate, generateScript);
router.post("/save", authenticate, createtAndSaveScript);
router.get("/:id", authenticate, getProjectById);

module.exports = router;
