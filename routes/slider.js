const express = require('express');
const Slider = require('../models/Slider');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/slider/public
// @desc    Get all active slides for public display
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const slides = await Slider.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Get public slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/slider
// @desc    Get all slides (admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const slides = await Slider.find()
      .sort({ order: 1, createdAt: 1 })
      .populate('author', 'name email');

    res.json({ success: true, data: slides });
  } catch (error) {
    console.error('Get slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/slider
// @desc    Add a new slide
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, caption, image, order } = req.body;

    if (!title || !image) {
      return res.status(400).json({ success: false, message: 'Title and image are required' });
    }

    // Count existing slides to auto-assign order
    const count = await Slider.countDocuments();

    const slide = new Slider({
      title,
      caption: caption || '',
      image,
      order: order !== undefined ? order : count,
      isActive: true,
      author: req.admin._id
    });

    await slide.save();

    res.status(201).json({
      success: true,
      message: 'Slide added successfully',
      data: slide
    });
  } catch (error) {
    console.error('Create slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/slider/:id
// @desc    Update a slide
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, caption, image, order, isActive } = req.body;

    let slide = await Slider.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    if (title !== undefined) slide.title = title;
    if (caption !== undefined) slide.caption = caption;
    if (image !== undefined) slide.image = image;
    if (order !== undefined) slide.order = order;
    if (isActive !== undefined) slide.isActive = isActive;

    await slide.save();

    res.json({ success: true, message: 'Slide updated successfully', data: slide });
  } catch (error) {
    console.error('Update slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/slider/:id
// @desc    Delete a slide
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const slide = await Slider.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    await Slider.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Delete slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
