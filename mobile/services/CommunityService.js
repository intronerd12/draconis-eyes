import { apiFetch } from './api';

const safeReadJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const normalizeText = (value) => {
  const text = String(value ?? '').trim();
  return text.length ? text : '';
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeImageUrl = (value) => {
  const text = normalizeText(value);
  return text || undefined;
};

const isRemoteUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const getUploadMeta = (imageUri) => {
  const uriStr = String(imageUri || '');
  const cleanUri = uriStr.split('?')[0];
  const extRaw = cleanUri.includes('.') ? cleanUri.split('.').pop() : '';
  const ext = String(extRaw || '').toLowerCase();
  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : 'image/jpeg';
  const fileName = ext === 'png' || ext === 'webp' ? `community_scan.${ext}` : 'community_scan.jpg';
  return { mime, fileName };
};

const uploadScanImage = async (imageUri) => {
  const cleanUri = normalizeText(imageUri);
  if (!cleanUri) return null;

  const { mime, fileName } = getUploadMeta(cleanUri);
  const formData = new FormData();
  formData.append('image', {
    uri: cleanUri,
    name: fileName,
    type: mime,
  });

  const res = await apiFetch('/api/community/upload-scan-image', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });

  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to upload scan image');
  }
  return data;
};

const getUserMeta = (user) => {
  const userId = user?._id || user?.id || user?.userId || user?.uid || undefined;
  const authorName = normalizeText(user?.name || user?.fullName || user?.username) || 'Anonymous User';
  const authorEmail = normalizeText(user?.email).toLowerCase() || undefined;

  return {
    userId: userId ? String(userId) : undefined,
    authorName,
    authorEmail,
  };
};

const buildScanSnapshot = (scan) => {
  if (!scan || typeof scan !== 'object') return undefined;
  return {
    localScanId: normalizeText(scan.id),
    grade: normalizeText(scan.grade || 'N/A').toUpperCase(),
    fruitType: normalizeText(scan.fruit_type || scan.fruitType || 'No fruit type'),
    notes: normalizeText(scan.notes || scan.details || 'No notes provided'),
    estimatedPricePerKg: toNumber(scan.estimated_price_per_kg, 0),
    fruitAreaRatio: toNumber(scan.fruit_area_ratio, 0),
    sizeCategory: normalizeText(scan.size_category || 'N/A'),
    shelfLifeLabel: normalizeText(scan.shelf_life_label || 'No result'),
    scanTimestamp: scan.timestamp || new Date().toISOString(),
    imageUrl: normalizeImageUrl(scan.imageUri || scan.imageUrl),
  };
};

export const CommunityService = {
  getPosts: async ({ limit = 60 } = {}) => {
    const res = await apiFetch(`/api/community?limit=${encodeURIComponent(String(limit))}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await safeReadJson(res);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to load community posts');
    }
    return Array.isArray(data) ? data : [];
  },

  createPost: async ({ user, text, scan } = {}) => {
    const userMeta = getUserMeta(user);
    const scanSnapshot = buildScanSnapshot(scan);

    if (scanSnapshot?.imageUrl && !isRemoteUrl(scanSnapshot.imageUrl)) {
      try {
        const uploaded = await uploadScanImage(scanSnapshot.imageUrl);
        if (uploaded?.imageUrl) {
          scanSnapshot.imageUrl = uploaded.imageUrl;
        }
      } catch (error) {
        console.warn('[community] scan image upload failed, continuing with local URI:', error?.message || error);
      }
    }

    const payload = {
      ...userMeta,
      text: normalizeText(text),
      source: 'mobile_app',
      scanSnapshot,
    };

    if (!payload.text && !payload.scanSnapshot) {
      throw new Error('Add text or select a scan result before posting.');
    }

    const res = await apiFetch('/api/community', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await safeReadJson(res);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to create community post');
    }
    return data;
  },

  addComment: async ({ user, postId, text } = {}) => {
    const cleanPostId = normalizeText(postId);
    const cleanText = normalizeText(text);
    if (!cleanPostId) {
      throw new Error('postId is required');
    }
    if (!cleanText) {
      throw new Error('Comment text is required');
    }

    const userMeta = getUserMeta(user);
    const payload = {
      userId: userMeta.userId,
      commenterName: userMeta.authorName,
      commenterEmail: userMeta.authorEmail,
      text: cleanText,
    };

    const res = await apiFetch(`/api/community/${encodeURIComponent(cleanPostId)}/comments`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await safeReadJson(res);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to add comment');
    }
    return data;
  },

  toggleReaction: async ({ user, postId, type } = {}) => {
    const cleanPostId = normalizeText(postId);
    if (!cleanPostId) {
      throw new Error('postId is required');
    }
    if (!['heart', 'like'].includes(type)) {
      throw new Error('Invalid reaction type');
    }

    const userMeta = getUserMeta(user);
    const payload = {
      userId: userMeta.userId,
      reactorName: userMeta.authorName,
      reactorEmail: userMeta.authorEmail,
      type,
    };

    const res = await apiFetch(`/api/community/${encodeURIComponent(cleanPostId)}/reactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await safeReadJson(res);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to toggle reaction');
    }
    return data;
  },

  getNotifications: async ({ user, limit = 40 } = {}) => {
    const userMeta = getUserMeta(user);
    const query = new URLSearchParams();
    if (userMeta.authorEmail) query.set('email', userMeta.authorEmail);
    if (!userMeta.authorEmail && userMeta.userId) query.set('userId', userMeta.userId);
    query.set('limit', String(limit));

    if (!query.get('email') && !query.get('userId')) {
      return { items: [], unreadCount: 0 };
    }

    const res = await apiFetch(`/api/community/notifications?${query.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await safeReadJson(res);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to load notifications');
    }

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      unreadCount: Number(data?.unreadCount || 0),
    };
  },

  markNotificationsRead: async ({ user, ids } = {}) => {
    const userMeta = getUserMeta(user);
    const payload = {
      email: userMeta.authorEmail,
      userId: userMeta.userId,
      ids: Array.isArray(ids) ? ids : undefined,
    };

    if (!payload.email && !payload.userId) {
      return { modifiedCount: 0 };
    }

    const res = await apiFetch('/api/community/notifications/read', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await safeReadJson(res);
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to mark notifications as read');
    }
    return data || { modifiedCount: 0 };
  },
};
