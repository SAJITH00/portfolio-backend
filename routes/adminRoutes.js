const express = require('express');
const { login, getMe, logout } = require('../controllers/authController');
const {
  getMessages,
  getMessageById,
  markMessageRead,
  deleteMessage,
  getAnalyticsOverview,
} = require('../controllers/adminController');
const {
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const {
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');
const {
  createEducation,
  updateEducation,
  deleteEducation,
  createExperience,
  updateExperience,
  deleteExperience,
} = require('../controllers/timelineController');
const { getProfile, updateProfile } = require('../controllers/profileController');

const { authenticateAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validateLogin } = require('../middleware/validator');
const handleImageUpload = require('../middleware/upload');
const { saveUpload } = require('../controllers/uploadController');

const router = express.Router();

// Authentication
router.post('/login', loginLimiter, validateLogin, login);
router.get('/me', authenticateAdmin, getMe);
router.post('/logout', authenticateAdmin, logout);

// Messages Management
router.get('/messages', authenticateAdmin, getMessages);
router.get('/messages/:id', authenticateAdmin, getMessageById);
router.patch('/messages/:id/read', authenticateAdmin, markMessageRead);
router.delete('/messages/:id', authenticateAdmin, deleteMessage);

// Analytics
router.get('/analytics', authenticateAdmin, getAnalyticsOverview);

// File Upload — stored in MongoDB so files survive Render's temporary disk
router.post('/upload', authenticateAdmin, handleImageUpload, saveUpload);

// Projects CRUD
router.post('/projects', authenticateAdmin, createProject);
router.put('/projects/:id', authenticateAdmin, updateProject);
router.delete('/projects/:id', authenticateAdmin, deleteProject);

// Skills CRUD
router.post('/skills', authenticateAdmin, createSkill);
router.put('/skills/:id', authenticateAdmin, updateSkill);
router.delete('/skills/:id', authenticateAdmin, deleteSkill);

// Education CRUD
router.post('/education', authenticateAdmin, createEducation);
router.put('/education/:id', authenticateAdmin, updateEducation);
router.delete('/education/:id', authenticateAdmin, deleteEducation);

// Experience CRUD
router.post('/experience', authenticateAdmin, createExperience);
router.put('/experience/:id', authenticateAdmin, updateExperience);
router.delete('/experience/:id', authenticateAdmin, deleteExperience);

// Profile CRUD
router.get('/profile', authenticateAdmin, getProfile);
router.put('/profile', authenticateAdmin, updateProfile);

module.exports = router;
