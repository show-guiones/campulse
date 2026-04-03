// pages/language/[lang].jsx
// SEO mejorado: título con viewers top modelo, keywords por idioma, og:image bandera idioma

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const SUPPORTED_LANGS = [
  "spanish", "english", "portuguese", "romanian",
  "russian", "german", "french", "italian",
];

const LANGUAGE_INFO = {
  spanish:    { name: "Español",   flag: "es", keywords: "modelos español chaturbate, webcam español, latinas chaturbate" },
  english:    { name: "English",   flag: "gb", keywords: "english chaturbate models, webcam english, chaturbate english speakers" },
  portuguese: { name: "Português", flag: "br", keywords: "modelos português chaturbate, webcam português, brasileiras chaturbate" },
  romanian:   { name: "Română",    flag: "ro", keywords: "modele chaturbate română, webcam română, chaturbate romania" },
  russian:    { name: "Русский",   flag: "ru", keywords: "модели chaturbate русский, вебкам русский, chaturbate russia" },
  german:     { name: "Deutsch",   flag: "de", keywords: "chaturbate deutsch models, webcam deutsch, chaturbate deutschland" },
  french:     { name: "Français",  flag: "fr", keywords: "modèles chaturbate français, webcam français, chaturbate france" },
  italian:    { name: "Italiano",  flag: "it", keywords: "modelle chaturbate italiano, webcam italiano, chaturbate italia" },
};

const LANG_VARIANTS = {
  spanish:    ["spanish", "español", "espanol", "es"],
  english:    ["english", "inglés", "ingles", "en"],
  portuguese: ["portuguese", "portugués", "portugues", "pt"],
  romanian:   ["romanian", "rumano", "română", "ro"],
  russian:    ["russian", "ruso", "русский", "ru"],
  german:     ["german", "alemán", "aleman", "deutsch", "de"],
  french:     ["french", "francés", "frances", "français", "fr"],
  italian:    ["italian", "italiano", "it"],
};

const COUNTRY_NAMES = {
  CO: "Colombia", MX: "México", AR: "Argentina", CL: "Chile",
  PE: "Perú",    VE: "Venezuela", EC: "Ecuador", US: "Estados Unidos",
  ES: "España",  BR: "Brasil",   RO: "Rumania",  RU: "Rusia",
  DE: "Alemania",FR: "Francia",  GB: "Reino Unido", IT: "Italia",
  UA: "Ucrania", PH: "Filipinas",TH: "Tailandia",CA: "Canadá",
  AU: "Australia",NL: "Países Bajos", TR: "Turquía", HU: "Hungría",
  PL: "Polonia", CZ: "República Checa", SE: "Suecia", PT: "Portugal",
};

function detectsLang(raw, slug) {
  if (!raw) return false;
  const val = raw.toLowerCase().trim();
  return LANG_VARIANTS[slug]?.some((v) => val.includes(v)) ?? false;
}

