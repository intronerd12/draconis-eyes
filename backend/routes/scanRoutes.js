
const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { getScans, createScan, deleteScanByLocalScanId, getScanStats, getScanAnalytics } = require('../controllers/scanController');
const { ensureAiServiceRunning } = require('../services/aiServiceManager');

// Configure Multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

// @desc    Get all scans
// @route   GET /api/scan
router.get('/', getScans);

// @desc    Create a new scan
// @route   POST /api/scan
router.post('/', createScan);

// @desc    Delete a scan by local scan id
// @route   DELETE /api/scan/:localScanId
router.delete('/:localScanId', deleteScanByLocalScanId);

// @desc    Get scan statistics
// @route   GET /api/scan/stats
router.get('/stats', getScanStats);

// @desc    Get scan analytics payload
// @route   GET /api/scan/analytics
router.get('/analytics', getScanAnalytics);

// @desc    Analyze dragon fruit image
// @route   POST /api/scan/analyze
// @access  Public (or Private if we add auth middleware)
router.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    const filePath = req.file.path;

    // On Render/local setups, auto-start AI service if needed.
    await ensureAiServiceRunning({ timeoutMs: 30000 });
    
    // Create FormData for Python service
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const client = String(req.body?.client || '').trim().toLowerCase();
    const source = String(req.body?.source || '').trim().toLowerCase();
    const requireYoloWeights =
      client === 'mobile' ||
      client === 'web' ||
      source === 'mobile_app' ||
      source === 'web_app';

    if (requireYoloWeights) {
      // Mobile and web app scans must use production YOLO weights.
      form.append('source', source || (client === 'web' ? 'web_app' : 'mobile_app'));
      form.append('require_yolo', '1');
      form.append('require_dual_yolo', '1');
      form.append('require_weights', 'yolo_best.pt');
      form.append('require_bad_weights', 'yolo_bad.pt');
    }
    
    // Forward to Python Service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/detect`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Cleanup temp file
    fs.unlinkSync(filePath);

    // Return analysis result
    res.json(response.data);

  } catch (error) {
    console.error('Scan Analysis Error:', error.message);
    
    // Cleanup temp file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'AI service is starting or unavailable. Please try scanning again in a few seconds.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error communicating with AI service' });
  }
});

module.exports = router;
