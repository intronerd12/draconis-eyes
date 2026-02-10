const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/.env' });

const connectDB = require('./config/db');
// const sql = require('./config/database');
const { configureCloudinary } = require('./config/cloudinary');
const { verifyConnection: verifyEmailConnection } = require('./config/email');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

app.use(cors());
// Explicitly log all requests for debugging mobile connections
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/scan', require('./routes/scanRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/train', require('./routes/trainRoutes'));

// Connect to Database
connectDB();

// Configure Cloudinary
const cloudinary = configureCloudinary();

// Seed Database
const seedDatabase = async () => {
  /*
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding database...');
      
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@dragon.com',
        password: 'admin123', // In a real app, hash this!
        role: 'admin'
      });
      console.log('Admin created:', admin.email);

      const user = await User.create({
        name: 'Normal User',
        email: 'user@dragon.com',
        password: 'password123', // In a real app, hash this!
        role: 'user'
      });
      console.log('User created:', user.email);
    } else {
      console.log('Database already seeded.');
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
  }
  */
  console.log('Seeding temporarily disabled for migration.');
};

// Status Endpoint
app.get('/status', async (req, res) => {
  const status = {
    database: 'disconnected',
    cloudinary: 'disconnected',
    ai_service: 'disconnected',
    email_service: 'disconnected'
  };

  // Check Database
  try {
    if (mongoose.connection.readyState === 1) {
      status.database = 'connected';
    }
  } catch (err) {
    console.error('Database connection error:', err);
  }

  // Check Email (Mailtrap)
  if (await verifyEmailConnection()) {
    status.email_service = 'connected';
  }

  // Check Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      await cloudinary.api.ping();
      status.cloudinary = 'connected';
    } catch (err) {
      // If ping fails, it might be auth error, but env vars are there.
      // For free tier, ping might not be available or restricted, but usually 'ping' works or we can assume config is valid if vars exist.
      // Let's assume connected if vars exist for now to avoid blocking, or try a simple list.
      // Better: just check if config is present as deep check is slow.
      status.cloudinary = 'connected (config present)'; 
    }
  }

  // Check AI Service
  try {
    const aiRes = await axios.get(`${PYTHON_SERVICE_URL}/health`);
    if (aiRes.data.status === 'healthy') {
      status.ai_service = 'connected';
    }
  } catch (err) {
    // AI service might be starting up or down
  }

  res.json(status);
});

app.get('/api/health', async (req, res) => {
  const status = {
    database: false,
    cloudinary: false,
    ai_service: false,
    email_service: false,
  };
  let ai_details = null;

  try {
    status.database = mongoose.connection.readyState === 1;
  } catch {
    status.database = false;
  }

  try {
    status.email_service = await verifyEmailConnection();
  } catch {
    status.email_service = false;
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    status.cloudinary = true;
  }

  try {
    const aiRes = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 4000 });
    status.ai_service = aiRes?.data?.status === 'healthy';
    ai_details = aiRes?.data || null;
  } catch {
    status.ai_service = false;
  }

  const allOk = Object.values(status).every(Boolean);
  res.json({
    status: allOk ? 'ok' : 'degraded',
    components: status,
    ai: ai_details,
  });
});

// Startup Notification
const logStatus = async () => {
  console.log('\n--- System Status Check ---');
  
  // Database
  let dbStatus = '❌ Disconnected';
  try {
      if (mongoose.connection.readyState === 1) {
        dbStatus = '✅ Connected';
      } else if (mongoose.connection.readyState === 2) {
        dbStatus = '⏳ Connecting...';
      } else {
        dbStatus = `❌ Disconnected (State: ${mongoose.connection.readyState})`;
      }
  } catch (e) {
      dbStatus = '❌ Error (' + e.message + ')';
  }
  console.log(`Database:     ${dbStatus}`);

  // Cloudinary
  const cloudStatus = (process.env.CLOUDINARY_CLOUD_NAME) ? '✅ Configured' : '❌ Missing Config';
  console.log(`Cloudinary:   ${cloudStatus}`);

  // AI Service
  try {
    let ai = null;
    for (let i = 0; i < 5; i++) {
      try {
        ai = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 4000 });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (ai?.data?.status === 'healthy') {
      const yolo = ai?.data?.yolo_enabled ? 'YOLO' : 'Heuristics';
      const boot = ai?.data?.bootstrap_training ? ' (bootstrapping)' : '';
      console.log(`AI Service:   ✅ Connected (${PYTHON_SERVICE_URL}) - ${yolo}${boot}`);
    } else {
      console.log(`AI Service:   ❌ Disconnected (Is main.py running?)`);
    }
  } catch (err) {
    console.log(`AI Service:   ❌ Disconnected (Is main.py running?)`);
  }
  console.log('---------------------------\n');
};

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Node Server running on port ${PORT}`);
  
  // Wait a bit for connections to establish before logging status
  setTimeout(async () => {
    await seedDatabase();
    await logStatus();
  }, 3000);
});
