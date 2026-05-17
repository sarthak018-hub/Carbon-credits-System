const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const fraudDetection = require("../utils/fraudDetection");

router.post("/detect", upload.single("file"), async (req, res) => {
  try {
    const { fileHash, creditsRequested } = req.body;

    if (!fileHash || !creditsRequested) {
      return res.status(400).json({ error: "Missing fileHash or creditsRequested" });
    }

    const result = fraudDetection.checkFraud(fileHash, creditsRequested);

    res.json({
      fileHash,
      creditsRequested,
      isFraud: result.isFraud,
      reason: result.reason,
      riskScore: result.riskScore,
    });
  } catch (error) {
    console.error("❌ Fraud detection error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
