const Project = require('../models/Project');
const { normalizeMediaUrl } = require('../utils/mediaUrl');

// GET /api/projects (Public)
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: 1, _id: 1 });
    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/projects (Admin)
const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      badge,
      technologies,
      imageUrl,
      liveUrl,
      githubUrl,
      isFeatured,
      order,
    } = req.body;

    if (typeof description === 'string' && description.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Project description must be 200 characters or fewer.',
      });
    }

    const techArray = Array.isArray(technologies)
      ? technologies
      : (technologies || '').split(',').map((t) => t.trim()).filter(Boolean);

    const project = await Project.create({
      title,
      description,
      category: category || 'frontend',
      badge: badge || '',
      technologies: techArray,
      imageUrl: normalizeMediaUrl(imageUrl),
      liveUrl: liveUrl || '#contact',
      githubUrl: githubUrl || '#contact',
      isFeatured: !!isFeatured,
      order: parseInt(order, 10) || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// PUT/PATCH /api/admin/projects/:id (Admin)
const updateProject = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    if (typeof updateData.description === 'string' && updateData.description.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Project description must be 200 characters or fewer.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'imageUrl')) {
      updateData.imageUrl = normalizeMediaUrl(updateData.imageUrl);
    }

    if (updateData.technologies && !Array.isArray(updateData.technologies)) {
      updateData.technologies = updateData.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/projects/:id (Admin)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
