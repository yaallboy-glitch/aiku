// ============================================
// NexusAI Server - Proxy ke 9Router
// Cara pakai:
//   1. npm install express cors node-fetch@2
//   2. Edit ROUTER_URL & API_KEY di bawah
//   3. node server.js
//   4. Buka http://localhost:3000
// ============================================

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // gunakan node-fetch versi 2
const path = require('path');

const app = express();

// ============ KONFIGURASI — GANTI INI! ============
const CONFIG = {
  // Tunnel URL dari 9Router Anda (sampai /v1)
  ROUTER_URL: 'https://xxxxx.tunnel-anda.com/v1',

  // Nilai API Key ASLI (bukan nama label!)
  API_KEY: 'sk-xxxxxxxxxxxxxxxx',

  // Model default
  MODEL: 'claude-sonnet-4-20250514',

  PORT: 3000
};
// ==================================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname))); // sajikan index.html

// Endpoint chat — frontend memanggil /api/chat
app.post('/api/chat', async (req, res) => {
  const { messages, model, temperature, max_tokens } = req.body;

  console.log('📨 Request masuk:', JSON.stringify({
    model: model || CONFIG.MODEL,
    messages_count: messages?.length
  }));

  try {
    const upstream = await fetch(CONFIG.ROUTER_URL.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.API_KEY,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: model || CONFIG.MODEL,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
        stream: true
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('❌ Upstream error HTTP', upstream.status, ':', errText.substring(0, 300));
      return res.status(upstream.status).json({
        error: { message: errText.substring(0, 500), status: upstream.status }
      });
    }

    // Stream langsung diteruskan ke browser
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    upstream.body.on('data', chunk => res.write(chunk));
    upstream.body.on('end', () => {
      console.log('✅ Stream selesai');
      res.end();
    });
    upstream.body.on('error', e => {
      console.error('❌ Stream error:', e.message);
      res.end();
    });

    // Jika client disconnect, hentikan upstream
    req.on('close', () => upstream.body.destroy());

  } catch (err) {
    console.error('❌ Fetch gagal:', err.message);
    res.status(502).json({
      error: { message: 'Tidak bisa menghubungi 9Router: ' + err.message }
    });
  }
});

// Test koneksi sederhana
app.get('/api/test', async (req, res) => {
  try {
    const r = await fetch(CONFIG.ROUTER_URL.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.API_KEY
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [{ role: 'user', content: 'Jawab satu kata: OK' }],
        max_tokens: 10, stream: false
      })
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      console.log('✅ Test koneksi BERHASIL:', data.choices?.[0]?.message?.content);
      res.json({ ok: true, reply: data.choices?.[0]?.message?.content });
    } else {
      console.error('❌ Test gagal HTTP', r.status, JSON.stringify(data).substring(0, 300));
      res.status(r.status).json({ ok: false, status: r.status, detail: data });
    }
  } catch (e) {
    res.status(502).json({ ok: false, detail: e.message });
  }
});

app.listen(CONFIG.PORT, () => {
  console.log('');
  console.log('🚀 NexusAI Server berjalan!');
  console.log(`   👉 Buka: http://localhost:${CONFIG.PORT}`);
  console.log(`   🔗 Router: ${CONFIG.ROUTER_URL}`);
  console.log(`   🤖 Model: ${CONFIG.MODEL}`);
  console.log('');
});
