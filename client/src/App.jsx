import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const webcamRef = useRef(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [uploadedSelfie, setUploadedSelfie] = useState(null);
  const [useCaptured, setUseCaptured] = useState(true);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const file = dataURLtoFile(imageSrc, 'captured_selfie.png');
    setCapturedSelfie({ file, preview: imageSrc });
    setUseCaptured(true);
    toast.success("📸 Selfie captured successfully!");

    const webcamBox = document.querySelector('.webcam-box');
    if (webcamBox) {
      webcamBox.classList.add('flash');
      setTimeout(() => webcamBox.classList.remove('flash'), 300);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleVerify = async () => {
    if (!aadhaarFile) {
      toast.warn("📄 Please upload Aadhaar image");
      return;
    }
    if (!capturedSelfie && !uploadedSelfie) {
      toast.warn("📷 Please capture or upload a selfie");
      return;
    }

    setLoading(true);
    setResponse(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('aadhaar', aadhaarFile);
    const selfieToUse = useCaptured ? capturedSelfie?.file : uploadedSelfie;
    formData.append('selfie', selfieToUse);

    try {
      const uploadRes = await fetch('http://localhost:5000/api/users/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.aadhaarPath || !uploadData?.selfiePath) {
        throw new Error("Upload failed");
      }

      const sseUrl = `http://localhost:5000/api/users/verify-face-sse?aadhaarPath=${encodeURIComponent(uploadData.aadhaarPath)}&selfiePath=${encodeURIComponent(uploadData.selfiePath)}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.percent !== undefined) setProgress(data.percent);
        if (data.msg) console.log("📣", data.msg);

        if (data.done) {
          setResponse(data.result);
          toast.success("✅ Verification complete! Check the results below");
          setLoading(false);
          eventSource.close();
        }

        if (data.error) {
          toast.error("❌ " + data.error);
          setLoading(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        alert("Real-time connection failed.");
        setLoading(false);
        eventSource.close();
      };
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Verification failed: " + err.message);
      setProgress(0);
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className="navbar">
        <h2>🔐 VeriFace</h2>
      </div>

      <div className="container">
        <h1>🆔 Aadhaar Face Verification</h1>

        <h2 className={`step-title step1 ${activeStep >= 1 ? "active" : ""}`}>📤 Step 1: Upload Aadhaar</h2>
        <div className="section card-style">
          <label>📄 Upload Aadhaar Image:</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files[0];
            if (file) toast.success("📄 Aadhaar selected!");
            setAadhaarFile(file);
          }} />
        </div>

        <h2 className="step-title step2">📸 Step 2: Capture or Upload Selfie</h2>
        <div className="section card-style">
          <label>📷 Live Camera:</label>
          <div className="webcam-wrapper">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              width={300}
              height={240}
              videoConstraints={{ facingMode: "user" }}
              className="webcam-box"
              style={{
                borderRadius: '12px',
                border: '2px solid #007bff',
                backgroundColor: '#f0f4ff',
                objectFit: 'cover',
                boxShadow: '0 8px 20px rgba(0, 123, 255, 0.2)',
              }}
            />
            <button className="capture-btn" onClick={captureImage}>📸 Capture Selfie</button>
          </div>
        </div>

        <div className="section">
          <label>🖼️ Or Upload a Selfie (Backup):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) toast.success("🖼 Selfie uploaded!");
              setUploadedSelfie(file);
              setUseCaptured(false);
            }}
          />
        </div>

        <div className="section">
          <label>🧠 Which selfie to use?</label>
          <div className="radio-group">
            <label><input type="radio" checked={useCaptured} onChange={() => setUseCaptured(true)} /> Captured</label>
            <label><input type="radio" checked={!useCaptured} onChange={() => setUseCaptured(false)} /> Uploaded</label>
          </div>
        </div>

        <div className="section card-style">
          <label>🖼 Image Previews:</label>
          <div className="preview-row">
            {aadhaarFile && (
              <div className="preview-box">
                <p>📄 Aadhaar Image</p>
                <img src={URL.createObjectURL(aadhaarFile)} className="preview" />
              </div>
            )}
            {capturedSelfie?.preview && (
              <div className={`preview-box ${useCaptured ? "selected" : ""}`}>
                <p>📷 Captured Selfie</p>
                <img src={capturedSelfie.preview} className="preview" />
              </div>
            )}
            {uploadedSelfie && (
              <div className={`preview-box ${!useCaptured ? "selected" : ""}`}>
                <p>🖼 Uploaded Selfie</p>
                <img src={URL.createObjectURL(uploadedSelfie)} className="preview" />
              </div>
            )}
          </div>
        </div>

        <h2 className="step-title step3">🔍 Step 3: Verify & Get Results</h2>

        {loading ? (
          <>
            <div className="progress-container">
              <div className="progress-bar" style={{
                width: `${progress}%`,
                backgroundColor:
                  progress < 50 ? '#ffc107' :
                    progress < 90 ? '#17a2b8' :
                      '#28a745'
              }}></div>
            </div>
            <p className="progress-message">
              {progress < 20 ? '🔍 Uploading files' :
                progress < 50 ? '🧠 Performing OCR' :
                  progress < 90 ? '🤖 Matching faces' :
                    progress < 100 ? '🧾 Finalizing report' : '✅ Done!'} ({progress}%)
            </p>
          </>
        ) : (
          <button onClick={handleVerify}>✅ Verify Now</button>
        )}

        {response && (
          <div className="result fade-in-up">
            <div className="result">
              <h2>🔍 Verification Summary</h2>
              <div className="result-grid">
                <div className={`status-card ${response.match ? "yes" : "no"}`}>
                  <h4>Match</h4>
                  <p>{response.match ? "✅ Face Matched" : "❌ Face Mismatch"}</p>
                </div>
                <div className="status-card">
                  <h4>Similarity</h4>
                  <p>{response.similarity}</p>
                </div>
                <div className={`status-card ${response.age_verified ? "yes" : "no"}`}>
                  <h4>Age Verified</h4>
                  <p>{response.age_verified ? "✅ 18+ Allowed" : "❌ Underage"}</p>
                </div>
              </div>

              <div className={`age-box ${response.age_verified ? "valid" : "invalid"}`}>
                {response.age_verified ? (
                  <p>🎉 You are <strong>{response.aadhaar_info.age}</strong> years old — access granted!</p>
                ) : (
                  <p>⚠️ You are <strong>{response.aadhaar_info.age}</strong> — access denied.</p>
                )}
              </div>

              <h3>📋 Aadhaar Information</h3>
              <div className="aadhaar-info-grid">
                {response.aadhaar_info?.name && (
                  <div><span>🧑 Name:</span> <strong>{response.aadhaar_info.name}</strong></div>
                )}
                {response.aadhaar_info?.gender && (
                  <div><span>🚻 Gender:</span> <strong>{response.aadhaar_info.gender}</strong></div>
                )}
                {response.aadhaar_info?.dob && (
                  <div><span>📅 DOB:</span> <strong>{response.aadhaar_info.dob}</strong></div>
                )}
                {response.aadhaar_info?.aadhaar_number && (
                  <div><span>🔢 Aadhaar Number:</span> <strong>{response.aadhaar_info.aadhaar_number}</strong></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
