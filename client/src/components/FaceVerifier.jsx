import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";

const FaceVerifier = () => {
  const [aadharImage, setAadharImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [result, setResult] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);
  const webcamRef = useRef(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log("✅ Models loaded");
      setModelLoaded(true);
    };
    loadModels();
  }, []);

  // Capture live selfie from webcam
  const captureSelfie = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setSelfieImage(imageSrc);
  };

  // Load image and return HTMLImageElement
  const loadImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = typeof file === "string" ? file : URL.createObjectURL(file);
    });
  };

  // Compare faces
  const handleCompare = async () => {
    if (!modelLoaded) {
      setResult("❗ Please wait, models are still loading.");
      return;
    }

    if (!aadharImage || !selfieImage) {
      setResult("❗ Upload Aadhaar image and take selfie.");
      return;
    }

    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

    const aadharImg = await loadImage(aadharImage);
    const selfieImg = await loadImage(selfieImage);

    const aadharDetection = await faceapi
      .detectSingleFace(aadharImg, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const selfieDetection = await faceapi
      .detectSingleFace(selfieImg, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!aadharDetection || !selfieDetection) {
      console.log("❌ Face detection failed:");
      if (!aadharDetection) console.log("Aadhaar image failed.");
      if (!selfieDetection) console.log("Selfie image failed.");
      setResult("❌ Could not detect face in one or both images.");
      return;
    }

    const distance = faceapi.euclideanDistance(
      aadharDetection.descriptor,
      selfieDetection.descriptor
    );

    console.log("🔍 Euclidean Distance:", distance);
    setResult(distance < 0.5 ? "✅ Faces match." : "❌ Faces do not match.");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Face Verification with Live Selfie</h2>

      {/* Aadhaar image upload */}
      <div>
        <label>Upload Aadhaar Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAadharImage(e.target.files[0])}
        />
      </div>

      {/* Aadhaar preview */}
      {aadharImage && (
        <div style={{ marginTop: "1rem" }}>
          <p>Aadhaar Image Preview:</p>
          <img src={URL.createObjectURL(aadharImage)} alt="Aadhaar" width="200" />
        </div>
      )}

      {/* Webcam live view */}
      <div style={{ marginTop: "1rem" }}>
        <label>Live Selfie:</label>
        <Webcam
          audio={false}
          height={240}
          screenshotFormat="image/jpeg"
          width={320}
          ref={webcamRef}
          videoConstraints={{
            facingMode: "user",
          }}
        />
        <br />
        <button onClick={captureSelfie}>📸 Capture Selfie</button>
      </div>

      {/* Selfie preview */}
      {selfieImage && (
        <div style={{ marginTop: "1rem" }}>
          <p>Selfie Preview:</p>
          <img src={selfieImage} alt="Selfie" width="200" />
        </div>
      )}

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={!modelLoaded}
        style={{ marginTop: "1rem" }}
      >
        {modelLoaded ? "Compare Faces" : "Loading Models..."}
      </button>

      {/* Result */}
      <div style={{ marginTop: "1rem" }}>
        <strong>Result:</strong> {result}
      </div>
    </div>
  );
};

export default FaceVerifier;
