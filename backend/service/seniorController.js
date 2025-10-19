const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const db = require("../config/db"); // Make sure this points to your MySQL connection

exports.uploadBulkSeniors = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    // ✅ Parse CSV files
    if (ext === ".csv") {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => records.push(data))
          .on("end", resolve)
          .on("error", reject);
      });
    }
    // ✅ Parse Excel files
    else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      records = xlsx.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: "Invalid file type. Please upload CSV or Excel." });
    }

    // ✅ Insert records into MySQL
    for (const row of records) {
      const {
        lastName,
        firstName,
        middleName,
        barangay,
        birthdate,
        gender,
        civilStatus,
        isPwd,
        pdl,
        utp,
        isPensioner,
        pensioner,
        remarks,
        booklet,
      } = row;

      await db.query(
        `INSERT INTO seniors 
        (lastName, firstName, middleName, barangay, birthdate, gender, civilStatus, isPwd, pdl, utp, isPensioner, pensioner, remarks, booklet) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lastName || null,
          firstName || null,
          middleName || null,
          barangay || null,
          birthdate || null,
          gender || null,
          civilStatus || null,
          isPwd || 0,
          pdl || 0,
          utp || 0,
          isPensioner || 0,
          pensioner || null,
          remarks || null,
          booklet || null,
        ]
      );
    }

    // ✅ Delete uploaded file after processing
    fs.unlinkSync(filePath);

    res.json({
      message: "✅ Bulk upload successful",
      totalInserted: records.length,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({
      message: "Server error during file upload",
      error: error.message,
    });
  }
};
