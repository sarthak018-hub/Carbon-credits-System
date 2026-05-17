const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "✅ Backend is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      fraud: "/api/fraud/detect",
      ipfs: "/api/ipfs/upload",
    },
  });
});

module.exports = router;
