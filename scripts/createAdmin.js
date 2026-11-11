require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sajith_portfolio';
  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    console.error('[Error] Set a unique ADMIN_PASSWORD of at least 12 characters in .env.');
    process.exit(1);
  }
  if (!username || !email) {
    console.error('[Error] Set ADMIN_USERNAME and ADMIN_EMAIL in .env.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('[Error] Set a unique JWT_SECRET of at least 32 characters in .env.');
    process.exit(1);
  }

  try {
    console.log(`[Seed] Connecting to database: ${uri.replace(/\/\/[^@]*@/, '//***:***@')}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });

    // Check if admin already exists
    const existing = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existing) {
      existing.username = username;
      existing.email = email;
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log(`[Seed Success] Existing Admin account updated:`);
      console.log(`  Username: ${username}`);
      console.log(`  Email:    ${email}`);
      console.log(`  Password: [Password successfully re-hashed with bcrypt]`);
    } else {
      const newAdmin = await Admin.create({
        username,
        email,
        passwordHash,
      });
      console.log(`[Seed Success] New Admin account created:`);
      console.log(`  ID:       ${newAdmin._id}`);
      console.log(`  Username: ${username}`);
      console.log(`  Email:    ${email}`);
      console.log(`  Password: [Password successfully hashed with bcrypt]`);
    }

    await mongoose.disconnect();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Error] Failed to create admin: ${err.message}`);
    process.exit(1);
  }
};

seedAdmin();

