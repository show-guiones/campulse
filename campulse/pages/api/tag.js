// pages/api/tag.js
// Devuelve modelos con un tag específico (últimas 2h)

export default async function handler(req, res) {
  const { tag, limit = 50 } = req.query;
  if (!tag) return res.status(400).json({ error: "tag requerido" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const url =
    `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
    `?captured_at=gte.${since}` +
    `&tags=cs.{"${tag}"}` +
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

  res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=3600");
  res.status(200).json(unique);
}
