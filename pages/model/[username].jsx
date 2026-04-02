// pages/model/[username].jsx
//
// Novedades respecto a la versión anterior:
//   · noindex automático si snapCount < 3 (páginas sin datos reales)
//   · Sección "Modelos similares" al final — modelos del mismo país en vivo
//   · Mini gráfico SVG de viewers (sparkline) generado desde el historial
//   · Sección "En vivo ahora" si el último snapshot tiene viewers > 0
//   · Peak viewers (máximo histórico) mostrado en métricas
//   · Tabla de historial con barras proporcionales inline
//   · canonical, Schema.org, OG, links a categorías

import Head from "next/head";

const LANG_VARIANTS = {
  spanish:    ["spanish", "español", "espanol", "es"],
  english:    ["english", "inglés", "ingles", "en"],
  portuguese: ["portuguese", "portugués", "portugues", "pt"],
  romanian:   ["romanian", "rumano", "română", "ro"],
  russian:    ["russian", "ruso", "русский", "ru"],
  german:     ["german", "alemán", "deutsch", "de"],
  french:     ["french", "francés", "français", "fr"],
  italian:    ["italian", "italiano", "it"],
};

const LANG_NAMES = {
  spanish: "Español", english: "English", portuguese: "Português",
  romanian: "Română", russian: "Русский", german: "Deutsch",
  french: "Français", italian: "Italiano",
};

function detectLangSlug(raw) {
  if (!raw) return null;
  const val = raw.toLowerCase().trim();
  for (const [slug, variants] of Object.entries(LANG_VARIANTS)) {
    if (variants.some((v) => val.includes(v))) return slug;
  }
  return null;
}

const SITE = "https://www.campulsehub.com";

const COUNTRY_NAMES = {
  CO: "Colombia", ES: "España", MX: "México", AR: "Argentina",
  CL: "Chile", PE: "Perú", VE: "Venezuela", EC: "Ecuador",
  US: "Estados Unidos", BR: "Brasil", RO: "Rumania", RU: "Rusia",
  DE: "Alemania", FR: "Francia", GB: "Reino Unido", IT: "Italia",
  PH: "Filipinas", TH: "Tailandia", CZ: "República Checa",
  UA: "Ucrania", HU: "Hungría", PL: "Polonia", CA: "Canadá",
  AU: "Australia", NL: "Países Bajos", SE: "Suecia", TR: "Turquía",
};

const GENDER_LABELS = { f: "Mujer", m: "Hombre", c: "Pareja", t: "Trans" };

