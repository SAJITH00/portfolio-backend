const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      required: [true, 'Institution is required'],
      trim: true,
    },
    degree: {
      type: String,
      required: [true, 'Degree / Certificate is required'],
      trim: true,
    },
    period: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

educationSchema.index({ order: 1 });

module.exports = mongoose.model('Education', educationSchema);

