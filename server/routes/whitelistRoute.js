const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const AllowedParticipant = require("../models/AllowedParticipant");
const Event = require("../models/Event");
const { verifyToken } = require("../middleware/auth");

// Use /tmp/ for Vercel (read-only filesystem — only /tmp/ is writable in serverless)
const upload = multer({ dest: "/tmp/" });

// Upload and Parse Whitelist Route
router.post("/:eventId/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Strict Validation: Event existence
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const results = [];
    let hasError = false;

    // Stream CSV into Memory safely
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => {
        if (!data.admissionNumber || !data.email) {
          hasError = true;
        } else {
          results.push({
            eventId: eventId,
            admissionNumber: data.admissionNumber.trim(),
            email: data.email.trim().toLowerCase()
          });
        }
      })
      .on("end", async () => {
        // Destroy the temporary incoming file payload
        fs.unlinkSync(req.file.path);

        // Terminate process if schema violated
        if (hasError) {
          return res.status(400).json({ message: "Invalid CSV format. Headers must exactly match 'admissionNumber' and 'email'." });
        }
        if (results.length === 0) {
          return res.status(400).json({ message: "CSV file is empty." });
        }

        try {
          // Transactional Style Execution
          await AllowedParticipant.deleteMany({ eventId });
          await AllowedParticipant.insertMany(results);
          
          event.hasWhitelist = true;
          await event.save();

          res.json({ message: "Whitelist activated securely", count: results.length });
        } catch (dbErr) {
          res.status(500).json({ message: "Database Error", error: dbErr.message });
        }
      });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Retrieve Live Event Capacity Statistics
router.get("/:eventId/stats", verifyToken, async (req, res) => {
  try {
    const total = await AllowedParticipant.countDocuments({ eventId: req.params.eventId });
    const joined = await AllowedParticipant.countDocuments({ eventId: req.params.eventId, hasJoined: true });
    
    res.json({ total, joined });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
