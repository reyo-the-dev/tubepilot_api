const express = require("express");
const { converseWithLLM } = require("../controllers/llm/llm.controller");

const router = express.Router();

router.post("/converse", converseWithLLM);

module.exports = router;
