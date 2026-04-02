const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, course, specialization, cgpa } = req.body;
    
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).send("User not found");

    if (name) user.name = name;
    
    if (phone) {
      const phoneRegex = /^(?:\+91|91)?\s?[6789]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).send("Please provide a valid Indian phone number (+91).");
      }
      user.phone = phone;
    }
    
    if (user.role === 'student') {
      if (course) user.course = course;
      if (specialization !== undefined) user.specialization = specialization;
      if (cgpa !== undefined) user.cgpa = cgpa;
    }

    const updatedUser = await user.save();
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
