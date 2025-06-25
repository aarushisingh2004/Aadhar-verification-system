const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyFaceSSE } = require("../controllers/verifyFace");

const router = express.Router();

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 📸 Multer setup
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

/**
 * ✅ 1. Upload Route — returns uploaded file paths
 * Use this to upload first, get paths → then call SSE route with those paths
 */
router.post("/users/upload", upload.fields([
  { name: "aadhaar", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]), (req, res) => {
  try {
    const aadhaarPath = req.files["aadhaar"]?.[0]?.path;
    const selfiePath = req.files["selfie"]?.[0]?.path;

    if (!aadhaarPath || !selfiePath) {
      return res.status(400).json({ error: "Missing uploaded files" });
    }

    res.json({
      success: true,
      aadhaarPath,
      selfiePath
    });
  } catch (err) {
    console.error("❌ Upload Error:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * ✅ 2. SSE Route — processes uploaded files
 * Expects `aadhaarPath` and `selfiePath` as query params
 */
router.get("/users/verify-face-sse", verifyFaceSSE);

module.exports = router;
