const Profile = require('../models/Profile');
const { normalizeMediaUrl } = require('../utils/mediaUrl');

// GET /api/profile (Public)
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne();
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

// PUT/PATCH /api/admin/profile (Admin)
const updateProfile = async (req, res, next) => {
  try {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'avatarUrl')) {
      req.body.avatarUrl = normalizeMediaUrl(req.body.avatarUrl);
    }

    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create(req.body);
    } else {
      profile = await Profile.findByIdAndUpdate(profile._id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
