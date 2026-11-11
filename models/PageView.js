const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema(
  {
    visitorHash: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    section: {
      type: String,
      default: 'home',
      trim: true,
      index: true,
    },
    referrer: {
      type: String,
      default: 'Direct',
      trim: true,
    },
    device: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Other'],
      default: 'Desktop',
      index: true,
    },
    browser: {
      type: String,
      default: 'Unknown',
      trim: true,
      index: true,
    },
    isReturning: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

pageViewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);

