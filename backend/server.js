require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const fraudDetectionRoute = require("./src/routes/fraudDetection");
const pinataRoute = require("./src/routes/pinata");
const healthRoute = require("./src/routes/health");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/health", healthRoute);
app.use("/api/fraud", fraudDetectionRoute);
app.use("/api/ipfs", pinataRoute);

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
