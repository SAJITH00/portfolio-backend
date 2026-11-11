const Education = require('../models/Education');
const Experience = require('../models/Experience');

// GET /api/timeline (Public)
const getTimeline = async (req, res, next) => {
  try {
    const [education, experience] = await Promise.all([
      Education.find().sort({ order: 1 }),
      Experience.find().sort({ order: 1 }),
    ]);

    return res.status(200).json({
      success: true,
      data: { education, experience },
    });
  } catch (err) {
    next(err);
  }
};

// Education CRUD (Admin)
const createEducation = async (req, res, next) => {
  try {
    const item = await Education.create(req.body);
    return res.status(201).json({ success: true, message: 'Education added.', data: item });
  } catch (err) { next(err); }
};

const updateEducation = async (req, res, next) => {
  try {
    const item = await Education.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, message: 'Education updated.', data: item });
  } catch (err) { next(err); }
};

const deleteEducation = async (req, res, next) => {
  try {
    const item = await Education.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, message: 'Education deleted.' });
  } catch (err) { next(err); }
};

// Experience CRUD (Admin)
const createExperience = async (req, res, next) => {
  try {
    const item = await Experience.create(req.body);
    return res.status(201).json({ success: true, message: 'Experience added.', data: item });
  } catch (err) { next(err); }
};

const updateExperience = async (req, res, next) => {
  try {
    const item = await Experience.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, message: 'Experience updated.', data: item });
  } catch (err) { next(err); }
};

const deleteExperience = async (req, res, next) => {
  try {
    const item = await Experience.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, message: 'Experience deleted.' });
  } catch (err) { next(err); }
};

module.exports = {
  getTimeline,
  createEducation,
  updateEducation,
  deleteEducation,
  createExperience,
  updateExperience,
  deleteExperience,
};
