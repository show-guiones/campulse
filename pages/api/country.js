// pages/api/country.js — v3
// Ruta: pages/api/country.js
//
// FIX v3: agrega campo `gender` al select de modelos por código
// para que pages/country/[code].jsx pueda mostrar el género en la lista.

export const config = { runtime: "edge" };

const SITE = "https://www.campulsehub.com";
const DEFAULT_DAYS = 30;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const COUNTRY_NAMES = {
  // América
  CO: "Colombia", MX: "México", AR: "Argentina", CL: "Chile",
  PE: "Perú", VE: "Venezuela", EC: "Ecuador", BO: "Bolivia",
  UY: "Uruguay", PY: "Paraguay", CR: "Costa Rica", PA: "Panamá",
  DO: "República Dominicana", CU: "Cuba", GT: "Guatemala",
  HN: "Honduras", SV: "El Salvador", NI: "Nicaragua",
  US: "Estados Unidos", CA: "Canadá", BR: "Brasil", PR: "Puerto Rico",
  // Europa
  ES: "España", RO: "Rumania", RU: "Rusia", DE: "Alemania",
  FR: "Francia", GB: "Reino Unido", IT: "Italia", UA: "Ucrania",
  HU: "Hungría", PL: "Polonia", CZ: "República Checa", SE: "Suecia",
  NL: "Países Bajos", PT: "Portugal", GR: "Grecia", BE: "Bélgica",
  AT: "Austria", CH: "Suiza", NO: "Noruega", DK: "Dinamarca",
  FI: "Finlandia", SK: "Eslovaquia", RS: "Serbia", HR: "Croacia",
  BG: "Bulgaria", MD: "Moldavia", LT: "Lituania", LV: "Letonia",
  EE: "Estonia", SI: "Eslovenia", MK: "Macedonia del Norte", AL: "Albania",
  ME: "Montenegro", BA: "Bosnia", BY: "Bielorrusia", KZ: "Kazajistán",
  // Asia / Oceanía
  PH: "Filipinas", TH: "Tailandia", IN: "India", CN: "China",
  JP: "Japón", KR: "Corea del Sur", AU: "Australia", NZ: "Nueva Zelanda",
  ID: "Indonesia", MY: "Malasia", VN: "Vietnam", SG: "Singapur",
  TR: "Turquía", IL: "Israel", AE: "Emiratos Árabes Unidos",
  // África
  ZA: "Sudáfrica", NG: "Nigeria", KE: "Kenia", EG: "Egipto",
  MA: "Marruecos", GH: "Ghana", MG: "Madagascar", TZ: "Tanzania",
};

const GENDER_LABELS = { f: "Mujer", m: "Hombre", c: "Pareja", t: "Trans" };

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
  const code  = (searchParams.get("code") || "").toUpperCase().trim();
  const list  = searchParams.get("list") === "1";
  const days  = Math.min(parseInt(searchParams.get("days") || DEFAULT_DAYS), 90);
  const limit = Math.min(parseInt(searchParams.get("limit") || DEFAULT_LIMIT), MAX_LIMIT);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    // ── Listado de todos los países ────────────────────────────────────────
    if (list) {
      const url =
        `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
        `?captured_at=gte.${since}` +
        `&select=username,country` +
        `&limit=50000`;

      const r = await fetch(url, { headers: sbHeaders });
      const rows = await r.json();

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
          flag: `https://flagcdn.com/32x24/${code.toLowerCase()}.png`,
          models: usernames.size,
          slug: `/country/${code.toLowerCase()}`,
        }))
        .sort((a, b) => b.models - a.models);

      return new Response(JSON.stringify(countries), {
        headers: { ...headers, "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
      });
    }

    // ── Modelos de un país específico ──────────────────────────────────────
    if (!code || code.length !== 2) {
      return new Response(
        JSON.stringify({ error: "Parámetro 'code' requerido (ej: CO)" }),
        { status: 400, headers }
      );
    }

    // FIX: añadido `gender` al select para mostrar el género en la página
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&country=eq.${code}` +
      `&select=username,num_users,num_followers,display_name,gender` +
      `&limit=50000`;

    const r = await fetch(url, { headers: sbHeaders });
    const rows = await r.json();

    const map = {};
    for (const row of rows) {
      const u = row.username;
      if (!u) continue;
      if (!map[u]) {
        map[u] = {
          username: u,
          display_name: row.display_name || u,
          gender: row.gender || "",
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
      .filter((m) => m.snapshots >= 3)
      .map((m) => ({
        username: m.username,
        display_name: m.display_name,
        gender: m.gender,
        gender_label: GENDER_LABELS[m.gender] || null,
        avg_viewers: Math.round(m.total_viewers / m.snapshots),
        max_followers: m.max_followers,
        snapshots: m.snapshots,
        url: `${SITE}/model/${m.username}`,
      }))
      .sort((a, b) => b.avg_viewers - a.avg_viewers)
      .slice(0, limit);

    return new Response(
      JSON.stringify({
        code,
        name: COUNTRY_NAMES[code] || code,
        flag: `https://flagcdn.com/32x24/${code.toLowerCase()}.png`,
        models,
      }),
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
