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

    if (!/^file-\d+-\d+\.(jpe?g|png|webp|gif)$/i.test(filename)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image filename'
      });
    }

    const file = await StoredUpload.findOne({ filename })
      .select('mimetype data size');

    if (!file || !file.data) {
      console.log('Image not found in MongoDB:', filename);

      return res.status(404).json({
        success: false,
        message: 'Image not found in MongoDB',
        filename
      });
    }

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    return res.send(file.data);

  } catch (err) {
    console.error('Image retrieval error:', err);
    next(err);
  }
};

module.exports = {
  saveUpload,
  serveUpload,
};
