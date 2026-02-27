const mongoose = require('mongoose');
const fs = require('fs');
const CommunityPost = require('../models/CommunityPost');
const CommunityNotification = require('../models/CommunityNotification');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

const DRAGON_TOPIC_REGEX = /\b(dragon\s*fruit|dragonfruit|pitaya|hylocereus|selenicereus|red\s*dragon|white\s*dragon|yellow\s*dragon)\b/i;
const NON_DRAGON_REGEX = /\b(no\s+dragon\s+fruit|not\s+(a\s+)?dragon\s*fruit|non[-\s]*dragon)\b/i;
const BAD_WORD_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|motherfucker|cunt)\b/ig,
  /\b(puta|putangina|putang\s*ina|gago|tanga|ulol|pakyu|bobo)\b/ig,
];

const maskBadLanguage = (text) => {
  let masked = String(text || '');
  BAD_WORD_PATTERNS.forEach((pattern) => {
    masked = masked.replace(pattern, (match) => '*'.repeat(match.length));
  });
  return masked;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return undefined;
  const out = String(value).trim();
  return out.length ? out : undefined;
};

const normalizeGrade = (value) => {
  const cleaned = normalizeText(value);
  return cleaned ? cleaned.toUpperCase() : undefined;
};

const parseDateOrNow = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const containsBadLanguage = (text) => {
  const sample = String(text || '').trim();
  if (!sample) return false;
  return BAD_WORD_PATTERNS.some((pattern) => pattern.test(sample));
};

const hasDragonFruitContext = ({ text, scanSnapshot }) => {
  const postText = String(text || '');
  const scanText = `${scanSnapshot?.fruitType || ''} ${scanSnapshot?.notes || ''}`;

  const textHasDragon = DRAGON_TOPIC_REGEX.test(postText) && !NON_DRAGON_REGEX.test(postText);
  const scanHasDragon = DRAGON_TOPIC_REGEX.test(scanText) && !NON_DRAGON_REGEX.test(scanText);

  return Boolean(textHasDragon || scanHasDragon);
};

const resolveUser = async ({ userId, authorEmail }) => {
  const userIdCandidate = normalizeText(userId);
  const normalizedEmail = normalizeText(authorEmail)?.toLowerCase();

  if (userIdCandidate && mongoose.Types.ObjectId.isValid(userIdCandidate)) {
    return User.findById(userIdCandidate).select('_id name email');
  }
  if (normalizedEmail) {
    return User.findOne({ email: normalizedEmail }).select('_id name email');
  }
  return null;
};

const createNotifications = async ({ recipients, actorUser, actorName, actorEmail, type, postId, commentId }) => {
  if (!Array.isArray(recipients) || !recipients.length) return;

  const actorEmailNorm = normalizeText(actorEmail)?.toLowerCase();
  const actorUserId = actorUser ? String(actorUser) : null;
  const docs = recipients
    .filter((r) => r && (r.recipientEmail || r.recipientUser))
    .filter((r) => {
      const recUserId = r.recipientUser ? String(r.recipientUser) : null;
      const recEmail = normalizeText(r.recipientEmail)?.toLowerCase();
      if (actorUserId && recUserId && recUserId === actorUserId) return false;
      if (!actorEmailNorm || !recEmail) return true;
      return recEmail !== actorEmailNorm;
    })
    .map((r) => ({
      recipientUser: r.recipientUser || undefined,
      recipientEmail: normalizeText(r.recipientEmail)?.toLowerCase(),
      actorUser: actorUser || undefined,
      actorName: actorName || 'Community User',
      actorEmail: actorEmailNorm,
      type,
      message: type === 'post'
        ? `${actorName || 'A user'} shared a new dragon fruit scan post.`
        : type === 'reaction'
          ? `${actorName || 'A user'} reacted to your post.`
          : `${actorName || 'A user'} commented on a community post.`,
      post: postId || undefined,
      commentId: commentId || undefined,
      readAt: null,
    }));

  if (docs.length) {
    try {
      await CommunityNotification.insertMany(docs, { ordered: false });
    } catch (error) {
      console.error('Community notification insert failed:', error.message || error);
    }
  }
};

