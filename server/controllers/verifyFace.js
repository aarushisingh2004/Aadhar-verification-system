const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.verifyFaceSSE = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const aadhaarPath = req.query.aadhaarPath;
  const selfiePath = req.query.selfiePath;

  const sendProgress = (percent, msg) => {
    res.write(`data: ${JSON.stringify({ percent, msg })}\n\n`);
  };

  if (!aadhaarPath || !selfiePath) {
    sendProgress(0, "Missing Aadhaar or Selfie path");
    return res.end();
  }

  try {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

    // ✅ Step 1: OCR
    sendProgress(10, "🧠 Extracting Aadhaar details...");
    const ocrResult = await runPython(["scripts/extract_info.py", aadhaarPath]);
    if (ocrResult.error) throw new Error(ocrResult.error);
    const age = ocrResult.age;
    const age_verified = typeof age === "number" && age >= 18;

    // ✅ Step 2: Aadhaar Embedding
    sendProgress(30, "📷 Processing Aadhaar face...");
    const aadhaarResult = await runPython(["scripts/get_embedding.py", aadhaarPath]);
    if (
      aadhaarResult.error ||
      !aadhaarResult.embedding ||
      aadhaarResult.embedding.length !== 128
    ) {
      throw new Error("Face not detected in Aadhaar image or invalid embedding.");
    }
    const aadhaarEmbedPath = path.join("uploads", "aadhaar_embedding.txt");
    fs.writeFileSync(aadhaarEmbedPath, aadhaarResult.embedding.join("\n"));

    // ✅ Step 3: Selfie Embedding
    sendProgress(60, "📸 Processing Selfie...");
    const selfieResult = await runPython(["scripts/get_embedding.py", selfiePath]);
    if (
      selfieResult.error ||
      !selfieResult.embedding ||
      selfieResult.embedding.length !== 128
    ) {
      throw new Error("Face not detected in selfie image or invalid embedding.");
    }
    const selfieEmbedPath = path.join("uploads", "selfie_embedding.txt");
    fs.writeFileSync(selfieEmbedPath, selfieResult.embedding.join("\n"));

    // ✅ Step 4: Face Comparison
    sendProgress(85, "🤖 Matching faces...");
    const compareResult = await runPython([
      "scripts/compare_embeddings.py",
      aadhaarEmbedPath,
      selfieEmbedPath,
    ]);
    if (compareResult.error || typeof compareResult.similarity !== "number") {
      throw new Error(compareResult.error || "Face comparison failed.");
    }

    // ✅ Step 5: Clean up
    fs.unlink(aadhaarEmbedPath, () => {});
    fs.unlink(selfieEmbedPath, () => {});

    // ✅ Step 6: Final response
    sendProgress(100, "✅ Done!");
    res.write(
      `data: ${JSON.stringify({
        done: true,
        result: {
          success: true,
          match: compareResult.match,
          similarity: `${compareResult.similarity}%`,
          age_verified,
          aadhaar_info: ocrResult,
        },
      })}\n\n`
    );
    res.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.write(
      `data: ${JSON.stringify({
        error: err.message || "Internal server error",
      })}\n\n`
    );
    res.end();
  }
};

function runPython(args) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", args);
    let output = "",
      errorOutput = "";

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (errorOutput += data.toString()));

    py.on("error", (err) =>
      reject(new Error("Python execution failed: " + err.message))
    );

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
