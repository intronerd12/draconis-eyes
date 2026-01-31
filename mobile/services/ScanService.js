import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dragon_scans';

export const ScanService = {
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
      const currentScans = await ScanService.getScans();
      const newScan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...scan,
      };
      const updatedScans = [newScan, ...currentScans];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
      return newScan;
    } catch (e) {
      console.error('Error adding scan', e);
      throw e;
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
