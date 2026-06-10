const mongoose = require('mongoose');

function hasMysqlPrismaConfig() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://'));
}

async function connectDB() {
  if (hasMysqlPrismaConfig()) {
    console.log('Task 4 relational database configured through Prisma/MySQL DATABASE_URL. Prisma will connect when debt carry-over records are saved.');
  } else {
    console.warn('MySQL DATABASE_URL is not configured. Task 4 will fall back to MongoDB if MONGO_URI exists, otherwise backend/data/debt-carryover-db.json.');
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) return null;

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
