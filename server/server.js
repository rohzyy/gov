require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoute = require('./routes/authRoute');

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'https://smart-events-attendance.vercel.app',
    'https://smart-od-admin.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));

// ─── Serverless MongoDB Connection Cache ──────────────────────────────────────
// On Vercel, each cold-start runs module-level code fresh, but warm invocations
// reuse the same Node.js context. We cache the connection promise so we don't
// re-connect on every warm request. We also await it inside a middleware so that
// the first request on a cold-start waits for the DB before running route logic.
let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return; // already connected
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }
  await connectionPromise;
}

// Inject connection wait into every incoming request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Routes
app.use('/api/auth', authRoute);
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/events', require('./routes/eventRoute'));
app.use('/api/participation', require('./routes/participationRoute'));
app.use('/api/location', require('./routes/locationRoute'));
app.use('/api/whitelist', require('./routes/whitelistRoute'));

const startCronJobs = require('./services/cronJobs');
startCronJobs();

app.get('/', (req, res) => {
  res.send('Smart OD Management API is running');
});

const PORT = process.env.PORT || 5000;

// Only bind a port listener when running locally (not on Vercel)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch(err => console.error('MongoDB connection error:', err));
}

// Export the Express App for Vercel Serverless
module.exports = app;
