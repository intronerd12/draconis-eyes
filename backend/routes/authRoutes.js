const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
// router.get('/me', protect, getMe); // protect middleware not implemented yet, skipping for now

module.exports = router;
