const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../config/email');

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

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists && userExists.isEmailVerified) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate verification token
  const verificationToken = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars

  let user;

  if (userExists && !userExists.isEmailVerified) {
    // Update existing unverified user
    userExists.name = name;
    userExists.password = hashedPassword;
    userExists.verificationToken = verificationToken;
    userExists.verificationTokenExpires = Date.now() + 10 * 60 * 1000;
    user = await userExists.save();
  } else {
    // Create new user
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
  }

  if (user) {
    try {
      const message = `Your verification code is: ${verificationToken}`;
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message,
      });

      if (!emailResult.success) {
        // If email fails, we should probably rollback the user creation or at least warn
        // For now, we'll return a server error so the frontend knows something went wrong
        throw new Error(`Email sending failed: ${emailResult.error}`);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        requiresVerification: true,
        email: user.email
      });
    } catch (error) {
      console.error('Registration Error:', error);
      
      // If user was created but email failed, we might want to delete the user
      // so they can try again with the same email.
      if (user && !userExists) {
        await User.deleteOne({ _id: user._id });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed: Could not send verification email. Please try again later.'
      });
    }
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ 
    email, 
    verificationToken: code,
    verificationTokenExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  user.isEmailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(404).json({ message: 'No user found' });
  }

  if (!user.isEmailVerified) {
    return res.status(401).json({ message: 'Please verify your email address' });
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
};
