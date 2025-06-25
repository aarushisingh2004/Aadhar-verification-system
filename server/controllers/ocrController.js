const Tesseract = require("tesseract.js");

exports.extractDOB = async (req, res) => {
  try {
    const imagePath = req.file.path;
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");

    const dobMatch = text.match(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
    let dob = dobMatch ? dobMatch[0].trim() : null;

    let age = "N/A";
    let isAdult = false;

    if (dob) {
      const [day, month, year] = dob.split(/[-/]/).map(Number);
      const birthDate = new Date(year, month - 1, day);

      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) {
          age -= 1;
        }
        isAdult = age >= 18;
      } else {
        dob = null;
      }
    }

    res.json({
      dob: dob || "Not found",
      age,
      isAdult,
      rawText: text
    });
  } catch (error) {
    console.error("Error in extractDOB:", error);
    res.status(500).json({ error: "Failed to extract DOB" });
  }
};
