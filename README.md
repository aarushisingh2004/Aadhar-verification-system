---

---

# 🔐 VeriFace — Aadhaar + Face + Age Verification App

**Team Alpha Coders | Zynga Hackathon 2025**

**Team Members:** Akshita Goel, Aarushi Singh, Chanda Jha, Mayuri Paliwal, Monika Rana

Real-time face match and age verification using Aadhaar + Selfie. Built with ❤️ using the **MERN stack** + **Python AI backend**.

---

## 🧠 Overview

VeriFace checks if a person is:

* ✅ **18+** (based on Aadhaar DOB)
* ✅ **Same person** (via face match with selfie)
* ✅ **Using a valid Aadhaar card**

**Key Features:**

* 🔍 Real-time OCR + face comparison
* 🔄 Live progress with Server-Sent Events (SSE)
* 🎥 React UI with webcam integration
* 🧠 AI-powered backend (PyTorch + Python + Node)

---

## 📽️ Demo Video

🎥 Click to watch VeriFace in action:
[![Watch the demo](https://img.youtube.com/vi/YOUTUBE_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID)

> *(Replace `YOUTUBE_VIDEO_ID` with your actual YouTube ID)*

---

## 🖼️ UI Walkthrough — Step-by-Step

### 🪪 Step 1: Upload Aadhaar

![Step 1](./assets/step1.jpg)

### 📸 Step 2: Capture or Upload Selfie

![Step 2](./assets/step2.jpg)

### ⏳ Step 3: Live Verification Progress

SSE-powered updates showing OCR, embedding & similarity processing
![Progress](./assets/progress.jpg)

### ✅ Step 4: Click Verify and View Results

![Results](./assets/step3.jpg)

---

## 🧑‍💻 Tech Stack

| Layer         | Tech Stack                                         |
| ------------- | -------------------------------------------------- |
| **Frontend**  | React.js, React Webcam, Toastify                   |
| **Backend**   | Node.js, Express, Multer, Server-Sent Events (SSE) |
| **Python AI** | Tesseract, FaceNet (InceptionResNet), MTCNN        |
| **Database**  | None (stateless demo)                              |
| **Libs**      | facenet-pytorch, OpenCV, SciPy, NumPy              |

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-team/VeriFace.git
cd VeriFace
```

### 2. Install Frontend

```bash
cd client
npm install
npm start
```

### 3. Install Backend

```bash
cd ../server
npm install
```

### 4. Setup Python Scripts

```bash
cd scripts
pip install -r requirements.txt
```

---

## 📷 React Frontend Highlights

* 🔴 Live webcam preview + capture
* 🪪 Aadhaar image upload
* ⚡ Realtime progress via SSE
* ✅ Result cards with age + match score

---

## 🧠 Express Backend API

### `POST /api/users/upload`

**Uploads Aadhaar + Selfie**

**Response:**

```json
{
  "aadhaarPath": "...",
  "selfiePath": "..."
}
```

---

### `GET /api/users/verify-face-sse?aadhaarPath=...&selfiePath=...`

**Streams live verification progress**

**Response Stream:**

```json
data: { "percent": 60, "msg": "📸 Processing Selfie..." }
data: { "done": true, "result": { ... } }
```

---

## 🧠 Python Scripts

### 📝 `extract_info.py` — OCR Aadhaar Info

Extracts:

* Name
* DOB
* Gender
* Aadhaar number
* Age (from DOB)

**Sample Output:**

```json
{
  "name": "Aarushi Singh",
  "dob": "15/08/2004",
  "gender": "Female",
  "aadhaar_number": "123456789012",
  "age": 20
}
```

---

### 🧬 `get_embedding.py` — Face Embedding

* MTCNN → face detection
* InceptionResNet → 512-d embeddings
* Sliced to 128-d for demo
* Saves cropped face image

```python
if emb.size == 512:
    emb = emb[:128]
```

**Sample Output:**

```json
{
  "embedding": [0.02, -0.03, ...],
  "cropped_face": "aadhaar_face.jpg"
}
```

---

### 🧠 `compare_embeddings.py` — Face Match

* Loads Aadhaar + selfie embeddings
* Cosine similarity ≥ 70% → match

**Sample Output:**

```json
{
  "match": true,
  "similarity": 82.45
}
```

---

## 🔁 Alternate Blocking API (No SSE)

### `POST /api/users/verify`

**FormData:** `aadhaar`, `selfie`

**Output:**

```json
{
  "face_match": true,
  "similarity": "83.92%",
  "age_verified": true,
  "aadhaar_info": { ... }
}
```

---

## 🧪 JS-only OCR API (Fallback)

### `POST /api/utils/extract-dob`

**Output:**

```json
{
  "dob": "15/08/2004",
  "age": 20,
  "isAdult": true
}
```

---

## 🏁 What We Achieved

* ✅ Full offline AI pipeline
* ✅ Real-time updates via SSE
* ✅ Face match + age verification
* ✅ Clean & responsive UI
* ✅ End-to-end working hackathon demo

---
