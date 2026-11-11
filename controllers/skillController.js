const Skill = require('../models/Skill');

// GET /api/skills (Public)
const getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ order: 1 });
    return res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/skills (Admin)
const createSkill = async (req, res, next) => {
  try {
    const { name, category, isHighlight, styleClass, order } = req.body;
    const skill = await Skill.create({
      name,
      category,
      isHighlight: !!isHighlight,
      styleClass: styleClass || '',
      order: parseInt(order, 10) || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Skill created successfully.',
      data: skill,
    });
  } catch (err) {
    next(err);
  }
};

// PUT/PATCH /api/admin/skills/:id (Admin)
const updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Skill updated successfully.',
      data: skill,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/skills/:id (Admin)
const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Skill deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
};