const collectAllUsersExceptActor = async ({ actorEmail, actorUser }) => {
  const query = {};
  if (actorEmail) {
    query.email = { $ne: actorEmail };
  }
  if (actorUser && mongoose.Types.ObjectId.isValid(String(actorUser))) {
    query._id = { $ne: actorUser };
  }

  const users = await User.find(query).select('_id email');
  return users.map((u) => ({
    recipientUser: u._id,
    recipientEmail: u.email,
  }));
};

const cleanupLocalFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
};

const collectCommentRecipients = async (postDoc, actorEmail) => {
  const actor = normalizeText(actorEmail)?.toLowerCase();
  const emailSet = new Set();

  if (postDoc?.authorEmail) {
    emailSet.add(String(postDoc.authorEmail).toLowerCase());
  }
  if (Array.isArray(postDoc?.comments)) {
    postDoc.comments.forEach((c) => {
      const e = normalizeText(c?.commenterEmail)?.toLowerCase();
      if (e) emailSet.add(e);
    });
  }

  if (actor) emailSet.delete(actor);
  const emails = [...emailSet];
  if (!emails.length) return [];

  const users = await User.find({ email: { $in: emails } }).select('_id email');
  const byEmail = new Map(users.map((u) => [String(u.email).toLowerCase(), u]));

  return emails.map((email) => ({
    recipientEmail: email,
    recipientUser: byEmail.get(email)?._id,
  }));
};

const toRecipientQuery = ({ email, userId }) => {
  const normalizedEmail = normalizeText(email)?.toLowerCase();
  const normalizedUserId = normalizeText(userId);
  if (normalizedEmail) return { recipientEmail: normalizedEmail };
  if (normalizedUserId && mongoose.Types.ObjectId.isValid(normalizedUserId)) return { recipientUser: normalizedUserId };
  return null;
};

// @desc    Get community forum posts
// @route   GET /api/community
// @access  Public
const getCommunityPosts = async (req, res) => {
  try {
    const rawLimit = Number(req.query?.limit || 50);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 120)) : 50;

    // Prevent caching of community posts
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('comments.commenterUser', 'name email avatar')
      .populate('reactions.user', 'name email avatar');

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch community posts' });
  }
};

// @desc    Create community forum post
// @route   POST /api/community
// @access  Public
const createCommunityPost = async (req, res) => {
  try {
    const {
      text,
      userId,
      authorName,
      authorEmail,
      source,
      scanSnapshot,
    } = req.body || {};

    let normalizedText = normalizeText(text);
    const cleanSnapshot = scanSnapshot && typeof scanSnapshot === 'object' ? scanSnapshot : null;

    if (!normalizedText && !cleanSnapshot) {
      return res.status(400).json({ message: 'Post text or scan snapshot is required' });
    }

    if (normalizedText) {
      normalizedText = normalizeText(maskBadLanguage(normalizedText));
    }

    if (cleanSnapshot && cleanSnapshot.notes) {
      cleanSnapshot.notes = maskBadLanguage(cleanSnapshot.notes);
    }

    const snapshotForChecks = cleanSnapshot
      ? {
          fruitType: normalizeText(cleanSnapshot.fruitType),
          notes: normalizeText(cleanSnapshot.notes),
        }
      : null;

    if (!hasDragonFruitContext({ text: normalizedText, scanSnapshot: snapshotForChecks })) {
      return res.status(400).json({
        message: 'Community posts must be about dragon fruit and scan results only.',
      });
    }

    const resolvedUser = await resolveUser({ userId, authorEmail });
    const safeAuthorName = normalizeText(authorName) || resolvedUser?.name || 'Anonymous User';
    const safeAuthorEmail = normalizeText(authorEmail)?.toLowerCase() || resolvedUser?.email;

    const payload = {
      authorName: safeAuthorName,
      authorEmail: safeAuthorEmail,
      text: normalizedText,
      source: normalizeText(source) || 'mobile_app',
    };

    if (resolvedUser?._id) {
      payload.user = resolvedUser._id;
    }

    if (cleanSnapshot) {
      payload.scanSnapshot = {
        localScanId: normalizeText(cleanSnapshot.localScanId),
        grade: normalizeGrade(cleanSnapshot.grade),
        fruitType: normalizeText(cleanSnapshot.fruitType),
        notes: normalizeText(cleanSnapshot.notes),
        estimatedPricePerKg: Number(cleanSnapshot.estimatedPricePerKg) || 0,
        fruitAreaRatio: Number(cleanSnapshot.fruitAreaRatio) || 0,
        sizeCategory: normalizeText(cleanSnapshot.sizeCategory),
        shelfLifeLabel: normalizeText(cleanSnapshot.shelfLifeLabel),
        scanTimestamp: parseDateOrNow(cleanSnapshot.scanTimestamp),
        imageUrl: normalizeText(cleanSnapshot.imageUrl),
      };
    }

    const created = await CommunityPost.create(payload);

    const recipients = await collectAllUsersExceptActor({
      actorEmail: safeAuthorEmail,
      actorUser: resolvedUser?._id,
    });
    await createNotifications({
      recipients,
      actorUser: resolvedUser?._id,
      actorName: safeAuthorName,
      actorEmail: safeAuthorEmail,
      type: 'post',
      postId: created._id,
    });

    const post = await CommunityPost.findById(created._id)
      .populate('user', 'name email avatar')
      .populate('comments.commenterUser', 'name email avatar')
      .populate('reactions.user', 'name email avatar');

    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create community post' });
  }
};

