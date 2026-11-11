const path = require('path');
const StoredUpload = require('../models/StoredUpload');

const saveUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    await StoredUpload.create({
      filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
    });

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      url: `/uploads/${filename}`,
    });
  } catch (err) {
    next(err);
  }
};

const serveUpload = async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (!/^file-\d+-\d+\.(jpe?g|png|webp|gif)$/.test(filename)) {
      return next();
    }

    const file = await StoredUpload.findOne({ filename }).select('mimetype data size');
    if (!file) return next();

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', file.size || file.data.length);
    return res.send(Buffer.from(file.data));
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  saveUpload,
  serveUpload,
};
