// pages/country/index.jsx
//
// Refactor: getStaticProps consulta Supabase directamente (sin fetch interno).
// Antes: getStaticProps → /api/country?list=1 → Supabase  (2 saltos de red)
// Ahora: getStaticProps → Supabase  (1 salto directo)
//
// El endpoint /api/country se conserva para uso desde el cliente.

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

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

// MIN_SNAPSHOTS alineado con sitemap.js (5) para consistencia
const MIN_SNAPSHOTS = 5;
const DAYS = 30;

export async function getStaticProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { props: { countries: [] }, revalidate: 3600 };
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
      `&select=username,country` +
      `&limit=50000`;

    const r = await fetch(url, { headers: sbHeaders });
    const rows = r.ok ? await r.json() : [];

    // Agrupar por país y contar modelos únicos con >= MIN_SNAPSHOTS
    const usernamesByCountry = {};
    const snapshotCount = {};

    for (const row of (Array.isArray(rows) ? rows : [])) {
      const c = (row.country || "").toUpperCase().trim();
      if (!c || c.length !== 2) continue;
      const key = `${c}:${row.username}`;
      snapshotCount[key] = (snapshotCount[key] || 0) + 1;
    }

    for (const [key, count] of Object.entries(snapshotCount)) {
      if (count < MIN_SNAPSHOTS) continue;
      const [c] = key.split(":");
      if (!usernamesByCountry[c]) usernamesByCountry[c] = 0;
      usernamesByCountry[c]++;
    }

    const countries = Object.entries(usernamesByCountry)
      .map(([code, modelCount]) => ({
        code,
        name: COUNTRY_NAMES[code] || code,
        flag: `https://flagcdn.com/32x24/${code.toLowerCase()}.png`,
        models: modelCount,
        slug: `/country/${code.toLowerCase()}`,
      }))
      .sort((a, b) => b.models - a.models);

    return { props: { countries }, revalidate: 3600 };
  } catch {
    return { props: { countries: [] }, revalidate: 3600 };
  }
}

export default function CountriesPage({ countries }) {
  const pageTitle = "Modelos de Chaturbate por País | Campulse";
  const pageDescription =
    `Explora modelos de Chaturbate organizadas por país. ` +
    `Encuentra las mejores salas en vivo de ${countries.slice(0, 4).map((c) => c.name).join(", ")} y más.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/country`,
    hasPart: countries.slice(0, 10).map((c) => ({
      "@type": "WebPage",
      name: `Modelos de ${c.name} en Chaturbate`,
      url: `${SITE}/country/${c.code.toLowerCase()}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/country`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/country`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main style={styles.main}>
        <a href="/" style={styles.breadcrumb}>Campulse</a>
        <h1 style={styles.h1}>Modelos por País</h1>
        <p style={styles.subtitle}>
          Descubre las mejores modelos de Chaturbate filtradas por país de origen.
        </p>

        <div style={styles.grid}>
          {countries.map((c) => (
            <a key={c.code} href={`/country/${c.code.toLowerCase()}`} style={styles.card}>
              <div style={styles.cardTop}>
                <img
                  src={`https://flagcdn.com/32x24/${c.code.toLowerCase()}.png`}
                  alt={`Bandera de ${c.name}`}
                  width={32}
                  height={24}
                  style={{ borderRadius: 3, display: "block" }}
                />
                <span style={styles.code}>{c.code}</span>
              </div>
              <div style={styles.cardName}>{c.name}</div>
              <div style={styles.cardCount}>
                {c.models.toLocaleString("es")} modelos
              </div>
            </a>
          ))}
        </div>

        {countries.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Cargando datos...
          </p>
        )}

        <section style={styles.seoText}>
          <h2 style={styles.h2}>Modelos de Chaturbate por País</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de las modelos de
            Chaturbate de todo el mundo. Filtra por país para encontrar las
            mejores salas en vivo de Colombia, España, México, Rumania y más.
          </p>
          <p>
            Los datos se actualizan cada 2 horas con el número de viewers,
            seguidores y los mejores horarios para cada modelo.
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
  breadcrumb: { color: "#a78bfa", fontSize: 14, textDecoration: "none" },
  h1: { fontSize: 32, marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 18, marginBottom: 12, color: "#ccc" },
  subtitle: { color: "#888", fontSize: 15, marginBottom: 32 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#1a1a2e",
    borderRadius: 12,
    padding: "20px 16px",
    textDecoration: "none",
    color: "#f0f0f0",
    display: "block",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  code: { fontSize: 11, color: "#555", fontWeight: 700 },
  cardName: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  cardCount: { fontSize: 12, color: "#a78bfa" },
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