// @desc    Add comment to a community post
// @route   POST /api/community/:postId/comments
// @access  Public
const addCommunityComment = async (req, res) => {
  try {
    const postId = normalizeText(req.params?.postId);
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Valid postId is required' });
    }

    const {
      text,
      userId,
      commenterName,
      commenterEmail,
    } = req.body || {};

    let normalizedText = normalizeText(text);
    if (!normalizedText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    normalizedText = normalizeText(maskBadLanguage(normalizedText));

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Community post not found' });
    }

    const resolvedUser = await resolveUser({ userId, authorEmail: commenterEmail });
    const safeCommenterName = normalizeText(commenterName) || resolvedUser?.name || 'Anonymous User';
    const safeCommenterEmail = normalizeText(commenterEmail)?.toLowerCase() || resolvedUser?.email;

    post.comments.push({
      commenterUser: resolvedUser?._id,
      commenterName: safeCommenterName,
      commenterEmail: safeCommenterEmail,
      text: normalizedText,
    });
    await post.save();

    const latestComment = post.comments[post.comments.length - 1];
    const recipients = await collectCommentRecipients(post, safeCommenterEmail);
    await createNotifications({
      recipients,
      actorUser: resolvedUser?._id,
      actorName: safeCommenterName,
      actorEmail: safeCommenterEmail,
      type: 'comment',
      postId: post._id,
      commentId: latestComment?._id ? String(latestComment._id) : undefined,
    });

    const populated = await CommunityPost.findById(post._id)
      .populate('user', 'name email avatar')
      .populate('comments.commenterUser', 'name email avatar')
      .populate('reactions.user', 'name email avatar');

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to add comment' });
  }
};

// @desc    Get community notifications for a recipient
// @route   GET /api/community/notifications
// @access  Public
const getCommunityNotifications = async (req, res) => {
  try {
    const rawLimit = Number(req.query?.limit || 50);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 120)) : 50;
    const recipientQuery = toRecipientQuery({
      email: req.query?.email,
      userId: req.query?.userId,
    });

    if (!recipientQuery) {
      return res.status(400).json({ message: 'email or userId is required' });
    }

    const [items, unreadCount] = await Promise.all([
      CommunityNotification.find(recipientQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actorUser', 'name email avatar'),
      CommunityNotification.countDocuments({ ...recipientQuery, readAt: null }),
    ]);

    return res.status(200).json({
      items,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load notifications' });
  }
};

// @desc    Mark community notifications as read
// @route   POST /api/community/notifications/read
// @access  Public
const markCommunityNotificationsRead = async (req, res) => {
  try {
    const recipientQuery = toRecipientQuery({
      email: req.body?.email,
      userId: req.body?.userId,
    });

    if (!recipientQuery) {
      return res.status(400).json({ message: 'email or userId is required' });
    }

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const now = new Date();

    const query = { ...recipientQuery, readAt: null };
    if (ids.length) {
      const validIds = ids
        .map((id) => String(id))
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length) {
        query._id = { $in: validIds };
      }
    }

    const updated = await CommunityNotification.updateMany(query, { $set: { readAt: now } });
    return res.status(200).json({
      message: 'Notifications marked as read',
      modifiedCount: Number(updated?.modifiedCount || 0),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to mark notifications as read' });
  }
};

// @desc    Upload community scan image
// @route   POST /api/community/upload-scan-image
// @access  Public
const uploadCommunityScanImage = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      cleanupLocalFile(req.file.path);
      return res.status(503).json({ message: 'Cloud image storage is not configured' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'dragon-vision/community-scans',
      resource_type: 'image',
      quality: 'auto:good',
    });

    cleanupLocalFile(req.file.path);
    return res.status(201).json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    cleanupLocalFile(req.file?.path);
    return res.status(500).json({ message: error.message || 'Failed to upload community image' });
  }
};

