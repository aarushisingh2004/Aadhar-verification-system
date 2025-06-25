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
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }

    // Step 1: Aadhaar OCR
    const ocrResult = await runPython(["scripts/extract_info.py", aadhaarPath]);
    if (ocrResult.error) throw new Error(ocrResult.error);

    const age = ocrResult.age;
    const is18plus = age >= 18;

    // Step 2: Aadhaar Embedding
    const aadhaarResult = await runPython(["scripts/get_embedding.py", aadhaarPath]);
    if (aadhaarResult.error || !aadhaarResult.embedding) throw new Error("Face not detected in Aadhaar image");

    const aadhaarEmbedPath = path.join("uploads", "aadhaar_embedding.txt");
    fs.writeFileSync(aadhaarEmbedPath, aadhaarResult.embedding.join("\n"));

    // Step 3: Selfie Embedding
    const selfieResult = await runPython(["scripts/get_embedding.py", selfiePath]);
    if (selfieResult.error || !selfieResult.embedding) throw new Error("Face not detected in selfie image");

    const selfieEmbedPath = path.join("uploads", "selfie_embedding.txt");
    fs.writeFileSync(selfieEmbedPath, selfieResult.embedding.join("\n"));

    // Step 4: Compare embeddings
    const compareResult = await runPython([
      "scripts/compare_embeddings.py",
      aadhaarEmbedPath,
      selfieEmbedPath,
    ]);

    if (compareResult.error) throw new Error(compareResult.error);
    const similarity = typeof compareResult.similarity === "number"
      ? `${compareResult.similarity}%`
      : "0%";

    return res.status(200).json({
      success: true,
      face_match: compareResult.match,
      similarity: similarity,
      age_verified: is18plus,
      aadhaar_info: ocrResult
    });

  } catch (err) {
    console.error("🔴 Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error"
    });
  } finally {
    // Optional: clean up images
    // fs.unlink(aadhaarPath, () => {});
    // fs.unlink(selfiePath, () => {});
  }
};

function runPython(args) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", args);
    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    py.on("error", (err) => {
      reject(new Error("Failed to run Python script: " + err.message));
    });

    py.on("close", () => {
      if (errorOutput && output.trim() === "") {
        return reject(new Error("Python Error: " + errorOutput));
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
