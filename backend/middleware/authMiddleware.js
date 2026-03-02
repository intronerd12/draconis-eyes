const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isBlockedAccountStatus, getAccountStatusMessage, normalizeStatus } = require('../utils/accountStatus');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
    return '';
  }
  return String(authHeader).split(' ')[1].trim();
};

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const ensureActiveAccount = (req, res, next) => {
  const status = normalizeStatus(req.user?.status);
  if (isBlockedAccountStatus(status)) {
    const reason = req.user?.status_reason || '';
    return res.status(403).json({
      message: getAccountStatusMessage({ status, reason }),
      status,
      reason,
    });
  }

  return next();
};

module.exports = {
  protect,
  ensureActiveAccount,
};
