import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [uploadedSelfie, setUploadedSelfie] = useState(null);
  const [useCaptured, setUseCaptured] = useState(true);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const file = dataURLtoFile(imageSrc, 'captured_selfie.png');
    setCapturedSelfie({ file, preview: imageSrc });
    setUseCaptured(true);
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
    if (!aadhaarFile) return alert("Please upload Aadhaar image");
    if (!capturedSelfie && !uploadedSelfie) return alert("Please capture or upload a selfie");

    setLoading(true);
    const formData = new FormData();
    formData.append('aadhaar', aadhaarFile);
    const selfieToUse = useCaptured ? capturedSelfie?.file : uploadedSelfie;
    formData.append('selfie', selfieToUse);

    try {
      const res = await axios.post('http://localhost:5000/api/users/verify-face', formData);
      setResponse(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🆔 Aadhaar Face Verification</h1>

      <div className="section">
        <label>📄 Upload Aadhaar Image:</label>
        <input type="file" accept="image/*" onChange={(e) => setAadhaarFile(e.target.files[0])} />
      </div>

      <div className="section">
        <label>📷 Capture Live Selfie:</label>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          width={250}
          height={200}
          videoConstraints={{ facingMode: "user" }}
        />
        <button onClick={captureImage}>📸 Capture Selfie</button>
      </div>

      <div className="section">
        <label>🖼️ Or Upload a Selfie (Backup):</label>
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          setUploadedSelfie(file);
          setUseCaptured(false);
        }} />
      </div>

      <div className="section">
        <label>🧠 Which selfie to use?</label>
        <div className="radio-group">
          <label><input type="radio" checked={useCaptured} onChange={() => setUseCaptured(true)} /> Captured</label>
          <label><input type="radio" checked={!useCaptured} onChange={() => setUseCaptured(false)} /> Uploaded</label>
        </div>
      </div>

      <div className="preview-row">
        {aadhaarFile && (
          <div className="preview-box">
            <p>📄 Aadhaar Image</p>
            <img src={URL.createObjectURL(aadhaarFile)} className="preview" />
          </div>
        )}
        {capturedSelfie?.preview && (
          <div className="preview-box">
            <p>📷 Captured Selfie</p>
            <img src={capturedSelfie.preview} className="preview" />
          </div>
        )}
        {uploadedSelfie && (
          <div className="preview-box">
            <p>🖼️ Uploaded Selfie</p>
            <img src={URL.createObjectURL(uploadedSelfie)} className="preview" />
          </div>
        )}
      </div>

      <button disabled={loading} onClick={handleVerify}>
        {loading ? "Verifying..." : "✅ Verify Now"}
      </button>

      {response && (
        <div className="result">
          <h2>✅ Verification Result</h2>
          <p><strong>Match:</strong> {response.match ? "✅ Yes" : "❌ No"}</p>
          <p><strong>Similarity:</strong> {response.similarity}</p>
          <p><strong>Age Verified:</strong> {response.age_verified ? "✅ Yes" : "❌ No"}</p>

          <h3>📋 Aadhaar Info</h3>
          <div className="aadhaar-info">
            {response.aadhaar_info?.dob && <p>📅 <strong>DOB:</strong> {response.aadhaar_info.dob}</p>}
            {response.aadhaar_info?.age && <p>🎂 <strong>Age:</strong> {response.aadhaar_info.age}</p>}
            {response.aadhaar_info?.name && <p>🧑 <strong>Name:</strong> {response.aadhaar_info.name}</p>}
            {response.aadhaar_info?.gender && <p>🚻 <strong>Gender:</strong> {response.aadhaar_info.gender}</p>}
            {response.aadhaar_info?.aadhaar_number && <p>🔢 <strong>Aadhaar Number:</strong> {response.aadhaar_info.aadhaar_number}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
