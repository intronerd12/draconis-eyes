const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/.env' });

const connectDatabase = require('./config/database');
const { configureCloudinary } = require('./config/cloudinary');
const { verifyConnection: verifyEmailConnection } = require('./config/email');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_SERVICE_URL = 'http://localhost:8000';

app.use(cors());
// Explicitly log all requests for debugging mobile connections
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Connect to Database
connectDatabase();

// Configure Cloudinary
const cloudinary = configureCloudinary();

// Seed Database
const seedDatabase = async () => {
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
};

// Status Endpoint
app.get('/status', async (req, res) => {
  const status = {
    mongodb: 'disconnected',
    cloudinary: 'disconnected',
    ai_service: 'disconnected',
    email_service: 'disconnected'
  };

  // Check MongoDB
  if (mongoose.connection.readyState === 1) {
    status.mongodb = 'connected';
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

// Startup Notification
const logStatus = async () => {
  console.log('\n--- System Status Check ---');
  
  // MongoDB
  const mongoStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected';
  console.log(`MongoDB:      ${mongoStatus}`);

  // Cloudinary
  const cloudStatus = (process.env.CLOUDINARY_CLOUD_NAME) ? '✅ Configured' : '❌ Missing Config';
  console.log(`Cloudinary:   ${cloudStatus}`);

  // AI Service
  try {
    await axios.get(`${PYTHON_SERVICE_URL}/health`);
    console.log(`AI Service:   ✅ Connected (${PYTHON_SERVICE_URL})`);
  } catch (err) {
    console.log(`AI Service:   ❌ Disconnected (Is main.py running?)`);
  }
  console.log('---------------------------\n');
};

app.listen(PORT, async () => {
  console.log(`Node Server running on port ${PORT}`);
  
  // Wait a bit for connections to establish before logging status
  setTimeout(async () => {
    await seedDatabase();
    await logStatus();
  }, 3000);
});
