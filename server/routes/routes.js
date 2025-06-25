const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyFace } = require("../controllers/verifyFace");

const router = express.Router();

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 📸 Multer storage setup for Aadhaar & Selfie images
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✅ Route: Face verification (Aadhaar + Selfie)
router.post(
  "/users/verify-face",
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]),
  verifyFace
);

module.exports = router;
