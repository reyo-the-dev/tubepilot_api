const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  console.log("hchealth check started..");

  res.json({ message: "Healthy" });
});

router.use("/speech", require("./speech"));
router.use("/automation", require("./automation"));

router.use("/script", require("./script.routes.js"));
router.use("/llm", require("./llm.js"));
router.use("/history", require("./history.routes.js"));

router.use("/project", require("./project.routes.js"));
router.use("/job", require("./job.routes.js"));
router.use("/news", require("./news.routes.js"));

module.exports = router;
