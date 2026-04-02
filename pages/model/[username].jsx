// pages/model/[username].jsx
//
// Cambios respecto a la versión anterior:
//   · canonical tag → evita contenido duplicado con vercel.app
//   · title y description con datos reales (viewers, seguidores, mejor horario)
//   · Schema.org ProfilePage → habilita rich results en Google
//   · base de APIs apunta a campulsehub.com (no a vercel.app)

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

export async function getServerSideProps({ params }) {
  const { username } = params;

  // ─── IMPORTANTE: apunta a tu dominio de producción, NO a vercel.app ────────
  // Esto también evita que el servidor haga llamadas internas a la URL pública
  // de Vercel, que puedes bloquear sin afectar el funcionamiento del sitio.
  const base = SITE;

  try {
    const [h, b] = await Promise.all([
      fetch(base + "/api/history?username=" + encodeURIComponent(username)),
      fetch(base + "/api/best-hours?username=" + encodeURIComponent(username)),
    ]);
    return {
      props: {
        username,
        history: h.ok ? await h.json() : [],
        bestHours: b.ok ? await b.json() : [],
      },
    };
  } catch {
    return { props: { username, history: [], bestHours: [] } };
  }
}

export default function ModelPage({ username, history, bestHours }) {
  const last = history[history.length - 1] || {};
  const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

  // ── Datos para SEO ──────────────────────────────────────────────────────────
  const viewers = last.num_users ?? null;
  const followers = last.num_followers ?? null;
  const snapshotCount = history.length;
  const topHour = bestHours[0];

  // Title: informativo y diferenciado por modelo
  const pageTitle = viewers != null
    ? `${username} en Chaturbate — ${viewers} viewers ahora | Campulse`
    : `${username} Stats en Chaturbate | Campulse`;

  // Description: usa datos reales cuando existen
  let pageDescription = `Estadísticas en tiempo real de ${username} en Chaturbate.`;
  if (followers != null) {
    pageDescription += ` ${followers.toLocaleString("es")} seguidores.`;
  }
  if (topHour) {
    pageDescription += ` Mejor horario: ${days[topHour.day_of_week]} a las ${String(topHour.hour_est ?? 0).padStart(2, "0")}:00 EST con ${Math.round(topHour.avg_viewers)} viewers promedio.`;
  }
  if (snapshotCount > 0) {
    pageDescription += ` ${snapshotCount} snapshots registrados en los últimos 30 días.`;
  }

  // ── Schema.org ProfilePage ──────────────────────────────────────────────────
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": `${username} — Stats en Chaturbate`,
    "description": pageDescription,
    "url": `${SITE}/model/${username}`,
    "mainEntity": {
      "@type": "Person",
      "name": username,
      "identifier": username,
      "url": `https://chaturbate.com/${username}/`,
      ...(followers != null && {
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/FollowAction",
          "userInteractionCount": followers,
        },
      }),
    },
    ...(snapshotCount > 0 && {
      "dateModified": last.captured_at ?? undefined,
    }),
  };

  // ── Helpers de formato ──────────────────────────────────────────────────────
  function fmtDate(iso) {
    if (!iso) return "--";
    const d = new Date(iso);
    if (isNaN(d)) return "--";
    return d.toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      hour12: false,
    });
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />

        {/* ── Canonical: siempre apunta a campulsehub.com ── */}
        <link rel="canonical" href={`${SITE}/model/${username}`} />

        {/* ── Open Graph (compartir en redes) ── */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${SITE}/model/${username}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="Campulse" />

        {/* ── Schema.org ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main
        style={{
          fontFamily: "sans-serif",
          maxWidth: 700,
          margin: "0 auto",
          padding: "2rem 1rem",
          background: "#0d0d0d",
          minHeight: "100vh",
          color: "#f0f0f0",
        }}
      >
        <a href="/" style={{ color: "#a78bfa", fontSize: 14 }}>
          Campulse
        </a>

        <h1 style={{ fontSize: 28, marginTop: 16 }}>{username}</h1>

        {/* ── Métricas principales ── */}
        <section
          style={{
            display: "flex",
            gap: 16,
            margin: "24px 0",
            flexWrap: "wrap",
          }}
        >
          {[
            ["Viewers", viewers],
            ["Seguidores", followers],
            ["Snapshots", snapshotCount || null],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                background: "#1a1a2e",
                borderRadius: 10,
                padding: "16px 24px",
                flex: 1,
                minWidth: 120,
              }}
            >
              <div
                style={{ fontSize: 26, fontWeight: 700, color: "#a78bfa" }}
              >
                {val != null ? val.toLocaleString("es") : "--"}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {label}
              </div>
            </div>
          ))}
        </section>

        {/* ── Mejores horarios ── */}
        {bestHours.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, color: "#888", marginBottom: 12 }}>
              Mejores horarios (EST)
            </h2>
            {bestHours.slice(0, 5).map((h, i) => (
              <div
                key={i}
                style={{
                  background: "#1a1a2e",
                  borderRadius: 8,
                  padding: "10px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
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

        {/* ── Historial reciente ── */}
        {history.length > 0 && (
          <>
            <h2
              style={{ fontSize: 16, color: "#888", margin: "24px 0 12px" }}
            >
              Historial reciente
            </h2>
            {history
              .slice(-10)
              .reverse()
              .map((r, i) => (
                <div
                  key={i}
                  style={{
                    borderTop: "1px solid #222",
                    padding: "8px 0",
                    fontSize: 14,
                  }}
                >
                  {fmtDate(r.captured_at)} —{" "}
                  <span style={{ color: "#a78bfa" }}>{r.num_users}</span>{" "}
                  viewers
                </div>
              ))}
          </>
        )}

        {/* ── CTA ── */}
        <a
          href={`https://chaturbate.com/${username}/?campaign=rI8z3&track=default`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            background: "#a78bfa",
            color: "#000",
            textAlign: "center",
            padding: "14px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 16,
            marginTop: 24,
          }}
        >
          Ver sala en vivo
        </a>
      </main>
    </>
  );
}
