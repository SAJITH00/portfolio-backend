const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [200, 'Project description must be 200 characters or fewer'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'frontend', // 'frontend', 'fullstack', 'ai' or combined
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    liveUrl: {
      type: String,
      default: '#contact',
      trim: true,
    },
    githubUrl: {
      type: String,
      default: '#contact',
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

projectSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
