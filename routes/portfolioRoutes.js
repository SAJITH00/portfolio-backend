const express = require('express');
const { getEntirePortfolio } = require('../controllers/portfolioController');
const { getProjects } = require('../controllers/projectController');
const { getSkills } = require('../controllers/skillController');
const { getTimeline } = require('../controllers/timelineController');
const { getProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/', getEntirePortfolio);
router.get('/projects', getProjects);
router.get('/skills', getSkills);
router.get('/timeline', getTimeline);
router.get('/profile', getProfile);

module.exports = router;

