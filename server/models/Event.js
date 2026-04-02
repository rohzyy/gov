const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  radius: { type: Number, required: true }, // meters
  requiredDuration: { type: Number, required: true }, // minutes

  status: {
    type: String,
    enum: ["upcoming", "live", "ended"],
    default: "upcoming"
  },

  hasWhitelist: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