// @desc    Toggle reaction (heart/like) on a community post
// @route   POST /api/community/:postId/reactions
// @access  Public
const toggleCommunityReaction = async (req, res) => {
  try {
    const postId = normalizeText(req.params?.postId);
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Valid postId is required' });
    }

    const {
      type, // 'heart' or 'like'
      userId,
      reactorName,
      reactorEmail,
    } = req.body || {};

    if (!['heart', 'like'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type. Use heart or like.' });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Community post not found' });
    }

    const resolvedUser = await resolveUser({ userId, authorEmail: reactorEmail });
    // Identify user by _id if available, otherwise email
    const userIdentifier = resolvedUser?._id;
    const emailIdentifier = normalizeText(reactorEmail)?.toLowerCase();

    if (!userIdentifier && !emailIdentifier) {
      return res.status(400).json({ message: 'User identification required (userId or email)' });
    }

    // Find existing reaction
    const existingReactionIndex = post.reactions.findIndex((r) => {
      if (userIdentifier && r.user && r.user.toString() === userIdentifier.toString()) return true;
      if (emailIdentifier && r.email === emailIdentifier) return true;
      return false;
    });

    let isNewReaction = false;
    if (existingReactionIndex > -1) {
      const existing = post.reactions[existingReactionIndex];
      if (existing.type === type) {
        // Toggle off
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change reaction type
        existing.type = type;
      }
    } else {
      // Add new reaction
      isNewReaction = true;
      const safeName = normalizeText(reactorName) || resolvedUser?.name || 'Anonymous User';
      post.reactions.push({
        user: resolvedUser?._id,
        name: safeName,
        email: emailIdentifier,
        type,
      });
    }

    await post.save();

    if (isNewReaction && (post.user || post.authorEmail)) {
      // Only notify if it's a new reaction
      const recipient = {
        recipientUser: post.user,
        recipientEmail: post.authorEmail,
      };

      const safeReactorName = normalizeText(reactorName) || resolvedUser?.name || 'Community User';
      const safeReactorEmail = normalizeText(reactorEmail)?.toLowerCase() || resolvedUser?.email;

      await createNotifications({
        recipients: [recipient],
        actorUser: resolvedUser?._id,
        actorName: safeReactorName,
        actorEmail: safeReactorEmail,
        type: 'reaction',
        postId: post._id,
      });
    }

    // Return updated post with populated fields
    const populated = await CommunityPost.findById(post._id)
      .populate('user', 'name email avatar')
      .populate('comments.commenterUser', 'name email avatar')
      .populate('reactions.user', 'name email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to toggle reaction' });
  }
};

