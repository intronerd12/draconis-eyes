const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://bumatayjilian_db_user:121304@cluster0.gyq0dvj.mongodb.net/DragonFruit?appName=Cluster0', {
      serverSelectionTimeoutMS: 5000, // Fail after 5 seconds if server not found
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
