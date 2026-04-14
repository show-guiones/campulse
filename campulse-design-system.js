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
.cmp-embed-wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:14px;background:#111;border:1px solid var(--bdr);margin-bottom:1rem}
.cmp-embed-frame{position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:14px}
.cmp-embed-note{font-size:.75rem;color:var(--txt3);text-align:center;margin-bottom:1.5rem}

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
}
`;

// Logo JSX component — mirrors app.html .logo markup
export function Logo() {
  return (
    <a href="/" className="cmp-logo">
      <span className="cmp-logo-icon">CP</span>
      <span className="cmp-logo-name">Campulse<em>Hub</em></span>
    </a>
  );
}
