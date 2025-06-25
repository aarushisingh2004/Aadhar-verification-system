const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.verifyFace = async (req, res) => {
  const aadhaarImg = req.files["aadhaar"]?.[0];
  const selfieImg = req.files["selfie"]?.[0];

  if (!aadhaarImg || !selfieImg) {
    return res.status(400).json({ success: false, message: "Aadhaar and selfie images are required." });
  }

  const aadhaarPath = aadhaarImg.path;
  const selfiePath = selfieImg.path;

  try {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

    // ✅ 1. Aadhaar OCR
    const ocrResult = await runPython(["scripts/extract_info.py", aadhaarPath]);
    if (ocrResult.error) throw new Error(ocrResult.error);

    const age = ocrResult.age;
    const age_verified = typeof age === "number" && age >= 18;

    // ✅ 2. Aadhaar Embedding
    const aadhaarResult = await runPython(["scripts/get_embedding.py", aadhaarPath]);
    if (aadhaarResult.error || !aadhaarResult.embedding || aadhaarResult.embedding.length !== 128) {
      throw new Error("Face not detected in Aadhaar image or invalid embedding.");
    }
    const aadhaarEmbedPath = path.join("uploads", "aadhaar_embedding.txt");
    fs.writeFileSync(aadhaarEmbedPath, aadhaarResult.embedding.join("\n"));
    console.log("📏 Aadhaar embedding length:", aadhaarResult.embedding.length);

    // ✅ 3. Selfie Embedding
    const selfieResult = await runPython(["scripts/get_embedding.py", selfiePath]);
    if (selfieResult.error || !selfieResult.embedding || selfieResult.embedding.length !== 128) {
      throw new Error("Face not detected in selfie image or invalid embedding.");
    }
    const selfieEmbedPath = path.join("uploads", "selfie_embedding.txt");
    fs.writeFileSync(selfieEmbedPath, selfieResult.embedding.join("\n"));
    console.log("📏 Selfie embedding length:", selfieResult.embedding.length);

    // ✅ 4. Compare Embeddings
    const compareResult = await runPython(["scripts/compare_embeddings.py", aadhaarEmbedPath, selfieEmbedPath]);

    if (compareResult.error || typeof compareResult.similarity !== "number") {
      throw new Error(compareResult.error || "Face comparison failed.");
    }

    // ✅ Optional: Clean up files
    fs.unlink(aadhaarEmbedPath, () => {});
    fs.unlink(selfieEmbedPath, () => {});

    return res.status(200).json({
      success: true,
      match: compareResult.match,
      similarity: `${compareResult.similarity}%`,
      age_verified,
      aadhaar_info: ocrResult,
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

// ✅ Helper: Runs Python script and parses output
function runPython(args) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", args);
    let output = "", errorOutput = "";

    py.stdout.on("data", (data) => output += data.toString());
    py.stderr.on("data", (data) => errorOutput += data.toString());

    py.on("error", (err) => reject(new Error("Python execution failed: " + err.message)));

    py.on("close", () => {
      if (errorOutput && output.trim() === "") {
        return reject(new Error("Python script error: " + errorOutput));
      }
      try {
        const result = JSON.parse(output.trim());
        resolve(result);
      } catch (e) {
        reject(new Error("Invalid JSON from Python: " + output.trim()));
      }
    });
  });
}
