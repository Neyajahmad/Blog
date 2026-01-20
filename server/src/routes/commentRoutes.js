const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ message: 'Missing content' });

    const post = await Post.findById(postId).select('_id status author');
    if (!post || post.status !== 'published') return res.status(404).json({ message: 'Not found' });

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: String(content).trim(),
    });

    const populated = await comment.populate('author', 'name role');
    res.status(201).json({ comment: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Not found' });

    const post = await Post.findById(comment.post).select('author');
    const canDelete =
      String(comment.author) === String(req.user._id) || (post && String(post.author) === String(req.user._id));
    if (!canDelete) return res.status(403).json({ message: 'Forbidden' });

    await Comment.deleteOne({ _id: comment._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

