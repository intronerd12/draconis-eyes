
const express = require('express');
const axios = require('axios');

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.DRAGON_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const messageRaw = typeof body.message === 'string' ? body.message : '';
    const message = messageRaw.trim();
    const user = body.user || null;

    if (!message) {
      return res.status(400).json({
        message: 'Message is required',
        text: 'Please type a question about dragon fruit so I can help.',
      });
    }

    const lower = message.toLowerCase();
    const domainKeywords = [
      'dragon fruit',
      'dragonfruit',
      'pitaya',
      'pitahaya',
      'tropiscan',
      'grading',
      'grade',
      'harvest',
      'orchard',
      'farm',
      'fertilizer',
      'pruning',
      'disease',
      'fungus',
      'pest',
      'brix',
      'sweetness',
      'size',
      'quality',
      'storage',
      'shelf life',
    ];

    const isDragonfruitQuestion = domainKeywords.some((k) => lower.includes(k));

    if (!isDragonfruitQuestion) {
      return res.json({
        text:
          'I can only answer questions about dragon fruit quality, farming, diseases, storage, and the Tropiscan scanning system. Try asking a dragon-fruit-related question.',
      });
    }

    if (!GEMINI_API_KEY) {
      return res.json({
        text:
          'The advanced Tropiscan assistant is not fully configured on the server yet. Ask shorter questions about dragon fruit quality, grading, or farming, or contact the admin to add a Gemini API key.',
      });
    }

    const systemParts = [
      'You are an expert assistant for Tropiscan, a dragon fruit quality and farming app.',
      'You only answer questions that are directly related to dragon fruit, pitaya, or pitahaya.',
      'If a question is not about dragon fruit, politely say you can only help with dragon-fruit-related topics.',
      'Give clear, step-by-step practical advice for farmers, traders, and operators.',
      'Be concise but detailed enough to answer complex questions.',
    ];

    const userContext = [];
    if (user && typeof user.name === 'string' && user.name.trim()) {
      userContext.push(`User name: ${user.name}`);
    }
    if (user && typeof user.email === 'string' && user.email.trim()) {
      userContext.push(`User email: ${user.email}`);
    }

    const systemText = systemParts.join(' ');
    const contextText = userContext.length ? `\n\nUser context: ${userContext.join(' • ')}` : '';
    const prompt = `${systemText}${contextText}\n\nUser question: ${message}`;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        params: {
          key: GEMINI_API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const candidates = geminiRes && geminiRes.data && Array.isArray(geminiRes.data.candidates) ? geminiRes.data.candidates : [];
    const first = candidates[0] && candidates[0].content && Array.isArray(candidates[0].content.parts) ? candidates[0].content.parts : null;
    const partWithText = first && first.find && first.find((p) => typeof p.text === 'string');
    const text = partWithText && typeof partWithText.text === 'string' ? partWithText.text.trim() : '';

    if (!text) {
      return res.status(502).json({
        message: 'No response from language model',
        text: 'I could not generate a reply right now. Please try again in a moment.',
      });
    }

    return res.json({ text });
  } catch (err) {
    let detail = null;
    if (err && err.response && err.response.data) {
      detail = err.response.data;
    } else if (err && err.message) {
      detail = err.message;
    }
    console.error('Chatbot error:', detail || err);
    return res.status(500).json({
      message: 'Error from chatbot service',
      text: 'Something went wrong while generating an answer. Please try again.',
    });
  }
});

module.exports = router;
