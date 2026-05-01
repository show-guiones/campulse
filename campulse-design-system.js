// campulse-design-system.js
// Shared CSS tokens + Logo component — matches app.html exactly

export const DS_FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
`;

// CSS variables & base reset — identical to app.html :root
export const DS_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f1014; --bg2:#151720; --bg3:#1a1d28;
  --surf:#1e2130; --surf2:#252839;
  --bdr:rgba(255,255,255,.07); --bdr2:rgba(255,255,255,.12);
  --txt:#e8eaf0; --txt2:#8892a8; --txt3:#505870;
  --hot:#e8305a; --neon:#38b6d4; --gold:#f0a830; --grn:#22c77a; --purple:#7c5cbf;
  --female:#e8305a; --male:#3080e8; --couple:#d48020; --trans:#9248c8;
  --radius:12px; --radius-sm:8px;
  --font:'Outfit',sans-serif;
}
html,body{background:var(--bg);color:var(--txt);font-family:var(--font);font-size:15px;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
a{text-decoration:none;color:inherit}
button{font-family:inherit;cursor:pointer}

/* ── SHARED LAYOUT ── */
.cmp-page{max-width:900px;margin:0 auto;padding:0 1.25rem 5rem;min-height:100vh}

/* ── NAV / LOGO ── */
.cmp-nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 0;border-bottom:1px solid var(--bdr);margin-bottom:0}
.cmp-logo{display:flex;align-items:center;gap:.45rem;flex-shrink:0}
.cmp-logo-icon{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--hot),var(--purple));display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;color:#fff;letter-spacing:-.02em}
.cmp-logo-name{font-size:1.05rem;font-weight:800;letter-spacing:-.03em;color:var(--txt)}
.cmp-logo-name em{color:var(--neon);font-style:normal}
.cmp-nav-links{display:flex;gap:1.25rem}
.cmp-nav-link{font-size:.8125rem;color:var(--txt2);font-weight:500;transition:color .2s}
.cmp-nav-link:hover{color:var(--neon)}

/* ── BREADCRUMB ── */
.cmp-bc{font-size:.8rem;color:var(--txt3);padding:.75rem 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cmp-bc a{color:var(--txt2);transition:color .2s}.cmp-bc a:hover{color:var(--neon)}
.cmp-bc-sep{color:var(--txt3)}

/* ── SECTION LABEL ── */
.cmp-sec{font-size:.6875rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);margin-bottom:.875rem;margin-top:2rem;display:flex;align-items:center;gap:10px}
.cmp-sec::after{content:'';flex:1;height:1px;background:var(--bdr)}

/* ── TAGS ── */
.cmp-tag{background:rgba(255,255,255,.04);border:1px solid var(--bdr);border-radius:100px;padding:4px 12px;font-size:.75rem;color:var(--txt2)}
.cmp-tag-link{border-radius:100px;padding:4px 12px;font-size:.75rem;color:var(--neon);border:1px solid rgba(56,182,212,.22);background:rgba(56,182,212,.07);transition:background .2s}
.cmp-tag-link:hover{background:rgba(56,182,212,.14)}

/* ── METRIC CARDS ── */
.cmp-metrics{display:flex;gap:10px;margin:1.5rem 0;flex-wrap:wrap}
.cmp-metric{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--radius);padding:1rem 1.125rem;flex:1;min-width:100px}
.cmp-mval{font-size:1.5rem;font-weight:800;color:var(--neon);letter-spacing:-1px}
.cmp-mlbl{font-size:.6875rem;color:var(--txt3);margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}

/* ── CTA BUTTONS ── */
.cmp-cta-live{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--hot);color:#fff;padding:1rem;border-radius:var(--radius);font-weight:700;font-size:.9375rem;margin:1.5rem 0;transition:opacity .2s,transform .15s;border:none}
.cmp-cta-live:hover{opacity:.88;transform:translateY(-1px)}
.cmp-cta{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--surf);border:1px solid var(--bdr2);color:var(--neon);padding:1rem;border-radius:var(--radius);font-weight:600;font-size:.9375rem;margin:1.5rem 0;transition:border-color .2s,background .2s}
.cmp-cta:hover{border-color:rgba(56,182,212,.4);background:rgba(56,182,212,.06)}

/* ── LIVE BADGE ── */
.cmp-live-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(232,48,90,.1);border:1px solid rgba(232,48,90,.25);color:var(--hot);border-radius:100px;padding:3px 10px;font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.cmp-live-dot{width:5px;height:5px;border-radius:50%;background:var(--hot);animation:cmpPulse 1.6s ease-in-out infinite;flex-shrink:0}
@keyframes cmpPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}

/* ── MODEL GRID ── */
.cmp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px}
.cmp-card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--radius);padding:1rem;transition:border-color .2s,background .15s,transform .15s;display:block}
.cmp-card:hover{border-color:rgba(56,182,212,.3);background:rgba(56,182,212,.04);transform:translateY(-2px)}
.cmp-card-name{font-weight:700;font-size:.875rem;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--txt)}
.cmp-card-handle{font-size:.6875rem;color:var(--txt3);margin-bottom:.5rem}
.cmp-card-viewers{font-size:.8125rem;color:var(--neon);font-weight:600}
.cmp-card-sub{font-size:.75rem;color:var(--txt3);margin-top:2px}

/* ── RANK MEDAL ── */
.cmp-rank{font-size:.7rem;font-weight:800;color:var(--txt3);min-width:22px}
.cmp-rank-1{color:var(--gold)}
.cmp-rank-2{color:var(--txt2)}
.cmp-rank-3{color:#b47544}

/* ── DIVIDER ── */
.cmp-divider{height:1px;background:var(--bdr);margin:1.5rem 0}

/* ── FOOTER LINKS ── */
.cmp-footer-links{display:flex;flex-direction:column;gap:6px;margin-top:2rem;align-items:center}
.cmp-footer-link{color:var(--txt3);font-size:.8125rem;transition:color .2s;text-align:center}
.cmp-footer-link:hover{color:var(--neon)}

/* ── EMBED ── */
.cmp-embed-wrap{position:relative;height:54dvh;min-height:270px;max-height:60dvh;overflow:hidden;border-radius:14px;background:#111;border:1px solid var(--bdr);margin-bottom:1rem}
.cmp-embed-frame{position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:14px}
.cmp-embed-note{font-size:.75rem;color:var(--txt3);text-align:center;margin-bottom:1.5rem}

/* ── LIVE EMBED (thumbnail + overlay) ── */
.cmp-live-embed{display:block;box-sizing:border-box;position:relative;height:54dvh;min-height:270px;max-height:60dvh;overflow:hidden;border-radius:14px;background:#0c0c0e;border:1px solid var(--bdr);margin-bottom:1rem;cursor:pointer;}
.cmp-live-embed__thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:14px;transition:transform .4s ease,filter .4s ease;}
.cmp-live-embed__thumb-err{position:absolute;inset:0;background:linear-gradient(135deg,#0f1014 0%,#1a1022 100%);}
.cmp-live-embed__overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:linear-gradient(to top,rgba(0,0,0,.78) 0%,rgba(0,0,0,.1) 60%,transparent 100%);border-radius:14px;transition:background .3s;}
.cmp-live-embed:hover .cmp-live-embed__thumb{transform:scale(1.03);filter:brightness(.85);}
.cmp-live-embed:hover .cmp-live-embed__overlay{background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.25) 60%,rgba(0,0,0,.05) 100%);}
.cmp-live-embed__play{width:72px;height:72px;border-radius:50%;background:rgba(232,48,90,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 0 rgba(232,48,90,.5);animation:cmpPulsePlay 2s ease-in-out infinite;transition:transform .2s;}
.cmp-live-embed:hover .cmp-live-embed__play{transform:scale(1.12);}
@keyframes cmpPulsePlay{0%,100%{box-shadow:0 0 0 0 rgba(232,48,90,.5)}50%{box-shadow:0 0 0 14px rgba(232,48,90,0)}}
.cmp-live-embed__play svg{margin-left:5px;}
.cmp-live-embed__info{display:flex;flex-direction:column;align-items:center;gap:6px;}
.cmp-live-embed__viewers{font-size:.875rem;font-weight:600;color:#fff;background:rgba(0,0,0,.55);padding:3px 10px;border-radius:20px;display:flex;align-items:center;gap:6px;}
.cmp-live-embed__viewers-dot{width:7px;height:7px;background:#e8305a;border-radius:50%;animation:cmpBlink 1.2s ease-in-out infinite;}
@keyframes cmpBlink{0%,100%{opacity:1}50%{opacity:.3}}
.cmp-live-embed__cta{display:inline-block;background:linear-gradient(135deg,#e8305a,#c42049);color:#fff;font-weight:700;font-size:.9375rem;padding:.6rem 1.6rem;border-radius:10px;text-decoration:none;box-shadow:0 4px 18px rgba(232,48,90,.4);transition:transform .18s,box-shadow .18s;}
.cmp-live-embed:hover .cmp-live-embed__cta{transform:translateY(-2px);box-shadow:0 7px 26px rgba(232,48,90,.55);}
/* expanded iframe state */
.cmp-live-embed--expanded{cursor:default;}
.cmp-live-embed--expanded .cmp-live-embed__overlay{display:none;}
.cmp-live-embed--expanded .cmp-live-embed__thumb{display:none;}
.cmp-live-embed--expanded .cmp-embed-frame{display:block;}

/* CTA APP BANNER */
@keyframes cmpShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
@keyframes cmpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes cmpCounterPulse{0%,100%{opacity:1}50%{opacity:.6}}
.cmp-app-cta{display:flex;align-items:center;justify-content:space-between;gap:1rem;position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(232,48,90,.12) 0%,rgba(124,92,191,.14) 50%,rgba(56,182,212,.1) 100%);border:1px solid rgba(232,48,90,.28);border-radius:16px;padding:1.125rem 1.375rem;margin:1.5rem 0;text-decoration:none;transition:border-color .25s,transform .2s,box-shadow .25s;cursor:pointer;}
.cmp-app-cta::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);animation:cmpShimmer 3.2s ease-in-out infinite;pointer-events:none;}
.cmp-app-cta:hover{border-color:rgba(232,48,90,.5);transform:translateY(-2px);box-shadow:0 8px 30px rgba(232,48,90,.15),0 2px 8px rgba(0,0,0,.4);}
.cmp-app-cta-left{display:flex;align-items:center;gap:.875rem;flex:1;min-width:0}
.cmp-app-cta-icon{width:44px;height:44px;border-radius:13px;flex-shrink:0;background:linear-gradient(135deg,var(--hot),var(--purple));display:flex;align-items:center;justify-content:center;font-size:1.25rem;animation:cmpFloat 3s ease-in-out infinite;box-shadow:0 4px 14px rgba(232,48,90,.3);}
.cmp-app-cta-text{flex:1;min-width:0}
.cmp-app-cta-title{font-size:.9375rem;font-weight:800;color:var(--txt);letter-spacing:-.02em;margin-bottom:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cmp-app-cta-sub{font-size:.75rem;color:var(--txt2);line-height:1.35}
.cmp-app-cta-sub strong{color:var(--neon)}
.cmp-app-cta-badge{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;}
.cmp-app-cta-counter{font-size:1.25rem;font-weight:900;color:var(--hot);letter-spacing:-.04em;line-height:1;animation:cmpCounterPulse 2.4s ease-in-out infinite;}
.cmp-app-cta-counter-lbl{font-size:.6rem;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.08em;text-align:center}
.cmp-app-cta-arrow{flex-shrink:0;width:32px;height:32px;border-radius:10px;background:var(--hot);display:flex;align-items:center;justify-content:center;font-size:.875rem;box-shadow:0 3px 10px rgba(232,48,90,.35);transition:transform .2s;}
.cmp-app-cta:hover .cmp-app-cta-arrow{transform:translateX(3px)}
@media(max-width:480px){.cmp-app-cta{padding:.875rem 1rem;gap:.75rem}.cmp-app-cta-badge{display:none}}

/* ── SPARK ── */
.cmp-spark{background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:1.125rem 1.25rem;margin-bottom:1.5rem}
.cmp-spark-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.875rem}
.cmp-spark-lbl{font-size:.6875rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--txt3)}
.cmp-spark-peak{font-size:.8125rem;color:var(--neon);font-weight:600}

/* ── HOUR ROW ── */
.cmp-hour{background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:.875rem 1rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:.875rem}
.cmp-hour-time{color:var(--txt2);font-weight:500}
.cmp-hour-val{color:var(--neon);font-weight:700}

/* ── HIST ROW ── */
.cmp-hist{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--bdr)}
.cmp-hist-date{font-size:.6875rem;color:var(--txt3);width:130px;flex-shrink:0}
.cmp-hist-bar{flex:1;background:rgba(255,255,255,.04);border-radius:4px;height:5px;overflow:hidden}
.cmp-hist-fill{height:100%;background:linear-gradient(90deg,var(--purple),var(--neon));border-radius:4px;min-width:2px}
.cmp-hist-val{font-size:.75rem;color:var(--neon);width:48px;text-align:right;flex-shrink:0;font-weight:600}

/* ── SEARCH PAGE ── */
.cmp-search-form{display:flex;gap:8px;margin:1.5rem 0}
.cmp-search-input{flex:1;background:var(--surf);border:1px solid var(--bdr2);color:var(--txt);font-size:.9375rem;padding:.8rem 1rem;border-radius:var(--radius);outline:none;font-family:var(--font);transition:border-color .2s}
.cmp-search-input:focus{border-color:var(--neon)}
.cmp-search-input::placeholder{color:var(--txt3)}
.cmp-search-btn{background:var(--neon);border:none;color:#0f1014;font-size:.875rem;font-weight:700;padding:.8rem 1.25rem;border-radius:var(--radius);cursor:pointer;transition:opacity .2s;font-family:var(--font)}
.cmp-search-btn:hover{opacity:.85}
.cmp-search-btn:disabled{opacity:.5;cursor:default}

/* ── PAGE HEADER ── */
.cmp-page-header{padding:2rem 0 1.5rem}
.cmp-page-h1{font-size:clamp(1.6rem,5vw,2.25rem);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:.5rem;color:var(--txt)}
.cmp-page-sub{color:var(--txt2);font-size:.9375rem;line-height:1.5}

/* ── CATEGORY CARDS (gender, country, language hubs) ── */
.cmp-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:1.5rem}
.cmp-cat-card{background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:1.25rem 1.375rem;display:flex;align-items:center;gap:1rem;transition:border-color .2s,background .15s,transform .15s}
.cmp-cat-card:hover{border-color:rgba(56,182,212,.3);background:rgba(56,182,212,.04);transform:translateY(-2px)}
.cmp-cat-card-icon{font-size:1.75rem;flex-shrink:0;line-height:1}
.cmp-cat-card-name{font-weight:700;font-size:1.0625rem;color:var(--txt);margin-bottom:2px}
.cmp-cat-card-count{font-size:.8rem;color:var(--txt3)}

@media(max-width:540px){
  .cmp-metrics{gap:8px} .cmp-metric{min-width:90px}
  .cmp-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
  .cmp-cat-grid{grid-template-columns:1fr 1fr}
  .cmp-embed-wrap{
    height:64dvh;
    min-height:340px;
    max-height:70dvh;
    overflow:hidden;
    clip-path:inset(0 round 10px);
    border-radius:10px;
    margin-left:-1.25rem;
    margin-right:-1.25rem;
    width:calc(100% + 2.5rem);
  }
  .cmp-embed-frame{
    position:absolute;top:0;left:0;
    width:100%;height:100%;
    border-radius:0;
    display:block;
    border:none;
  }
  .cmp-live-embed{
    height:56dvh;
    min-height:280px;
    max-height:65dvh;
    border-radius:12px;
    margin-left:0;
    margin-right:0;
    width:100%;
  }
  .cmp-live-embed__thumb{border-radius:12px;}
  .cmp-live-embed__play{width:64px;height:64px;}
  .cmp-live-embed__cta{font-size:.875rem;padding:.55rem 1.3rem;}
}

/* ── BOTTOM NAV MÓVIL ── */
.cmp-bottom-nav{
  display:none;
  position:fixed;bottom:0;left:0;right:0;
  background:rgba(15,16,20,.97);
  border-top:1px solid var(--bdr);
  z-index:1000;
  padding:6px 0 env(safe-area-inset-bottom,6px);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
}
.cmp-bottom-nav-inner{
  display:flex;align-items:flex-start;justify-content:space-around;
  max-width:540px;margin:0 auto;padding:0 4px;
}
.cmp-bottom-nav-item{
  display:flex;flex-direction:column;align-items:center;
  gap:2px;flex:1;
  color:var(--txt3);font-size:.6rem;font-weight:500;
  text-decoration:none;padding:4px 2px;
  transition:color .18s;
  letter-spacing:.01em;line-height:1.2;
  min-width:0;
}
.cmp-bottom-nav-item:hover,.cmp-bottom-nav-item.active{color:var(--neon)}
.cmp-bottom-nav-icon{font-size:1.2rem;line-height:1}
.cmp-page-body{padding-bottom:72px}
@media(max-width:540px){
  .cmp-bottom-nav{display:block}
}
`;

