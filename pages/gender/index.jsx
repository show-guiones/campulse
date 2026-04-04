// pages/gender/index.jsx
//
// Refactor: getServerSideProps consulta Supabase directamente (sin fetch interno).
// Antes: SSR → /api/gender?list=1 → Supabase  (2 saltos de red)
// Ahora: SSR → Supabase  (1 salto directo)
//
// El endpoint /api/gender se conserva para uso desde el cliente.

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

// Mapa inverso: valor BD (CHAR 1) → slug URL
const DB_TO_SLUG = { f: "female", m: "male", c: "couple", t: "trans" };

const GENDER_INFO = {
  female: {
    name: "Chicas",
    nameEs: "Mujeres",
    emoji: "♀️",
    description: "Las mejores modelos femeninas de Chaturbate",
    icon: "♀",
  },
  male: {
    name: "Chicos",
    nameEs: "Hombres",
    emoji: "♂️",
    description: "Los mejores modelos masculinos de Chaturbate",
    icon: "♂",
  },
  couple: {
    name: "Parejas",
    nameEs: "Parejas",
    emoji: "👫",
    description: "Las mejores parejas de Chaturbate en vivo",
    icon: "♥",
  },
  trans: {
    name: "Trans",
    nameEs: "Trans",
    emoji: "⚧️",
    description: "Las mejores modelos trans de Chaturbate",
    icon: "⚧",
  },
};

const DAYS = 30;

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { props: { genders: [] } };
  }

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&select=username,gender` +
      `&limit=50000`;

    const r = await fetch(url, { headers: sbHeaders });
    const rows = r.ok ? await r.json() : [];

    // Agrupa por slug URL (convirtiendo CHAR 1 → slug)
    const map = {};
    for (const row of (Array.isArray(rows) ? rows : [])) {
      const dbVal = (row.gender || "").toLowerCase().trim();
      const slug = DB_TO_SLUG[dbVal];
      if (!slug || !GENDER_INFO[slug]) continue;
      if (!map[slug]) map[slug] = new Set();
      map[slug].add(row.username);
    }

    const genders = Object.entries(GENDER_INFO)
      .map(([key, info]) => ({
        gender: key,
        name: info.name,
        nameEs: info.nameEs,
        emoji: info.emoji,
        description: info.description,
        models: map[key] ? map[key].size : 0,
        slug: `/gender/${key}`,
      }))
      .filter((g) => g.models > 0)
      .sort((a, b) => b.models - a.models);

    return { props: { genders } };
  } catch {
    return { props: { genders: [] } };
  }
}

export default function GenderPage({ genders }) {
  const pageTitle = "Modelos de Chaturbate por Género | Campulse";
  const pageDescription =
    "Explora modelos de Chaturbate por género: chicas, chicos, parejas y trans. " +
    "Ranking en tiempo real ordenado por viewers. Estadísticas actualizadas cada 2 horas.";

  const GENDER_ICONS = {
    female: "♀",
    male:   "♂",
    couple: "♥",
    trans:  "⚧",
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/gender`,
    hasPart: genders.map((g) => ({
      "@type": "WebPage",
      name: `${g.name} en Chaturbate`,
      url: `${SITE}/gender/${g.gender}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/gender`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/gender`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main style={styles.main}>
        <nav style={styles.breadcrumbs}>
          <a href="/" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <span>Géneros</span>
        </nav>

        <h1 style={styles.h1}>Modelos por Género</h1>
        <p style={styles.subtitle}>
          Descubre las mejores modelos de Chaturbate filtradas por género.
        </p>

        <div style={styles.grid}>
          {genders.map((g) => (
            <a key={g.gender} href={`/gender/${g.gender}`} style={styles.card}>
              <div style={styles.icon}>{GENDER_ICONS[g.gender] || "★"}</div>
              <div style={styles.cardName}>{g.name}</div>
              <div style={styles.cardDesc}>{g.description}</div>
              <div style={styles.cardCount}>
                {g.models.toLocaleString("es")} modelos
              </div>
            </a>
          ))}
        </div>

        {genders.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            No hay datos disponibles en este momento.
          </p>
        )}

        <section style={styles.seoText}>
          <h2 style={styles.h2}>Modelos de Chaturbate por Género</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de todas las
            categorías de modelos de Chaturbate. Filtra por género para encontrar
            las mejores salas en vivo de chicas, chicos, parejas y modelos trans.
          </p>
          <p>
            Los datos se actualizan cada 2 horas con el número de viewers y
            seguidores de cada modelo.
          </p>
          <p>
            <a href="/country" style={styles.link}>Ver modelos por país →</a>
          </p>
        </section>
      </main>
    </>
  );
}

const styles = {
  main: {
    fontFamily: "sans-serif",
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem 1rem",
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#f0f0f0",
  },
  breadcrumbs: { fontSize: 13, color: "#888", marginBottom: 16 },
  link: { color: "#a78bfa", textDecoration: "none" },
  sep: { color: "#555", margin: "0 4px" },
  h1: { fontSize: 32, marginTop: 8, marginBottom: 8 },
  h2: { fontSize: 18, marginBottom: 12, color: "#ccc" },
  subtitle: { color: "#888", fontSize: 15, marginBottom: 32 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#1a1a2e",
    borderRadius: 14,
    padding: "28px 20px",
    textDecoration: "none",
    color: "#f0f0f0",
    display: "block",
    textAlign: "center",
  },
  icon: { fontSize: 40, marginBottom: 12, color: "#a78bfa" },
  cardName: { fontWeight: 700, fontSize: 18, marginBottom: 8 },
  cardDesc: { fontSize: 12, color: "#777", marginBottom: 12, lineHeight: 1.5 },
  cardCount: { fontSize: 13, color: "#a78bfa", fontWeight: 600 },
  seoText: {
    marginTop: 48,
    padding: "24px",
    background: "#111",
    borderRadius: 12,
    color: "#aaa",
    fontSize: 14,
    lineHeight: 1.7,
  },
};
