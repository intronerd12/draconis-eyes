const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await User.countDocuments(query);
    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .select('-password');

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count,
    });
  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const has = (key) => Object.prototype.hasOwnProperty.call(req.body, key);

      if (has('name')) user.name = req.body.name;
      if (has('email')) user.email = req.body.email;
      if (has('role')) user.role = req.body.role;
      if (has('status')) user.status = req.body.status;
      if (has('avatar')) user.avatar = req.body.avatar; // Allow direct URL update
      if (user.status === 'active') {
        user.status_reason = '';
      } else if (has('status_reason')) {
        user.status_reason = req.body.status_reason;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        status: updatedUser.status,
        status_reason: updatedUser.status_reason,
        last_login_at: updatedUser.last_login_at,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/:id/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'dragon-vision/avatars',
      width: 300,
      crop: 'scale',
    });

    // Remove local file
    fs.unlinkSync(req.file.path);

    user.avatar = result.secure_url;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      status: updatedUser.status,
    });
  } catch (err) {
    console.error('Upload Avatar Error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    res.status(403).json({ message: 'User deletion is disabled' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  getUsers,
  updateUser,
  uploadAvatar,
  deleteUser,
};
