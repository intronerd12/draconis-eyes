const mongoose = require('mongoose');

const communityNotificationSchema = mongoose.Schema(
  {
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: false,
    },
    actorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    actorName: {
      type: String,
      trim: true,
      required: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: false,
    },
    type: {
      type: String,
      enum: ['post', 'comment'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 500,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: false,
    },
    commentId: {
      type: String,
      trim: true,
      required: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

communityNotificationSchema.index({ recipientEmail: 1, createdAt: -1 });
communityNotificationSchema.index({ recipientUser: 1, createdAt: -1 });
communityNotificationSchema.index({ recipientEmail: 1, readAt: 1 });
communityNotificationSchema.index({ recipientUser: 1, readAt: 1 });

module.exports = mongoose.model('CommunityNotification', communityNotificationSchema);
