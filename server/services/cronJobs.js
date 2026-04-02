const cron = require('node-cron');
const Participation = require('../models/Participation');
const Event = require('../models/Event');

const startCronJobs = () => {
  // Run every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      const liveEvents = await Event.find({ status: 'live' });
      const liveEventIds = liveEvents.map(e => e._id);

      const participations = await Participation.find({ 
        eventId: { $in: liveEventIds },
        status: { $in: ['pending', 'suspicious'] }
      }).populate('eventId');

      const now = new Date();

      for (const p of participations) {
        const event = p.eventId;
        const requiredSeconds = event.requiredDuration * 60;
        
        let shouldSave = false;

        // Auto Approval
        if (p.totalInsideTime >= requiredSeconds) {
          p.status = 'approved';
          p.logs.push({ action: 'Cron: Auto-approved time requirement met', timestamp: now });
          shouldSave = true;
        }

        // Network Drop / Suspicious Check (No ping for > 3 minutes)
        const timeSinceLastPing = p.lastPing ? (now - p.lastPing) / 1000 : 0;
        if (timeSinceLastPing > 180 && p.status === 'pending') {
          p.status = 'suspicious';
          p.isFlagged = true;
          p.logs.push({ 
            action: `Cron: Suspicious - no ping for ${Math.round(timeSinceLastPing)}s`, 
            timestamp: now 
          });
          shouldSave = true;
        }

        // Auto Rejection Check (Outside for > 10 minutes)
        if (!p.isInside && p.outsideStartTime) {
          const timeOutside = (now - p.outsideStartTime) / 1000;
          if (timeOutside > 600) {
            p.status = 'rejected';
            p.logs.push({ action: 'Cron: Rejected due to >10m outside', timestamp: now });
            shouldSave = true;
          }
        }

        if (shouldSave) {
          await p.save();
        }
      }
    } catch (err) {
      console.error('Error in cron job execution:', err);
    }
  });

  console.log('Cron jobs initialized');
};

module.exports = startCronJobs;
