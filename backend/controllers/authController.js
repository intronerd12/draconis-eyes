const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../config/email');
const {
  isBlockedAccountStatus,
  normalizeStatus,
  getAccountStatusMessage,
} = require('../utils/accountStatus');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists && userExists.is_email_verified && userExists.password) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (userExists && !userExists.password && (userExists.googleId || userExists.facebookId)) {
        // Allow linking password to social account if needed, but for now just error or handle differently
        // For register flow, if they exist as social user, maybe just tell them to login with social?
        return res.status(400).json({ message: 'User already exists with social login. Please login with Google/Facebook.' });
    }

    // Generate verification token
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;

    if (userExists && !userExists.is_email_verified) {
      // Update existing unverified user
      userExists.name = name;
      if (password) userExists.password = password; // Only set password if provided
      userExists.verificationCode = verificationCode;
      userExists.verificationCodeExpires = verificationCodeExpires;
      
      user = await userExists.save();
    } else {
      // Create new user
      const userData = {
        name,
        email,
        verificationCode,
        verificationCodeExpires
      };
      if (password) userData.password = password; // Only set password if provided
      
      user = await User.create(userData);
    }

    if (user) {
      const message = `Your verification code is: ${verificationCode}`;
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message,
      });

      if (!emailResult.success) {
        throw new Error(`Email sending failed: ${emailResult.error}`);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        requiresVerification: true,
        email: user.email
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    
    // Cleanup if email failed (and user was just created)
    if (error.message.includes('Email sending failed')) {
       await User.deleteOne({ email: email, is_email_verified: false });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed: Could not send verification email. Please try again later.'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    user.is_email_verified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    
    const updatedUser = await user.save();
    const status = normalizeStatus(updatedUser.status);

    if (isBlockedAccountStatus(status)) {
      return res.status(403).json({
        message: getAccountStatusMessage({
          status,
          reason: updatedUser.status_reason,
        }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found' });
    }

    if (!user.is_email_verified) {
      return res.status(401).json({ message: 'Please verify your email address' });
    }

    if (user && (await user.matchPassword(password))) {
      const status = normalizeStatus(user.status);
      if (isBlockedAccountStatus(status)) {
        return res.status(403).json({
          message: getAccountStatusMessage({
            status,
            reason: user.status_reason,
          }),
        });
      }

      user.last_login_at = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  // Assuming req.user is set by middleware (which isn't implemented yet in routes)
  res.status(200).json(req.user);
};

// @desc    Social Login (Google/Facebook)
// @route   POST /api/auth/social-login
// @access  Public
const socialLogin = async (req, res) => {
  const { name, email, googleId, facebookId, avatar } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required for social login' });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with social ID if missing
      if (googleId && !user.googleId) user.googleId = googleId;
      if (facebookId && !user.facebookId) user.facebookId = facebookId;
      if (avatar && !user.avatar) user.avatar = avatar;
      
      // If user was unverified but now logging in via social (trusted), mark verified
      if (!user.is_email_verified) {
          user.is_email_verified = true;
          user.verificationCode = undefined;
          user.verificationCodeExpires = undefined;
      }

      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        facebookId,
        avatar: avatar || '',
        is_email_verified: true, // Trusted from Google/Facebook
      });
    }

    const status = normalizeStatus(user.status);
    if (isBlockedAccountStatus(status)) {
      return res.status(403).json({
        message: getAccountStatusMessage({
          status,
          reason: user.status_reason,
        }),
      });
    }

    user.last_login_at = new Date();
    await user.save();

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Social Login Error:', error);
    if (error.code === 11000) {
      // Duplicate key error (likely email or social ID collision)
      return res.status(400).json({ message: 'User with this email already exists but is not linked to this social account.' });
    }
    res.status(500).json({ message: 'Server error during social login' });
  }
};

// @desc    Validate active session
// @route   GET /api/auth/session
// @access  Private
const getSessionStatus = async (req, res) => {
  const status = normalizeStatus(req.user?.status);
  if (isBlockedAccountStatus(status)) {
    return res.status(403).json({
      message: getAccountStatusMessage({
        status,
        reason: req.user?.status_reason,
      }),
      status,
      reason: req.user?.status_reason || '',
    });
  }

  return res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
    role: req.user.role,
    status,
    status_reason: req.user.status_reason || '',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  socialLogin,
  getSessionStatus,
};
