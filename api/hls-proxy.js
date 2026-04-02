// api/hls-proxy.js — Node.js runtime (default en Next.js /api/)
// Estrategia 1: endpoint GET público de Chaturbate (sin CSRF, sin page scraping)
// Estrategia 2: URL CDN mmcdn directa como fallback

export const config = { maxDuration: 15 };

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const username = ((req.query.username) || '').trim().toLowerCase();
  if (!username || !/^[a-z0-9_-]{3,60}$/.test(username)) {
    return res.status(400).json({ error: 'invalid_username' });
  }

  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

  // ── Estrategia 1: endpoint GET público (sin CSRF) ──
  try {
    const endpoint = `https://chaturbate.com/get_edge_hls_url_ajax/?room_slug=${username}&bandwidth=high`;

    const r = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': ua,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': `https://chaturbate.com/${username}/`,
        'X-Requested-With': 'XMLHttpRequest',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
    });

    if (r.ok) {
      const data = await r.json();
      if (data.url) {
        return res.status(200).json({
          success: true, type: 'hls',
          url: data.url,
          room_status: data.room_status || 'public',
        });
      }
      // sala offline/privada — no hay fallback útil
      return res.status(200).json({
        success: false,
        room_status: data.room_status || 'offline',
        _debug: data,
      });
    }
    console.warn(`[hls-proxy] s1 HTTP ${r.status}`);
  } catch (err) {
    console.warn('[hls-proxy] s1 error:', err.message);
  }

  // ── Estrategia 2: URL CDN mmcdn directa ──
  // Chaturbate usa hls.live.mmcdn.com con CORS abierto.
  // El cliente puede intentar reproducir este .m3u8 directamente con hls.js.
  const cdnUrl = `https://hls.live.mmcdn.com/live-hls/amlst:${username}/index.m3u8`;
  return res.status(200).json({
    success: true, type: 'hls',
    url: cdnUrl,
    room_status: 'public',
    _via: 'cdn_fallback',
  });
}
