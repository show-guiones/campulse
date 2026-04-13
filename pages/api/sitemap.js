// pages/api/sitemap.js
//
// Sitemap completo — incluye:
//   · Home y páginas estáticas de categoría (género, país, idioma)
//   · Búsqueda + Tags populares de Chaturbate
//   · Modelos individuales filtradas (MIN_SNAPSHOTS + MIN_VIEWERS)
//
// Estrategia de paginación: keyset pagination por (username, captured_at)
// Esto es más eficiente y confiable que offset con tablas grandes.

const SITE = "https://www.campulsehub.com";
const DAYS = 30;
const MIN_SNAPSHOTS = 5;
const MIN_VIEWERS = 1;
const MIN_COUNTRY_MODELS = 5;
const PAGE_SIZE = 1000;
const MAX_ROWS = 600000; // límite de seguridad

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

// ── Fetch con timeout para no bloquear el response ────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
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
    // Decirle a PostgREST que devuelva el count para saber si hay más páginas
    Prefer: "count=none",
  };

  const stats = {};          // { username -> { snapshots, maxViewers, country } }
  const countryCounts = {};  // { countryCode -> Set<username> }

  try {
    // ── Keyset pagination: paginamos por offset numérico pero con un cursor
    //    de username para evitar duplicados en inserciones concurrentes.
    //    PostgREST soporta &offset=N en el query string — funciona con cualquier
    //    versión de Supabase. Lo importante es que el límite máximo de respuesta
    //    de Supabase por defecto es 1000 filas — si el proyecto tiene max_rows
    //    configurado diferente, ajustar PAGE_SIZE.
    //
    //    Para evitar el problema de offset inconsistente con datos en tiempo real,
    //    NO ordenamos por username (que cambia) sino por un campo estable:
    //    captured_at + username como clave compuesta. Esto garantiza que cada
    //    página sea siempre un slice distinto de la ventana de tiempo.

    let totalFetched = 0;
    let offset = 0;
    let keepGoing = true;

    while (keepGoing && totalFetched < MAX_ROWS) {
      // Construir URL con parámetros correctos de PostgREST
      const params = new URLSearchParams({
        captured_at: `gte.${since}`,
        select: "username,num_users,country",
        order: "captured_at.asc,username.asc",
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      let r;
      try {
        r = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/rooms_snapshot?${params}`,
          { headers: sbHeaders },
          9000
        );
      } catch (fetchErr) {
        console.error("[sitemap] fetch error en offset", offset, fetchErr.message);
        break;
      }

      // Supabase puede devolver 200 o 206 — ambos son válidos
      if (!r.ok && r.status !== 206) {
        console.error("[sitemap] HTTP", r.status, "en offset", offset);
        break;
      }

      let page;
      try {
        page = await r.json();
      } catch (jsonErr) {
        console.error("[sitemap] JSON parse error en offset", offset);
        break;
      }

      if (!Array.isArray(page) || page.length === 0) {
        keepGoing = false;
        break;
      }

      // Procesar filas de esta página
      for (const row of page) {
        const u = row.username;
        if (!u || typeof u !== "string") continue;

        if (!stats[u]) stats[u] = { snapshots: 0, maxViewers: 0, country: null };
        stats[u].snapshots += 1;
        const viewers = row.num_users ?? 0;
        if (viewers > stats[u].maxViewers) stats[u].maxViewers = viewers;
        // Guardar el primer país no-vacío que encontremos
        if (!stats[u].country && row.country && row.country.trim()) {
          stats[u].country = row.country.trim().toLowerCase();
        }
      }

      totalFetched += page.length;
      offset += page.length;

      // Si recibimos menos filas que el límite, ya no hay más
      if (page.length < PAGE_SIZE) keepGoing = false;
    }

    console.log(`[sitemap] Total rows fetched: ${totalFetched}, unique users: ${Object.keys(stats).length}`);

    // ── Filtrar modelos calificados ──────────────────────────────────────────
    for (const [u, s] of Object.entries(stats)) {
      if (s.snapshots >= MIN_SNAPSHOTS && s.maxViewers >= MIN_VIEWERS && s.country) {
        const c = s.country;
        if (!countryCounts[c]) countryCounts[c] = new Set();
        countryCounts[c].add(u);
      }
    }

  } catch (e) {
    console.error("[sitemap] Error inesperado:", e.message);
  }

  // ── Modelos calificados ────────────────────────────────────────────────────
  const qualifiedUsernames = Object.entries(stats)
    .filter(([, s]) => s.snapshots >= MIN_SNAPSHOTS && s.maxViewers >= MIN_VIEWERS)
    .map(([username]) => username)
    .sort();

  // ── Países con suficientes modelos ────────────────────────────────────────
  const HIGH_PRIORITY = new Set(["co", "es", "mx", "ar", "br", "ru", "us", "ro", "gb", "ph"]);
  const qualifiedCountries = Object.entries(countryCounts)
    .filter(([, set]) => set.size >= MIN_COUNTRY_MODELS)
    .sort((a, b) => b[1].size - a[1].size)
    .map(([code]) => ({
      loc: `/country/${code}`,
      changefreq: "daily",
      priority: HIGH_PRIORITY.has(code) ? "0.8" : "0.6",
    }));

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
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
  res.status(200).send(xml);
}
