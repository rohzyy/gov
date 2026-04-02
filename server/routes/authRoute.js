const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email.endsWith('@srmap.edu.in')) {
      return res.status(400).send("Only @srmap.edu.in email addresses are allowed.");
    }
    
    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).send("Email already registered");
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await Otp.findOneAndDelete({ email });
    const newOtp = new Otp({ email, otp });
    await newOtp.save();
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Smart OD" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Smart OD verification code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f9f9f9;
              margin: 0;
              padding: 40px 0;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 24px;
              text-align: left;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 32px 24px;
              color: #1a1a1a;
            }
            .content h2 {
              margin-top: 0;
              font-size: 22px;
              color: #000000;
            }
            .content p {
              font-size: 15px;
              line-height: 1.5;
              color: #4a4a4a;
              margin-bottom: 24px;
            }
            .otp-box {
              background-color: #f5f5f5;
              border: 1px solid #d1d1d1;
              border-radius: 6px;
              padding: 24px;
              text-align: center;
              margin-bottom: 24px;
            }
            .otp-code {
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 12px;
              color: #000000;
              margin: 0;
              margin-left: 12px; /* to balance the letter spacing */
            }
            .footer-text {
              font-size: 13px;
              color: #666666;
              line-height: 1.5;
            }
            .bottom-footer {
              border-top: 1px solid #eeeeee;
              padding: 16px 24px;
              font-size: 12px;
              color: #888888;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Smart OD</h1>
            </div>
            <div class="content">
              <h2>Verify your email</h2>
              <p>Use the code below to complete your registration. It expires in 10 minutes.</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p class="footer-text">
                If you didn't request this, you can safely ignore this email.<br>
                Never share this code with anyone.
              </p>
            </div>
            <div class="bottom-footer">
              &copy; Smart OD &middot; campus events automation, thoughtfully done
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("OTP sent to your email! Please check your inbox (and spam).");
    
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, admissionNumber, password, role, course, specialization, yearOfStudy, cgpa, phone, otp } = req.body;
    
    if (!email.endsWith('@srmap.edu.in')) {
      return res.status(400).send("Only @srmap.edu.in email addresses are allowed.");
    }

    const userRole = role || "student";

    if (userRole === "student" && phone) {
      const phoneRegex = /^(?:\+91|91)?\s?[6789]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).send("Please provide a valid Indian phone number (+91).");
      }
    }
    
    // Check if user exists
    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).send("Email already exists");

    if (userRole === "student") {
      if (!otp) return res.status(400).send("OTP is required to verify student email.");
      
      const validOtp = await Otp.findOne({ email, otp });
      if (!validOtp) return res.status(400).send("Invalid or expired OTP code.");
      
      await Otp.findOneAndDelete({ email });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      admissionNumber,
      password: hashedPassword,
      role: userRole,
      course,
      specialization,
      yearOfStudy,
      cgpa,
      phone,
      isEmailVerified: userRole === "student" ? true : false
    });
    
    const savedUser = await user.save();
    res.status(201).send({ user: savedUser._id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, admissionNumber, password } = req.body;
    
    // Can login with either email or admissionNumber
    const query = email ? { email } : { admissionNumber };
    if (!query.email && !query.admissionNumber) {
        return res.status(400).send("Provide email or admission number to login");
    }

    const user = await User.findOne(query);
    if (!user) return res.status(400).send("User not found");
    
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send("Invalid password");
    
    const token = jwt.sign(
      { _id: user._id, role: user.role, name: user.name, admissionNumber: user.admissionNumber },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).send({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
