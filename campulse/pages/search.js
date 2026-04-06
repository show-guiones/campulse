// pages/api/search.js
// Busca modelos por username (últimos 30 días)

export default async function handler(req, res) {
  const { q, limit = 20 } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Query muy corta" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const url =
    `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
    `?captured_at=gte.${since}` +
    `&username=ilike.*${encodeURIComponent(q.trim())}*` +
    `&select=username,display_name,num_users,country,gender` +
    `&order=num_users.desc` +
    `&limit=${limit}`;

  const r = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await r.json();

  // Deduplicar por username
  const seen = new Set();
  const unique = (Array.isArray(data) ? data : []).filter((row) => {
    if (seen.has(row.username)) return false;
    seen.add(row.username);
    return true;
  });

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(unique);
}
