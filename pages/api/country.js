// pages/api/country.js
//
// Devuelve datos de modelos filtrados por país.
//
// GET /api/country?code=CO          → top modelos de Colombia
// GET /api/country?list=1           → lista de todos los países con conteo
//
// Parámetros opcionales:
//   limit   — cuántas modelos devolver (default 50, max 200)
//   days    — ventana de tiempo en días (default 30)

export const config = { runtime: "edge" };

const SITE = "https://www.campulsehub.com";
const DEFAULT_DAYS = 30;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Nombres legibles de países (ISO 3166-1 alpha-2)
// Agrega más según los países que aparezcan en tu DB
const COUNTRY_NAMES = {
  CO: "Colombia", ES: "España", MX: "México", AR: "Argentina",
  CL: "Chile", PE: "Perú", VE: "Venezuela", EC: "Ecuador",
  US: "Estados Unidos", BR: "Brasil", RO: "Rumania", RU: "Rusia",
  DE: "Alemania", FR: "Francia", GB: "Reino Unido", IT: "Italia",
  PH: "Filipinas", TH: "Tailandia", CZ: "República Checa",
  UA: "Ucrania", HU: "Hungría", PL: "Polonia", CA: "Canadá",
  AU: "Australia", NL: "Países Bajos", SE: "Suecia", TR: "Turquía",
};

export default async function handler(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: "Servidor no configurado" }), {
      status: 500, headers,
    });
  }

  const { searchParams } = new URL(req.url);
  const code   = (searchParams.get("code") || "").toUpperCase().trim();
  const list   = searchParams.get("list") === "1";
  const days   = Math.min(parseInt(searchParams.get("days") || DEFAULT_DAYS), 90);
  const limit  = Math.min(parseInt(searchParams.get("limit") || DEFAULT_LIMIT), MAX_LIMIT);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    if (list) {
      // ── Modo lista: devuelve todos los países con su conteo de modelos únicas
      const url =
        `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
        `?captured_at=gte.${since}` +
        `&select=username,country` +
        `&limit=50000`;

      const r = await fetch(url, { headers: sbHeaders });
      const rows = await r.json();

      // Agrupar por país contando modelos únicas
      const map = {};
      for (const row of rows) {
        const c = (row.country || "").toUpperCase().trim();
        if (!c || c.length !== 2) continue;
        if (!map[c]) map[c] = new Set();
        map[c].add(row.username);
      }

      const countries = Object.entries(map)
        .map(([code, usernames]) => ({
          code,
          name: COUNTRY_NAMES[code] || code,
          models: usernames.size,
          slug: `/country/${code.toLowerCase()}`,
        }))
        .sort((a, b) => b.models - a.models);

      return new Response(JSON.stringify(countries), {
        headers: { ...headers, "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
      });
    }

    if (!code || code.length !== 2) {
      return new Response(
        JSON.stringify({ error: "Parámetro 'code' requerido (ISO 3166-1 alpha-2, ej: CO)" }),
        { status: 400, headers }
      );
    }

    // ── Modo país: devuelve top modelos del país ordenadas por viewers promedio
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&country=eq.${code}` +
      `&select=username,num_users,num_followers,display_name` +
      `&limit=50000`;

    const r = await fetch(url, { headers: sbHeaders });
    const rows = await r.json();

    // Agrupar por username: calcular avg_viewers y max_followers
    const map = {};
    for (const row of rows) {
      const u = row.username;
      if (!u) continue;
      if (!map[u]) {
        map[u] = {
          username: u,
          display_name: row.display_name || u,
          total_viewers: 0,
          snapshots: 0,
          max_followers: 0,
        };
      }
      map[u].total_viewers += row.num_users ?? 0;
      map[u].snapshots += 1;
      if ((row.num_followers ?? 0) > map[u].max_followers) {
        map[u].max_followers = row.num_followers ?? 0;
      }
    }

    const models = Object.values(map)
      .filter((m) => m.snapshots >= 3) // mínimo de datos para ser relevante
      .map((m) => ({
        username: m.username,
        display_name: m.display_name,
        avg_viewers: Math.round(m.total_viewers / m.snapshots),
        max_followers: m.max_followers,
        snapshots: m.snapshots,
        url: `${SITE}/model/${m.username}`,
      }))
      .sort((a, b) => b.avg_viewers - a.avg_viewers)
      .slice(0, limit);

    const countryName = COUNTRY_NAMES[code] || code;

    return new Response(
      JSON.stringify({ code, name: countryName, models }),
      {
        headers: {
          ...headers,
          "Cache-Control": "s-maxage=1800, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers,
    });
  }
}
