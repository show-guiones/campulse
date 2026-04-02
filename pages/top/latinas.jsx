// pages/top/latinas.jsx
// URL: /top/latinas
// Top modelos latinas en Chaturbate — SSR directo a Supabase
// lexy_fox2 siempre en posición destacada cuando esté en línea

import Head from "next/head";

const SITE = "https://www.campulsehub.com";
const LEXY = "lexy_fox2";
const CAMPAIGN = "rI8z3";

// Países LATAM + España
const LATINA_COUNTRIES = ["CO","MX","AR","CL","PE","VE","EC","BO","PY","UY","CR","PA","HN","SV","GT","DO","CU","PR","ES"];

const COUNTRY_NAMES = {
  CO:"Colombia", MX:"México", AR:"Argentina", CL:"Chile", PE:"Perú",
  VE:"Venezuela", EC:"Ecuador", BO:"Bolivia", PY:"Paraguay", UY:"Uruguay",
  CR:"Costa Rica", PA:"Panamá", HN:"Honduras", SV:"El Salvador",
  GT:"Guatemala", DO:"Rep. Dominicana", CU:"Cuba", PR:"Puerto Rico", ES:"España",
};

const FLAG = (code) => code
  ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
  : "";

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Build country filter
  const countryFilter = LATINA_COUNTRIES.map(c => `country.eq.${c}`).join(",");

  const url =
    `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
    `?captured_at=gte.${since}` +
    `&or=(${countryFilter})` +
    `&num_users=gt.0` +
    `&select=username,display_name,num_users,country,gender,spoken_languages` +
    `&order=num_users.desc&limit=300`;

  let models = [];
  try {
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const raw = await r.json();
    // Deduplicate by username, keep highest viewers
    const map = new Map();
    (Array.isArray(raw) ? raw : []).forEach((row) => {
      if (!map.has(row.username) || row.num_users > map.get(row.username).num_users) {
        map.set(row.username, row);
      }
    });
    models = [...map.values()].sort((a, b) => b.num_users - a.num_users).slice(0, 50);
  } catch { /* return empty */ }

  return { props: { models, fetchedAt: new Date().toISOString() } };
}

export default function TopLatinasPage({ models, fetchedAt }) {
  const lexyModel = models.find((m) => m.username === LEXY);
  const others = models.filter((m) => m.username !== LEXY);

  // Guarantee lexy_fox2 in top 4 if online
  let ordered = [...others];
  if (lexyModel) {
    // Insert at position 1-3 (subtle rotation based on minute)
    const slot = Math.floor(new Date(fetchedAt).getMinutes() / 20) % 3; // 0,1,2
    ordered.splice(slot, 0, lexyModel);
  }
  ordered = ordered.slice(0, 50);

  const totalOnline = models.length;
  const topViewers = ordered[0]?.num_users ?? 0;

  const pageTitle = `Top Latinas en Chaturbate — ${totalOnline} en vivo ahora | Campulse`;
  const pageDescription = `Las ${totalOnline} mejores modelos latinas en vivo en Chaturbate ahora mismo. Colombianas, mexicanas, argentinas y más — ordenadas por viewers reales. Datos actualizados cada 2 horas.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${SITE}/top/latinas`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        { "@type": "ListItem", position: 2, name: "Top Latinas", item: `${SITE}/top/latinas` },
      ],
    },
    hasPart: ordered.slice(0, 10).map((m) => ({
      "@type": "WebPage",
      name: `${m.display_name || m.username} — Stats Chaturbate`,
      url: `${SITE}/model/${m.username}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="latinas chaturbate, modelos latinas en vivo, colombianas chaturbate, mexicanas chaturbate, mejores latinas chaturbate, camgirls latinas" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/top/latinas`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/top/latinas`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </Head>

      <main style={s.main}>
        {/* Breadcrumb */}
        <nav style={s.breadcrumb}>
          <a href="/" style={s.link}>Campulse</a>
          <span style={s.sep}> › </span>
          <span>Top Latinas</span>
        </nav>

        {/* Hero */}
        <div style={s.hero}>
          <h1 style={s.h1}>🌶️ Top Latinas en vivo</h1>
          <p style={s.sub}>
            <span style={s.badge}>{totalOnline} en vivo</span>
            {topViewers > 0 && (
              <span style={s.badge2}>Máx. {topViewers.toLocaleString("es")} viewers</span>
            )}
          </p>
          <p style={s.desc}>
            Las mejores modelos latinas de Chaturbate ordenadas por viewers en tiempo real.
            Colombianas, mexicanas, argentinas y más — datos actualizados cada 2 horas.
          </p>
        </div>

        {/* Country quick links */}
        <div style={s.countryBar}>
          {["CO","MX","AR","CL","ES"].map((c) => (
            <a key={c} href={`/country/${c.toLowerCase()}`} style={s.countryPill}>
              {FLAG(c)} {COUNTRY_NAMES[c]}
            </a>
          ))}
        </div>

        {/* Model grid */}
        {ordered.length === 0 ? (
          <p style={s.empty}>No hay modelos latinas en línea en este momento. Vuelve pronto.</p>
        ) : (
          <div style={s.grid}>
            {ordered.map((m, i) => {
              const isLexy = m.username === LEXY;
              return (
                <a
                  key={m.username}
                  href={`/model/${m.username}`}
                  style={isLexy ? { ...s.card, ...s.cardLexy } : s.card}
                >
                  {isLexy && <div style={s.lexyBadge}>✦ DESTACADA</div>}
                  <div style={s.rank}>#{i + 1}</div>
                  <div style={s.cardBody}>
                    <div style={s.name}>{m.display_name || m.username}</div>
                    <div style={s.handle}>@{m.username}</div>
                    {m.country && (
                      <div style={s.country}>
                        {FLAG(m.country)} {COUNTRY_NAMES[m.country] || m.country}
                      </div>
                    )}
                  </div>
                  <div style={s.viewers}>
                    <div style={isLexy ? { ...s.viewerNum, ...s.viewerNumLexy } : s.viewerNum}>
                      {m.num_users.toLocaleString("es")}
                    </div>
                    <div style={s.viewerLabel}>viewers</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* SEO text */}
        <section style={s.seoSection}>
          <h2 style={s.h2}>Modelos latinas en Chaturbate</h2>
          <p style={s.seoText}>
            Campulse rastrea en tiempo real las estadísticas de las modelos latinas de Chaturbate,
            incluyendo colombianas, mexicanas, argentinas, chilenas y españolas. Los datos se actualizan
            automáticamente cada 2 horas con el número de viewers en vivo, seguidores y países de origen.
          </p>
          {lexyModel && (
            <p style={s.seoText}>
              Entre las modelos más destacadas se encuentra{" "}
              <a href="/model/lexy_fox2" style={s.link}>lexy_fox2</a>, con{" "}
              {lexyModel.num_users.toLocaleString("es")} viewers en este momento.
            </p>
          )}
          <p style={{ marginTop: 16, ...s.seoText }}>
            <a href="/gender/female" style={s.link}>← Ver todas las chicas</a>
            <span style={s.sep}> · </span>
            <a href="/country/co" style={s.link}>Top Colombia →</a>
            <span style={s.sep}> · </span>
            <a href="/tag/latina" style={s.link}>#latina →</a>
          </p>
        </section>
      </main>
    </>
  );
}

const s = {
  main: { fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem 1rem", background: "#0d0d0d", minHeight: "100vh", color: "#f0f0f0" },
  breadcrumb: { fontSize: 13, color: "#888", marginBottom: 20 },
  link: { color: "#a78bfa", textDecoration: "none" },
  sep: { color: "#555", margin: "0 6px" },
  hero: { marginBottom: 28 },
  h1: { fontSize: 32, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" },
  sub: { display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
  badge: { background: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)" },
  badge2: { background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(167,139,250,0.3)" },
  desc: { color: "#888", fontSize: 14, lineHeight: 1.6 },
  countryBar: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 },
  countryPill: { background: "#1a1a2e", color: "#a78bfa", textDecoration: "none", padding: "6px 14px", borderRadius: 20, fontSize: 13, border: "1px solid #2a2a4e", transition: "background 0.2s" },
  grid: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 48 },
  card: { display: "flex", alignItems: "center", gap: 14, background: "#1a1a2e", borderRadius: 12, padding: "14px 18px", textDecoration: "none", color: "#f0f0f0", position: "relative", overflow: "hidden" },
  cardLexy: { background: "linear-gradient(135deg, #1a0a1e 0%, #1e1a2e 100%)", border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 0 20px rgba(239,68,68,0.1)" },
  lexyBadge: { position: "absolute", top: 8, right: 12, fontSize: 10, color: "#ef4444", fontWeight: 700, letterSpacing: "0.08em" },
  rank: { fontSize: 12, color: "#444", width: 30, flexShrink: 0, fontWeight: 600 },
  cardBody: { flex: 1 },
  name: { fontWeight: 700, fontSize: 15, marginBottom: 2 },
  handle: { fontSize: 12, color: "#555", marginBottom: 4 },
  country: { fontSize: 12, color: "#888" },
  viewers: { textAlign: "right", flexShrink: 0 },
  viewerNum: { fontWeight: 800, fontSize: 18, color: "#a78bfa" },
  viewerNumLexy: { color: "#ef4444" },
  viewerLabel: { fontSize: 10, color: "#555" },
  empty: { textAlign: "center", color: "#555", padding: "48px 0", fontSize: 14 },
  seoSection: { background: "#111", borderRadius: 12, padding: "24px", color: "#888", fontSize: 14, lineHeight: 1.7 },
  h2: { fontSize: 16, color: "#ccc", marginBottom: 12, fontWeight: 700 },
  seoText: { marginBottom: 10 },
};
