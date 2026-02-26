const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  socialLogin,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social-login', socialLogin);
router.post('/verify-email', verifyEmail);
// router.get('/me', protect, getMe); // protect middleware not implemented yet, skipping for now

module.exports = router;
