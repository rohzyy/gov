const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  admissionNumber: { type: String },
  course: { type: String },
  specialization: { type: String },
  yearOfStudy: { type: Number },
  cgpa: { type: Number },
  phone: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["student", "lead", "faculty"],
    default: "student"
  },
  password: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
