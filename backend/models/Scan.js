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
      required: false,
      default: 'UNKNOWN',
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    operatorName: {
      type: String,
      trim: true,
    },
    operatorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    fruitType: {
      type: String,
      trim: true,
    },
    localScanId: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'unknown',
    },
    estimated_price_per_kg: {
      type: Number,
    },
    fruit_area_ratio: {
      type: Number,
    },
    size_category: {
      type: String,
      trim: true,
    },
    market_value_label: {
      type: String,
      trim: true,
    },
    weight_grams_est: {
      type: Number,
    },
    ripeness_score: {
      type: Number,
    },
    quality_score: {
      type: Number,
    },
    shelf_life_label: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

scanSchema.index({ timestamp: -1 });
scanSchema.index({ user: 1, timestamp: -1 });
scanSchema.index({ operatorEmail: 1, timestamp: -1 });

module.exports = mongoose.model('Scan', scanSchema);
