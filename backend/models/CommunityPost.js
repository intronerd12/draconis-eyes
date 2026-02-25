const mongoose = require('mongoose');

const commentSchema = mongoose.Schema(
  {
    commenterUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    commenterName: {
      type: String,
      trim: true,
      required: true,
    },
    commenterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    text: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1200,
    },
  },
  {
    timestamps: true,
  }
);

const reactionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['heart', 'like'], // 'like' represents thumbs up
      required: true,
    },
  },
  { timestamps: true }
);

const communityPostSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    authorName: {
      type: String,
      trim: true,
      required: true,
    },
    authorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1200,
    },
    source: {
      type: String,
      trim: true,
      default: 'mobile_app',
    },
    scanSnapshot: {
      localScanId: { type: String, trim: true },
      grade: { type: String, trim: true },
      fruitType: { type: String, trim: true },
      notes: { type: String, trim: true, maxlength: 1200 },
      estimatedPricePerKg: { type: Number, default: 0 },
      fruitAreaRatio: { type: Number, default: 0 },
      sizeCategory: { type: String, trim: true },
      shelfLifeLabel: { type: String, trim: true },
      scanTimestamp: { type: Date },
      imageUrl: { type: String, trim: true },
    },
    comments: [commentSchema],
    reactions: [reactionSchema],
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ user: 1, createdAt: -1 });
communityPostSchema.index({ authorEmail: 1, createdAt: -1 });
communityPostSchema.index({ 'comments.createdAt': -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
