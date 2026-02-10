const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const source = typeof req.body?.source === 'string' ? req.body.source : undefined;

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    if (source) form.append('source', source);

    const response = await axios.post(`${PYTHON_SERVICE_URL}/train/upload`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    fs.unlinkSync(filePath);
    res.json(response.data);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error communicating with AI service' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/train/pending`);
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error communicating with AI service' });
  }
});

module.exports = router;
