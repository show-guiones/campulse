// pages/search.jsx
import Head from "next/head";
import { useState } from "react";

const SITE = "https://www.campulsehub.com";

const COUNTRY_FLAGS = {
  CO:"🇨🇴",ES:"🇪🇸",MX:"🇲🇽",AR:"🇦🇷",BR:"🇧🇷",US:"🇺🇸",
  RO:"🇷🇴",RU:"🇷🇺",DE:"🇩🇪",FR:"🇫🇷",GB:"🇬🇧",CL:"🇨🇱",
  PE:"🇵🇪",VE:"🇻🇪",PH:"🇵🇭",UA:"🇺🇦",HU:"🇭🇺",PL:"🇵🇱",
};

export default function SearchPage() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await r.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const title = "Buscar modelos de Chaturbate | Campulse";
  const description = "Busca modelos de Chaturbate por nombre de usuario. Estadísticas en tiempo real: viewers, seguidores y mejores horarios.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE}/search`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE}/search`} />
      </Head>

      <main style={styles.main}>
        <nav style={styles.breadcrumb}>
          <a href="/" style={styles.link}>Campulse</a>
          <span style={styles.sep}> › </span>
          <span>Buscar</span>
        </nav>

        <h1 style={styles.h1}>Buscar modelos</h1>
        <p style={styles.sub}>Encuentra modelos de Chaturbate por nombre de usuario</p>

        <form onSubmit={handleSearch} style={styles.form}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe un username..."
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {searched && !loading && results.length === 0 && (
          <p style={styles.empty}>No se encontraron modelos con ese nombre.</p>
        )}

        <div style={styles.grid}>
          {results.map((m) => (
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

        <div style={styles.back}>
          <a href="/" style={styles.link}>← Volver al inicio</a>
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
  form: { display:"flex", gap:10, marginBottom:28 },
  input: { flex:1, padding:"12px 16px", borderRadius:10, border:"1px solid #333", background:"#1a1a2e", color:"#f0f0f0", fontSize:15, outline:"none" },
  button: { padding:"12px 24px", borderRadius:10, background:"#a78bfa", color:"#000", fontWeight:700, fontSize:15, border:"none", cursor:"pointer" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:12 },
  card: { background:"#1a1a2e", borderRadius:12, padding:"16px", textDecoration:"none", color:"#f0f0f0", display:"block" },
  name: { fontWeight:700, fontSize:15, marginBottom:4 },
  handle: { fontSize:12, color:"#666", marginBottom:8 },
  viewers: { fontSize:13, color:"#a78bfa", marginBottom:4 },
  country: { fontSize:12, color:"#888" },
  empty: { textAlign:"center", color:"#555", padding:"32px 0", fontSize:14 },
  back: { marginTop:32, textAlign:"center" },
};
