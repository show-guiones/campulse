// pages/tag/[tag].jsx
//
// Refactor: getServerSideProps consulta Supabase directamente (sin fetch interno).
// Antes: SSR → /api/tag → Supabase  (2 saltos de red)
// Ahora: SSR → Supabase  (1 salto directo)
//
// El endpoint /api/tag se conserva para uso desde el cliente (app.html, etc.)

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const COUNTRY_FLAGS = {
  CO:"🇨🇴",ES:"🇪🇸",MX:"🇲🇽",AR:"🇦🇷",BR:"🇧🇷",US:"🇺🇸",
  RO:"🇷🇴",RU:"🇷🇺",DE:"🇩🇪",FR:"🇫🇷",GB:"🇬🇧",CL:"🇨🇱",
  PE:"🇵🇪",VE:"🇻🇪",PH:"🇵🇭",UA:"🇺🇦",HU:"🇭🇺",PL:"🇵🇱",
};

export async function getServerSideProps({ params }) {
  const { tag } = params;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { props: { tag, models: [] } };
  }

  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?captured_at=gte.${since}` +
      `&tags=cs.{"${tag}"}` +
      `&select=username,display_name,num_users,country,gender` +
      `&order=num_users.desc` +
      `&limit=100`;

    const r = await fetch(url, { headers: sbHeaders });
    const data = r.ok ? await r.json() : [];

    // Deduplicar por username
    const seen = new Set();
    const models = (Array.isArray(data) ? data : []).filter((row) => {
      if (seen.has(row.username)) return false;
      seen.add(row.username);
      return true;
    });

    return { props: { tag, models } };
  } catch {
    return { props: { tag, models: [] } };
  }
}

export default function TagPage({ tag, models }) {
  const title = `Modelos #${tag} en Chaturbate — ${models.length} en vivo | Campulse`;
  const description = `${models.length} modelos con el tag "${tag}" en vivo ahora en Chaturbate. Viewers, países y estadísticas en tiempo real.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/tag/${tag}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE}/tag/${tag}`} />
      </Head>

      <main style={styles.main}>
        <nav style={styles.breadcrumb}>
          <a href="/app.html" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <span>#{tag}</span>
        </nav>

        <h1 style={styles.h1}>#{tag}</h1>
        <p style={styles.sub}>
          {models.length > 0
            ? `${models.length} modelos en vivo ahora`
            : "No hay modelos en vivo con este tag ahora mismo"}
        </p>

        <div style={styles.grid}>
          {models.map((m) => (
            <a key={m.username} href={`/model/${m.username}`} style={styles.card}>
              <div style={styles.name}>{m.display_name || m.username}</div>
              <div style={styles.handle}>@{m.username}</div>
              <div style={styles.viewers}>
                👁 {(m.num_users ?? 0).toLocaleString("es")} viewers
              </div>
              {m.country && (
                <div style={styles.country}>
                  {COUNTRY_FLAGS[m.country?.toUpperCase()] || ""} {m.country?.toUpperCase()}
                </div>
              )}
            </a>
          ))}
        </div>

        {models.length === 0 && (
          <div style={styles.empty}>
            Vuelve más tarde — los datos se actualizan cada 2 horas.
          </div>
        )}

        <div style={styles.back}>
          <a href="/app.html" style={styles.link}>← Volver al inicio</a>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: { fontFamily:"sans-serif", maxWidth:900, margin:"0 auto", padding:"2rem 1rem", background:"#0d0d0d", minHeight:"100vh", color:"#f0f0f0" },
  breadcrumb: { fontSize:13, color:"#888", marginBottom:16 },
  link: { color:"#a78bfa", textDecoration:"none" },
  sep: { color:"#555", margin:"0 4px" },
  h1: { fontSize:32, fontWeight:800, margin:"0 0 8px" },
  sub: { color:"#888", fontSize:14, marginBottom:28 },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:12 },
  card: { background:"#1a1a2e", borderRadius:12, padding:"16px", textDecoration:"none", color:"#f0f0f0", display:"block" },
  name: { fontWeight:700, fontSize:15, marginBottom:4 },
  handle: { fontSize:12, color:"#666", marginBottom:8 },
  viewers: { fontSize:13, color:"#a78bfa", marginBottom:4 },
  country: { fontSize:12, color:"#888" },
  empty: { textAlign:"center", color:"#555", padding:"48px 0", fontSize:14 },
  back: { marginTop:32, textAlign:"center" },
};
