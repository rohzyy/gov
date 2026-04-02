const mongoose = require("mongoose");

const allowedParticipantSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  admissionNumber: { type: String, required: true },
  email: { type: String, required: true },
  hasJoined: {
    type: Boolean,
    default: false
  }
});

// Performance indexing for rapid dual-validation queries during Join
allowedParticipantSchema.index({ eventId: 1, admissionNumber: 1 });
allowedParticipantSchema.index({ eventId: 1, email: 1 });

module.exports = mongoose.model("AllowedParticipant", allowedParticipantSchema);
