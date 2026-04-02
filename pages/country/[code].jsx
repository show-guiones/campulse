// pages/country/[code].jsx
//
// Página de modelos por país.
// URL: /country/co  /country/es  /country/mx  etc.
//
// Rankea por: "modelos chaturbate Colombia", "chaturbate España en vivo", etc.

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

// Países soportados — genera estas páginas en build time (SSG)
// Agrega más códigos según los que aparezcan en tu DB
const SUPPORTED_COUNTRIES = [
  "co", "es", "mx", "ar", "cl", "pe", "ve", "ec",
  "us", "br", "ro", "ru", "de", "fr", "gb", "it",
  "ph", "th", "cz", "ua", "hu", "pl", "ca", "au",
  "nl", "se", "tr",
];

export async function getStaticPaths() {
  return {
    paths: SUPPORTED_COUNTRIES.map((code) => ({ params: { code } })),
    fallback: "blocking", // genera bajo demanda para países no listados
  };
}

export async function getStaticProps({ params }) {
  const code = params.code.toUpperCase();
  try {
    const r = await fetch(`${SITE}/api/country?code=${code}&limit=50`);
    if (!r.ok) return { notFound: true };
    const data = await r.json();
    if (!data.models || data.models.length === 0) return { notFound: true };
    return {
      props: { data },
      revalidate: 1800, // regenerar cada 30 minutos
    };
  } catch {
    return { notFound: true };
  }
}

export default function CountryPage({ data }) {
  const { code, name, models } = data;
  const topModel = models[0];

  const pageTitle = `Modelos de ${name} en Chaturbate — Top ${models.length} | Campulse`;
  const pageDescription =
    `Las mejores ${models.length} modelos de Chaturbate de ${name} ordenadas por viewers. ` +
    (topModel
      ? `${topModel.display_name} lidera con ${topModel.avg_viewers} viewers promedio. `
      : "") +
    `Estadísticas en tiempo real en Campulse.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/country/${code.toLowerCase()}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        { "@type": "ListItem", position: 2, name: "Países", item: `${SITE}/country` },
        { "@type": "ListItem", position: 3, name: name, item: `${SITE}/country/${code.toLowerCase()}` },
      ],
    },
    hasPart: models.slice(0, 10).map((m) => ({
      "@type": "WebPage",
      name: `${m.username} Stats — Campulse`,
      url: `${SITE}/model/${m.username}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/country/${code.toLowerCase()}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/country/${code.toLowerCase()}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main style={styles.main}>
        {/* Breadcrumb */}
        <nav style={styles.breadcrumbs}>
          <a href="/" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <a href="/country" style={styles.link}>Países</a>
          <span style={styles.sep}> › </span>
          <span>{name}</span>
        </nav>

        <h1 style={styles.h1}>
          <img
            src={`https://flagcdn.com/32x24/${code.toLowerCase()}.png`}
            alt={name}
            width={32}
            height={24}
            style={{ borderRadius: 3, verticalAlign: "middle", marginRight: 10 }}
          />
          Modelos de {name} en Chaturbate
        </h1>
        <p style={styles.subtitle}>
          Top {models.length} modelos ordenadas por viewers promedio en los últimos 30 días.
        </p>

        {/* Tabla de modelos */}
        <div style={styles.list}>
          {models.map((m, i) => (
            <a key={m.username} href={`/model/${m.username}`} style={styles.row}>
              <span style={styles.rank}>#{i + 1}</span>
              <div style={styles.info}>
                <div style={styles.username}>{m.display_name || m.username}</div>
                <div style={styles.handle}>@{m.username}</div>
              </div>
              <div style={styles.stats}>
                <div style={styles.statMain}>
                  {m.avg_viewers} <span style={styles.statLabel}>viewers</span>
                </div>
                {m.max_followers > 0 && (
                  <div style={styles.statSub}>
                    {m.max_followers.toLocaleString("es")} seguidores
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* SEO text — contenido textual para Google */}
        <section style={styles.seoText}>
          <h2 style={styles.h2}>Modelos de {name} en Chaturbate</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de las modelos de{" "}
            {name} en Chaturbate. Los datos se actualizan cada 2 horas con el
            número de viewers, seguidores y los mejores horarios para cada modelo.
          </p>
          {topModel && (
            <p>
              Actualmente, <strong>{topModel.display_name || topModel.username}</strong> es
              la modelo más vista de {name} con un promedio de{" "}
              <strong>{topModel.avg_viewers} viewers</strong> y{" "}
              {topModel.max_followers > 0
                ? `${topModel.max_followers.toLocaleString("es")} seguidores.`
                : "miles de seguidores."}
            </p>
          )}
          <p>
            <a href="/country" style={styles.link}>Ver modelos de otros países →</a>
          </p>
        </section>
      </main>
    </>
  );
}

function countryCodeToFlag(code) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65))
    .join("");
}

const styles = {
  main: {
    fontFamily: "sans-serif",
    maxWidth: 800,
    margin: "0 auto",
    padding: "2rem 1rem",
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#f0f0f0",
  },
  breadcrumbs: { fontSize: 13, color: "#888", marginBottom: 16 },
  link: { color: "#a78bfa", textDecoration: "none" },
  sep: { color: "#555", margin: "0 4px" },
  h1: { fontSize: 28, marginTop: 8, marginBottom: 8 },
  h2: { fontSize: 18, marginBottom: 12, color: "#ccc" },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 28 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "#1a1a2e",
    borderRadius: 10,
    padding: "14px 18px",
    textDecoration: "none",
    color: "#f0f0f0",
  },
  rank: { fontSize: 13, color: "#555", width: 28, flexShrink: 0 },
  info: { flex: 1 },
  username: { fontWeight: 700, fontSize: 15 },
  handle: { fontSize: 12, color: "#666", marginTop: 2 },
  stats: { textAlign: "right" },
  statMain: { fontWeight: 700, color: "#a78bfa", fontSize: 16 },
  statLabel: { fontSize: 11, color: "#888", fontWeight: 400 },
  statSub: { fontSize: 11, color: "#666", marginTop: 2 },
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
