// pages/index.js
// Home de Campulse — hub de navegación + ranking top 10 en vivo
//
// Novedades respecto a la versión anterior:
//   · Sección "Top 10 ahora" con las modelos de mayor audiencia en vivo
//   · Datos traídos directamente desde Supabase en SSR (sin fetch interno)
//   · Conteo real de modelos online con count=exact

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const COUNTRY_NAMES = {
  CO: "Colombia", MX: "México", AR: "Argentina", CL: "Chile",
  ES: "España", US: "Estados Unidos", BR: "Brasil", RO: "Rumania",
  RU: "Rusia", DE: "Alemania", FR: "Francia", GB: "Reino Unido",
  IT: "Italia", UA: "Ucrania", PH: "Filipinas", TH: "Tailandia",
  CA: "Canadá", AU: "Australia", HU: "Hungría", PL: "Polonia",
  PE: "Perú", VE: "Venezuela", EC: "Ecuador",
};

const GENDER_LABELS = { f: "♀", m: "♂", c: "♥", t: "⚧" };
const GENDER_COLORS = { f: "#f472b6", m: "#60a5fa", c: "#34d399", t: "#a78bfa" };

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  let totalModels = 0;
  let topModels = [];

  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const sbHeaders = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      };

      // Conteo total con count=exact (no trae filas, solo el header)
      const [countRes, topRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
          `?captured_at=gte.${since}` +
          `&select=username`,
          {
            headers: { ...sbHeaders, "Prefer": "count=exact", "Range": "0-0" },
          }
        ),
        // Top modelos por viewers en el último snapshot (últimas 2h, orden desc)
        fetch(
          `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
          `?captured_at=gte.${since}` +
          `&select=username,display_name,num_users,num_followers,country,gender` +
          `&order=num_users.desc` +
          `&limit=200`,
          { headers: sbHeaders }
        ),
      ]);

      // Conteo total
      if (countRes.ok) {
        const range = countRes.headers.get("content-range");
        if (range) {
          const total = parseInt(range.split("/")[1], 10);
          if (!isNaN(total)) totalModels = total;
        }
      }

      // Top modelos — deduplicar por username (puede haber múltiples snapshots)
      if (topRes.ok) {
        const rows = await topRes.json();
        if (Array.isArray(rows)) {
          const seen = new Set();
          const unique = [];
          for (const r of rows) {
            if (!r.username || seen.has(r.username)) continue;
            seen.add(r.username);
            unique.push({
              username: r.username,
              display_name: r.display_name || r.username,
              num_users: r.num_users ?? 0,
              num_followers: r.num_followers ?? 0,
              country: r.country || "",
              gender: r.gender || "",
            });
            if (unique.length >= 10) break;
          }
          topModels = unique;
        }
      }
    }
  } catch {}

  return { props: { totalModels, topModels } };
}

export default function Home({ totalModels, topModels }) {
  const pageTitle = "Campulse — Estadísticas de Chaturbate en Tiempo Real";
  const pageDescription =
    "Campulse rastrea las estadísticas de Chaturbate en tiempo real: viewers, seguidores y mejores horarios. " +
    "Filtra modelos por género, país e idioma. Datos actualizados cada 2 horas.";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Campulse",
    description: pageDescription,
    url: SITE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/search?q={username}`,
      "query-input": "required name=username",
    },
  };

  const categories = [
    { href: "/gender",      icon: "⚥", title: "Por Género",   desc: "Chicas, chicos, parejas y trans", color: "#a78bfa" },
    { href: "/country",     icon: "🌍", title: "Por País",     desc: "Colombia, España, México y más",  color: "#34d399" },
    { href: "/language",    icon: "🗣", title: "Por Idioma",   desc: "Español, inglés, portugués...",   color: "#f59e0b" },
    { href: "/top/latinas", icon: "🌶️", title: "Top Latinas",  desc: "Las mejores latinas en vivo",    color: "#ef4444" },
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={SITE} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main style={styles.main}>

        {/* ── Hero ── */}
        <section style={styles.hero}>
          <h1 style={styles.h1}>Campulse</h1>
          <p style={styles.tagline}>Estadísticas de Chaturbate en tiempo real</p>
          {totalModels > 0 && (
            <div style={styles.badge}>
              🔴 {totalModels.toLocaleString("es")} modelos online ahora
            </div>
          )}
        </section>

        {/* ── Buscador ── */}
        <section style={styles.section}>
          <a href="/search" style={styles.searchBox}>
            🔍 Buscar modelo por username...
          </a>
        </section>

        {/* ── Top 10 en vivo ── */}
        {topModels.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.h2}>🔥 Top 10 en vivo ahora</h2>
            <div style={styles.topList}>
              {topModels.map((m, i) => {
                const countryLC = m.country?.toLowerCase();
                const countryName = COUNTRY_NAMES[m.country?.toUpperCase()] || m.country || null;
                const genderIcon = GENDER_LABELS[m.gender] || "";
                const genderColor = GENDER_COLORS[m.gender] || "#888";
                return (
                  <a key={m.username} href={`/model/${m.username}`} style={styles.topRow}>
                    <span style={styles.topRank}>#{i + 1}</span>
                    <div style={styles.topInfo}>
                      <span style={styles.topName}>{m.display_name}</span>
                      <span style={styles.topMeta}>
                        {genderIcon && (
                          <span style={{ color: genderColor, marginRight: 6 }}>{genderIcon}</span>
                        )}
                        {countryLC && (
                          <img
                            src={`https://flagcdn.com/16x12/${countryLC}.png`}
                            alt={countryName || m.country}
                            width={16} height={12}
                            style={{ verticalAlign: "middle", borderRadius: 2, marginRight: 4 }}
                          />
                        )}
                        {countryName}
                      </span>
                    </div>
                    <div style={styles.topViewers}>
                      <span style={styles.topViewerNum}>
                        {m.num_users.toLocaleString("es")}
                      </span>
                      <span style={styles.topViewerLabel}> viewers</span>
                    </div>
                  </a>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="/gender/female" style={styles.moreLink}>Ver más modelos →</a>
            </div>
          </section>
        )}

        {/* ── Categorías ── */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Explorar por categoría</h2>
          <div style={styles.grid}>
            {categories.map((cat) => (
              <a key={cat.href} href={cat.href} style={styles.card}>
                <div style={{ ...styles.cardIcon, color: cat.color }}>{cat.icon}</div>
                <div style={styles.cardTitle}>{cat.title}</div>
                <div style={styles.cardDesc}>{cat.desc}</div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Links rápidos ── */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Géneros populares</h2>
          <div style={styles.linkRow}>
            {[
              { href: "/gender/female", label: "♀ Chicas" },
              { href: "/gender/male",   label: "♂ Chicos" },
              { href: "/gender/couple", label: "♥ Parejas" },
              { href: "/gender/trans",  label: "⚧ Trans" },
              { href: "/top/latinas",   label: "🌶️ Latinas" },
            ].map((l) => (
              <a key={l.href} href={l.href} style={styles.pill}>{l.label}</a>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Países más activos</h2>
          <div style={styles.linkRow}>
            {[
              { href: "/country/co", label: "🇨🇴 Colombia" },
              { href: "/country/es", label: "🇪🇸 España" },
              { href: "/country/mx", label: "🇲🇽 México" },
              { href: "/country/ro", label: "🇷🇴 Rumania" },
              { href: "/country/us", label: "🇺🇸 EEUU" },
              { href: "/country/br", label: "🇧🇷 Brasil" },
            ].map((l) => (
              <a key={l.href} href={l.href} style={styles.pill}>{l.label}</a>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Idiomas</h2>
          <div style={styles.linkRow}>
            {[
              { href: "/language/spanish",    label: "🇪🇸 Español" },
              { href: "/language/english",    label: "🇬🇧 English" },
              { href: "/language/portuguese", label: "🇧🇷 Português" },
              { href: "/language/romanian",   label: "🇷🇴 Română" },
              { href: "/language/russian",    label: "🇷🇺 Русский" },
            ].map((l) => (
              <a key={l.href} href={l.href} style={styles.pill}>{l.label}</a>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Tags populares</h2>
          <div style={styles.linkRow}>
            {[
              { href: "/tag/latina",   label: "#latina" },
              { href: "/tag/bigboobs", label: "#bigboobs" },
              { href: "/tag/ebony",    label: "#ebony" },
              { href: "/tag/teen",     label: "#teen" },
              { href: "/tag/curvy",    label: "#curvy" },
              { href: "/tag/lovense",  label: "#lovense" },
              { href: "/tag/squirt",   label: "#squirt" },
              { href: "/tag/colombia", label: "#colombia" },
            ].map((l) => (
              <a key={l.href} href={l.href} style={styles.pillTag}>{l.label}</a>
            ))}
          </div>
        </section>

        {/* ── SEO text ── */}
        <section style={styles.seoText}>
          <h2 style={{ ...styles.h2, color: "#ccc" }}>
            Estadísticas de Chaturbate en tiempo real
          </h2>
          <p>
            Campulse es la herramienta de estadísticas más completa para Chaturbate.
            Rastrea viewers, seguidores y mejores horarios de miles de modelos,
            actualizado automáticamente cada 2 horas desde Chaturbate.
          </p>
          <p>
            Encuentra las modelos más vistas de Colombia, España, México y 50 países más.
            Filtra por género, idioma o país para descubrir nuevas modelos en vivo.
          </p>
        </section>
      </main>
    </>
  );
}

const styles = {
  main: { fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem 1rem", background: "#0d0d0d", minHeight: "100vh", color: "#f0f0f0" },
  hero: { textAlign: "center", padding: "48px 0 40px" },
  h1: { fontSize: 42, fontWeight: 800, margin: "0 0 12px", letterSpacing: -1 },
  tagline: { fontSize: 18, color: "#888", margin: "0 0 20px" },
  badge: { display: "inline-block", background: "#1a1a2e", borderRadius: 20, padding: "8px 20px", fontSize: 14, color: "#a78bfa", fontWeight: 600 },
  searchBox: { display: "block", background: "#1a1a2e", border: "1px solid #333", borderRadius: 12, padding: "14px 20px", color: "#666", fontSize: 15, textDecoration: "none", textAlign: "left" },
  section: { marginBottom: 40 },
  h2: { fontSize: 16, color: "#888", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },

  // Top 10
  topList: { display: "flex", flexDirection: "column", gap: 6 },
  topRow: { display: "flex", alignItems: "center", gap: 14, background: "#1a1a2e", borderRadius: 10, padding: "12px 16px", textDecoration: "none", color: "#f0f0f0" },
  topRank: { fontSize: 12, color: "#555", width: 24, flexShrink: 0, fontWeight: 700 },
  topInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  topName: { fontWeight: 700, fontSize: 14 },
  topMeta: { fontSize: 11, color: "#666", display: "flex", alignItems: "center" },
  topViewers: { textAlign: "right" },
  topViewerNum: { fontWeight: 700, color: "#a78bfa", fontSize: 15 },
  topViewerLabel: { fontSize: 11, color: "#666" },
  moreLink: { color: "#a78bfa", fontSize: 13, textDecoration: "none" },

  // Cards
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  card: { background: "#1a1a2e", borderRadius: 14, padding: "28px 20px", textDecoration: "none", color: "#f0f0f0", display: "block", textAlign: "center" },
  cardIcon: { fontSize: 36, marginBottom: 12 },
  cardTitle: { fontWeight: 700, fontSize: 17, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#777" },

  // Pills
  linkRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  pill: { background: "#1a1a2e", borderRadius: 20, padding: "8px 16px", textDecoration: "none", color: "#a78bfa", fontSize: 14, fontWeight: 500 },
  pillTag: { background: "#1a1a2e", borderRadius: 20, padding: "8px 16px", textDecoration: "none", color: "#34d399", fontSize: 14, fontWeight: 500 },

  seoText: { marginTop: 32, padding: "24px", background: "#111", borderRadius: 12, color: "#aaa", fontSize: 14, lineHeight: 1.7 },
};
