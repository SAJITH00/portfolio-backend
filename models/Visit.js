const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    anonymousVisitorIdHash: {
      type: String,
      required: true,
      index: true,
    },
    visitDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '365d', // Automatically clean up old raw visit records after 1 year
    },
  },
  {
    timestamps: false,
  }
);

// Prevent duplicate count of same anonymous visitor on the same day
visitSchema.index({ anonymousVisitorIdHash: 1, visitDate: 1 }, { unique: true });

module.exports = mongoose.model('Visit', visitSchema);

