const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ message: "Healthy" });
});

router.use("/speech", require("./speech"));
router.use("/automation", require("./automation"));

router.use("/script", require("./script.routes.js"));

router.use("/project", require("./project.routes.js"));
router.use("/job", require("./job.routes.js"));

module.exports = router;
