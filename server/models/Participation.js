const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  admissionNumber: { type: String, required: true },
  name: { type: String },
  course: String,
  cgpa: Number,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspicious", "failed"],
    default: "pending"
  },

  isInside: { type: Boolean, default: false },
  firstInsideTime: { type: Date },
  lastInsideTime: { type: Date },
  outsideStartTime: { type: Date },
  
  totalInsideTime: {
    type: Number,
    default: 0 // in seconds
  },
  
  lastPing: { type: Date },
  lastLat: { type: Number },
  lastLng: { type: Number },
  sessionId: { type: String },
  isFlagged: { type: Boolean, default: false },

  logs: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],

  joinedAt: {
    type: Date,
    default: Date.now
  }
});

ParticipationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Participation', ParticipationSchema);
