const express = require('express');
const { submitContact } = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiter');
const { validateContact } = require('../middleware/validator');

const router = express.Router();

router.post('/', contactLimiter, validateContact, submitContact);

module.exports = router;