// BottomNav — barra de navegación fija inferior, solo móvil
export function BottomNav({ active }) {
  const items = [
    { href:"/top/latinas", icon:"🔥", label:"Latinas" },
    { href:"/country/co",  icon:"🇨🇴", label:"Colombia" },
    { href:"/country/mx",  icon:"🇲🇽", label:"México" },
    { href:"/country",     icon:"🌍", label:"Países" },
    { href:"/gender",      icon:"⚧", label:"Género" },
    { href:"/language",    icon:"💬", label:"Idioma" },
    { href:"/search",      icon:"🔍", label:"Buscar" },
  ];
  return (
    <nav className="cmp-bottom-nav">
      <div className="cmp-bottom-nav-inner">
        {items.map(it=>(
          <a key={it.href} href={it.href} className={`cmp-bottom-nav-item${active===it.href?" active":""}`}>
            <span className="cmp-bottom-nav-icon">{it.icon}</span>
            <span>{it.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}


// AppCTA - Banner visual que lleva a app.html (todas las modelos en vivo)
export function AppCTA({ liveCount }) {
  const count = liveCount ?? "3000+";
  return (
    <a href="/app.html" className="cmp-app-cta">
      <div className="cmp-app-cta-left">
        <div className="cmp-app-cta-icon">📡</div>
        <div className="cmp-app-cta-text">
          <div className="cmp-app-cta-title">Ver todas las modelos en vivo</div>
          <div className="cmp-app-cta-sub">
            Dashboard completo · Ranking · <strong>Estadísticas en tiempo real</strong>
          </div>
        </div>
      </div>
      <div className="cmp-app-cta-badge">
        <div className="cmp-app-cta-counter">{count}</div>
        <div className="cmp-app-cta-counter-lbl">modelos<br/>ahora</div>
      </div>
      <div className="cmp-app-cta-arrow">→</div>
    </a>
  );
}

// Logo JSX component — Campulse brand mark
export function Logo() {
  return (
    <a href="/app.html" className="cmp-logo" style={{ gap: ".55rem" }}>
      <span className="cmp-logo-icon" style={{
        background: "linear-gradient(135deg,#e8305a 0%,#7c5cbf 100%)",
        boxShadow: "0 2px 10px rgba(232,48,90,.25)",
        borderRadius: "10px",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: ".6rem",
        fontWeight: 900,
        color: "#fff",
        letterSpacing: "-.03em",
        flexShrink: 0,
      }}>
        CP
      </span>
      <span className="cmp-logo-name" style={{ fontSize: "1.075rem", fontWeight: 800, letterSpacing: "-.03em" }}>
        Campulse<em style={{ color: "var(--neon)", fontStyle: "normal" }}>Hub</em>
      </span>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveEmbed — thumbnail Chaturbate con overlay CTA, carga iframe solo al click en desktop
// Soluciona el iframe roto: Chaturbate bloquea embeds sin sesion en muchos contextos.
// El thumbnail (thumb.live.mmcdn.com) siempre carga. Click en movil → abre afiliado directo.
// Click en desktop → expande iframe inline.
// Props: room (string), viewers (number|null), name (string), campaign, track
import { useState, useEffect } from "react";
export function LiveEmbed({ room, viewers=null, name=null, campaign="rI8z3", track="embed_play" }) {
  const displayName = name || room;
  const thumbUrl    = `https://thumb.live.mmcdn.com/riw/${room}.jpg`;
  const thumbFallback = `https://thumb.live.mmcdn.com/n/${room}.jpg`;
  const [imgSrc, setImgSrc]     = useState(thumbUrl);
  const [imgOk,  setImgOk]      = useState(true);
  const [mobileHref, setMobileHref] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
      if (isMobile) {
        setMobileHref(`https://chaturbate.com/${room}/?campaign=${campaign}&tour=LQps&track=${track}&mobile_site=1`);
      }
    }
  }, [room, campaign, track]);

  const desktopHref = `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}&room=${room}`;

  function handleClick(e) {
    e.preventDefault();
    const url = mobileHref || desktopHref;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <a
      href={mobileHref || desktopHref}
      className="cmp-live-embed"
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ver a ${displayName} en vivo en Chaturbate`}
    >
      {imgOk ? (
        <img
          src={imgSrc}
          alt={`${displayName} en vivo`}
          className="cmp-live-embed__thumb"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => {
            if (imgSrc === thumbUrl) { setImgSrc(thumbFallback); }
            else { setImgOk(false); }
          }}
          loading="eager"
        />
      ) : (
        <div className="cmp-live-embed__thumb-err"/>
      )}
      <div className="cmp-live-embed__overlay">
        <div className="cmp-live-embed__play">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="9,5 23,14 9,23" fill="#fff"/>
          </svg>
        </div>
        <div className="cmp-live-embed__info">
          {viewers != null && viewers > 0 && (
            <span className="cmp-live-embed__viewers">
              <span className="cmp-live-embed__viewers-dot"/>
              {viewers.toLocaleString("es")} viewers en vivo
            </span>
          )}
          <span className="cmp-live-embed__cta">Ver en vivo →</span>
        </div>
      </div>
    </a>
  );
}


// affLink — construye URL afiliado con mobile_site=1 en móvil, tour link en desktop
// REGLA: chaturbate.com/in/ no fuerza vista móvil aunque lleve mobileRedirect=mobile
// La única URL que garantiza vista móvil con afiliado es la URL directa con mobile_site=1
// ─────────────────────────────────────────────────────────────────────────────
export function affLink({ room = null, gender = null, tag = null, track = "default", campaign = "rI8z3" }) {
  if (typeof window === "undefined") {
    // SSR: devolver tour link genérico (se reescribirá en cliente)
    if (room) return `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}&room=${room}`;
    if (gender) return `https://chaturbate.com/in/?tour=x1Rd&campaign=${campaign}&track=${track}&gender=${gender}`;
    return `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}`;
  }
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth <= 768;

  if (isMobile) {
    // URL directa → fuerza vista móvil con afiliado
    if (room) return `https://chaturbate.com/${room}/?campaign=${campaign}&tour=LQps&track=${track}&mobile_site=1`;
    if (gender) return `https://chaturbate.com/in/?tour=x1Rd&campaign=${campaign}&track=${track}&gender=${gender}&mobile_site=1`;
    // Sin room específico: landing de tour en modo móvil
    return `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}&mobile_site=1`;
  }
  // Desktop: tour link estándar
  if (room) return `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}&room=${room}`;
  if (gender) return `https://chaturbate.com/in/?tour=x1Rd&campaign=${campaign}&track=${track}&gender=${gender}`;
  return `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}`;
}

// CtaAfiliado — botón CTA que reescribe su href en el cliente para mobile
// Uso: <CtaAfiliado room="lexy_fox2" track="model_top" live />
// Props: room, gender, tag, track, campaign, live (bool), label, className, style
export function CtaAfiliado({ room=null, gender=null, track="default", campaign="rI8z3", live=false, label=null, className=null, style={} }) {
  const defaultLabel = live ? "🔴 Ver en vivo ahora →" : "🎥 Ver en Chaturbate →";
  const text = label || defaultLabel;
  const cls = className || (live ? "cmp-cta-live" : "cmp-cta");
  // SSR href (desktop fallback, se actualiza en useEffect)
  const ssrHref = room
    ? `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}&room=${room}`
    : gender
      ? `https://chaturbate.com/in/?tour=x1Rd&campaign=${campaign}&track=${track}&gender=${gender}`
      : `https://chaturbate.com/in/?tour=LQps&campaign=${campaign}&track=${track}`;

  // En cliente usamos data-aff para re-hidratar el href correcto
  const handleClick = (e) => {
    const href = affLink({ room, gender, track, campaign });
    e.currentTarget.href = href;
  };

  return (
    <a
      href={ssrHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      style={style}
      onClick={handleClick}
      onMouseEnter={(e) => { e.currentTarget.href = affLink({ room, gender, track, campaign }); }}
    >
      {text}
    </a>
  );
}

