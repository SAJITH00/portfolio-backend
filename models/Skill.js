const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Frontend', 'Backend', 'Tools', 'AI & Vibe Tools', 'Other'],
      default: 'Frontend',
    },
    isHighlight: {
      type: Boolean,
      default: false,
    },
    styleClass: {
      type: String,
      default: '', // 'hl', 'cy', 'lm', 'mu', etc.
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

skillSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('Skill', skillSchema);

