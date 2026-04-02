// pages/model/[username].jsx
//
// Cambios respecto a versiones anteriores:
//   · Trae country, display_name y gender del snapshot más reciente
//   · Link a la página de categoría del país del modelo
//   · Link a la página de idioma del modelo
//   · canonical tag → evita duplicados con vercel.app
//   · title y description con datos reales (viewers, seguidores, mejor horario)
//   · Schema.org ProfilePage → habilita rich results en Google
//   · Open Graph para compartir en redes
//   · base de APIs apunta a campulsehub.com

import Head from "next/head";

// Detecta el slug de idioma desde el campo spoken_languages de Supabase
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

const GENDER_LABELS = {
  f: "Mujer", m: "Hombre", c: "Pareja", t: "Trans",
};

function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65))
    .join("");
}

export async function getServerSideProps({ params }) {
  const { username } = params;
  const base = SITE;

  try {
    const [h, b, s] = await Promise.all([
      fetch(`${base}/api/history?username=${encodeURIComponent(username)}`),
      fetch(`${base}/api/best-hours?username=${encodeURIComponent(username)}`),
      // Trae el snapshot más reciente para obtener country, gender, display_name
      fetch(
        `${process.env.SUPABASE_URL}/rest/v1/rooms_snapshot` +
        `?username=eq.${encodeURIComponent(username)}` +
        `&select=country,gender,display_name,spoken_languages` +
        `&order=captured_at.desc&limit=1`,
        {
          headers: {
            apikey: process.env.SUPABASE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
          },
        }
      ),
    ]);

    const history   = h.ok ? await h.json() : [];
    const bestHours = b.ok ? await b.json() : [];
    const snapRows  = s.ok ? await s.json() : [];
    const snap      = Array.isArray(snapRows) ? snapRows[0] || {} : {};

    return {
      props: {
        username,
        history,
        bestHours,
        country:     snap.country        || "",
        gender:      snap.gender         || "",
        displayName: snap.display_name   || "",
        languages:   snap.spoken_languages || "",
      },
    };
  } catch {
    return {
      props: {
        username,
        history: [],
        bestHours: [],
        country: "",
        gender: "",
        displayName: "",
        languages: "",
      },
    };
  }
}

export default function ModelPage({
  username, history, bestHours,
  country, gender, displayName, languages,
}) {
  const last      = history[history.length - 1] || {};
  const days      = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const viewers   = last.num_users    ?? null;
  const followers = last.num_followers ?? null;
  const snapCount = history.length;
  const topHour   = bestHours[0];

  const countryCode = (country || "").toUpperCase().trim();
  const countryName = COUNTRY_NAMES[countryCode] || countryCode || null;
  const flag        = countryCodeToFlag(countryCode);
  const genderLabel = GENDER_LABELS[gender] || null;
  const name        = displayName || username;
  const langSlug    = detectLangSlug(languages);
  const langName    = langSlug ? LANG_NAMES[langSlug] : null;

  // ── SEO ───────────────────────────────────────────────────────────────────
  const pageTitle = viewers != null
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

  // ── Schema.org ProfilePage ────────────────────────────────────────────────
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${name} — Stats en Chaturbate`,
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
        <meta name="robots" content="index, follow" />
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
          <h1 style={styles.h1}>{name}</h1>
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
            {languages && langSlug ? (
              <a href={`/language/${langSlug}`} style={styles.tagLink}>🗣 {langName}</a>
            ) : languages ? (
              <span style={styles.tag}>🗣 {languages}</span>
            ) : null}
          </div>
        </div>

        {/* Métricas */}
        <section style={styles.metrics}>
          {[
            ["Viewers", viewers],
            ["Seguidores", followers],
            ["Snapshots", snapCount || null],
          ].map(([label, val]) => (
            <div key={label} style={styles.metricCard}>
              <div style={styles.metricVal}>
                {val != null ? val.toLocaleString("es") : "--"}
              </div>
              <div style={styles.metricLabel}>{label}</div>
            </div>
          ))}
        </section>

        {/* Mejores horarios */}
        {bestHours.length > 0 && (
          <>
            <h2 style={styles.h2}>Mejores horarios (EST)</h2>
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

        {/* Historial reciente */}
        {history.length > 0 && (
          <>
            <h2 style={{ ...styles.h2, marginTop: 28 }}>Historial reciente</h2>
            {history
              .slice(-10)
              .reverse()
              .map((r, i) => (
                <div key={i} style={styles.historyRow}>
                  {fmtDate(r.captured_at)} —{" "}
                  <span style={{ color: "#a78bfa" }}>{r.num_users}</span> viewers
                </div>
              ))}
          </>
        )}

        {/* CTA Chaturbate */}
        <a
          href={`https://chaturbate.com/${username}/?campaign=rI8z3&track=default`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.cta}
        >
          Ver sala en vivo
        </a>

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
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    fontFamily: "sans-serif",
    maxWidth: 700,
    margin: "0 auto",
    padding: "2rem 1rem",
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#f0f0f0",
  },
  breadcrumbs: { fontSize: 13, color: "#888", marginBottom: 16 },
  link: { color: "#a78bfa", textDecoration: "none" },
  sep: { color: "#555", margin: "0 4px" },
  header: { marginBottom: 24 },
  h1: { fontSize: 28, marginTop: 8, marginBottom: 4 },
  handle: { fontSize: 13, color: "#666", marginBottom: 10 },
  tags: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  tag: {
    background: "#1a1a2e",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    color: "#aaa",
  },
  tagLink: {
    background: "#1a1a2e",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    color: "#a78bfa",
    textDecoration: "none",
  },
  metrics: { display: "flex", gap: 16, margin: "24px 0", flexWrap: "wrap" },
  metricCard: {
    background: "#1a1a2e",
    borderRadius: 10,
    padding: "16px 24px",
    flex: 1,
    minWidth: 120,
  },
  metricVal: { fontSize: 26, fontWeight: 700, color: "#a78bfa" },
  metricLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  h2: { fontSize: 15, color: "#888", marginBottom: 12 },
  hourRow: {
    background: "#1a1a2e",
    borderRadius: 8,
    padding: "10px 16px",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
  },
  historyRow: {
    borderTop: "1px solid #222",
    padding: "8px 0",
    fontSize: 14,
  },
  cta: {
    display: "block",
    background: "#a78bfa",
    color: "#000",
    textAlign: "center",
    padding: "14px",
    borderRadius: 10,
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 16,
    marginTop: 28,
  },
  categoryLinks: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 16,
  },
  countryLink: {
    display: "block",
    textAlign: "center",
    color: "#a78bfa",
    fontSize: 14,
    textDecoration: "none",
  },
};
