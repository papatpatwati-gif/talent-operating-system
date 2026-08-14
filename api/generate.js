import { createHash } from 'crypto';
import { kv } from '@vercel/kv'; // WAJIB jika pakai KV

// ======================
// In-memory rate limiter
// ======================
const rateLimitMap = new Map();

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip, max = 10, windowSeconds = 3600) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);

  if (recent.length >= max) {
    return {
      allowed: false,
      resetIn: Math.ceil((recent[0] + windowMs - now) / 1000)
    };
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);

  return {
    allowed: true,
    remaining: max - recent.length
  };
}

// ======================
// Cache Key Generator
// ======================
function createCacheKey(prompt) {
  return `tos-cache:${createHash('sha256')
    .update(prompt)
    .digest('hex')}`;
}

export default async function handler(req, res) {
  // ======================
  // CORS
  // ======================
  const allowedOrigin =
    process.env.VERCEL_ENV === 'production'
      ? `https://${process.env.VERCEL_PROD_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' });

  // ======================
  // Rate Limit
  // ======================
  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, 10, 3600);

  if (!rl.allowed) {
    return res.status(429).json({
      message: `Terlalu banyak permintaan. Coba lagi dalam ${rl.resetIn} detik.`
    });
  }

  // ======================
  // Validate API Key
  // ======================
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;

  if (!API_KEY) {
    console.error('[TOS] GEMINI_API_KEY tidak ditemukan.');
    return res.status(503).json({
      message: 'Layanan AI belum dikonfigurasi. Silakan aktifkan API key di environment server.'
    });
  }

  // ======================
  // Validate Request Body
  // ======================
  const body = req.body;

  if (!body || typeof body.prompt !== 'string') {
    return res.status(400).json({ message: 'Request tidak valid.' });
  }

  const prompt = body.prompt.trim();

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt kosong.' });
  }

  if (prompt.length > 12000) {
    return res.status(400).json({ message: 'Prompt terlalu panjang.' });
  }

  // ======================
  // Caching (Optional KV)
  // ======================
  const cacheKey = createCacheKey(prompt);

  try {
    if (process.env.REDIS_URL && kv) {
      const cached = await kv.get(cacheKey);

      if (cached) {
        console.log(`[TOS] CACHE HIT — ${ip}`);
        res.setHeader('X-Cache', 'hit');
        return res.status(200).json(cached);
      }
    }
  } catch (err) {
    console.warn('[TOS] KV read error:', err.message);
  }

  // ======================
  // Call Gemini API
  // ======================
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TOS] Gemini error:', errorText);

      if (response.status === 429) {
        return res.status(429).json({
          message: 'AI sedang sibuk. Coba lagi.'
        });
      }

      return res.status(502).json({
        message: 'AI service error',
        detail: errorText
      });
    }

    const data = await response.json();

    // ======================
    // Extract & Parse JSON from Gemini Response
    // ======================
    let analysisResult = null;
    
    try {
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!geminiText) {
        console.error('[TOS] No text in Gemini response');
        return res.status(502).json({
          message: 'Gemini response format tidak valid'
        });
      }

      // Extract JSON dari response (bisa dibungkus dalam markdown code block)
      const jsonMatch = geminiText.match(/```json\n?([\s\S]*?)\n?```|({[\s\S]*})/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : geminiText;

      analysisResult = JSON.parse(jsonString);
      
      // Validate struktur minimal
      if (!analysisResult.top_archetype || !analysisResult.summary_text || !analysisResult.scores || !analysisResult.plan) {
        console.error('[TOS] Invalid analysis structure:', Object.keys(analysisResult));
        return res.status(502).json({
          message: 'Format hasil analisis tidak sesuai'
        });
      }

    } catch (parseErr) {
      console.error('[TOS] JSON parse error:', parseErr.message);
      console.error('[TOS] Gemini text:', data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 200));
      
      return res.status(502).json({
        message: 'Gagal parse hasil analisis. Format tidak valid.'
      });
    }

    // ======================
    // Save to Cache
    // ======================
    try {
      if (process.env.REDIS_URL && kv) {
        await kv.set(cacheKey, analysisResult, { ex: 2592000 }); // 30 hari
      }
    } catch (err) {
      console.warn('[TOS] KV write error:', err.message);
    }

    console.log(`[TOS] CACHE MISS — ${ip}`);
    res.setHeader('X-Cache', 'miss');

    return res.status(200).json(analysisResult);

  } catch (error) {
    console.error('[TOS] Fatal error:', error);
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
}