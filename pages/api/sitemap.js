// pages/api/sitemap.js
//
// Sitemap filtrado — solo incluye modelos con datos reales suficientes
// para que Google las considere dignas de indexar.
//
// Criterios de inclusión (configurable con las constantes de abajo):
//   · MIN_SNAPSHOTS  — mínimo de snapshots en los últimos DAYS días
//   · MIN_VIEWERS    — al menos un snapshot con viewers >= este valor
//   · DAYS           — ventana de tiempo analizada
//
// Resultado esperado: eliminar las ~38 páginas "Discovered – not indexed"
// que Google rechaza por contenido escaso o vacío.

const SITE = "https://www.campulsehub.com";
const DAYS = 30;           // ventana de tiempo
const MIN_SNAPSHOTS = 5;   // mínimo de capturas con la modelo online
const MIN_VIEWERS = 1;     // al menos 1 snapshot con viewers reales (descarta "--")

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.status(500).send("Servidor no configurado");
    return;
  }

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  let qualifiedUsernames = [];

  try {
    // ── Paso 1: contar snapshots por username en la ventana de tiempo ──────────
    // Supabase no tiene GROUP BY en REST, así que pedimos los campos necesarios
    // y agrupamos en memoria. Limitamos a 50.000 filas para cubrir holgadamente
    // los ~30 días con scraping cada 2 h (~360 ejecuciones × ~3.000 modelos).
    const countUrl =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&select=username,num_users` +
      `&order=username` +
      `&limit=50000`;

    const r = await fetch(countUrl, { headers: sbHeaders });
    if (!r.ok) throw new Error(`Supabase error: ${r.status}`);

    const rows = await r.json();

    // ── Paso 2: agrupar y filtrar en memoria ───────────────────────────────────
    const stats = {}; // { username: { snapshots: N, maxViewers: N } }

    for (const row of rows) {
      const u = row.username;
      if (!u) continue;
      if (!stats[u]) stats[u] = { snapshots: 0, maxViewers: 0 };
      stats[u].snapshots += 1;
      if ((row.num_users ?? 0) > stats[u].maxViewers) {
        stats[u].maxViewers = row.num_users ?? 0;
      }
    }

    qualifiedUsernames = Object.entries(stats)
      .filter(
        ([, s]) =>
          s.snapshots >= MIN_SNAPSHOTS && s.maxViewers >= MIN_VIEWERS
      )
      .map(([username]) => username)
      .sort(); // orden alfabético para estabilidad del sitemap

  } catch (e) {
    console.error("[sitemap] Error consultando Supabase:", e.message);
    // Devolvemos un sitemap mínimo válido en lugar de un 500
    // para no interrumpir el crawl de Google.
  }

  // ── Paso 3: construir XML ──────────────────────────────────────────────────
  const modelUrls = qualifiedUsernames
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${SITE}/model/${encodeURIComponent(u)}</loc>\n` +
        `    <changefreq>daily</changefreq>\n` +
        `    <priority>0.7</priority>\n` +
        `  </url>`
    )
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n` +
    `    <loc>${SITE}/</loc>\n` +
    `    <changefreq>hourly</changefreq>\n` +
    `    <priority>1.0</priority>\n` +
    `  </url>\n` +
    modelUrls +
    `\n</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=UTF-8");
  // Cache de 6 h en CDN, refresca en background cuando expira
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
  res.status(200).send(xml);
}
