const { body, validationResult } = require('express-validator');

// Validation rules for contact form submission
const validateContact = [
  // Honeypot field (hidden from real users, filled by naive bots)
  body('website_url_check')
    .optional({ checkFalsy: true })
    .custom((val) => {
      if (val && val.length > 0) {
        throw new Error('Bot submission detected');
      }
      return true;
    }),

  body('name')
    .trim()
    .notEmpty().withMessage('Please enter your name.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Please enter your email.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),

  body('subject')
    .trim()
    .notEmpty().withMessage('Please enter a subject.')
    .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters.')
    .escape(),

  body('message')
    .trim()
    .notEmpty().withMessage('Please enter your message.')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be at least 10 characters long.')
    .escape(),

  // Interceptor middleware to check for validation errors
  (req, res, next) => {
    // If honeypot is populated, pretend success silently to avoid giving cues to bots
    if (req.body.website_url_check && req.body.website_url_check.trim().length > 0) {
      console.warn('[Honeypot Triggered] Spambot detected and dropped silently.');
      return res.status(200).json({
        success: true,
        message: 'Transmission received! Thank you, Sajith will connect back shortly.',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
      });
    }
    next();
  },
];

// Validation rules for admin login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username or email is required.'),
  body('password')
    .notEmpty().withMessage('Password is required.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    next();
  },
];

module.exports = {
  validateContact,
  validateLogin,
};