export async function getServerSideProps({ params }) {
  const lang = (params.lang || "").toLowerCase();
  if (!SUPPORTED_LANGS.includes(lang)) return { notFound: true };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return { notFound: true };

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&spoken_languages=not.is.null` +
      `&select=username,num_users,num_followers,display_name,country,spoken_languages` +
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
      if (!detectsLang(row.spoken_languages, lang)) continue;
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
      .filter((m) => m.snapshots >= 1)
      .map((m) => ({
        username: m.username,
        display_name: m.display_name,
        country: m.country,
        avg_viewers: Math.round(m.total_viewers / m.snapshots),
        max_followers: m.max_followers,
      }))
      .sort((a, b) => b.avg_viewers - a.avg_viewers)
      .slice(0, 50);

    const info = LANGUAGE_INFO[lang];
    return { props: { data: { lang, ...info, models, empty: models.length === 0 } } };
  } catch {
    const info = LANGUAGE_INFO[lang] || { name: lang, flag: "", keywords: "", description: "" };
    return { props: { data: { lang, ...info, models: [], empty: true } } };
  }
}

export default function LanguagePage({ data }) {
  const { lang, name, flag, keywords, models, empty } = data;
  const top = models[0];
  const second = models[1];

  // Título dinámico con viewers del top modelo
  const pageTitle = empty
    ? `Modelos Chaturbate en ${name} | Campulse`
    : top
      ? `Modelos Chaturbate en ${name} — ${top.display_name} con ${top.avg_viewers.toLocaleString("es")} viewers | Campulse`
      : `Modelos Chaturbate en ${name} — Top ${models.length} | Campulse`;

  // Descripción dinámica con top 2
  const pageDescription = empty
    ? `Explora las modelos de Chaturbate que hablan ${name}. Estadísticas en tiempo real en Campulse.`
    : `Las ${models.length} mejores modelos de Chaturbate que hablan ${name}, ordenadas por viewers. ` +
      (top ? `${top.display_name} lidera con ${top.avg_viewers.toLocaleString("es")} viewers promedio` : "") +
      (second ? `, seguida de ${second.display_name} con ${second.avg_viewers.toLocaleString("es")}. ` : ". ") +
      `Datos actualizados cada 2 horas en Campulse.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/language/${lang}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        { "@type": "ListItem", position: 2, name: "Idiomas",  item: `${SITE}/language` },
        { "@type": "ListItem", position: 3, name,            item: `${SITE}/language/${lang}` },
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
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="robots" content={empty ? "noindex, follow" : "index, follow"} />
        <link rel="canonical" href={`${SITE}/language/${lang}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/language/${lang}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        {flag && <meta property="og:image" content={`https://flagcdn.com/160x120/${flag}.png`} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main style={styles.main}>
        <nav style={styles.breadcrumbs}>
          <a href="/" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <a href="/language" style={styles.link}>Idiomas</a>
          <span style={styles.sep}> › </span>
          <span>{name}</span>
        </nav>

        <h1 style={styles.h1}>Modelos Chaturbate en {name}</h1>
        <p style={styles.subtitle}>
          {empty
            ? "No hay modelos en línea en este idioma en este momento. Vuelve pronto."
            : `Top ${models.length} modelos ordenadas por viewers promedio en los últimos 30 días.`}
        </p>

        {empty ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎥</div>
            <p style={styles.emptyTitle}>Sin modelos en línea ahora</p>
            <p style={styles.emptyText}>
              No encontramos modelos de {name} activas en este momento.<br/>
              Los datos se actualizan cada 2 horas — vuelve más tarde.
            </p>
            <a href="/language" style={{...styles.link, fontSize:14}}>← Ver otros idiomas</a>
          </div>
        ) : (
          <div style={styles.list}>
            {models.map((m, i) => (
              <a key={m.username} href={`/model/${m.username}`} style={styles.row}>
                <span style={styles.rank}>#{i + 1}</span>
                <div style={styles.info}>
                  <div style={styles.username}>{m.display_name || m.username}</div>
                  <div style={styles.meta}>
                    @{m.username}
                    {m.country && (
                      <>
                        <span style={styles.dot}>·</span>
                        <img
                          src={`https://flagcdn.com/16x12/${m.country.toLowerCase()}.png`}
                          alt={COUNTRY_NAMES[m.country?.toUpperCase()] || m.country}
                          width={16} height={12}
                          style={{ borderRadius: 2, verticalAlign: "middle", marginRight: 4 }}
                        />
                        {COUNTRY_NAMES[m.country?.toUpperCase()] || m.country}
                      </>
                    )}
                  </div>
                </div>
                <div style={styles.stats}>
                  <div style={styles.statMain}>
                    {m.avg_viewers.toLocaleString("es")}{" "}
                    <span style={styles.statLabel}>viewers</span>
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
        )}

        <section style={styles.seoText}>
          <h2 style={styles.h2}>Modelos de Chaturbate en {name}</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de las modelos de
            Chaturbate que hablan {name}. Los datos se actualizan cada 2 horas con
            el número de viewers, seguidores y los mejores horarios para cada modelo.
          </p>
          {top && (
            <p>
              Actualmente, <strong>{top.display_name || top.username}</strong> es
              la modelo más vista con un promedio de{" "}
              <strong>{top.avg_viewers.toLocaleString("es")} viewers</strong>
              {top.max_followers > 0
                ? ` y ${top.max_followers.toLocaleString("es")} seguidores.`
                : "."}
            </p>
          )}
          <p style={{ marginTop: 16 }}>
            <a href="/language" style={styles.link}>← Ver otros idiomas</a>
            <span style={styles.sep}> · </span>
            <a href="/country" style={styles.link}>Ver por país →</a>
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
  meta: { fontSize: 12, color: "#666", marginTop: 3, display: "flex", alignItems: "center", gap: 4 },
  dot: { color: "#444" },
  stats: { textAlign: "right" },
  statMain: { fontWeight: 700, color: "#a78bfa", fontSize: 16 },
  statLabel: { fontSize: 11, color: "#888", fontWeight: 400 },
  statSub: { fontSize: 11, color: "#666", marginTop: 2 },
  seoText: { marginTop: 48, padding: "24px", background: "#111", borderRadius: 12, color: "#aaa", fontSize: 14, lineHeight: 1.7 },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#111", borderRadius: 12, marginBottom: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#f0f0f0", marginBottom: 8 },
  emptyText: { color: "#888", fontSize: 14, lineHeight: 1.7, marginBottom: 24 },
};
