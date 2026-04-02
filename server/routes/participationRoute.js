const router = require('express').Router();
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto');

// Join an event
router.post('/:eventId/join', verifyToken, async (req, res) => {
  try {
    const { course, cgpa } = req.body;
    const eventId = req.params.eventId;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    // Check if event is active or upcoming
    if (event.status !== "live" && event.status !== "upcoming") {
      return res.status(400).json({ error: "Event is not open for registration" });
    }
    
    const now = new Date();
    
    // We allow joining at any time while LIVE. The ending Cron job handles calculating if they met the required metrics.
    const requiredMs = event.requiredDuration * 60000;
    const latestEntryTime = new Date(event.endTime.getTime() - requiredMs);
    
    if (!event.hasWhitelist) {
      return res.status(400).json({ error: "Whitelist not uploaded yet. Event is locked." });
    }

    const AllowedParticipant = require('../models/AllowedParticipant');
    const allowed = await AllowedParticipant.findOne({
      eventId,
      $or: [
        { admissionNumber: req.user.admissionNumber },
        { email: req.user.email }
      ]
    });

    if (!allowed) {
      return res.status(403).json({ error: "You are not allowed to join this event." });
    }

    // Check if already joined
    const existing = await Participation.findOne({ userId: req.user._id, eventId });
    if (existing) {
      // Return new session ID so multi-tabs invalidate old sessions
      const newSessionId = crypto.randomBytes(16).toString('hex');
      existing.sessionId = newSessionId;
      existing.logs.push({ action: "Rejoined session generated" });
      await existing.save();
      return res.json({ message: "Already joined", sessionId: newSessionId, participation: existing });
    }
    
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Mark as joined in the whitelist tracking
    allowed.hasJoined = true;
    await allowed.save();

    const participation = new Participation({
      userId: req.user._id,
      eventId: eventId,
      admissionNumber: req.user.admissionNumber,
      name: req.user.name,
      course,
      cgpa,
      sessionId,
      logs: [{ action: "Joined event" }]
    });
    
    const saved = await participation.save();
    res.status(201).json({ message: "Successfully joined", sessionId, participation: saved });
    
  } catch (err) {
    if (err.code === 11000) {
       return res.status(400).json({ error: "Already participated" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get my events
router.get('/my-events', verifyToken, async (req, res) => {
  try {
    const participations = await Participation.find({ userId: req.user._id })
      .populate('eventId', 'title description startTime endTime status location radius requiredDuration')
      .sort({ joinedAt: -1 });
    res.json(participations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin views participants for an event
router.get('/:eventId/participants', verifyToken, async (req, res) => {
    // Ideally adding role check: authorize(['lead', 'faculty'])
    try {
        const participants = await Participation.find({ eventId: req.params.eventId });
        res.json(participants);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
