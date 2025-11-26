const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPost,
  likePost,
  dislikePost,
  addComment,
  getMostActivePost,
  getExpiredPosts,
  getMyInteractions,
  getPostInteractions
} = require('../controllers/postController');
const { createPostValidation, commentValidation, validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPostValidation, validate, createPost);
router.get('/', protect, getPosts);
router.get('/interactions/my-history', protect, getMyInteractions);
router.get('/most-active/:topic', protect, getMostActivePost);
router.get('/expired/:topic', protect, getExpiredPosts);
router.get('/:id', protect, getPost);
router.post('/:id/like', protect, likePost);
router.post('/:id/dislike', protect, dislikePost);
router.post('/:id/comment', protect, commentValidation, validate, addComment);
router.get('/:id/interactions', protect, getPostInteractions);

module.exports = router;
