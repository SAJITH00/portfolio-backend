const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Sajith',
      trim: true,
    },
    title: {
      type: String,
      default: 'Frontend Developer // Aspiring Full Stack',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Architecting ultra-responsive interfaces and full-stack systems.',
      trim: true,
    },
    aboutHeadline: {
      type: String,
      default: 'Curious Mind. Creative Builder. Continuous Learner.',
      trim: true,
    },
    aboutBio: {
      type: String,
      default: "I'm Sajith, an aspiring Full Stack Web Developer passionate about creating modern web applications. I enjoy experimenting with new technologies, building practical projects, and finding creative ways to solve real-world problems.",
      trim: true,
    },
    location: {
      type: String,
      default: 'Kerala, India',
      trim: true,
    },
    status: {
      type: String,
      default: 'Open to Roles',
      trim: true,
    },
    email: {
      type: String,
      default: 'sajith.dev@example.com',
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 80754 87845',
      trim: true,
    },
    whatsappUrl: {
      type: String,
      default: 'https://wa.me/918075487845',
      trim: true,
    },
    githubUrl: {
      type: String,
      default: '#projects',
      trim: true,
    },
    linkedinUrl: {
      type: String,
      default: '#contact',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    stats: {
      projectsCount: { type: String, default: '15+' },
      techMastered: { type: String, default: '12+' },
      passionRate: { type: String, default: '100%' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);

