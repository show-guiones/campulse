// pages/api/sitemap.js
//
// Sitemap completo — incluye:
//   · Home y páginas estáticas de categoría (género, país, idioma)
//   · Búsqueda
//   · Tags populares de Chaturbate
//   · Modelos individuales filtradas (MIN_SNAPSHOTS + MIN_VIEWERS)
//
// Criterios de inclusión de modelos (configurable):
//   · MIN_SNAPSHOTS  — mínimo de snapshots en los últimos DAYS días
//   · MIN_VIEWERS    — al menos un snapshot con viewers >= este valor
//   · DAYS           — ventana de tiempo analizada

const SITE = "https://www.campulsehub.com";
const DAYS = 30;
const MIN_SNAPSHOTS = 5;
const MIN_VIEWERS = 1;

// ── Páginas estáticas de categoría ────────────────────────────────────────────
const STATIC_PAGES = [
  // Home
  { loc: "/",               changefreq: "hourly",  priority: "1.0" },

  // lexy_fox2 — máxima prioridad
  { loc: "/model/lexy_fox2", changefreq: "always", priority: "1.0" },

  // Top categorías especiales
  { loc: "/top/latinas",    changefreq: "hourly",  priority: "0.9" },

  // Búsqueda
  { loc: "/search",         changefreq: "daily",   priority: "0.8" },

  // Índices de categoría
  { loc: "/gender",         changefreq: "daily",   priority: "0.9" },
  { loc: "/country",        changefreq: "daily",   priority: "0.9" },
  { loc: "/language",       changefreq: "daily",   priority: "0.9" },

  // Géneros
  { loc: "/gender/female",  changefreq: "hourly",  priority: "0.8" },
  { loc: "/gender/male",    changefreq: "hourly",  priority: "0.8" },
  { loc: "/gender/couple",  changefreq: "hourly",  priority: "0.8" },
  { loc: "/gender/trans",   changefreq: "hourly",  priority: "0.8" },

  // Países — generados dinámicamente desde Supabase (ver abajo)

  // Idiomas
  { loc: "/language/spanish",    changefreq: "daily",  priority: "0.8" },
  { loc: "/language/english",    changefreq: "daily",  priority: "0.8" },
  { loc: "/language/portuguese", changefreq: "daily",  priority: "0.7" },
  { loc: "/language/romanian",   changefreq: "daily",  priority: "0.7" },
  { loc: "/language/russian",    changefreq: "daily",  priority: "0.7" },
  { loc: "/language/german",     changefreq: "daily",  priority: "0.6" },
  { loc: "/language/french",     changefreq: "daily",  priority: "0.6" },
  { loc: "/language/italian",    changefreq: "daily",  priority: "0.6" },

  // Tags populares
  { loc: "/tag/latina",      changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/bigboobs",    changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/ebony",       changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/teen",        changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/squirt",      changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/anal",        changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/curvy",       changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/mature",      changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/lovense",     changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/new",         changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/lesbians",    changefreq: "hourly", priority: "0.7" },
  { loc: "/tag/colombia",    changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/spanish",     changefreq: "hourly", priority: "0.8" },
  { loc: "/tag/pantyhose",   changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/feet",        changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/chubby",      changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/hairy",       changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/muscle",      changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/daddy",       changefreq: "hourly", priority: "0.6" },
  { loc: "/tag/bigcock",     changefreq: "hourly", priority: "0.6" },
];

// Mínimo de modelos por país para incluirlo en el sitemap
const MIN_COUNTRY_MODELS = 5;

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

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  let qualifiedUsernames = [];
  let qualifiedCountries = [];

  try {
    const countUrl =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&select=username,num_users,country` +
      `&order=username` +
      `&limit=50000`;

    const r = await fetch(countUrl, { headers: sbHeaders });
    if (!r.ok) throw new Error(`Supabase error: ${r.status}`);

    const rows = await r.json();

    const stats = {};
    const countryCounts = {};

    for (const row of rows) {
      const u = row.username;
      if (!u) continue;

      // Stats por modelo
      if (!stats[u]) stats[u] = { snapshots: 0, maxViewers: 0 };
      stats[u].snapshots += 1;
      if ((row.num_users ?? 0) > stats[u].maxViewers) {
        stats[u].maxViewers = row.num_users ?? 0;
      }

      // Conteo por país — solo modelos con suficientes snapshots
      if (row.country && stats[u].snapshots >= MIN_SNAPSHOTS) {
        const c = row.country.toLowerCase();
        if (!countryCounts[c]) countryCounts[c] = new Set();
        countryCounts[c].add(u);
      }
    }

    qualifiedUsernames = Object.entries(stats)
      .filter(([, s]) => s.snapshots >= MIN_SNAPSHOTS && s.maxViewers >= MIN_VIEWERS)
      .map(([username]) => username)
      .sort();

    // Países con suficientes modelos — prioridad según tamaño
    const HIGH_PRIORITY = new Set(["co","es","mx","ar","br","ru","us","ro","gb","ph"]);
    qualifiedCountries = Object.entries(countryCounts)
      .filter(([, set]) => set.size >= MIN_COUNTRY_MODELS)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([code]) => ({
        loc: `/country/${code}`,
        changefreq: "daily",
        priority: HIGH_PRIORITY.has(code) ? "0.8" : "0.6",
      }));

  } catch (e) {
    console.error("[sitemap] Error consultando Supabase:", e.message);
  }

  // ── Construir XML ──────────────────────────────────────────────────────────
  const staticSection = STATIC_PAGES.map(buildUrl).join("\n");
  const countrySection = qualifiedCountries.map(buildUrl).join("\n");

  const modelSection = qualifiedUsernames
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
    staticSection + "\n" +
    countrySection + "\n" +
    modelSection +
    `\n</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=UTF-8");
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
  res.status(200).send(xml);
}
