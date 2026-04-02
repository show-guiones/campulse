// api/hls-proxy.js
// Lee la hls_url cacheada en Supabase (guardada por campulse.py cada 2h).
// campulse.py corre en GitHub Actions donde Chaturbate no bloquea las IPs.
// Vercel solo lee de Supabase — sin tocar Chaturbate directamente.

export const config = { maxDuration: 10 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const username = ((req.query.username) || '').trim().toLowerCase();
  if (!username || !/^[a-z0-9_-]{3,60}$/.test(username)) {
    return res.status(400).json({ error: 'invalid_username' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'supabase_not_configured' });
  }

  try {
    // Leer hls_url del snapshot más reciente para este username
    const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?username=eq.${encodeURIComponent(username)}` +
      `&select=hls_url,current_show,captured_at` +
      `&order=captured_at.desc&limit=1`;

    const r = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!r.ok) {
      return res.status(502).json({ success: false, error: `supabase_http_${r.status}` });
    }

    const rows = await r.json();
    const row = rows?.[0];

    if (!row) {
      return res.status(200).json({ success: false, room_status: 'offline', reason: 'not_in_snapshot' });
    }

    if (!row.hls_url) {
      return res.status(200).json({
        success: false,
        room_status: row.current_show || 'offline',
        reason: 'no_hls_cached',
        hint: 'hls_url is null — la sala puede estar offline o tener pocos viewers (umbral: >5)',
      });
    }

    return res.status(200).json({
      success: true,
      type: 'hls',
      url: row.hls_url,
      room_status: row.current_show || 'public',
      cached_at: row.captured_at,
    });

  } catch (err) {
    console.error('[hls-proxy] error:', err.message);
    return res.status(500).json({ success: false, error: 'proxy_error', message: err.message });
  }
}
