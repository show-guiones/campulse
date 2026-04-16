// pages/tag/[tag].jsx — Rediseño visual completo v2
// Añade Logo, nav, BottomNav del design system + mejoras de diseño premium
// Mantiene exactamente la misma lógica de datos (getServerSideProps sin cambios)

import Head from "next/head";
import { useState } from "react";
import { DS_CSS, Logo, BottomNav } from "../../campulse-design-system";

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

const TAG_EMOJI = {
  latina:"🌶️", bigboobs:"🍒", ebony:"✨", teen:"🌸", curvy:"🔥",
  lovense:"💜", squirt:"💦", colombia:"🇨🇴", anal:"🔞", lesbians:"💋",
};

export async function getServerSideProps({ params }) {
  const { tag } = params;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return { props: { tag, models: [] } };
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sbHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  try {
    const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&tags=cs.{"${tag}"}&select=username,display_name,num_users,country,gender&order=num_users.desc&limit=100`;
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

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#e8305a,#7c5cbf)",
  "linear-gradient(135deg,#38b6d4,#3080e8)",
  "linear-gradient(135deg,#f0a830,#e8305a)",
  "linear-gradient(135deg,#22c77a,#38b6d4)",
  "linear-gradient(135deg,#9248c8,#e8305a)",
];

function ModelCard({ model, index }) {
  const flag = COUNTRY_FLAGS[model.country?.toUpperCase()] || "";
  const viewers = (model.num_users ?? 0).toLocaleString("es");
  const isHot = (model.num_users ?? 0) > 500;
  const isFire = (model.num_users ?? 0) > 1000;
  const letter = (model.display_name || model.username).charAt(0).toUpperCase();
  const grad = AVATAR_GRADIENTS[letter.charCodeAt(0) % AVATAR_GRADIENTS.length];

  return (
    <a href={`/model/${model.username}`} className="tg-card" style={{ animationDelay: `${index * 35}ms` }}>
      <div className="tg-avatar" style={{ background: grad }}>
        <span className="tg-avatar-letter">{letter}</span>
        <span className="tg-live-dot" />
      </div>
      <div className="tg-body">
        <div className="tg-name">
          {model.display_name || model.username}
          {isFire && <span className="tg-badge">🔥</span>}
          {isHot && !isFire && <span className="tg-badge">⭐</span>}
        </div>
        <div className="tg-handle">@{model.username}</div>
        <div className="tg-row">
          <span className="tg-viewers"><span className="tg-dot-v">●</span>{viewers}</span>
          {model.country && <span className="tg-country">{flag} {model.country.toUpperCase()}</span>}
        </div>
      </div>
      <span className="tg-arrow">›</span>
    </a>
  );
}

function EmptyState({ tag }) {
  const relatedTags = RELATED_TAGS[tag] || [];
  return (
    <div className="tg-empty">
      <span className="tg-empty-emoji">{TAG_EMOJI[tag] || "📡"}</span>
      <h2 className="tg-empty-h">Sin modelos en vivo en este momento</h2>
      <p className="tg-empty-p">
        Las modelos con el tag <strong style={{color:"var(--neon)"}}>#{tag}</strong> en Chaturbate
        no están activas ahora mismo. Los datos se actualizan automáticamente — vuelve en unos minutos.
      </p>
      <span className="tg-timer"><span className="tg-timer-dot"/>Actualización automática cada hora</span>
      {relatedTags.length > 0 && (
        <div style={{marginTop:"2rem"}}>
          <p style={{color:"var(--txt3)",fontSize:".75rem",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:".75rem"}}>
            Mientras tanto, explora tags similares
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center"}}>
            {relatedTags.map((t) => (
              <a key={t} href={`/tag/${t}`} className="tg-rel-tag">#{t}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TagPage({ tag, models }) {
  const [sortBy, setSortBy] = useState("viewers");
  const emoji = TAG_EMOJI[tag] || "";
  const title = `Modelos #${tag} en Chaturbate — ${models.length} en vivo | CampulseHub`;
  const description = `${models.length} modelos con el tag "${tag}" en vivo ahora en Chaturbate. Viewers, países y estadísticas en tiempo real.`;
  const relatedTags = RELATED_TAGS[tag] || [];
  const totalViewers = models.reduce((acc, m) => acc + (m.num_users ?? 0), 0);
  const topViewers = models[0]?.num_users ?? 0;
  const sorted = [...models].sort((a, b) => {
    if (sortBy === "viewers") return (b.num_users ?? 0) - (a.num_users ?? 0);
    return (a.display_name || a.username).localeCompare(b.display_name || b.username);
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
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CampulseHub" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
        <style>{DS_CSS}</style>
        <style>{`
          /* ── AMBIENT GLOWS ── */
          .tg-glow1{position:fixed;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(124,92,191,.07) 0%,transparent 65%);top:-300px;right:-250px;pointer-events:none;z-index:0}
          .tg-glow2{position:fixed;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(232,48,90,.04) 0%,transparent 65%);bottom:-200px;left:-150px;pointer-events:none;z-index:0}

          /* ── HERO ── */
          .tg-hero{padding:2rem 0 1.75rem}
          .tg-live-pill{display:inline-flex;align-items:center;gap:7px;background:rgba(232,48,90,.1);border:1px solid rgba(232,48,90,.25);color:var(--hot);border-radius:100px;padding:4px 13px;font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:1rem}
          .tg-pill-dot{width:6px;height:6px;border-radius:50%;background:var(--hot);animation:cmpPulse 1.6s ease-in-out infinite}
          .tg-h1{font-size:clamp(2.25rem,8vw,3.75rem);font-weight:800;letter-spacing:-.04em;line-height:1;margin-bottom:1.25rem;color:var(--txt)}
          .tg-h1-tag{background:linear-gradient(135deg,var(--hot) 0%,var(--purple) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

          /* stat pills */
          .tg-stats-row{display:flex;gap:10px;flex-wrap:wrap}
          .tg-stat{display:flex;align-items:center;gap:7px;background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:8px 16px;font-size:.8125rem}
          .tg-stat-lbl{color:var(--txt3);font-weight:500}
          .tg-stat-val{color:var(--neon);font-weight:800}
          .tg-stat-val.top{color:var(--hot)}

          /* ── CONTROLS ── */
          .tg-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1rem 0 1.25rem;border-bottom:1px solid var(--bdr);margin-bottom:1.25rem;flex-wrap:wrap}
          .tg-count{font-size:.8125rem;color:var(--txt3)}
          .tg-count strong{color:var(--txt);font-weight:700}
          .tg-count .hl{color:var(--neon)}
          .tg-sort{display:flex;gap:6px}
          .tg-sort-btn{background:var(--surf);border:1px solid var(--bdr);color:var(--txt3);border-radius:8px;padding:6px 14px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--font)}
          .tg-sort-btn:hover{border-color:rgba(56,182,212,.4);color:var(--txt)}
          .tg-sort-btn.on{background:rgba(56,182,212,.1);border-color:rgba(56,182,212,.4);color:var(--neon)}

          /* ── GRID ── */
          .tg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:9px}
          @keyframes tgUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
          .tg-card{display:flex;align-items:center;gap:13px;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--radius);padding:13px 15px;text-decoration:none;color:var(--txt);transition:border-color .2s,background .18s,transform .2s,box-shadow .2s;animation:tgUp .45s both;position:relative;overflow:hidden}
          .tg-card::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(56,182,212,.04),transparent);opacity:0;transition:opacity .2s}
          .tg-card:hover{border-color:rgba(56,182,212,.3);background:var(--surf2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.25)}
          .tg-card:hover::after{opacity:1}

          /* avatar */
          .tg-avatar{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative}
          .tg-avatar-letter{font-size:18px;font-weight:800;color:rgba(255,255,255,.92);line-height:1;position:relative;z-index:1}
          .tg-live-dot{position:absolute;bottom:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:var(--grn);border:2px solid var(--surf);animation:cmpPulse 2s infinite;z-index:2}

          /* body */
          .tg-body{flex:1;min-width:0}
          .tg-name{font-weight:700;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--txt);display:flex;align-items:center;gap:5px;margin-bottom:1px}
          .tg-badge{font-size:.75rem;flex-shrink:0}
          .tg-handle{font-size:.7rem;color:var(--txt3);margin-bottom:6px}
          .tg-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
          .tg-viewers{display:flex;align-items:center;gap:5px;font-size:.78rem;font-weight:700;color:var(--neon)}
          .tg-dot-v{font-size:7px;color:var(--grn);animation:cmpPulse 1.8s infinite}
          .tg-country{font-size:.7rem;color:var(--txt3);background:rgba(255,255,255,.04);border-radius:5px;padding:2px 7px;font-weight:500}
          .tg-arrow{font-size:18px;color:var(--txt3);opacity:0;transform:translateX(-5px);transition:opacity .2s,transform .2s;flex-shrink:0}
          .tg-card:hover .tg-arrow{opacity:1;transform:translateX(0)}

          /* ── EMPTY ── */
          .tg-empty{text-align:center;padding:5rem 1rem}
          .tg-empty-emoji{font-size:3.5rem;margin-bottom:1.5rem;display:block;animation:cmpPulse 2.5s infinite}
          .tg-empty-h{font-size:1.375rem;font-weight:800;color:var(--txt);margin-bottom:.6rem}
          .tg-empty-p{color:var(--txt2);font-size:.875rem;line-height:1.7;margin-bottom:1.5rem}
          .tg-timer{display:inline-flex;align-items:center;gap:7px;background:var(--surf);border:1px solid var(--bdr);border-radius:100px;padding:7px 16px;font-size:.75rem;color:var(--txt3);font-weight:500}
          .tg-timer-dot{width:6px;height:6px;border-radius:50%;background:var(--grn);animation:cmpPulse 1.8s infinite}

          /* ── RELATED ── */
          .tg-related{margin-top:2.5rem;padding-top:1.75rem;border-top:1px solid var(--bdr)}
          .tg-rel-lbl{font-size:.6875rem;font-weight:700;color:var(--txt3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.875rem}
          .tg-rel-tags{display:flex;flex-wrap:wrap;gap:7px}
          .tg-rel-tag{background:var(--surf);border:1px solid var(--bdr);border-radius:8px;padding:7px 15px;font-size:.8rem;font-weight:600;color:var(--txt3);text-decoration:none;transition:all .2s;font-family:var(--font)}
          .tg-rel-tag:hover{border-color:rgba(56,182,212,.35);color:var(--neon);background:rgba(56,182,212,.06)}

          /* ── SEO BLOCK ── */
          .tg-seo{margin-top:2.5rem;padding:1.5rem;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--radius)}
          .tg-seo h2{font-size:1rem;font-weight:700;color:var(--txt);margin-bottom:.6rem}
          .tg-seo p{color:var(--txt2);font-size:.875rem;line-height:1.7}

          @media(max-width:600px){
            .tg-grid{grid-template-columns:1fr}
            .tg-h1{font-size:2rem}
            .tg-stats-row{gap:7px}
          }
        `}</style>
      </Head>

      <div className="tg-glow1" />
      <div className="tg-glow2" />

      <div className="cmp-page cmp-page-body" style={{ position: "relative", zIndex: 1 }}>

        {/* NAV CON LOGO */}
        <nav className="cmp-nav">
          <Logo />
          <div className="cmp-nav-links">
            <a href="/top/latinas" className="cmp-nav-link">🔥 Latinas</a>
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <nav className="cmp-bc">
          <a href="/app.html" style={{ fontWeight: 700, color: "var(--txt2)" }}>CampulseHub</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{ color: "var(--txt3)" }}>Tags</span>
          <span className="cmp-bc-sep">›</span>
          <span style={{ color: "var(--txt)" }}>#{tag}</span>
        </nav>

        {/* HERO */}
        <header className="tg-hero">
          <div className="tg-live-pill">
            <span className="tg-pill-dot" />
            {models.length > 0 ? `${models.length} en vivo ahora` : "Tag activo"}
          </div>
          <h1 className="tg-h1">
            {emoji && <span style={{ marginRight: "0.25em" }}>{emoji}</span>}
            <span className="tg-h1-tag">#{tag}</span>
          </h1>
          {models.length > 0 && (
            <div className="tg-stats-row">
              <div className="tg-stat">
                <span className="tg-stat-lbl">En vivo</span>
                <span className="tg-stat-val">{models.length}</span>
              </div>
              <div className="tg-stat">
                <span className="tg-stat-lbl">Viewers totales</span>
                <span className="tg-stat-val">{totalViewers.toLocaleString("es")}</span>
              </div>
              {topViewers > 0 && (
                <div className="tg-stat">
                  <span className="tg-stat-lbl">Top sala</span>
                  <span className="tg-stat-val top">{topViewers.toLocaleString("es")}</span>
                </div>
              )}
            </div>
          )}
        </header>

        {/* CONTROLS */}
        {models.length > 0 && (
          <div className="tg-controls">
            <div className="tg-count">
              Mostrando <strong>{sorted.length}</strong> modelos con <strong className="hl">#{tag}</strong>
            </div>
            <div className="tg-sort">
              <button className={`tg-sort-btn${sortBy === "viewers" ? " on" : ""}`} onClick={() => setSortBy("viewers")}>👁 Viewers</button>
              <button className={`tg-sort-btn${sortBy === "az" ? " on" : ""}`} onClick={() => setSortBy("az")}>A–Z</button>
            </div>
          </div>
        )}

        {/* GRID */}
        {models.length > 0 ? (
          <div className="tg-grid">
            {sorted.map((m, i) => <ModelCard key={m.username} model={m} index={i} />)}
          </div>
        ) : (
          <EmptyState tag={tag} />
        )}

        {/* EMBED — Top Female en vivo */}
        <section style={{marginTop:32,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
            <span style={{fontSize:".75rem",fontWeight:700,color:"var(--txt2)",letterSpacing:".06em",textTransform:"uppercase"}}>En vivo ahora en Chaturbate</span>
          </div>
          <div style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)",background:"#000",position:"relative",paddingTop:"56.25%"}}>
            <iframe
              src={`https://cbxyz.com/in/?tour=dTm0&campaign=rI8z3&track=tag_${tag}&disable_sound=1&mobileRedirect=auto&embed_video_only=1`}
              style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
              allow="autoplay; fullscreen; encrypted-media"
              scrolling="no"
            />
          </div>
          <p style={{fontSize:".6875rem",color:"var(--txt3)",textAlign:"center",marginTop:6}}>
            Stream en vivo desde Chaturbate ·{" "}
            <a href={`https://chaturbate.com/in/?tour=LQps&campaign=rI8z3&track=tag_${tag}`} target="_blank" rel="noopener noreferrer" style={{color:"var(--neon)"}}>Ver en pantalla completa →</a>
          </p>
        </section>

        {/* SEO */}
        <section className="tg-seo">
          <h2>Modelos con #{tag} en Chaturbate en vivo</h2>
          <p>
            CampulseHub rastrea en tiempo real las modelos de Chaturbate con el tag <strong>#{tag}</strong>.
            {models.length > 0
              ? ` Ahora mismo hay ${models.length} modelos en vivo con un total de ${totalViewers.toLocaleString("es")} viewers.`
              : " Los datos se actualizan automáticamente cada 2 horas."
            } Explora sus estadísticas, mejor horario y historial de viewers.
          </p>
        </section>

        {/* RELATED TAGS */}
        {relatedTags.length > 0 && (
          <section className="tg-related">
            <p className="tg-rel-lbl">Tags relacionados</p>
            <div className="tg-rel-tags">
              {relatedTags.map((t) => (
                <a key={t} href={`/tag/${t}`} className="tg-rel-tag">#{t}</a>
              ))}
            </div>
          </section>
        )}

        <div className="cmp-footer-links" style={{ marginTop: "2.5rem" }}>
          <a href="/app.html" className="cmp-footer-link">← Inicio</a>
          <a href="/top/latinas" className="cmp-footer-link">🔥 Top Latinas</a>
          <a href="/country" className="cmp-footer-link">🌍 Explorar países →</a>
        </div>

      </div>

      <BottomNav active={`/tag/${tag}`} />
    </>
  );
}
