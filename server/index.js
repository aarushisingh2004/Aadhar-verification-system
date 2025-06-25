const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const routes = require("./routes/routes");

dotenv.config();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api", routes);

// ✅ Root GET route for browser testing
app.get("/", (req, res) => {
  res.send("✅ Aadhar Verification API is running");
});

// Optional error handler
app.use((err, req, res, next) => {
  console.error("🔥 Internal Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
