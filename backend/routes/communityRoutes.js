const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  getCommunityPosts,
  createCommunityPost,
  addCommunityComment,
  uploadCommunityScanImage,
  getCommunityNotifications,
  markCommunityNotificationsRead,
  toggleCommunityReaction,
} = require('../controllers/communityController');

// @desc    Get community notifications
// @route   GET /api/community/notifications
router.get('/notifications', getCommunityNotifications);

// @desc    Mark community notifications read
// @route   POST /api/community/notifications/read
router.post('/notifications/read', markCommunityNotificationsRead);

// @desc    Get community posts
// @route   GET /api/community
router.get('/', getCommunityPosts);

// @desc    Create community post
// @route   POST /api/community
router.post('/', createCommunityPost);

// @desc    Upload scan image used in community post
// @route   POST /api/community/upload-scan-image
router.post('/upload-scan-image', upload.single('image'), uploadCommunityScanImage);

// @desc    Add comment to post
// @route   POST /api/community/:postId/comments
router.post('/:postId/comments', addCommunityComment);

// @desc    Toggle reaction (heart/like)
// @route   POST /api/community/:postId/reactions
router.post('/:postId/reactions', toggleCommunityReaction);

module.exports = router;
