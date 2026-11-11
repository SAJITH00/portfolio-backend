const path = require('path');
const multer = require('multer');

const fileFilter = (req, file, cb) => {
  const isExt = /^\.(jpe?g|png|webp|gif)$/.test(path.extname(file.originalname).toLowerCase());
  const isMime = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);

  if (isExt && isMime) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    err.statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      err.message = 'Image must be 5 MB or smaller.';
    }
    return next(err);
  });
};

module.exports = handleImageUpload;
