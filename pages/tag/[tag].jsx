// pages/tag/[tag].jsx — Rediseño visual completo
// Mantiene exactamente la misma lógica de datos (getServerSideProps sin cambios)

import Head from "next/head";
import { useState } from "react";

const SITE = "https://www.campulsehub.com";

const COUNTRY_FLAGS = {
  CO:"🇨🇴",ES:"🇪🇸",MX:"🇲🇽",AR:"🇦🇷",BR:"🇧🇷",US:"🇺🇸",
  RO:"🇷🇴",RU:"🇷🇺",DE:"🇩🇪",FR:"🇫🇷",GB:"🇬🇧",CL:"🇨🇱",
  PE:"🇵🇪",VE:"🇻🇪",PH:"🇵🇭",UA:"🇺🇦",HU:"🇭🇺",PL:"🇵🇱",
};

const RELATED_TAGS = {
  latina:   ["colombia","spanish","bigass","brunette","lovense"],
  bigboobs: ["curvy","milf","lovense","squirt","latina"],
  ebony:    ["bigass","squirt","lovense","teen","curvy"],
  teen:     ["18","cute","lovense","smalltits","young"],
  curvy:    ["bigass","bbw","latina","lovense","bigboobs"],
  lovense:  ["squirt","bigass","latina","teen","ebony"],
  squirt:   ["lovense","bigass","latina","ebony","curvy"],
  colombia: ["latina","spanish","lovense","bigass","brunette"],
  anal:     ["bigass","lovense","squirt","latina","teen"],
  lesbians: ["lovense","squirt","bigboobs","curvy","ebony"],
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

function ModelCard({ model, index }) {
  const flag = COUNTRY_FLAGS[model.country?.toUpperCase()] || "";
  const viewers = (model.num_users ?? 0).toLocaleString("es");
  const isHot = (model.num_users ?? 0) > 500;

  return (
    <a
      href={`/model/${model.username}`}
      className="model-card"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="card-avatar">
        <span className="avatar-letter">
          {(model.display_name || model.username).charAt(0).toUpperCase()}
        </span>
        <span className="live-dot" />
      </div>

      <div className="card-body">
        <div className="card-name">
          {model.display_name || model.username}
          {isHot && <span className="hot-badge">🔥</span>}
        </div>
        <div className="card-handle">@{model.username}</div>

        <div className="card-stats">
          <span className="viewers-count">
            <span className="viewers-icon">👁</span>
            {viewers}
          </span>
          {model.country && (
            <span className="country-tag">
              {flag} {model.country.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="card-arrow">›</div>
    </a>
  );
}

function EmptyState({ tag }) {
  return (
    <div className="empty-state">
      <div className="empty-pulse">
        <span className="empty-icon">📡</span>
      </div>
      <h2 className="empty-title">Sin modelos en vivo ahora</h2>
      <p className="empty-desc">
        No hay nadie con <strong>#{tag}</strong> en este momento.<br />
        Los datos se actualizan cada 2 horas.
      </p>
      <div className="empty-timer">
        <span className="timer-dot" />
        Próxima actualización en menos de 2h
      </div>
    </div>
  );
}

export default function TagPage({ tag, models }) {
  const [sortBy, setSortBy] = useState("viewers");
  const title = `Modelos #${tag} en Chaturbate — ${models.length} en vivo | Campulse`;
  const description = `${models.length} modelos con el tag "${tag}" en vivo ahora en Chaturbate. Viewers, países y estadísticas en tiempo real.`;

  const relatedTags = RELATED_TAGS[tag] || [];
  const totalViewers = models.reduce((acc, m) => acc + (m.num_users ?? 0), 0);

  const sorted = [...models].sort((a, b) => {
    if (sortBy === "viewers") return (b.num_users ?? 0) - (a.num_users ?? 0);
    if (sortBy === "az") return (a.display_name || a.username).localeCompare(b.display_name || b.username);
    return 0;
  });

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #080810;
          --surface:   #0f0f1a;
          --surface2:  #151525;
          --border:    rgba(120, 100, 255, 0.12);
          --accent:    #7c5cfc;
          --accent2:   #c084fc;
          --text:      #eeeef5;
          --muted:     #6b6b85;
          --live:      #22c55e;
          --hot:       #f97316;
          --font-head: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        /* ─── NOISE TEXTURE OVERLAY ──────────────────────────── */
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        /* ─── AMBIENT GLOW ───────────────────────────────────── */
        .ambient {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          pointer-events: none;
          z-index: 0;
        }

        /* ─── LAYOUT ─────────────────────────────────────────── */
        .page {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          padding: 2rem 1.25rem 4rem;
        }

        /* ─── BREADCRUMB ─────────────────────────────────────── */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 2rem;
          font-family: var(--font-body);
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .breadcrumb a {
          color: var(--accent2);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .breadcrumb a:hover { opacity: 0.75; }
        .breadcrumb-sep { color: #333; }

        /* ─── HERO HEADER ────────────────────────────────────── */
        .hero {
          margin-bottom: 2.5rem;
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(124,92,252,0.15), rgba(192,132,252,0.08));
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 6px 16px 6px 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--accent2);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .tag-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--live);
          animation: pulse 1.8s infinite;
        }

        .hero-title {
          font-family: var(--font-head);
          font-size: clamp(2.4rem, 7vw, 4.2rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #fff 0%, var(--accent2) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
        }
        .stat-pill-label { color: var(--muted); font-weight: 400; }
        .stat-pill-value { color: var(--text); }

        /* ─── CONTROLS BAR ───────────────────────────────────── */
        .controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .controls-left {
          font-size: 13px;
          color: var(--muted);
        }
        .controls-left strong { color: var(--text); }

        .sort-group {
          display: flex;
          gap: 6px;
        }
        .sort-btn {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--muted);
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
          letter-spacing: 0.03em;
        }
        .sort-btn:hover { border-color: var(--accent); color: var(--text); }
        .sort-btn.active {
          background: rgba(124,92,252,0.15);
          border-color: var(--accent);
          color: var(--accent2);
        }

        /* ─── MODEL GRID ─────────────────────────────────────── */
        .model-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .model-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
          text-decoration: none;
          color: var(--text);
          transition: background 0.22s, border-color 0.22s, transform 0.22s;
          animation: fadeUp 0.5s both;
          position: relative;
          overflow: hidden;
        }
        .model-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(124,92,252,0.05), transparent);
          opacity: 0;
          transition: opacity 0.22s;
        }
        .model-card:hover {
          background: var(--surface2);
          border-color: rgba(124, 92, 252, 0.35);
          transform: translateY(-2px);
        }
        .model-card:hover::before { opacity: 1; }

        /* avatar */
        .card-avatar {
          position: relative;
          flex-shrink: 0;
        }
        .avatar-letter {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(124,92,252,0.3), rgba(192,132,252,0.15));
          border: 1px solid rgba(124,92,252,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-head);
          font-size: 18px;
          font-weight: 800;
          color: var(--accent2);
        }
        .live-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--live);
          border: 2px solid var(--surface);
          animation: pulse 2s infinite;
        }

        /* body */
        .card-body {
          flex: 1;
          min-width: 0;
        }
        .card-name {
          font-family: var(--font-head);
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }
        .hot-badge {
          font-size: 12px;
          flex-shrink: 0;
        }
        .card-handle {
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 7px;
          font-weight: 400;
        }
        .card-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .viewers-count {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent2);
        }
        .viewers-icon { font-size: 11px; }
        .country-tag {
          font-size: 11px;
          color: var(--muted);
          background: rgba(255,255,255,0.04);
          border-radius: 5px;
          padding: 2px 7px;
          font-weight: 500;
        }

        /* arrow */
        .card-arrow {
          color: var(--muted);
          font-size: 18px;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s, transform 0.2s;
          flex-shrink: 0;
        }
        .model-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ─── EMPTY STATE ────────────────────────────────────── */
        .empty-state {
          text-align: center;
          padding: 5rem 1rem;
        }
        .empty-pulse {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--surface2);
          border: 1px solid var(--border);
          margin-bottom: 1.5rem;
          animation: pulse 2.5s infinite;
        }
        .empty-icon { font-size: 32px; }
        .empty-title {
          font-family: var(--font-head);
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          color: var(--text);
        }
        .empty-desc {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }
        .empty-desc strong { color: var(--accent2); }
        .empty-timer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 8px 18px;
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
        }
        .timer-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--live);
          animation: pulse 1.8s infinite;
        }

        /* ─── RELATED TAGS ───────────────────────────────────── */
        .related-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .related-title {
          font-family: var(--font-head);
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .related-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .related-tag {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          text-decoration: none;
          transition: all 0.2s;
          font-family: var(--font-body);
        }
        .related-tag:hover {
          border-color: var(--accent);
          color: var(--accent2);
          background: rgba(124,92,252,0.08);
        }

        /* ─── BACK LINK ──────────────────────────────────────── */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 2.5rem;
          color: var(--muted);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: var(--accent2); }

        /* ─── KEYFRAMES ──────────────────────────────────────── */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        /* ─── RESPONSIVE ─────────────────────────────────────── */
        @media (max-width: 600px) {
          .model-grid { grid-template-columns: 1fr; }
          .hero-meta { gap: 10px; }
        }
      `}</style>

      <div className="ambient" />

      <main className="page">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <a href="/app.html">Campulse</a>
          <span className="breadcrumb-sep">›</span>
          <span>#{tag}</span>
        </nav>

        {/* Hero */}
        <header className="hero">
          <div className="tag-badge">
            <span className="tag-badge-dot" />
            {models.length > 0 ? "En vivo ahora" : "Tag activo"}
          </div>
          <h1 className="hero-title">#{tag}</h1>
          {models.length > 0 && (
            <div className="hero-meta">
              <div className="stat-pill">
                <span className="stat-pill-label">En vivo</span>
                <span className="stat-pill-value">{models.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-label">Viewers totales</span>
                <span className="stat-pill-value">{totalViewers.toLocaleString("es")}</span>
              </div>
            </div>
          )}
        </header>

        {/* Controls */}
        {models.length > 0 && (
          <div className="controls">
            <div className="controls-left">
              <strong>{sorted.length}</strong> modelos encontradas
            </div>
            <div className="sort-group">
              <button
                className={`sort-btn ${sortBy === "viewers" ? "active" : ""}`}
                onClick={() => setSortBy("viewers")}
              >
                👁 Viewers
              </button>
              <button
                className={`sort-btn ${sortBy === "az" ? "active" : ""}`}
                onClick={() => setSortBy("az")}
              >
                A–Z
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {models.length > 0 ? (
          <div className="model-grid">
            {sorted.map((m, i) => (
              <ModelCard key={m.username} model={m} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState tag={tag} />
        )}

        {/* Related tags */}
        {relatedTags.length > 0 && (
          <section className="related-section">
            <p className="related-title">Tags relacionados</p>
            <div className="related-tags">
              {relatedTags.map((t) => (
                <a key={t} href={`/tag/${t}`} className="related-tag">
                  #{t}
                </a>
              ))}
            </div>
          </section>
        )}

        <a href="/app.html" className="back-link">← Volver al inicio</a>
      </main>
    </>
  );
}
