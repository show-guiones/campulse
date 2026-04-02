// pages/country/index.jsx
// Ruta: pages/country/index.jsx
//
// Página de listado de todos los países disponibles.
// URL: /country

import Head from "next/head";
import Image from "next/image";

const SITE = "https://www.campulsehub.com";

export async function getStaticProps() {
  try {
    const r = await fetch(`${SITE}/api/country?list=1`);
    const countries = r.ok ? await r.json() : [];
    return {
      props: { countries },
      revalidate: 3600,
    };
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
