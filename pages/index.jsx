// pages/language/index.jsx
// Ruta: pages/language/index.jsx
//
// Página índice de idiomas — ISR (revalidate 1h)
// URL: /language

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const LANG_ICONS = {
  spanish:    "🇪🇸",
  english:    "🇬🇧",
  portuguese: "🇧🇷",
  romanian:   "🇷🇴",
  russian:    "🇷🇺",
  german:     "🇩🇪",
  french:     "🇫🇷",
  italian:    "🇮🇹",
};

export async function getStaticProps() {
  try {
    const r = await fetch(`${SITE}/api/language?list=1`);
    const languages = r.ok ? await r.json() : [];
    return { props: { languages }, revalidate: 3600 };
  } catch {
    return { props: { languages: [] }, revalidate: 3600 };
  }
}

export default function LanguagesPage({ languages }) {
  const pageTitle = "Modelos de Chaturbate por Idioma | Campulse";
  const pageDescription =
    "Explora modelos de Chaturbate filtradas por idioma: español, inglés, portugués, rumano y más. " +
    "Ranking en tiempo real actualizado cada 2 horas.";

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/language`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        { "@type": "ListItem", position: 2, name: "Idiomas",  item: `${SITE}/language` },
      ],
    },
    hasPart: languages.slice(0, 8).map((l) => ({
      "@type": "WebPage",
      name: `Modelos Chaturbate ${l.name}`,
      url: `${SITE}/language/${l.slug}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/language`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/language`} />
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
          <span>Idiomas</span>
        </nav>

        <h1 style={styles.h1}>Modelos por Idioma</h1>
        <p style={styles.subtitle}>
          Encuentra modelos de Chaturbate que hablan tu idioma. Datos actualizados cada 2 horas.
        </p>

        <div style={styles.grid}>
          {languages.map((l) => (
            <a key={l.slug} href={`/language/${l.slug}`} style={styles.card}>
              <div style={styles.icon}>{LANG_ICONS[l.slug] || "🌐"}</div>
              <div style={styles.cardName}>{l.name}</div>
              <div style={styles.cardDesc}>{l.description}</div>
              <div style={styles.cardCount}>{l.models.toLocaleString("es")} modelos</div>
            </a>
          ))}
        </div>

        {languages.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Cargando datos...
          </p>
        )}

        <section style={styles.seoText}>
          <h2 style={styles.h2}>Modelos de Chaturbate por Idioma</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de las modelos de Chaturbate
            de todo el mundo y las organiza por idioma. Encuentra las mejores salas en vivo
            en español, inglés, portugués, rumano, ruso y más.
          </p>
          <p>
            Los datos se actualizan cada 2 horas con el número de viewers y seguidores de
            cada modelo en Chaturbate.
          </p>
          <p style={{ marginTop: 16 }}>
            <a href="/gender" style={styles.link}>Ver por género →</a>
            <span style={styles.sep}> · </span>
            <a href="/country" style={styles.link}>Ver por país →</a>
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
  icon: { fontSize: 40, marginBottom: 12 },
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
