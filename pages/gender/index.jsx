// pages/gender/index.jsx
// Ruta: pages/gender/index.jsx
//
// Página índice de géneros — SSR (getServerSideProps)
// Cambiado de getStaticProps a getServerSideProps para evitar páginas
// cacheadas con datos vacíos cuando la API aún no estaba lista.

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const GENDER_ICONS = {
  female: "♀",
  male:   "♂",
  couple: "♥",
  trans:  "⚧",
};

export async function getServerSideProps() {
  try {
    const r = await fetch(`${SITE}/api/gender?list=1`);
    const genders = r.ok ? await r.json() : [];
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
