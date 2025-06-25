import sys, os, json
import torch
import numpy as np
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1

# Make sure it's pretrained on 'vggface2' which gives 512-d — we'll reduce it
mtcnn = MTCNN(image_size=160, margin=0)
model = InceptionResnetV1(pretrained='vggface2').eval()

def extract_embedding(path):
    try:
        img = Image.open(path).convert('RGB')
        face = mtcnn(img)

        if face is None:
            return None, None

        with torch.no_grad():
            embedding_tensor = model(face.unsqueeze(0))  # Shape: [1, 512]

        emb = embedding_tensor.squeeze().cpu().numpy()  # Shape: (512,)
        norm = np.linalg.norm(emb)
        if norm == 0:
            raise ValueError("Embedding normalization failed.")
        emb = emb / norm  # Normalize

        # ⚠️ New: Reduce to 128 dims if needed using PCA or slicing
        if emb.size == 512:
            emb = emb[:128]  # TEMP: Just slicing for Zynga task (not ideal but acceptable for demo)

        if emb.ndim != 1 or emb.size != 128:
            raise ValueError(f"Invalid embedding shape: {emb.shape}. Expected 128-d vector.")

        # Save cropped face image
        cropped_path = path.replace(".jpg", "_face.jpg").replace(".png", "_face.jpg")
        face_img = face.permute(1, 2, 0).mul(255).byte().numpy()
        Image.fromarray(face_img).save(cropped_path)

        return emb.tolist(), os.path.basename(cropped_path)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    try:
        img_path = sys.argv[1]
        emb, cropped = extract_embedding(img_path)

        if emb is None:
            print(json.dumps({"error": "No face detected"}))
        else:
            print(json.dumps({
                "embedding": emb,
                "cropped_face": cropped
            }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
