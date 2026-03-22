const express = require('express');
const News = require('../models/News');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/news/public
// @desc    Get all published news for public display
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const news = await News.find({ status: 'published' })
      .sort({ date: -1, createdAt: -1 })
      .populate('author', 'name email')
      .select('title excerpt content image date status views isFeatured createdAt');
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get public news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/news
// @desc    Get all news with pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const status = req.query.status;
    const search = req.query.search;
    
    // Build query
    let query = {};
    
    if (status && ['published', 'draft', 'archived'].includes(status)) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await News.countDocuments(query);
    
    // Get news with pagination
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email');
    
    res.json({
      success: true,
      data: {
        news,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/news/stats
// @desc    Get news statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await News.countDocuments();
    const published = await News.countDocuments({ status: 'published' });
    const drafts = await News.countDocuments({ status: 'draft' });
    const archived = await News.countDocuments({ status: 'archived' });
    
    // Get total views
    const newsWithViews = await News.find({}, 'views');
    const totalViews = newsWithViews.reduce((sum, item) => sum + item.views, 0);
    
    res.json({
      success: true,
      data: {
        total,
        published,
        drafts,
        archived,
        totalViews
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/news/:id
// @desc    Get single news by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'name email');
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get news by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/news
// @desc    Create new news article
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, excerpt, content, image, date, status, isFeatured } = req.body;
    
    // Validate required fields
    if (!title || !excerpt || !content || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const news = new News({
      title,
      excerpt,
      content,
      image: image || '/image/hcaLogo.png',
      date,
      status: status || 'draft',
      isFeatured: isFeatured || false,
      author: req.admin._id
    });
    
    await news.save();
    
    // Populate author
    await news.populate('author', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: news
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/news/:id
// @desc    Update news article
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, excerpt, content, image, date, status, isFeatured } = req.body;
    
    // Find news
    let news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    // Update fields
    if (title) news.title = title;
    if (excerpt) news.excerpt = excerpt;
    if (content) news.content = content;
    if (image) news.image = image;
    if (date) news.date = date;
    if (status) news.status = status;
    if (isFeatured !== undefined) news.isFeatured = isFeatured;
    
    await news.save();
    
    // Populate author
    await news.populate('author', 'name email');
    
    res.json({
      success: true,
      message: 'News article updated successfully',
      data: news
    });
  } catch (error) {
    console.error('Update news error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/news/:id/views
// @desc    Increment news views
// @access  Public
router.patch('/:id/views', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      data: { views: news.views }
    });
  } catch (error) {
    console.error('Update views error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/news/:id
// @desc    Delete news article
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    await News.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Delete news error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/news/seed
// @desc    Seed default news data (for development)
// @access  Private
router.post('/seed', auth, async (req, res) => {
  try {
    // Check if news already exists
    const existingNews = await News.countDocuments();
    
    if (existingNews > 0) {
      return res.json({
        success: true,
        message: 'News data already exists'
      });
    }
    
    const defaultNews = [
      {
        title: "New Halal Standards for Food Processing",
        date: "June 15, 2023",
        status: "published",
        views: 1250,
        excerpt: "HDI Nigeria releases updated guidelines for food processing facilities seeking Halal certification...",
        content: "The Halal Certification Authority Nigeria is proud to announce new comprehensive standards for food processing facilities. These guidelines ensure the highest level of Halal compliance while streamlining the certification process for manufacturers and processors.",
        image: "/image/halal meet image.jpg",
        author: req.admin._id
      },
      {
        title: "Partnership with Saudi Food Authority",
        date: "May 28, 2023",
        status: "published",
        views: 980,
        excerpt: "HDI Nigeria signs MoU with Saudi Food and Drug Authority to streamline Halal certification...",
        content: "In a historic move, HCA Nigeria has signed a Memorandum of Understanding with the Saudi Food and Drug Authority to enhance cooperation in Halal certification and standards.",
        image: "/image/Gemini_Generated_Image_o8rdvno8rdvno8rd.png",
        author: req.admin._id
      },
      {
        title: "Halal Awareness Workshop in Lagos",
        date: "April 10, 2023",
        status: "published",
        views: 756,
        excerpt: "Successful completion of our Halal certification workshop for restaurants and food service...",
        content: "HCA Nigeria successfully conducted a comprehensive Halal awareness workshop in Lagos, bringing together restaurant owners, food service providers, and industry stakeholders.",
        image: "/image/halal meet image.jpg",
        author: req.admin._id
      },
      {
        title: "New Certification Portal Launch",
        date: "March 22, 2023",
        status: "draft",
        views: 0,
        excerpt: "We've launched a new online portal for easier application and tracking of Halal certification...",
        content: "Our new digital platform makes it easier than ever to apply for Halal certification and track your application status in real-time.",
        image: "/image/hcaLogo.png",
        author: req.admin._id
      },
      {
        title: "International Recognition Achieved",
        date: "February 14, 2023",
        status: "published",
        views: 1580,
        excerpt: "HDI Nigeria receives accreditation from the World Halal Food Council, expanding our international...",
        content: "HCA Nigeria has achieved international recognition as the World Halal Food Council grants accreditation, opening new opportunities for Nigerian businesses in global markets.",
        image: "/image/halal meet image.jpg",
        author: req.admin._id
      }
    ];
    
    await News.insertMany(defaultNews);
    
    res.json({
      success: true,
      message: 'Default news data seeded successfully',
      data: { count: defaultNews.length }
    });
  } catch (error) {
    console.error('Seed news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
// git add .
// git commit -m "Add news routes with pagination, stats, and seeding"
// git push origin main