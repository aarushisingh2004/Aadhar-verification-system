import React, { useState } from 'react';
import axios from 'axios';

const OcrUpload = () => {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    setErrorMsg(null);

    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setPreviewURL(imageUrl);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an image first!");

    const formData = new FormData();
    formData.append("aadharImage", file);

    try {
      setLoading(true);
      setErrorMsg(null);

      const response = await axios.post("http://localhost:5000/api/users/upload-aadhar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("OCR result:", response.data);
      setResult(response.data);
    } catch (error) {
      setErrorMsg("Failed to extract DOB. Please try another image.");
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      <h1 style={{ fontWeight: "bold" }}>Aadhar Age Verification</h1>

      <h3>Upload Aadhar to Verify Age</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <br /><br />

      {previewURL && (
        <div style={{ marginBottom: "1rem" }}>
          <img src={previewURL} alt="Aadhar Preview" style={{ maxWidth: "300px", border: "1px solid #ccc" }} />
        </div>
      )}

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Verify"}
      </button>

      {errorMsg && <p style={{ color: 'red', marginTop: '1rem' }}>{errorMsg}</p>}

      {result && (
        <div style={{ marginTop: "2rem", fontSize: "1.1rem" }}>
          <p><strong>DOB:</strong> {result.dob || "❌ Not found"}</p>
          <p><strong>Age:</strong> {result.age !== null ? result.age : "N/A"}</p>
          <p><strong>Is Adult:</strong> {result.isAdult ? "✅ Yes" : "❌ No"}</p>

          {result.rawText && (
            <pre style={{
              background: "#f9f9f9",
              padding: "1rem",
              marginTop: "1rem",
              fontSize: "0.9rem",
              textAlign: "left",
              overflowX: "auto"
            }}>
              <strong>OCR Extracted Text:</strong>
              <br />
              {result.rawText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default OcrUpload;
