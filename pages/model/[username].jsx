import Head from "next/head";

export async function getServerSideProps({ params }) {
  const { username } = params;
  const base = "https://campulse-sooty.vercel.app";
  try {
    const [h, b] = await Promise.all([
      fetch(base + "/api/history?username=" + username),
      fetch(base + "/api/best-hours?username=" + username),
    ]);
    return { props: { username, history: h.ok ? await h.json() : [], bestHours: b.ok ? await b.json() : [] } };
  } catch { return { props: { username, history: [], bestHours: [] } }; }
}

export default function M({ username, history, bestHours }) {
  const l = history[history.length - 1] || {};
  const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  function fmtDate(iso) {
    if (!iso) return "--";
    const d = new Date(iso);
    if (isNaN(d)) return "--";
    return d.toLocaleString("es-CO", { timeZone: "America/Bogota", hour12: false });
  }
  return (
    <>
      <Head>
        <title>{username + " Stats - Campulse"}</title>
        <meta name="description" content={"Stats de " + username + " en Chaturbate."} />
        <meta name="robots" content="index, follow" />
      </Head>
      <main style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: "2rem 1rem", background: "#0d0d0d", minHeight: "100vh", color: "#f0f0f0" }}>
        <a href="/" style={{ color: "#a78bfa", fontSize: 14 }}>Campulse</a>
        <h1 style={{ fontSize: 28, marginTop: 16 }}>{username}</h1>
        <section style={{ display: "flex", gap: 16, margin: "24px 0", flexWrap: "wrap" }}>
          {[["Viewers", l.num_users], ["Seguidores", l.num_followers], ["Snapshots", history.length]].map(([label, val]) => (
            <div key={label} style={{ background: "#1a1a2e", borderRadius: 10, padding: "16px 24px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#a78bfa" }}>{val ?? "--"}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </section>
        {bestHours.length > 0 && (<>
          <h2 style={{ fontSize: 16, color: "#888", marginBottom: 12 }}>Mejores horarios (EST)</h2>
          {bestHours.slice(0, 5).map((h, i) => (
            <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: "10px 16px", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>{days[h.day_of_week]} {String(h.hour_est ?? 0).padStart(2, "0")}:00 EST</span>
              <span style={{ color: "#a78bfa" }}>{Math.round(h.avg_viewers)} viewers</span>
            </div>
          ))}
        </>)}
        {history.length > 0 && (<>
          <h2 style={{ fontSize: 16, color: "#888", margin: "24px 0 12px" }}>Historial reciente</h2>
          {history.slice(-10).reverse().map((r, i) => (
            <div key={i} style={{ borderTop: "1px solid #222", padding: "8px 0", fontSize: 14 }}>
              {fmtDate(r.captured_at)} - {r.num_users} viewers
            </div>
          ))}
        </>)}
        <a href={"https://chaturbate.com/" + username + "/?campaign=rI8z3&track=default"} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", background: "#a78bfa", color: "#000", textAlign: "center", padding: "14px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 16, marginTop: 24 }}>
          Ver sala en vivo
        </a>
      </main>
    </>
  );
}