function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return "";
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65)).join("");
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, width = 280, height = 56 }) {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.num_users ?? 0);
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * (height - 4)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${(values.length - 1) * step},${height}`}
        fill="url(#sg)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {(() => {
        const last = values.length - 1;
        const x = last * step;
        const y = height - (values[last] / max) * (height - 4);
        return <circle cx={x} cy={y} r="4" fill="#a78bfa" />;
      })()}
    </svg>
  );
}

export async function getServerSideProps({ params }) {
  const { username } = params;

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const sbHeaders = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    const [h, b, s] = await Promise.all([
      fetch(`${SITE}/api/history?username=${encodeURIComponent(username)}`),
      fetch(`${SITE}/api/best-hours?username=${encodeURIComponent(username)}`),
      fetch(
        `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
        `?username=eq.${encodeURIComponent(username)}` +
        `&select=country,gender,display_name,spoken_languages` +
        `&order=captured_at.desc&limit=1`,
        { headers: sbHeaders }
      ),
    ]);

    const history   = h.ok ? await h.json() : [];
    const bestHours = b.ok ? await b.json() : [];
    const snapRows  = s.ok ? await s.json() : [];
    const snap      = Array.isArray(snapRows) ? snapRows[0] || {} : {};

    const countryCode = (snap.country || "").toUpperCase().trim();
    const gender      = snap.gender || "";

    // ── Modelos similares: mismo país en vivo, excluir al propio modelo ──
    let similarModels = [];
    if (SUPABASE_URL && SUPABASE_KEY && (countryCode || gender)) {
      try {
        const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        let filter = `captured_at=gte.${since}&username=neq.${encodeURIComponent(username)}&num_users=gt.0`;
        if (countryCode) filter += `&country=eq.${countryCode}`;
        else if (gender)  filter += `&gender=eq.${gender}`;

        const simRes = await fetch(
          `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
          `?${filter}` +
          `&select=username,display_name,num_users,country` +
          `&order=num_users.desc&limit=6`,
          { headers: sbHeaders }
        );
        if (simRes.ok) {
          const rows = await simRes.json();
          similarModels = Array.isArray(rows) ? rows : [];
        }
      } catch { /* no bloquea el render */ }
    }

    return {
      props: {
        username,
        history:      Array.isArray(history) ? history : [],
        bestHours:    Array.isArray(bestHours) ? bestHours : [],
        country:      snap.country          || "",
        gender,
        displayName:  snap.display_name     || "",
        languages:    snap.spoken_languages  || "",
        similarModels,
      },
    };
  } catch {
    return {
      props: {
        username,
        history: [], bestHours: [],
        country: "", gender: "", displayName: "", languages: "",
        similarModels: [],
      },
    };
  }
}

export default function ModelPage({
  username, history, bestHours,
  country, gender, displayName, languages,
  similarModels,
}) {
  const last      = history[history.length - 1] || {};
  const days      = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const viewers   = last.num_users    ?? null;
  const followers = last.num_followers ?? null;
  const snapCount = history.length;
  const topHour   = bestHours[0];
  const peakViewers = history.length > 0
    ? Math.max(...history.map((r) => r.num_users ?? 0))
    : null;

  const isLive = viewers != null && viewers > 0;

  const countryCode = (country || "").toUpperCase().trim();
  const countryName = COUNTRY_NAMES[countryCode] || countryCode || null;
  const flag        = countryCodeToFlag(countryCode);
  const genderLabel = GENDER_LABELS[gender] || null;
  const name        = displayName || username;
  const langSlug    = detectLangSlug(languages);
  const langName    = langSlug ? LANG_NAMES[langSlug] : null;

  const sparkData = history.slice(-30);
  const histMax   = peakViewers || 1;

  // ── noindex para páginas sin datos suficientes ─────────────────────────────
  const shouldIndex = snapCount >= 3;

  // ── SEO ───────────────────────────────────────────────────────────────────
  let pageTitle = viewers != null
    ? `${name} en Chaturbate — ${viewers.toLocaleString("es")} viewers ahora | Campulse`
    : `${name} Stats en Chaturbate | Campulse`;

  let pageDescription = `Estadísticas en tiempo real de ${name} en Chaturbate.`;
  if (countryName) pageDescription += ` Modelo de ${countryName}.`;
  if (followers != null) pageDescription += ` ${followers.toLocaleString("es")} seguidores.`;
  if (topHour) {
    pageDescription +=
      ` Mejor horario: ${days[topHour.day_of_week]} a las ` +
      `${String(topHour.hour_est ?? 0).padStart(2, "0")}:00 EST ` +
      `con ${Math.round(topHour.avg_viewers)} viewers promedio.`;
  }
  if (snapCount > 0) pageDescription += ` ${snapCount} snapshots en los últimos 30 días.`;

  const LEXY_USER = "lexy_fox2";
  if (username === LEXY_USER) {
    pageTitle = isLive
      ? `lexy_fox2 en vivo — ${viewers.toLocaleString("es")} viewers ahora | CampulseHub`
      : "lexy_fox2 en Chaturbate — Perfil y estadísticas | CampulseHub";
    pageDescription = `lexy_fox2 es una de las modelos más vistas en CampulseHub. ${isLive ? `Ahora mismo con ${viewers.toLocaleString("es")} viewers en vivo. ` : ""}Sigue sus estadísticas, historial y mejor horario en tiempo real.`;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: username === LEXY_USER ? "lexy_fox2 — Modelo destacada en CampulseHub" : `${name} — Stats en Chaturbate`,
    description: pageDescription,
    url: `${SITE}/model/${username}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campulse", item: SITE },
        ...(countryName && countryCode
          ? [{ "@type": "ListItem", position: 2, name: countryName, item: `${SITE}/country/${countryCode.toLowerCase()}` }]
          : []),
        { "@type": "ListItem", position: countryName ? 3 : 2, name, item: `${SITE}/model/${username}` },
      ],
    },
    mainEntity: {
      "@type": "Person",
      name,
      identifier: username,
      url: `https://chaturbate.com/${username}/`,
      ...(countryName && { nationality: countryName }),
      ...(followers != null && {
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: followers,
        },
      }),
    },
    ...(snapCount > 0 && { dateModified: last.captured_at ?? undefined }),
  };

  function fmtDate(iso) {
    if (!iso) return "--";
    const d = new Date(iso);
    if (isNaN(d)) return "--";
    return d.toLocaleString("es-CO", { timeZone: "America/Bogota", hour12: false });
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {username === LEXY_USER ? (
          <>
            <meta name="keywords" content="lexy_fox2, lexy fox, modelo en vivo, chaturbate, campulse, webcam latina" />
            <meta name="robots" content="index,follow,max-image-preview:large" />
            <meta property="og:image" content={`https://thumb.live.mmcdn.com/riw/lexy_fox2.jpg`} />
          </>
        ) : (
          <meta
            name="robots"
            content={shouldIndex ? "index, follow" : "noindex, nofollow"}
          />
        )}
        <link rel="canonical" href={`${SITE}/model/${username}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/model/${username}`} />
        <meta property="og:type" content="profile" />
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
          {countryName && countryCode && (
            <>
              <span style={styles.sep}> › </span>
              <a href={`/country/${countryCode.toLowerCase()}`} style={styles.link}>
                {flag} {countryName}
              </a>
            </>
          )}
          <span style={styles.sep}> › </span>
          <span>{name}</span>
        </nav>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.h1}>{name}</h1>
            {isLive && (
              <span style={styles.liveBadge}>🔴 EN VIVO</span>
            )}
          </div>
          {name !== username && (
            <div style={styles.handle}>@{username}</div>
          )}
          <div style={styles.tags}>
            {genderLabel && <span style={styles.tag}>{genderLabel}</span>}
            {countryName && countryCode && (
              <a href={`/country/${countryCode.toLowerCase()}`} style={styles.tagLink}>
                {flag} {countryName}
              </a>
            )}
            {langSlug ? (
              <a href={`/language/${langSlug}`} style={styles.tagLink}>🗣 {langName}</a>
            ) : languages ? (
              <span style={styles.tag}>🗣 {languages}</span>
            ) : null}
          </div>
        </div>

        {/* Métricas */}
        <section style={styles.metrics}>
          {[
            ["Viewers ahora", viewers],
            ["Seguidores",    followers],
            ["Peak viewers",  peakViewers],
            ["Snapshots",     snapCount || null],
          ].map(([label, val]) => (
            <div key={label} style={styles.metricCard}>
              <div style={styles.metricVal}>
                {val != null ? val.toLocaleString("es") : "--"}
              </div>
              <div style={styles.metricLabel}>{label}</div>
            </div>
          ))}
        </section>

        {/* Sparkline */}
        {sparkData.length >= 2 && (
          <section style={styles.sparkSection}>
            <div style={styles.sparkHeader}>
              <span style={styles.h2label}>Viewers últimos 30 días</span>
              {peakViewers != null && (
                <span style={styles.sparkPeak}>Máx: {peakViewers.toLocaleString("es")}</span>
              )}
            </div>
            <Sparkline data={sparkData} />
          </section>
        )}

        {/* CTA */}
        <a
          href={`https://chaturbate.com/${username}/?campaign=rI8z3&track=default`}
          target="_blank"
          rel="noopener noreferrer"
          style={isLive ? styles.ctaLive : styles.cta}
        >
          {isLive ? "🔴 Ver sala en vivo" : "Ver sala en Chaturbate"}
        </a>

        {/* Embed en vivo — solo cuando está online */}
        {isLive && (
          <section style={styles.embedSection}>
            <div style={styles.embedHeader}>
              <span style={styles.liveDot}>●</span>
              <span style={styles.embedLabel}>En vivo ahora · {viewers?.toLocaleString("es")} viewers</span>
            </div>
            <div style={styles.embedWrap}>
              <iframe
                src={`https://chaturbate.com/in/?tour=dT8X&campaign=rI8z3&room=${username}&bgcolor=black`}
                style={styles.embedFrame}
                allowFullScreen
                frameBorder="0"
                scrolling="no"
                title={`${name} en vivo en Chaturbate`}
              />
            </div>
            <p style={styles.embedNote}>
              Al ver el stream en Campulse, apoyas a {name} directamente.
            </p>
          </section>
        )}

        {/* Mejores horarios */}
        {bestHours.length > 0 && (
          <>
            <h2 style={{ ...styles.h2label, marginTop: 32, marginBottom: 12 }}>
              Mejores horarios (EST)
            </h2>
            {bestHours.slice(0, 5).map((h, i) => (
              <div key={i} style={styles.hourRow}>
                <span>
                  {days[h.day_of_week]}{" "}
                  {String(h.hour_est ?? 0).padStart(2, "0")}:00 EST
                </span>
                <span style={{ color: "#a78bfa" }}>
                  {Math.round(h.avg_viewers)} viewers
                </span>
              </div>
            ))}
          </>
        )}

        {/* Historial con barras */}
        {history.length > 0 && (
          <>
            <h2 style={{ ...styles.h2label, marginTop: 32, marginBottom: 12 }}>
              Historial reciente
            </h2>
            {history
              .slice(-15)
              .reverse()
              .map((r, i) => {
                const pct = histMax > 0 ? ((r.num_users ?? 0) / histMax) * 100 : 0;
                return (
                  <div key={i} style={styles.histRow}>
                    <div style={styles.histDate}>{fmtDate(r.captured_at)}</div>
                    <div style={styles.histBar}>
                      <div style={{ ...styles.histBarFill, width: `${pct}%` }} />
                    </div>
                    <div style={styles.histViewers}>
                      {(r.num_users ?? 0).toLocaleString("es")}
                    </div>
                  </div>
                );
              })}
          </>
        )}

        {/* ── Modelos similares ─────────────────────────────────────────────── */}
        {similarModels.length > 0 && (
          <section style={styles.similarSection}>
            <h2 style={styles.similarTitle}>
              {countryName
                ? `Más modelos de ${countryName} en vivo ahora`
                : "Modelos similares en vivo"}
            </h2>
            <div style={styles.similarGrid}>
              {similarModels.map((m) => {
                const mFlag = countryCodeToFlag(m.country || "");
                return (
                  <a
                    key={m.username}
                    href={`/model/${m.username}`}
                    style={styles.similarCard}
                  >
                    <div style={styles.similarName}>
                      {m.display_name || m.username}
                    </div>
                    <div style={styles.similarHandle}>@{m.username}</div>
                    <div style={styles.similarViewers}>
                      👁 {(m.num_users ?? 0).toLocaleString("es")} viewers
                    </div>
                    {m.country && (
                      <div style={styles.similarCountry}>
                        {mFlag} {m.country.toUpperCase()}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
            {countryCode && (
              <p style={{ textAlign: "center", marginTop: 16 }}>
                <a href={`/country/${countryCode.toLowerCase()}`} style={styles.link}>
                  Ver todas las modelos de {countryName} →
                </a>
              </p>
            )}
          </section>
        )}

        {/* Links a categorías */}
        <div style={styles.categoryLinks}>
          {countryName && countryCode && (
            <a href={`/country/${countryCode.toLowerCase()}`} style={styles.countryLink}>
              {flag} Ver más modelos de {countryName} →
            </a>
          )}
          {langSlug && (
            <a href={`/language/${langSlug}`} style={styles.countryLink}>
              🗣 Ver modelos en {langName} →
            </a>
          )}
          <a href="/" style={{ ...styles.countryLink, color: "#666", fontSize: 13 }}>
            ← Volver al inicio
          </a>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: { fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: "2rem 1rem", background: "#0d0d0d", minHeight: "100vh", color: "#f0f0f0" },
  breadcrumbs: { fontSize: 13, color: "#888", marginBottom: 16 },
  link: { color: "#a78bfa", textDecoration: "none" },
  sep: { color: "#555", margin: "0 4px" },
  header: { marginBottom: 24 },
  headerTop: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 28, marginTop: 8, marginBottom: 4 },
  liveBadge: { background: "#ff000022", border: "1px solid #ff4444", color: "#ff6666", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  handle: { fontSize: 13, color: "#666", marginBottom: 10 },
  tags: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  tag: { background: "#1a1a2e", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#aaa" },
  tagLink: { background: "#1a1a2e", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#a78bfa", textDecoration: "none" },
  metrics: { display: "flex", gap: 12, margin: "24px 0", flexWrap: "wrap" },
  metricCard: { background: "#1a1a2e", borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 110 },
  metricVal: { fontSize: 24, fontWeight: 700, color: "#a78bfa" },
  metricLabel: { fontSize: 11, color: "#666", marginTop: 4 },
  h2label: { fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  sparkSection: { background: "#111", borderRadius: 12, padding: "16px 20px", marginBottom: 24 },
  sparkHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sparkPeak: { fontSize: 12, color: "#a78bfa" },
  cta: { display: "block", background: "#1a1a2e", border: "1px solid #333", color: "#a78bfa", textAlign: "center", padding: "14px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 16, marginTop: 28 },
  ctaLive: { display: "block", background: "#a78bfa", color: "#000", textAlign: "center", padding: "14px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 16, marginTop: 28 },
  hourRow: { background: "#1a1a2e", borderRadius: 8, padding: "10px 16px", display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 },
  histRow: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: "1px solid #1a1a1a" },
  histDate: { fontSize: 11, color: "#555", width: 140, flexShrink: 0 },
  histBar: { flex: 1, background: "#1a1a2e", borderRadius: 4, height: 6, overflow: "hidden" },
  histBarFill: { height: "100%", background: "#a78bfa", borderRadius: 4, minWidth: 2 },
  histViewers: { fontSize: 12, color: "#a78bfa", width: 50, textAlign: "right", flexShrink: 0 },
  categoryLinks: { display: "flex", flexDirection: "column", gap: 8, marginTop: 28 },
  countryLink: { display: "block", textAlign: "center", color: "#a78bfa", fontSize: 14, textDecoration: "none" },
  // Modelos similares
  // Embed en vivo
  embedSection: { marginTop: 24, marginBottom: 8 },
  embedHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  liveDot: { color: "#ef4444", fontSize: 10, animation: "pulse 2s infinite" },
  embedLabel: { fontSize: 13, color: "#aaa", fontWeight: 600 },
  embedWrap: { position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 12, background: "#111" },
  embedFrame: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 12 },
  embedNote: { fontSize: 11, color: "#444", marginTop: 8, textAlign: "center" },
  // Modelos similares
  similarSection: { marginTop: 40, paddingTop: 28, borderTop: "1px solid #1a1a1a" },
  similarTitle: { fontSize: 15, color: "#ccc", marginBottom: 16, fontWeight: 600 },
  similarGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 },
  similarCard: { background: "#1a1a2e", borderRadius: 10, padding: "12px 14px", textDecoration: "none", color: "#f0f0f0", display: "block" },
  similarName: { fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  similarHandle: { fontSize: 11, color: "#555", marginBottom: 6 },
  similarViewers: { fontSize: 12, color: "#a78bfa", marginBottom: 2 },
  similarCountry: { fontSize: 11, color: "#666" },
};
