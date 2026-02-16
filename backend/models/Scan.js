const mongoose = require('mongoose');

const scanSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allow anonymous scans if needed, or link to user if logged in
    },
    grade: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    location: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Scan', scanSchema);
