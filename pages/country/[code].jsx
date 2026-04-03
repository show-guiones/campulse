// pages/country/[code].jsx
// SEO mejorado: título con viewers del top modelo, keywords por país,
// descripción menciona modelo #1 y #2, og:image con bandera

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const SUPPORTED_COUNTRIES = [
  "co", "es", "mx", "ar", "cl", "pe", "ve", "ec",
  "us", "br", "ro", "ru", "de", "fr", "gb", "it",
  "ph", "th", "cz", "ua", "hu", "pl", "ca", "au",
  "nl", "se", "tr", "za", "in", "kz", "rs", "sk",
  "mg", "ke", "pt", "gr", "be", "at", "ch", "no",
  "dk", "fi", "bg", "md", "lt", "lv", "ee", "si",
];

const COUNTRY_NAMES = {
  CO: "Colombia", MX: "México", AR: "Argentina", CL: "Chile",
  PE: "Perú", VE: "Venezuela", EC: "Ecuador", BO: "Bolivia",
  US: "Estados Unidos", CA: "Canadá", BR: "Brasil",
  ES: "España", RO: "Rumania", RU: "Rusia", DE: "Alemania",
  FR: "Francia", GB: "Reino Unido", IT: "Italia", UA: "Ucrania",
  HU: "Hungría", PL: "Polonia", CZ: "República Checa", SE: "Suecia",
  NL: "Países Bajos", PT: "Portugal", GR: "Grecia", BE: "Bélgica",
  AT: "Austria", CH: "Suiza", NO: "Noruega", DK: "Dinamarca",
  FI: "Finlandia", SK: "Eslovaquia", RS: "Serbia", BG: "Bulgaria",
  MD: "Moldavia", LT: "Lituania", LV: "Letonia", EE: "Estonia",
  SI: "Eslovenia", KZ: "Kazajistán",
  PH: "Filipinas", TH: "Tailandia", IN: "India", AU: "Australia",
  TR: "Turquía", ZA: "Sudáfrica", NG: "Nigeria", KE: "Kenia",
  MG: "Madagascar",
};

// Gentilicios para descripciones más naturales
const COUNTRY_DEMONYM = {
  CO: "colombianas", MX: "mexicanas", AR: "argentinas", CL: "chilenas",
  ES: "españolas", BR: "brasileñas", RO: "rumanas", RU: "rusas",
  DE: "alemanas", FR: "francesas", GB: "británicas", IT: "italianas",
  UA: "ucranianas", PH: "filipinas", US: "estadounidenses", CA: "canadienses",
  PE: "peruanas", VE: "venezolanas", EC: "ecuatorianas",
};

const GENDER_LABELS = { f: "Mujer", m: "Hombre", c: "Pareja", t: "Trans" };
const GENDER_COLORS = { f: "#f472b6", m: "#60a5fa", c: "#34d399", t: "#a78bfa" };

const DAYS = 30;
const MIN_SNAPSHOTS = 3;
const LIMIT = 50;

