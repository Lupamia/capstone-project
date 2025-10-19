const express = require("express");
const multer = require("multer");
const { uploadBulkSeniors } = require("../service/seniorController"); // ✅ updated path

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/bulk-upload", upload.single("file"), uploadBulkSeniors);

module.exports = router;
