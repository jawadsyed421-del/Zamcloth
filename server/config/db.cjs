const mongoose = require('mongoose');

// Connects once and reuses the connection (needed on serverless hosts like Vercel,
// where the same warm instance handles many requests).
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
};

module.exports = connectDB;
