
const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { getScans, createScan, getScanStats } = require('../controllers/scanController');

// Configure Multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

// @desc    Get all scans
// @route   GET /api/scan
router.get('/', getScans);

// @desc    Create a new scan
// @route   POST /api/scan
router.post('/', createScan);

// @desc    Get scan statistics
// @route   GET /api/scan/stats
router.get('/stats', getScanStats);

// @desc    Analyze dragon fruit image
// @route   POST /api/scan/analyze
// @access  Public (or Private if we add auth middleware)
router.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    const filePath = req.file.path;
    
    // Create FormData for Python service
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
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

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error communicating with AI service' });
  }
});

module.exports = router;
