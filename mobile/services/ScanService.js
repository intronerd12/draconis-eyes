import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './api';

const STORAGE_KEY = 'dragon_scans';
const IMAGES_DIR = FileSystem.documentDirectory + 'scans/';

// Ensure directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

export const ScanService = {
  // Analyze Image via Backend
  analyzeImage: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'scan.jpg',
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

  // Get all scans
  getScans: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error reading scans', e);
      return [];
    }
  },

  // Add a new scan
  addScan: async (scan) => {
    try {
      await ensureDirExists();
      
      // Move image to permanent storage
      const fileName = `scan_${Date.now()}.jpg`;
      const newPath = IMAGES_DIR + fileName;
      
      await FileSystem.copyAsync({
        from: scan.imageUri,
        to: newPath
      });

      const currentScans = await ScanService.getScans();
      const newScan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...scan,
        imageUri: newPath // Store permanent path
      };
      
      const updatedScans = [newScan, ...currentScans];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
      return newScan;
    } catch (e) {
      console.error('Error adding scan', e);
      // Fallback: save without moving image if FS fails
      const currentScans = await ScanService.getScans();
      const newScan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...scan,
      };
      const updatedScans = [newScan, ...currentScans];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
      return newScan;
    }
  },

  // Get stats
  getStats: async () => {
    try {
      const scans = await ScanService.getScans();
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
  
  // Clear all scans (for testing/debug)
  clearScans: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch(e) {
      console.error(e);
    }
  }
};
