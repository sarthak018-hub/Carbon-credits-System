const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const crypto = require("crypto");
const upload = multer({ storage: multer.memoryStorage() });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET;

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!PINATA_API_KEY || !PINATA_SECRET) {
      return res.status(500).json({ error: "Pinata credentials not configured" });
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET,
        },
      }
    );

    const cid = response.data.IpfsHash;
    const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

    res.json({
      success: true,
      cid,
      fileHash,
      filename: req.file.originalname,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ IPFS upload error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
