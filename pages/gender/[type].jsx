// pages/gender/[type].jsx
// FIX: snapshots >= 1, ventana 14 días para más modelos en el ranking

import Head from "next/head";

const SITE = "https://www.campulsehub.com";
const SUPPORTED_GENDERS = ["female", "male", "couple", "trans"];
const GENDER_DB_MAP = { female: "f", male: "m", couple: "c", trans: "t" };

const GENDER_INFO = {
  female: { name: "Chicas",  nameEs: "Mujeres", description: "Las mejores modelos femeninas de Chaturbate" },
  male:   { name: "Chicos",  nameEs: "Hombres", description: "Los mejores modelos masculinos de Chaturbate" },
  couple: { name: "Parejas", nameEs: "Parejas", description: "Las mejores parejas de Chaturbate en vivo" },
  trans:  { name: "Trans",   nameEs: "Trans",   description: "Las mejores modelos trans de Chaturbate" },
};

const COUNTRY_NAMES = {
  CO: "Colombia", MX: "México", AR: "Argentina", CL: "Chile",
  PE: "Perú", VE: "Venezuela", EC: "Ecuador", US: "Estados Unidos",
  ES: "España", BR: "Brasil", RO: "Rumania", RU: "Rusia",
  DE: "Alemania", FR: "Francia", GB: "Reino Unido", IT: "Italia",
  UA: "Ucrania", PH: "Filipinas", TH: "Tailandia", CA: "Canadá",
  AU: "Australia", NL: "Países Bajos", TR: "Turquía", HU: "Hungría",
  PL: "Polonia", CZ: "República Checa", SE: "Suecia",
};

export async function getServerSideProps({ params }) {
  const type = params.type.toLowerCase();
  if (!SUPPORTED_GENDERS.includes(type)) return { notFound: true };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return { notFound: true };

  try {
    const dbGender = GENDER_DB_MAP[type];
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&gender=eq.${dbGender}` +
      `&select=username,num_users,num_followers,display_name,country` +
      `&order=captured_at.desc` +
      `&limit=10000`;

    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!r.ok) return { notFound: true };
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return { notFound: true };

    const map = {};
    for (const row of rows) {
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

    if (models.length === 0) return { notFound: true };

    const data = { gender: type, ...GENDER_INFO[type], models };
    return { props: { data } };
  } catch {
    return { notFound: true };
  }
}

export default function GenderTypePage({ data }) {
  const { gender, name, nameEs, models } = data;
  const topModel = models[0];

  const pageTitle = `${name} en Chaturbate — Top ${models.length} | Campulse`;
  const pageDescription =
    `Las mejores ${models.length} ${nameEs.toLowerCase()} de Chaturbate ordenadas por viewers. ` +
    (topModel ? `${topModel.display_name} lidera con ${topModel.avg_viewers.toLocaleString("es")} viewers promedio. ` : "") +
    `Estadísticas en tiempo real en Campulse.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/gender/${gender}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        { "@type": "ListItem", position: 2, name: "Géneros", item: `${SITE}/gender` },
        { "@type": "ListItem", position: 3, name: name, item: `${SITE}/gender/${gender}` },
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
        <link rel="canonical" href={`${SITE}/gender/${gender}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/gender/${gender}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </Head>

      <main style={styles.main}>
        <nav style={styles.breadcrumbs}>
          <a href="/" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <a href="/gender" style={styles.link}>Géneros</a>
          <span style={styles.sep}> › </span>
          <span>{name}</span>
        </nav>

        <h1 style={styles.h1}>{name} en Chaturbate</h1>
        <p style={styles.subtitle}>
          Top {models.length} {nameEs.toLowerCase()} ordenadas por viewers promedio en los últimos 14 días.
        </p>

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
                        alt={COUNTRY_NAMES[m.country] || m.country}
                        width={16} height={12}
                        style={{ borderRadius: 2, verticalAlign: "middle", marginRight: 4 }}
                      />
                      {COUNTRY_NAMES[m.country] || m.country}
                    </>
                  )}
                </div>
              </div>
              <div style={styles.stats}>
                <div style={styles.statMain}>
                  {m.avg_viewers.toLocaleString("es")} <span style={styles.statLabel}>viewers</span>
                </div>
                {m.max_followers > 0 && (
                  <div style={styles.statSub}>{m.max_followers.toLocaleString("es")} seguidores</div>
                )}
              </div>
            </a>
          ))}
        </div>

        <section style={styles.seoText}>
          <h2 style={styles.h2}>{name} en Chaturbate</h2>
          <p>
            Campulse rastrea en tiempo real las estadísticas de las {nameEs.toLowerCase()} de
            Chaturbate. Los datos se actualizan cada 2 horas con el número de viewers,
            seguidores y los mejores horarios para cada modelo.
          </p>
          {topModel && (
            <p>
              Actualmente, <strong>{topModel.display_name || topModel.username}</strong> lidera con{" "}
              <strong>{topModel.avg_viewers.toLocaleString("es")} viewers promedio</strong>
              {topModel.max_followers > 0 ? ` y ${topModel.max_followers.toLocaleString("es")} seguidores.` : "."}
            </p>
          )}
          <p style={{ marginTop: 16 }}>
            <a href="/gender" style={styles.link}>← Ver todos los géneros</a>
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
};
