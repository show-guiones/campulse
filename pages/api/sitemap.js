// pages/api/sitemap.js
//
// Sitemap completo — usa la función SQL sitemap_qualified_models() en Supabase
// para obtener los modelos calificados en UNA SOLA QUERY (sin paginación).
// Esto evita el timeout de Vercel serverless (límite 10s en plan Hobby).
//
// PREREQUISITO: ejecutar supabase_sitemap_function.sql en Supabase SQL Editor.

const SITE = "https://www.campulsehub.com";
const MIN_COUNTRY_MODELS = 5;

// ── Páginas estáticas ─────────────────────────────────────────────────────────
const STATIC_PAGES = [
  { loc: "/",                  changefreq: "hourly", priority: "1.0" },
  { loc: "/model/lexy_fox2",   changefreq: "always", priority: "1.0" },
  { loc: "/top/latinas",       changefreq: "hourly", priority: "0.9" },
  { loc: "/top/colombia",      changefreq: "hourly", priority: "0.9" },
  { loc: "/top/mexico",        changefreq: "hourly", priority: "0.9" },
  { loc: "/top/espana",        changefreq: "hourly", priority: "0.9" },
  { loc: "/search",            changefreq: "daily",  priority: "0.8" },
  { loc: "/gender",            changefreq: "daily",  priority: "0.9" },
  { loc: "/country",           changefreq: "daily",  priority: "0.9" },
  { loc: "/language",          changefreq: "daily",  priority: "0.9" },
  { loc: "/gender/female",     changefreq: "hourly", priority: "0.8" },
  { loc: "/gender/male",       changefreq: "hourly", priority: "0.8" },
  { loc: "/gender/couple",     changefreq: "hourly", priority: "0.8" },
  { loc: "/gender/trans",      changefreq: "hourly", priority: "0.8" },
  { loc: "/language/spanish",    changefreq: "daily", priority: "0.8" },
  { loc: "/language/english",    changefreq: "daily", priority: "0.8" },
  { loc: "/language/portuguese", changefreq: "daily", priority: "0.7" },
  { loc: "/language/romanian",   changefreq: "daily", priority: "0.7" },
  { loc: "/language/russian",    changefreq: "daily", priority: "0.7" },
  { loc: "/language/german",     changefreq: "daily", priority: "0.6" },
  { loc: "/language/french",     changefreq: "daily", priority: "0.6" },
  { loc: "/language/italian",    changefreq: "daily", priority: "0.6" },
  { loc: "/tag/latina",      changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/bigboobs",    changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/ebony",       changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/teen",        changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/colombia",    changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/spanish",     changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/squirt",      changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/anal",        changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/curvy",       changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/mature",      changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/lovense",     changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/new",         changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/lesbians",    changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/pantyhose",   changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/feet",        changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/chubby",      changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/hairy",       changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/muscle",      changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/daddy",       changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/bigcock",     changefreq: "hourly", priority: "0.6" },
];

function buildUrl({ loc, changefreq, priority }) {
  return (
    `  <url>\n` +
    `    <loc>${SITE}${loc}</loc>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    `  </url>`
  );
}

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.status(500).send("Servidor no configurado");
    return;
  }

  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  let qualifiedUsernames = [];
  let qualifiedCountries = [];

  try {
    // ── Una sola llamada RPC — Supabase hace la agregación en SQL ─────────────
    // La función sitemap_qualified_models() agrupa por username en la BD,
    // devuelve solo los que cumplen min_snaps y min_viewers, en <1 segundo.
    const rpcRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/sitemap_qualified_models`,
      {
        method: "POST",
        headers: sbHeaders,
        body: JSON.stringify({
          since_days:  30,
          min_snaps:    1,
          min_viewers:  1,
        }),
      }
    );

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      console.error("[sitemap] RPC error:", rpcRes.status, errText);
      // Fallback graceful: devuelve solo páginas estáticas
    } else {
      const rows = await rpcRes.json();
      console.log(`[sitemap] RPC devolvió ${rows.length} modelos calificados`);

      // Agrupar por país para las páginas /country/
      const countryCounts = {};
      for (const row of rows) {
        if (row.username) qualifiedUsernames.push(row.username);
        if (row.country && row.country.trim()) {
          const c = row.country.trim().toLowerCase();
          countryCounts[c] = (countryCounts[c] || 0) + 1;
        }
      }

      // Países con suficientes modelos
      const HIGH_PRIORITY = new Set(["co","es","mx","ar","br","ru","us","ro","gb","ph"]);
      qualifiedCountries = Object.entries(countryCounts)
        .filter(([, count]) => count >= MIN_COUNTRY_MODELS)
        .sort((a, b) => b[1] - a[1])
        .map(([code]) => ({
          loc: `/country/${code}`,
          changefreq: "daily",
          priority: HIGH_PRIORITY.has(code) ? "0.8" : "0.6",
        }));
    }

  } catch (e) {
    console.error("[sitemap] Error:", e.message);
  }

  // ── Construir XML ──────────────────────────────────────────────────────────
  const staticSection  = STATIC_PAGES.map(buildUrl).join("\n");
  const countrySection = qualifiedCountries.map(buildUrl).join("\n");
  const modelSection   = qualifiedUsernames
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${SITE}/model/${encodeURIComponent(u)}</loc>\n` +
        `    <changefreq>daily</changefreq>\n` +
        `    <priority>0.7</priority>\n` +
        `  </url>`
    )
    .join("\n");

  const parts = [staticSection];
  if (countrySection) parts.push(countrySection);
  if (modelSection)   parts.push(modelSection);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    parts.join("\n") +
    `\n</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=UTF-8");
  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=3600");
  res.status(200).send(xml);
}
