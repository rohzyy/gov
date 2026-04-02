const router = require('express').Router();
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const { verifyToken } = require('../middleware/auth');

function getDistance(lat1, lon1, lat2, lon2) {
  var R = 6371e3;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/ping', verifyToken, async (req, res) => {
  try {
    const { eventId, lat, lng, accuracy, sessionId, timestamp } = req.body;
    
    if (accuracy > 1000) {
       return res.json({ message: "Poor GPS accuracy ignored", isInside: null });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.status !== "live") {
      return res.status(400).json({ error: "Event not active" });
    }

    const now = new Date();
    if (now < event.startTime || now > event.endTime) {
      return res.status(400).json({ error: "Tracking only allowed during event hours" });
    }

    const participation = await Participation.findOne({ userId: req.user._id, eventId });
    if (!participation) return res.status(404).json({ error: "Not joined" });

    // Session validation
    if (participation.sessionId !== sessionId) {
       return res.status(403).json({ error: "Invalid session or logged in from another tab." });
    }

    if (participation.lastLat && participation.lastLng && participation.lastPing) {
       const jumpDistance = getDistance(participation.lastLat, participation.lastLng, lat, lng);
       const timeDiffSecs = (now - participation.lastPing) / 1000;
       
       if (timeDiffSecs > 0) {
         const speed = jumpDistance / timeDiffSecs; // m/s
         if (speed > 50) { // 50 m/s = 180 km/h (impossible for a student walking/running to the event)
            participation.isFlagged = true;
            participation.status = 'suspicious';
            participation.logs.push({ action: `Fake GPS Flagged (Speed: ${Math.round(speed)}m/s)`, timestamp: now });
            await participation.save();
            return res.status(400).json({ error: "Suspicious location jump detected." });
         }
       }
    }

    participation.lastLat = lat;
    participation.lastLng = lng;

    const distance = getDistance(event.location.lat, event.location.lng, lat, lng);
    const insideRadius = distance <= (event.radius + 15); // 15m GPS buffer
    
    const timeSinceLastPing = participation.lastPing ? (now - participation.lastPing) / 1000 : 0;

    if (insideRadius) {
       if (!participation.firstInsideTime) participation.firstInsideTime = now;
       participation.isInside = true;
       participation.outsideStartTime = null; // Fix Grace Period Reset Bug
       participation.lastInsideTime = now;
       
       if (participation.lastPing && timeSinceLastPing > 0 && timeSinceLastPing < 120) {
           participation.totalInsideTime += timeSinceLastPing;
       }
    } else {
       participation.isInside = false;
       if (!participation.outsideStartTime) {
           participation.outsideStartTime = now;
       }
       // Reject if > 10 mins (600 seconds)
       if ((now - participation.outsideStartTime) > 600000) {
           participation.status = "rejected";
           participation.logs.push({ action: "Rejected due to >10m outside radius", timestamp: now });
       }
    }

    participation.lastPing = now;
    
    // Auto approve logic
    const reqSeconds = event.requiredDuration * 60;
    if (participation.totalInsideTime >= reqSeconds && participation.status === "pending") {
        participation.status = "approved";
        participation.logs.push({ action: "Auto-approved time requirement met", timestamp: now });
    }

    await participation.save();

    res.json({ 
      isInside: insideRadius, 
      distance,
      eventLocation: event.location,
      eventRadius: event.radius,
      totalInsideTime: participation.totalInsideTime,
      requiredSeconds: reqSeconds,
      status: participation.status 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
