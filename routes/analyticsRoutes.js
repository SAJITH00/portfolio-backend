const express = require('express');
const { recordVisit, getPublicVisitorCount } = require('../controllers/analyticsController');

const router = express.Router();

// Record a new visit (or check today's visit)
router.post('/visit', recordVisit);

// Retrieve total visitor count
router.get('/visitors', getPublicVisitorCount);

module.exports = router;

