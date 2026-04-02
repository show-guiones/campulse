// pages/language/index.js
// Índice de idiomas disponibles en Campulse
// URL: /language

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const LANGUAGES = [
  { slug: "spanish",    name: "Español",    flag: "🇪🇸", desc: "Modelos hispanohablantes" },
  { slug: "english",    name: "English",    flag: "🇬🇧", desc: "English-speaking models" },
  { slug: "portuguese", name: "Português",  flag: "🇧🇷", desc: "Modelos que falam português" },
  { slug: "romanian",   name: "Română",     flag: "🇷🇴", desc: "Modele vorbitoare de română" },
  { slug: "russian",    name: "Русский",    flag: "🇷🇺", desc: "Русскоязычные модели" },
  { slug: "german",     name: "Deutsch",    flag: "🇩🇪", desc: "Deutschsprachige Models" },
  { slug: "french",     name: "Français",   flag: "🇫🇷", desc: "Modèles francophones" },
  { slug: "italian",    name: "Italiano",   flag: "🇮🇹", desc: "Modelle italiane" },
];

export default function LanguageIndex() {
  const pageTitle = "Modelos de Chaturbate por Idioma | Campulse";
  const pageDescription =
    "Encuentra modelos de Chaturbate por idioma: español, inglés, portugués, rumano y más. " +
    "Estadísticas en tiempo real actualizadas cada 2 horas.";

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
          Explora modelos de Chaturbate filtradas por el idioma que hablan.
        </p>

        <div style={styles.grid}>
          {LANGUAGES.map((l) => (
            <a key={l.slug} href={`/language/${l.slug}`} style={styles.card}>
              <div style={styles.flag}>{l.flag}</div>
              <div style={styles.name}>{l.name}</div>
              <div style={styles.desc}>{l.desc}</div>
            </a>
          ))}
        </div>

        <div style={styles.nav}>
          <a href="/gender" style={styles.link}>⚥ Por género</a>
          <span style={styles.sep}> · </span>
          <a href="/country" style={styles.link}>🌍 Por país</a>
        </div>
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
  h1: { fontSize: 28, fontWeight: 800, margin: "0 0 8px" },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 32 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  card: {
    background: "#1a1a2e",
    borderRadius: 14,
    padding: "24px 20px",
    textDecoration: "none",
    color: "#f0f0f0",
    display: "block",
    textAlign: "center",
  },
  flag: { fontSize: 36, marginBottom: 10 },
  name: { fontWeight: 700, fontSize: 17, marginBottom: 6 },
  desc: { fontSize: 12, color: "#777" },
  nav: { textAlign: "center", fontSize: 14, marginTop: 16 },
};
