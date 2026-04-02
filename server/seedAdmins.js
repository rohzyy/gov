require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// ==========================================
// ADD NEW LEADS AND FACULTY STAFF HERE
// ==========================================
const ADMIN_ACCOUNTS = [
  {
    name: "Admin Faculty 1",
    email: "admin_faculty@srmap.edu.in",
    password: "smartpassword123",  // They can login with this password
    role: "faculty" // Must be 'faculty' or 'lead'
  },
  {
    name: "Lead Student 1",
    email: "community_lead@srmap.edu.in",
    password: "leadpassword123",
    role: "lead" 
  }
];

// Run the Database Seed
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("🟢 Connected to MongoDB Database");
  
  for (let account of ADMIN_ACCOUNTS) {
    const existingUser = await User.findOne({ email: account.email });
    
    if (existingUser) {
      console.log(`⚠️  Skipped: Admin account [${account.email}] already exists in Database.`);
      continue;
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(account.password, salt);
    
    const newAdmin = new User({
      name: account.name,
      email: account.email,
      password: hashedPassword,
      role: account.role,
      isEmailVerified: true // Bypass OTP for hardcoded admins
    });
    
    await newAdmin.save();
    console.log(`✅ Success: Created new ${account.role.toUpperCase()} account -> ${account.email}`);
  }
  
  console.log("🚀 Finished processing all Admin Accounts. Exiting...");
  process.exit(0);
}).catch(err => {
  console.log("❌ Fatal Error loading Database", err);
  process.exit(1);
});
