import React, { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 320,
  height: 240,
  facingMode: "user",
};

const Matching = () => {
  const [aadhaarImage, setAadhaarImage] = useState(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef(null);

  const captureSelfie = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedSelfie(imageSrc);
  };

  const handleSubmit = async () => {
    if (!aadhaarImage || !capturedSelfie) {
      alert("Please upload Aadhaar image and capture a selfie.");
      return;
    }

    try {
      setLoading(true);
      const selfieBlob = await fetch(capturedSelfie).then((res) => res.blob());
      const formData = new FormData();
      formData.append("aadhaar", aadhaarImage);
      formData.append("selfie", selfieBlob, "selfie.jpg");

      const response = await axios.post("http://localhost:5000/api/users/verify-face", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setMatchResult(response.data);
      } else {
        alert(response.data.message || "Face match failed");
        setMatchResult(null);
      }
    } catch (error) {
      console.error("Face match error:", error);
      alert("Failed to process face match. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🧠 Face Matching System</h2>

      {/* Aadhaar Upload */}
      <div style={{ marginBottom: "1rem" }}>
        <label><strong>Upload Aadhaar Image</strong></label><br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAadhaarImage(e.target.files[0])}
        />
        {aadhaarImage && (
          <div style={{ marginTop: "1rem" }}>
            <strong>Aadhaar Preview:</strong><br />
            <img src={URL.createObjectURL(aadhaarImage)} alt="Aadhaar Preview" width={160} />
          </div>
        )}
      </div>

      {/* Webcam Section */}
      <div style={{ marginBottom: "1rem" }}>
        <label><strong>Capture Selfie</strong></label><br />
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
        />
        <br />
        <button onClick={captureSelfie} style={{ marginTop: "0.5rem" }}>
          📸 Capture Selfie
        </button>
      </div>

      {/* Selfie Preview */}
      {capturedSelfie && (
        <div style={{ margin: "1rem 0" }}>
          <strong>Selfie Preview:</strong><br />
          <img src={capturedSelfie} alt="Selfie" width={160} />
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "🚀 Submit for Face Match"}
      </button>

      {/* Result */}
      {matchResult && (
        <div style={{ marginTop: "2rem" }}>
          <h3>🔍 Result:</h3>
          <p style={{ color: matchResult.match ? "green" : "red" }}>
            ✅ Match: {matchResult.match ? "Yes ✅" : "No ❌"}
          </p>
          <p>Confidence: {matchResult.confidence}</p>
          {matchResult.message && <p style={{ color: "red" }}>{matchResult.message}</p>}
        </div>
      )}
    </div>
  );
};

export default Matching;
