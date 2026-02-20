import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './api';

import { getUserNamespace, sanitizeForKey } from './storageScope';

const STORAGE_KEY_BASE = 'dragon_scans_v1';
const PENDING_KEY_BASE = 'dragon_scan_pending_ops_v1';

const activeFlushByKey = new Map();

const getStorageKey = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user));
  return ns ? `${STORAGE_KEY_BASE}:${ns}` : `${STORAGE_KEY_BASE}:anon`;
};

const getPendingKey = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user));
  return ns ? `${PENDING_KEY_BASE}:${ns}` : `${PENDING_KEY_BASE}:anon`;
};

const getImagesDir = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user)) || 'anon';
  return `${FileSystem.documentDirectory}scans/${ns}/`;
};

const safeParseArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readPendingOps = async (user) => {
  const key = getPendingKey(user);
  const raw = await AsyncStorage.getItem(key);
  return safeParseArray(raw);
};

const writePendingOps = async (ops, user) => {
  await AsyncStorage.setItem(getPendingKey(user), JSON.stringify(Array.isArray(ops) ? ops : []));
};

const resolveUserMeta = (user) => {
  const userId =
    user?._id ??
    user?.id ??
    user?.userId ??
    user?.uid ??
    null;

  const userName =
    user?.name ??
    user?.fullName ??
    user?.username ??
    null;

  const userEmail =
    user?.email ??
    null;

  const token = typeof user?.token === 'string' ? user.token : null;

  return {
    userId: userId ? String(userId) : null,
    userName: userName ? String(userName) : null,
    userEmail: userEmail ? String(userEmail).toLowerCase() : null,
    token,
  };
};

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
  const fileName = ext === 'png' || ext === 'webp' ? `scan.${ext}` : 'scan.jpg';
  return { mime, fileName };
};

const ensureDirExists = async (dir) => {
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const safeReadJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const buildScanPayload = (scan, user) => {
  const { userId, userName, userEmail } = resolveUserMeta(user);
  return {
    grade: scan?.grade || 'UNKNOWN',
    details: scan?.notes || scan?.fruit_type || 'No details provided',
    imageUrl: scan?.imageUri,
    location: scan?.location,
    timestamp: scan?.timestamp || new Date().toISOString(),
    userId: userId || undefined,
    operatorName: userName || undefined,
    operatorEmail: userEmail || undefined,
    fruitType: scan?.fruit_type || undefined,
    localScanId: scan?.id || undefined,
    source: 'mobile_app',
  };
};

const syncScanPayloadToBackend = async (payload, { user } = {}) => {
  const { token } = resolveUserMeta(user);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await safeReadJson(res);
    throw new Error(errorBody?.message || `Scan sync failed (${res.status})`);
  }

  return safeReadJson(res);
};

const syncScanToBackend = async (scan, { user } = {}) => {
  return syncScanPayloadToBackend(buildScanPayload(scan, user), { user });
};

const deleteScanFromBackend = async (localScanId, { user } = {}) => {
  const id = String(localScanId || '').trim();
  if (!id) return null;

  const { userId, userEmail, token } = resolveUserMeta(user);
  const query = new URLSearchParams();
  if (userId) query.set('userId', userId);
  if (userEmail) query.set('operatorEmail', userEmail);
  const queryString = query.toString();

  const url = `${API_URL}/api/scan/${encodeURIComponent(id)}${queryString ? `?${queryString}` : ''}`;
  const headers = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  // Record might already be removed server-side, which is equivalent to success.
  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorBody = await safeReadJson(res);
    throw new Error(errorBody?.message || `Scan delete sync failed (${res.status})`);
  }

  return safeReadJson(res);
};

const enqueuePendingOperation = async (operation, { user } = {}) => {
  const type = operation?.type === 'delete' ? 'delete' : 'upsert';
  const localScanId = String(operation?.localScanId || '').trim();
  if (!localScanId) return;

  const current = await readPendingOps(user);
  const withoutSameScanId = current.filter((item) => String(item?.localScanId || '') !== localScanId);

  const next = {
    type,
    localScanId,
    queuedAt: new Date().toISOString(),
  };
  if (type === 'upsert') {
    if (operation?.payload) {
      next.payload = operation.payload;
    } else if (operation?.scan) {
      next.payload = buildScanPayload(operation.scan, user);
    }
  }

  await writePendingOps([...withoutSameScanId, next], user);
};

const flushPendingSyncInternal = async ({ user } = {}) => {
  const queue = await readPendingOps(user);
  if (!queue.length) return { synced: 0, remaining: 0 };

  const pending = [];
  let synced = 0;

  for (const op of queue) {
    const type = op?.type;
    const localScanId = String(op?.localScanId || '').trim();
    if (!localScanId) continue;

    try {
      if (type === 'delete') {
        await deleteScanFromBackend(localScanId, { user });
        synced += 1;
        continue;
      }

      if (type === 'upsert' && (op?.payload || op?.scan)) {
        const payload = op?.payload || buildScanPayload(op.scan, user);
        await syncScanPayloadToBackend(payload, { user });
        synced += 1;
        continue;
      }

      pending.push(op);
    } catch {
      pending.push(op);
    }
  }

  await writePendingOps(pending, user);
  return { synced, remaining: pending.length };
};

