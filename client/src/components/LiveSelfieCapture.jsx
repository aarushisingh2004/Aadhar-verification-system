import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const LiveSelfieCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    onCapture(imageSrc); // Send to parent or upload
  };

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={320}
      />
      <button onClick={capture}>Capture Selfie</button>
    </div>
  );
};

export default LiveSelfieCapture;
