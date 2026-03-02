const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: '/image/hcaLogo.png'
  },
  date: {
    type: String,
    required: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for searching
newsSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Virtual for formatted date
newsSchema.virtual('formattedDate').get(function() {
  if (this.publishDate) {
    return new Date(this.publishDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return this.date;
});

module.exports = mongoose.model('News', newsSchema);
