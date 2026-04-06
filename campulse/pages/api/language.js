// pages/api/language.js
// Devuelve modelos filtradas por idioma desde Supabase.
// ?lang=spanish|english|portuguese|...  → top modelos de ese idioma
// ?list=1                               → conteo de modelos por idioma

export const config = { runtime: "edge" };

const SITE = "https://www.campulsehub.com";
const DEFAULT_DAYS = 30;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Idiomas soportados con sus variantes de escritura en la BD
const LANGUAGE_INFO = {
  spanish: {
    name: "Español",
    slug: "spanish",
    variants: ["spanish", "español", "espanol", "es"],
    description: "Las mejores modelos hispanohablantes de Chaturbate",
    keywords: "modelos chaturbate español, chaturbate hispanohablantes",
  },
  english: {
    name: "English",
    slug: "english",
    variants: ["english", "inglés", "ingles", "en"],
    description: "Top English-speaking Chaturbate models",
    keywords: "chaturbate english models, english speaking chaturbate",
  },
  portuguese: {
    name: "Português",
    slug: "portuguese",
    variants: ["portuguese", "portugués", "portugues", "pt"],
    description: "As melhores modelos de Chaturbate em português",
    keywords: "modelos chaturbate portugués, chaturbate brasil",
  },
  romanian: {
    name: "Română",
    slug: "romanian",
    variants: ["romanian", "rumano", "română", "ro"],
    description: "Cele mai bune modele Chaturbate vorbitoare de română",
    keywords: "chaturbate romanian models, modelos rumania chaturbate",
  },
  russian: {
    name: "Русский",
    slug: "russian",
    variants: ["russian", "ruso", "русский", "ru"],
    description: "Лучшие русскоязычные модели Chaturbate",
    keywords: "chaturbate russian models, modelos chaturbate ruso",
  },
  german: {
    name: "Deutsch",
    slug: "german",
    variants: ["german", "alemán", "alemán", "deutsch", "de"],
    description: "Die besten deutschsprachigen Chaturbate-Models",
    keywords: "chaturbate german models, deutsche chaturbate models",
  },
  french: {
    name: "Français",
    slug: "french",
    variants: ["french", "francés", "frances", "français", "fr"],
    description: "Les meilleures modèles Chaturbate francophones",
    keywords: "chaturbate french models, modeles chaturbate francais",
  },
  italian: {
    name: "Italiano",
    slug: "italian",
    variants: ["italian", "italiano", "it"],
    description: "Le migliori modelle Chaturbate italiane",
    keywords: "chaturbate italian models, modelle chaturbate italiano",
  },
};

// Normaliza el campo spoken_languages de la BD para encontrar coincidencias
function detectLanguage(raw) {
  if (!raw) return null;
  const val = raw.toLowerCase().trim();
  for (const [slug, info] of Object.entries(LANGUAGE_INFO)) {
    for (const variant of info.variants) {
      if (val.includes(variant)) return slug;
    }
  }
  return null;
}

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
  const lang  = (searchParams.get("lang") || "").toLowerCase().trim();
  const list  = searchParams.get("list") === "1";
  const days  = Math.min(parseInt(searchParams.get("days") || DEFAULT_DAYS), 90);
  const limit = Math.min(parseInt(searchParams.get("limit") || DEFAULT_LIMIT), MAX_LIMIT);

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
        `&select=username,spoken_languages` +
        `&limit=50000`;

      const r = await fetch(url, { headers: sbHeaders });
      const rows = await r.json();

      const map = {};
      for (const row of rows) {
        const detected = detectLanguage(row.spoken_languages);
        if (!detected) continue;
        if (!map[detected]) map[detected] = new Set();
        map[detected].add(row.username);
      }

      const languages = Object.entries(LANGUAGE_INFO)
        .map(([slug, info]) => ({
          slug,
          name: info.name,
          description: info.description,
          models: map[slug] ? map[slug].size : 0,
          url: `/language/${slug}`,
        }))
        .filter((l) => l.models > 0)
        .sort((a, b) => b.models - a.models);

      return new Response(JSON.stringify(languages), {
        headers: { ...headers, "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
      });
    }

    // Validar slug
    if (!lang || !LANGUAGE_INFO[lang]) {
      return new Response(
        JSON.stringify({ error: `Parámetro 'lang' requerido: ${Object.keys(LANGUAGE_INFO).join(", ")}` }),
        { status: 400, headers }
      );
    }

    const info = LANGUAGE_INFO[lang];

    // Trae snapshots recientes con spoken_languages
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&spoken_languages=not.is.null` +
      `&select=username,num_users,num_followers,display_name,country,spoken_languages` +
      `&limit=50000`;

    const r = await fetch(url, { headers: sbHeaders });
    const rows = await r.json();

    const map = {};
    for (const row of rows) {
      const detected = detectLanguage(row.spoken_languages);
      if (detected !== lang) continue;
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

    return new Response(
      JSON.stringify({ lang, ...info, models }),
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
