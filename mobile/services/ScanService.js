import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './api';

import { getUserNamespace, sanitizeForKey } from './storageScope';

const STORAGE_KEY_BASE = 'dragon_scans_v1';

const getStorageKey = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user));
  return ns ? `${STORAGE_KEY_BASE}:${ns}` : `${STORAGE_KEY_BASE}:anon`;
};

const getImagesDir = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user)) || 'anon';
  return `${FileSystem.documentDirectory}scans/${ns}/`;
};

// Ensure directory exists
const ensureDirExists = async (dir) => {
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
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

export const ScanService = {
  // Analyze Image via Backend
  analyzeImage: async (imageUri) => {
    try {
      const { mime, fileName } = getUploadMeta(imageUri);

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: mime,
        name: fileName,
      });

      console.log('Sending image for analysis...', API_URL);
      const response = await fetch(`${API_URL}/api/scan/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          // 'Content-Type': 'multipart/form-data', // Let fetch set this automatically with boundary
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
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
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Upload failed');
      }

      return await response.json();
    } catch (e) {
      console.error('Error uploading training sample:', e);
      throw e;
    }
  },

  // Get all scans
  getScans: async ({ user } = {}) => {
    try {
      const jsonValue = await AsyncStorage.getItem(getStorageKey(user));
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error reading scans', e);
      return [];
    }
  },

  // Add a new scan
  addScan: async (scan, { user } = {}) => {
    try {
      const imagesDir = getImagesDir(user);
      await ensureDirExists(imagesDir);
      
      // Move image to permanent storage
      const fileName = `scan_${Date.now()}.jpg`;
      const newPath = imagesDir + fileName;
      
      await FileSystem.copyAsync({
        from: scan.imageUri,
        to: newPath
      });

      const currentScans = await ScanService.getScans({ user });
      const newScan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...scan,
        imageUri: newPath // Store permanent path
      };
      
      const updatedScans = [newScan, ...currentScans];
      await AsyncStorage.setItem(getStorageKey(user), JSON.stringify(updatedScans));
      try {
        const payload = {
          grade: scan.grade,
          details: scan.notes,
          location: scan.location,
          timestamp: newScan.timestamp,
          userId: user && user._id ? user._id : undefined,
        };

        await fetch(`${API_URL}/api/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('Error syncing scan to backend', err);
      }
      return newScan;
    } catch (e) {
      console.error('Error adding scan', e);
      // Fallback: save without moving image if FS fails
      const currentScans = await ScanService.getScans({ user });
      const newScan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...scan,
      };
      const updatedScans = [newScan, ...currentScans];
      await AsyncStorage.setItem(getStorageKey(user), JSON.stringify(updatedScans));
      return newScan;
    }
  },

  // Get stats
  getStats: async ({ user } = {}) => {
    try {
      const scans = await ScanService.getScans({ user });
      const total = scans.length;
      if (total === 0) return { total: 0, best: '-', avg: '0%' };

      // Calculate average grade (assuming grade is A, B, C, D, F)
      // This is a placeholder logic
      const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
      const sum = scans.reduce((acc, scan) => acc + (gradeMap[scan.grade] || 0), 0);
      const avgNum = sum / total;
      const avgPercent = Math.round((avgNum / 4) * 100);

      // Find best grade
      const grades = scans.map(s => s.grade);
      let best = '-';
      if (grades.includes('A')) best = 'A';
      else if (grades.includes('B')) best = 'B';
      else if (grades.includes('C')) best = 'C';

      return {
        total,
        best,
        avg: `${avgPercent}%`
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
      if (idx < 0) return { deleted: false };

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

      return { deleted: true };
    } catch (e) {
      console.error('Error deleting scan', e);
      throw e;
    }
  },
  
  // Clear all scans (for testing/debug)
  clearScans: async ({ user, deleteImages = false } = {}) => {
    try {
      await AsyncStorage.removeItem(getStorageKey(user));
      if (deleteImages) {
        const dir = getImagesDir(user);
        const info = await FileSystem.getInfoAsync(dir);
        if (info.exists) {
          await FileSystem.deleteAsync(dir, { idempotent: true });
        }
      }
    } catch(e) {
      console.error(e);
    }
  }
};
