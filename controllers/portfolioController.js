const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Education = require('../models/Education');
const Experience = require('../models/Experience');

// GET /api/portfolio (Public)
const getEntirePortfolio = async (req, res, next) => {
  try {
    const [profile, projects, skills, education, experience] = await Promise.all([
      Profile.findOne(),
      Project.find().sort({ order: 1, createdAt: 1, _id: 1 }),
      Skill.find().sort({ order: 1 }),
      Education.find().sort({ order: 1 }),
      Experience.find().sort({ order: 1 }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        profile,
        projects,
        skills,
        education,
        experience,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEntirePortfolio,
};
