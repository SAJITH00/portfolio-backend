const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MongoDB is not configured. Add MONGODB_URI to backend/.env.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB connected (${mongoose.connection.name}).`);
    return true;
  } catch (error) {
    // Keep the static portfolio available and retry the initial connection.
    console.error("MongoDB connection failed:", error.message);
    const retry = setTimeout(connectDB, 10000);
    retry.unref();
    return false;
  }
};

module.exports = connectDB;