const deleteCommunityPost = async (req, res) => {
  try {
    let { postId } = req.params;
    postId = String(postId || '').trim();

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Valid postId is required' });
    }
    const post = await CommunityPost.findById(postId);
    if (!post) {
      console.log(`[Community] Delete failed: Post ${postId} not found`);
      return res.status(404).json({ message: 'Community post not found' });
    }
    
    const userId = req.body?.userId || req.query?.userId || req.headers?.['x-user-id'];
    const authorEmail =
      req.body?.authorEmail ||
      req.query?.authorEmail ||
      req.body?.email ||
      req.query?.email ||
      req.headers?.['x-user-email'];
      
    console.log(`[Community] Attempting delete for post ${postId} (DB ID: ${post._id}) by user ${userId} / ${authorEmail}`);

    const resolvedUser = await resolveUser({ userId, authorEmail });
    const actorUserId = resolvedUser?._id ? String(resolvedUser._id) : (mongoose.Types.ObjectId.isValid(String(userId || '')) ? String(userId) : null);
    const actorEmail = normalizeText(authorEmail)?.toLowerCase() || resolvedUser?.email || null;
    let ownerMatch = false;
    
    // Check if actor is the post owner (registered user match)
    if (actorUserId && post.user && String(post.user) === actorUserId) {
      ownerMatch = true;
    } else {
      // Check email match
      const emailCandidates = [];
      if (post.authorEmail) emailCandidates.push(String(post.authorEmail).toLowerCase());
      if (post.user && !post.authorEmail) {
        try {
          const postUser = await User.findById(post.user).select('email');
          if (postUser?.email) emailCandidates.push(String(postUser.email).toLowerCase());
        } catch {}
      }
      if (actorEmail && emailCandidates.includes(String(actorEmail).toLowerCase())) {
        ownerMatch = true;
      }
    }
    
    if (!ownerMatch) {
      console.log(`[Community] Delete denied for post ${postId}. Owner: ${post.user || post.authorEmail}, Actor: ${actorUserId || actorEmail}`);
      return res.status(403).json({ message: 'You can only delete your own post' });
    }

    // Use findOneAndDelete to get the deleted document and ensure atomicity
    const deletedPost = await CommunityPost.findOneAndDelete({ _id: post._id });

    if (!deletedPost) {
        console.warn(`[Community] Post ${postId} deletion failed (not found during delete)`);
        // Check if it still exists (race condition?)
        const exists = await CommunityPost.exists({ _id: post._id });
        if (exists) {
            return res.status(500).json({ message: 'Failed to delete post from database' });
        }
        // If it doesn't exist, it was already deleted, which is fine
        return res.status(200).json({ message: 'Post already deleted', id: String(post._id) });
    }

    console.log(`[Community] Post ${postId} permanently deleted.`);

    return res.status(200).json({ message: 'Post deleted', id: String(post._id) });
  } catch (error) {
    console.error(`[Community] Delete error for ${req.params?.postId}:`, error);
    return res.status(500).json({ message: error.message || 'Failed to delete community post' });
  }
};

// @desc    Get community analytics
// @route   GET /api/community/analytics
// @access  Public (Admin)
const getCommunityAnalytics = async (req, res) => {
  try {
    const totalPosts = await CommunityPost.countDocuments();
    
    // Aggregation for comments and reactions
    const stats = await CommunityPost.aggregate([
      {
        $group: {
          _id: null,
          totalComments: { $sum: { $size: "$comments" } },
          totalReactions: { $sum: { $size: "$reactions" } },
        }
      }
    ]);

    const totalComments = stats[0]?.totalComments || 0;
    const totalReactions = stats[0]?.totalReactions || 0;

    // Active users count (unique authors)
    const distinctAuthors = await CommunityPost.distinct('authorEmail');
    const activeUsers = distinctAuthors.length;

    // Posts in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const postsLast24h = await CommunityPost.countDocuments({ createdAt: { $gte: oneDayAgo } });

    // Most active author
    const topAuthor = await CommunityPost.aggregate([
      { $group: { _id: "$authorName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.status(200).json({
      totalPosts,
      totalComments,
      totalReactions,
      activeUsers,
      postsLast24h,
      topAuthor: topAuthor[0] || { _id: 'None', count: 0 }
    });
  } catch (error) {
    console.error('Community analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch community analytics' });
  }
};

module.exports = {
  getCommunityPosts,
  createCommunityPost,
  addCommunityComment,
  uploadCommunityScanImage,
  getCommunityNotifications,
  toggleCommunityReaction,
  markCommunityNotificationsRead,
  deleteCommunityPost,
  getCommunityAnalytics,
};
