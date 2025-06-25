# extract_info.py
import sys, cv2, re, json
import pytesseract
from datetime import datetime, date

def preprocess_image(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.resize(gray, None, fx=2, fy=2)

def extract_text(img):
    config = r'--oem 3 --psm 6'
    return pytesseract.image_to_string(img, config=config)

def calculate_age(dob_str):
    for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y']:
        try:
            bdate = datetime.strptime(dob_str, fmt).date()
            today = date.today()
            return today.year - bdate.year - ((today.month, today.day) < (bdate.month, bdate.day))
        except:
            continue
    return None

def parse_info(text):
    info = {}
    try:
        text = ' '.join(text.replace('\n', ' ').split())

        # ✅ Fixed: safe character class [-/.] instead of [/-\.]
        dob = re.search(r'(\d{2}[-/\.]\d{2}[-/\.]\d{4})', text)
        if dob:
            info['dob'] = dob.group(1)
            info['age'] = calculate_age(dob.group(1))

        name = re.search(r'Name[:\s]*([A-Z][A-Za-z\s]{2,50})', text)
        if name:
            info['name'] = name.group(1).strip()

        gender = re.search(r'\b(Male|Female|M|F)\b', text, re.IGNORECASE)
        if gender:
            info['gender'] = "Male" if gender.group(1).upper() in ['M', 'MALE'] else "Female"

        aadhaar = re.search(r'(\d{4}\s*\d{4}\s*\d{4})', text)
        if aadhaar:
            info['aadhaar_number'] = aadhaar.group(1).replace(" ", "")
    except Exception as e:
        return {"error": str(e)}
    return info

def main(img_path):
    try:
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError("Invalid image path or unreadable image.")
        text = extract_text(preprocess_image(img))
        result = parse_info(text)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main(sys.argv[1])