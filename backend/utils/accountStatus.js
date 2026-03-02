const BLOCKED_ACCOUNT_STATUSES = ['inactive', 'banned'];

const STATUS_REASON_CHOICES = Object.freeze({
  inactive: [
    'Requested by user',
    'No recent activity',
    'Pending identity verification',
    'Payment or subscription issue',
    'Temporary security hold',
  ],
  banned: [
    'Spam or scam activity',
    'Harassment or abuse',
    'Multiple policy violations',
    'Fraudulent account behavior',
    'Use of prohibited content',
  ],
});

const normalizeStatus = (status) => {
  const normalized = String(status || 'active').toLowerCase();
  if (normalized === 'deactivated') return 'inactive';
  return normalized;
};

const isBlockedAccountStatus = (status) => BLOCKED_ACCOUNT_STATUSES.includes(normalizeStatus(status));

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'inactive') return 'deactivated';
  return normalized;
};

const getAccountStatusMessage = ({ status, reason }) => {
  const label = getStatusLabel(status);
  const cleanReason = String(reason || '').trim();
  const reasonSuffix = cleanReason ? ` Reason: ${cleanReason}` : '';
  return `Your account is ${label}.${reasonSuffix}`;
};

module.exports = {
  BLOCKED_ACCOUNT_STATUSES,
  STATUS_REASON_CHOICES,
  normalizeStatus,
  isBlockedAccountStatus,
  getStatusLabel,
  getAccountStatusMessage,
};
