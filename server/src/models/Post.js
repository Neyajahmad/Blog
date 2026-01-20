const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 400, default: '' },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    contentType: { type: String, enum: ['html', 'markdown'], default: 'html' },
    content: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date, default: null, index: true },
    tags: [{ type: String, trim: true, maxlength: 40 }],
  },
  { timestamps: true }
);

postSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);