export async function getServerSideProps({ params }) {
  const code = (params.code || "").toLowerCase();
  if (!SUPPORTED_COUNTRIES.includes(code)) return { notFound: true };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return { notFound: true };

  const codeUC = code.toUpperCase();
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&country=eq.${codeUC}` +
      `&select=username,num_users,num_followers,display_name,gender` +
      `&limit=50000`;

    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!r.ok) return { notFound: true };
    const rows = await r.json();
    if (!Array.isArray(rows)) return { notFound: true };

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
      .filter((m) => m.snapshots >= MIN_SNAPSHOTS)
      .map((m) => ({
        username: m.username,
        display_name: m.display_name,
        gender: m.gender,
        avg_viewers: Math.round(m.total_viewers / m.snapshots),
        max_followers: m.max_followers,
        snapshots: m.snapshots,
      }))
      .sort((a, b) => b.avg_viewers - a.avg_viewers)
      .slice(0, LIMIT);

    if (models.length === 0) return { notFound: true };

    const name = COUNTRY_NAMES[codeUC] || codeUC;
    return { props: { code, codeUC, name, models } };
  } catch {
    return { notFound: true };
  }
}

export default function CountryPage({ code, codeUC, name, models }) {
  const top = models[0];
  const second = models[1];
  const demonym = COUNTRY_DEMONYM[codeUC] || `de ${name}`;

  // Título: menciona viewers reales del top modelo
  const pageTitle = top
    ? `Top Modelos ${name} en Chaturbate — ${top.display_name} con ${top.avg_viewers.toLocaleString("es")} viewers | Campulse`
    : `Modelos de ${name} en Chaturbate — Top ${models.length} | Campulse`;

  // Descripción: top 2 modelos + total + gentilicio
  const pageDescription =
    `Las ${models.length} mejores modelos ${demonym} de Chaturbate, ordenadas por viewers promedio. ` +
    (top ? `${top.display_name} lidera con ${top.avg_viewers.toLocaleString("es")} viewers` : "") +
    (second ? `, seguida de ${second.display_name} con ${second.avg_viewers.toLocaleString("es")}. ` : ". ") +
    `Estadísticas actualizadas cada 2 horas en Campulse.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/country/${code}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        { "@type": "ListItem", position: 2, name: "Países", item: `${SITE}/country` },
        { "@type": "ListItem", position: 3, name, item: `${SITE}/country/${code}` },
      ],
    },
    hasPart: models.slice(0, 10).map((m) => ({
      "@type": "WebPage",
      name: `${m.display_name || m.username} Stats — Campulse`,
      url: `${SITE}/model/${m.username}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/country/${code}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/country/${code}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <meta property="og:image" content={`https://flagcdn.com/160x120/${code}.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main style={styles.main}>
        <nav style={styles.breadcrumbs}>
          <a href="/" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <a href="/country" style={styles.link}>Países</a>
          <span style={styles.sep}> › </span>
          <span>{name}</span>
        </nav>

        <h1 style={styles.h1}>
          <img
            src={`https://flagcdn.com/32x24/${code}.png`}
            alt={`Bandera de ${name}`}
            width={32}
            height={24}
            style={{ borderRadius: 3, verticalAlign: "middle", marginRight: 10 }}
          />
          Modelos de {name} en Chaturbate
        </h1>
        <p style={styles.subtitle}>
          Top {models.length} modelos ordenadas por viewers promedio en los últimos 30 días.
        </p>

        <div style={styles.list}>
          {models.map((m, i) => (
            <a key={m.username} href={`/model/${m.username}`} style={styles.row}>
              <span style={styles.rank}>#{i + 1}</span>
              <div style={styles.info}>
                <div style={styles.username}>{m.display_name || m.username}</div>
                <div style={styles.handle}>
                  @{m.username}
                  {m.gender && GENDER_LABELS[m.gender] && (
                    <span style={{ ...styles.genderBadge, color: GENDER_COLORS[m.gender] || "#888" }}>
                      · {GENDER_LABELS[m.gender]}
                    </span>
                  )}
                </div>
              </div>
              <div style={styles.stats}>
                <div style={styles.statMain}>
                  {m.avg_viewers.toLocaleString("es")} <span style={styles.statLabel}>viewers</span>
                </div>
                {m.max_followers > 0 && (
                  <div style={styles.statSub}>
                    {m.max_followers.toLocaleString("es")} seg.
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>

        <section style={styles.seoText}>
          <h2 style={styles.h2}>Modelos {demonym} en Chaturbate</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de las modelos {demonym}{" "}
            en Chaturbate. Los datos se actualizan cada 2 horas con el
            número de viewers, seguidores y los mejores horarios para cada modelo.
          </p>
          {top && (
            <p>
              Actualmente, <strong>{top.display_name || top.username}</strong> es
              la modelo más vista de {name} con un promedio de{" "}
              <strong>{top.avg_viewers.toLocaleString("es")} viewers</strong>
              {top.max_followers > 0
                ? ` y ${top.max_followers.toLocaleString("es")} seguidores.`
                : "."}
            </p>
          )}
          <p style={{ marginTop: 16 }}>
            <a href="/country" style={styles.link}>← Ver modelos de otros países</a>
            <span style={styles.sep}> · </span>
            <a href="/gender" style={styles.link}>Ver por género →</a>
          </p>
        </section>
      </main>
    </>
  );
}

const styles = {
  main: { fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", padding: "2rem 1rem", background: "#0d0d0d", minHeight: "100vh", color: "#f0f0f0" },
  breadcrumbs: { fontSize: 13, color: "#888", marginBottom: 16 },
  link: { color: "#a78bfa", textDecoration: "none" },
  sep: { color: "#555", margin: "0 4px" },
  h1: { fontSize: 28, marginTop: 8, marginBottom: 8 },
  h2: { fontSize: 18, marginBottom: 12, color: "#ccc" },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 28 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", alignItems: "center", gap: 16, background: "#1a1a2e", borderRadius: 10, padding: "14px 18px", textDecoration: "none", color: "#f0f0f0" },
  rank: { fontSize: 13, color: "#555", width: 28, flexShrink: 0 },
  info: { flex: 1 },
  username: { fontWeight: 700, fontSize: 15 },
  handle: { fontSize: 12, color: "#666", marginTop: 2 },
  genderBadge: { marginLeft: 4, fontWeight: 600 },
  stats: { textAlign: "right" },
  statMain: { fontWeight: 700, color: "#a78bfa", fontSize: 16 },
  statLabel: { fontSize: 11, color: "#888", fontWeight: 400 },
  statSub: { fontSize: 11, color: "#666", marginTop: 2 },
  seoText: { marginTop: 48, padding: "24px", background: "#111", borderRadius: 12, color: "#aaa", fontSize: 14, lineHeight: 1.7 },
};
