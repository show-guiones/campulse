// pages/api/gender.js
// Ruta: pages/api/gender.js
//
// Devuelve modelos filtradas por género desde Supabase.
// ?gender=female|male|couple|trans  → top modelos de ese género
// ?list=1                           → conteo de modelos por género

export const config = { runtime: "edge" };

const SITE = "https://www.campulsehub.com";
const DEFAULT_DAYS = 30;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const GENDER_INFO = {
  female: {
    name: "Chicas",
    nameEs: "Mujeres",
    emoji: "♀️",
    description: "Las mejores modelos femeninas de Chaturbate",
    keywords: "chicas chaturbate, mujeres chaturbate en vivo, girls chaturbate",
  },
  male: {
    name: "Chicos",
    nameEs: "Hombres",
    emoji: "♂️",
    description: "Los mejores modelos masculinos de Chaturbate",
    keywords: "chicos chaturbate, hombres chaturbate en vivo, guys chaturbate",
  },
  couple: {
    name: "Parejas",
    nameEs: "Parejas",
    emoji: "👫",
    description: "Las mejores parejas de Chaturbate en vivo",
    keywords: "parejas chaturbate, couples chaturbate en vivo",
  },
  trans: {
    name: "Trans",
    nameEs: "Trans",
    emoji: "⚧️",
    description: "Las mejores modelos trans de Chaturbate",
    keywords: "trans chaturbate, shemale chaturbate en vivo",
  },
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
  const gender = (searchParams.get("gender") || "").toLowerCase().trim();
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
      const url =
        `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
        `?captured_at=gte.${since}` +
        `&select=username,gender` +
        `&limit=50000`;

      const r = await fetch(url, { headers: sbHeaders });
      const rows = await r.json();

      const map = {};
      for (const row of rows) {
        const g = (row.gender || "").toLowerCase().trim();
        if (!g || !GENDER_INFO[g]) continue;
        if (!map[g]) map[g] = new Set();
        map[g].add(row.username);
      }

      const genders = Object.entries(GENDER_INFO).map(([key, info]) => ({
        gender: key,
        name: info.name,
        nameEs: info.nameEs,
        emoji: info.emoji,
        models: map[key] ? map[key].size : 0,
        slug: `/gender/${key}`,
      })).filter(g => g.models > 0).sort((a, b) => b.models - a.models);

      return new Response(JSON.stringify(genders), {
        headers: { ...headers, "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
      });
    }

    if (!gender || !GENDER_INFO[gender]) {
      return new Response(
        JSON.stringify({ error: "Parámetro 'gender' requerido: female, male, couple, trans" }),
        { status: 400, headers }
      );
    }

    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&gender=eq.${gender}` +
      `&select=username,num_users,num_followers,display_name,country` +
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
          country: row.country || "",
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
        country: m.country,
        avg_viewers: Math.round(m.total_viewers / m.snapshots),
        max_followers: m.max_followers,
        url: `${SITE}/model/${m.username}`,
      }))
      .sort((a, b) => b.avg_viewers - a.avg_viewers)
      .slice(0, limit);

    const info = GENDER_INFO[gender];

    return new Response(
      JSON.stringify({ gender, ...info, models }),
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
