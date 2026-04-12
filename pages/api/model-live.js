// pages/api/model-live.js
// Consulta Supabase para saber si un modelo tiene un snapshot reciente con viewers > 0
// Esto evita depender de Chaturbate (bloqueado por Vercel) o del scraper (retraso 2h)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username requerido' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase no configurado', online: false });
  }

  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  const enc = encodeURIComponent(username);

  try {
    // Obtener el snapshot más reciente sin importar la fecha
    const snapRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rooms_snapshot?username=eq.${enc}&select=num_users,captured_at&order=captured_at.desc&limit=1`,
      { headers: sbHeaders }
    );

    if (!snapRes.ok) {
      return res.status(502).json({ online: false, error: `Supabase HTTP ${snapRes.status}` });
    }

    const rows = await snapRes.json();
    const snap = Array.isArray(rows) ? rows[0] : null;

    if (!snap) {
      return res.status(200).json({ online: false, reason: 'sin_snapshots' });
    }

    const capturedAt = new Date(snap.captured_at).getTime();
    const ageMs = Date.now() - capturedAt;
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    const online = snap.num_users > 0 && ageMs < THREE_HOURS;

    return res.status(200).json({
      online,
      num_users: snap.num_users ?? 0,
      captured_at: snap.captured_at,
      age_minutes: Math.round(ageMs / 60000),
    });
  } catch (e) {
    return res.status(500).json({ online: false, error: e.message });
  }
}
