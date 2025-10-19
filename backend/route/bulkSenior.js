// backend/route/bulkSenior.js
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const seniorCitizenService = require("../service/seniorCitizenService");

const router = express.Router();

// ✅ Setup multer for Excel/CSV upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Test Route (to verify connection)
router.get("/bulk-insert", (req, res) => {
  res.json({ message: "✅ Bulk Insert route is active" });
});

// ✅ POST Route: Handle Bulk Upload
router.post("/bulk-insert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read Excel/CSV content
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data.length) {
      return res.status(400).json({ error: "Empty file or invalid data" });
    }

    // Insert all records
    const inserted = await seniorCitizenService.bulkInsert(data);

    res.json({
      message: "✅ Bulk upload successful",
      inserted: inserted.length || 0,
    });
  } catch (error) {
    console.error("❌ Bulk upload failed:", error);
    res.status(500).json({ error: "Server error during bulk upload" });
  }
});

module.exports = router;
