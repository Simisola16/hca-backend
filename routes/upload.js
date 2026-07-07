const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

// Use memory storage — no disk writes, works on Vercel
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// @route   POST /api/upload
// @desc    Upload an image file OR base64 string to Cloudinary
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    let uploadResult;

    if (req.file) {
      // File uploaded via multipart/form-data
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;

      uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'hca-slides',
        resource_type: 'image',
        transformation: [
          { width: 1400, height: 600, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }
        ]
      });
    } else if (req.body.image) {
      // Base64 string sent as JSON body
      uploadResult = await cloudinary.uploader.upload(req.body.image, {
        folder: 'hca-slides',
        resource_type: 'image',
        transformation: [
          { width: 1400, height: 600, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }
        ]
      });
    } else {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    res.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed: ' + error.message });
  }
});

module.exports = router;
