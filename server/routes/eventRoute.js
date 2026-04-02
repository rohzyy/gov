const router = require('express').Router();
const Event = require('../models/Event');
const { verifyToken, authorize } = require('../middleware/auth');

// Create event (Lead or Faculty)
router.post('/create', verifyToken, authorize(['lead', 'faculty']), async (req, res) => {
  try {
    const { title, description, location, radius, requiredDuration, startTime, endTime } = req.body;
    
    const event = new Event({
      title,
      description,
      location,
      radius,
      requiredDuration,
      createdBy: req.user._id,
      startTime,
      endTime
    });
    
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all events
router.get('/', verifyToken, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'lead') {
      filter.createdBy = req.user._id;
    }
    const events = await Event.find(filter).populate('createdBy', 'name email').sort({ startTime: 1 });
    
    if (req.user.role === 'student') {
      const AllowedParticipant = require('../models/AllowedParticipant');
      const eventsWithEligibility = await Promise.all(events.map(async (event) => {
        const allowed = await AllowedParticipant.findOne({
          eventId: event._id,
          $or: [
            { admissionNumber: req.user.admissionNumber },
            { email: req.user.email }
          ]
        });
        
        return {
          ...event.toObject(),
          isWhitelisted: !!allowed
        };
      }));
      return res.json(eventsWithEligibility);
    }

    if (req.user.role === 'lead' || req.user.role === 'faculty') {
      const AllowedParticipant = require('../models/AllowedParticipant');
      const eventsWithStats = await Promise.all(events.map(async (event) => {
        const total = await AllowedParticipant.countDocuments({ eventId: event._id });
        const joined = await AllowedParticipant.countDocuments({ eventId: event._id, hasJoined: true });
        
        return {
          ...event.toObject(),
          whitelistStats: { total, joined }
        };
      }));
      return res.json(eventsWithStats);
    }

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific event
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name');
        if (!event) return res.status(404).json({error: "Event not found"});
        res.json(event);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Change event status
router.patch('/:id/status', verifyToken, authorize(['lead', 'faculty']), async (req, res) => {
  try {
      const { status } = req.body;
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({error: "Event not found"});
      
      event.status = status;
      await event.save();
      res.json(event);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

module.exports = router;
