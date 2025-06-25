import sys
import json
import numpy as np
from scipy.spatial.distance import cosine

def read_embedding(file_path):
    try:
        embedding = np.loadtxt(file_path)
        if embedding.ndim != 1 or embedding.size != 128:
            raise ValueError("Invalid embedding shape.")
        return embedding
    except Exception as e:
        raise ValueError(f"Error reading {file_path}: {str(e)}")

def compare_embeddings(a_path, b_path):
    emb1 = read_embedding(a_path)
    emb2 = read_embedding(b_path)

    similarity = 1 - cosine(emb1, emb2)
    if np.isnan(similarity):
        raise ValueError("Similarity calculation failed (NaN)")

    return {
        "match": bool(similarity >= 0.7),  # ✅ FIXED: Convert numpy.bool_ → Python bool
        "similarity": round(float(similarity * 100), 2)  # ✅ Convert numpy.float64 → float
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({ "error": "Expected 2 input paths" }))
        sys.exit(1)

    try:
        result = compare_embeddings(sys.argv[1], sys.argv[2])
        print(json.dumps(result))  # ✅ No more serialization errors
    except Exception as e:
        print(json.dumps({ "error": str(e) }))
        sys.exit(1)
