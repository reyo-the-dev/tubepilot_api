const express = require('express');
const router = express.Router();
const { automateVideoGeneration } = require('../controllers/automationController');

router.post('/create-video', automateVideoGeneration);

module.exports = router;