export const ScanService = {
  analyzeImage: async (imageUri) => {
    try {
      const { mime, fileName } = getUploadMeta(imageUri);

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: mime,
        name: fileName,
      });
      formData.append('client', 'mobile');

      const response = await fetch(`${API_URL}/api/scan/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await safeReadJson(response);
        throw new Error(errorData?.message || errorData?.detail || 'Analysis failed');
      }

      return await response.json();
    } catch (e) {
      console.error('Error analyzing image:', e);
      throw e;
    }
  },

  uploadTrainingSample: async (imageUri, { source } = {}) => {
    try {
      const { mime, fileName } = getUploadMeta(imageUri);
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: mime,
        name: fileName,
      });
      if (source) {
        formData.append('source', String(source));
      }

      const response = await fetch(`${API_URL}/api/train/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await safeReadJson(response);
        throw new Error(errorData?.message || 'Upload failed');
      }

      return await response.json();
    } catch (e) {
      console.error('Error uploading training sample:', e);
      throw e;
    }
  },

  flushPendingSync: async ({ user } = {}) => {
    const flushKey = getPendingKey(user);
    const running = activeFlushByKey.get(flushKey);
    if (running) return running;

    const nextRun = flushPendingSyncInternal({ user }).finally(() => {
      activeFlushByKey.delete(flushKey);
    });
    activeFlushByKey.set(flushKey, nextRun);
    return nextRun;
  },

  getPendingSyncCount: async ({ user } = {}) => {
    const queue = await readPendingOps(user);
    return queue.length;
  },

  getScans: async ({ user } = {}) => {
    try {
      const jsonValue = await AsyncStorage.getItem(getStorageKey(user));
      void ScanService.flushPendingSync({ user });
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error reading scans', e);
      return [];
    }
  },

  addScan: async (scan, { user } = {}) => {
    const scanId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();
    let finalImageUri = scan?.imageUri;

    try {
      const imagesDir = getImagesDir(user);
      await ensureDirExists(imagesDir);

      const fileName = `scan_${Date.now()}.jpg`;
      const newPath = imagesDir + fileName;
      await FileSystem.copyAsync({
        from: scan.imageUri,
        to: newPath,
      });
      finalImageUri = newPath;
    } catch (e) {
      console.error('Error copying scan image to local storage', e);
    }

    const newScan = {
      id: scanId,
      timestamp,
      ...scan,
      imageUri: finalImageUri,
    };

    try {
      const currentScans = await ScanService.getScans({ user });
      const updatedScans = [newScan, ...currentScans];
      await AsyncStorage.setItem(getStorageKey(user), JSON.stringify(updatedScans));
    } catch (e) {
      console.error('Error saving scan locally', e);
    }

    try {
      await enqueuePendingOperation(
        {
          type: 'upsert',
          localScanId: newScan.id,
          payload: buildScanPayload(newScan, user),
        },
        { user }
      );
      void ScanService.flushPendingSync({ user });
    } catch (e) {
      console.error('Error queueing scan sync', e);
    }

    return newScan;
  },

  getStats: async ({ user } = {}) => {
    try {
      const scans = await ScanService.getScans({ user });
      const total = scans.length;
      if (total === 0) return { total: 0, best: '-', avg: '0%' };

      const gradeMap = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const sum = scans.reduce((acc, scan) => acc + (gradeMap[scan.grade] || 0), 0);
      const avgNum = sum / total;
      const avgPercent = Math.round((avgNum / 5) * 100);

      const grades = scans.map((s) => s.grade);
      let best = '-';
      if (grades.includes('A')) best = 'A';
      else if (grades.includes('B')) best = 'B';
      else if (grades.includes('C')) best = 'C';
      else if (grades.includes('D')) best = 'D';
      else if (grades.includes('E')) best = 'E';

      return {
        total,
        best,
        avg: `${avgPercent}%`,
      };
    } catch (e) {
      console.error('Error getting stats', e);
      return { total: 0, best: '-', avg: '0%' };
    }
  },

  deleteScan: async (scanId, { user } = {}) => {
    try {
      const key = getStorageKey(user);
      const currentScans = await ScanService.getScans({ user });
      const idStr = String(scanId);
      const idx = currentScans.findIndex((s) => String(s?.id) === idStr);

      if (idx >= 0) {
        const removed = currentScans[idx];
        const updatedScans = [...currentScans.slice(0, idx), ...currentScans.slice(idx + 1)];
        await AsyncStorage.setItem(key, JSON.stringify(updatedScans));

        const uri = removed?.imageUri;
        if (typeof uri === 'string' && uri.length > 0) {
          try {
            const info = await FileSystem.getInfoAsync(uri);
            if (info.exists) {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            }
          } catch {}
        }
      }

      await enqueuePendingOperation(
        {
          type: 'delete',
          localScanId: idStr,
        },
        { user }
      );
      void ScanService.flushPendingSync({ user });

      return { deleted: idx >= 0 };
    } catch (e) {
      console.error('Error deleting scan', e);
      throw e;
    }
  },

  clearScans: async ({ user, deleteImages = false } = {}) => {
    try {
      await AsyncStorage.removeItem(getStorageKey(user));
      await AsyncStorage.removeItem(getPendingKey(user));
      if (deleteImages) {
        const dir = getImagesDir(user);
        const info = await FileSystem.getInfoAsync(dir);
        if (info.exists) {
          await FileSystem.deleteAsync(dir, { idempotent: true });
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
};
