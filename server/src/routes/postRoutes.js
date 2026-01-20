const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { requireAuth, requireRole } = require('../middleware/auth');
const { slugify } = require('../utils/slugify');

const router = express.Router();

async function ensureUniqueSlug(base) {
  let slug = base || 'post';
  let i = 0;
 
  while (true) {
    const exists = await Post.findOne({ slug }).select('_id');
    if (!exists) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}


router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const q = String(req.query.q || '').trim();

    const filter = { status: 'published' };
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name role')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/mine', requireAuth, requireRole('author'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const status = req.query.status ? String(req.query.status) : null;
    const filter = { author: req.user._id };
    if (status === 'draft' || status === 'published') filter.status = status;

    const [items, total] = await Promise.all([
      Post.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Post.countDocuments(filter),
    ]);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase().trim();
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    let userId = null;
    if (token) {
      try {

        const { verifyJwt } = require('../utils/jwt');
        const decoded = verifyJwt(token);
        userId = decoded?.sub || null;
      } catch {}
    }

    const post = await Post.findOne({ slug }).populate('author', 'name role');
    if (!post) return res.status(404).json({ message: 'Not found' });

    const isOwner = userId && String(post.author?._id) === String(userId);
    if (post.status !== 'published' && !isOwner) return res.status(404).json({ message: 'Not found' });

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'name role')
      .sort({ createdAt: -1 });

    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, requireRole('author'), async (req, res) => {
  try {
    const { title, excerpt, contentType, content, tags, coverImage } = req.body || {};
    if (!title || !content) return res.status(400).json({ message: 'Missing fields' });

    const baseSlug = slugify(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const post = await Post.create({
      author: req.user._id,
      title: String(title).trim(),
      slug,
      excerpt: String(excerpt || '').trim(),
      contentType: contentType === 'markdown' ? 'markdown' : 'html',
      content: String(content),
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      coverImage: coverImage && coverImage.url ? coverImage : { url: '', publicId: '' },
      status: 'draft',
    });

    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, requireRole('author'), async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    const { title, excerpt, contentType, content, tags, coverImage } = req.body || {};

    if (title) post.title = String(title).trim();
    if (excerpt !== undefined) post.excerpt = String(excerpt || '').trim();
    if (content !== undefined) post.content = String(content);
    if (contentType) post.contentType = contentType === 'markdown' ? 'markdown' : 'html';
    if (Array.isArray(tags)) post.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    if (coverImage) post.coverImage = coverImage;

    await post.save();
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/publish', requireAuth, requireRole('author'), async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/unpublish', requireAuth, requireRole('author'), async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    post.status = 'draft';
    post.publishedAt = null;
    await post.save();
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, requireRole('author'), async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    await Comment.deleteMany({ post: post._id });
    await Post.deleteOne({ _id: post._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

