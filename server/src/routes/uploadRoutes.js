const express = require('express');
const multer = require('multer');
const { requireAuth, requireRole } = require('../middleware/auth');
const { cloudinary, configureCloudinary } = require('../config/cloudinary');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});


router.post('/image', requireAuth, requireRole('author'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ message: err.message || 'Invalid file' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const ok = configureCloudinary();
    if (!ok) {
      return res.status(400).json({ 
        message: 'Cloudinary not configured. Please check server environment variables.' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'blog_platform',
      resource_type: 'image',
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    const message = err.message || 'Failed to upload image to Cloudinary';
    res.status(500).json({ message: `Upload failed: ${message}` });
  }
});

module.exports = router;

