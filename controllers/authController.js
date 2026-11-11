const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (admin) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: admin._id, username: admin.username, email: admin.email },
    secret,
    { expiresIn }
  );
};

const sendTokenResponse = (admin, statusCode, res) => {
  const token = generateToken(admin);

  // Set HTTP-only secure cookie
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  };

  res.cookie('admin_token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
    },
  });
};

/**
 * Admin Login
 * POST /api/admin/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const identifier = (username || '').trim().toLowerCase();

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
      });
    }

    return sendTokenResponse(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated admin
 * GET /api/admin/me
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
  });
};

/**
 * Admin Logout
 * POST /api/admin/logout
 */
const logout = async (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  login,
  getMe,
  logout,
};

