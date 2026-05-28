const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('MONGO_URI is not configured. Server will continue using the current JSON storage until APIs are migrated.');
    return null;
  }

  try {
    mongoose.set('strictQuery', true);
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (process.env.REQUIRE_MONGO === 'true') {
      process.exit(1);
    }
    return null;
  }
}

module.exports = connectDB;
