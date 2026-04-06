// pages/index.js — Campulse Home — Premium UI Redesign

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const COUNTRY_NAMES = {
  CO: "Colombia", MX: "México", AR: "Argentina", CL: "Chile",
  ES: "España", US: "Estados Unidos", BR: "Brasil", RO: "Rumania",
  RU: "Rusia", DE: "Alemania", FR: "Francia", GB: "Reino Unido",
  IT: "Italia", UA: "Ucrania", PH: "Filipinas", TH: "Tailandia",
  CA: "Canadá", AU: "Australia", HU: "Hungría", PL: "Polonia",
  PE: "Perú", VE: "Venezuela", EC: "Ecuador",
};

const GENDER_LABELS = { f: "♀", m: "♂", c: "♥", t: "⚧" };
const GENDER_COLORS = { f: "#f472b6", m: "#60a5fa", c: "#34d399", t: "#c084fc" };

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  let totalModels = 0;
  let topModels = [];
  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const sbHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
      const [countRes, topRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&select=username`,
          { headers: { ...sbHeaders, "Prefer": "count=exact", "Range": "0-0" } }),
        fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&select=username,display_name,num_users,num_followers,country,gender&order=num_users.desc&limit=200`,
          { headers: sbHeaders }),
      ]);
      if (countRes.ok) {
        const range = countRes.headers.get("content-range");
        if (range) { const total = parseInt(range.split("/")[1], 10); if (!isNaN(total)) totalModels = total; }
      }
      if (topRes.ok) {
        const rows = await topRes.json();
        if (Array.isArray(rows)) {
          const seen = new Set();
          for (const r of rows) {
            if (!r.username || seen.has(r.username)) continue;
            seen.add(r.username);
            topModels.push({ username: r.username, display_name: r.display_name || r.username, num_users: r.num_users ?? 0, num_followers: r.num_followers ?? 0, country: r.country || "", gender: r.gender || "" });
            if (topModels.length >= 10) break;
          }
        }
      }
    }
  } catch {}
  return { props: { totalModels, topModels } };
}

export default function Home({ totalModels, topModels }) {
  const top = topModels[0];
  const pageTitle = totalModels > 0
    ? `Campulse — ${totalModels.toLocaleString("es")} modelos en vivo en Chaturbate ahora`
    : "Campulse — Estadísticas de Chaturbate en Tiempo Real";
  const pageDescription = top
    ? `${totalModels.toLocaleString("es")} modelos online en Chaturbate ahora. ${top.display_name} lidera con ${top.num_users.toLocaleString("es")} viewers. Filtra por país, género e idioma.`
    : "Campulse rastrea las estadísticas de Chaturbate en tiempo real: viewers, seguidores y mejores horarios.";
  const schema = {
    "@context": "https://schema.org", "@type": "WebSite", name: "Campulse",
    description: pageDescription, url: SITE,
    potentialAction: { "@type": "SearchAction", target: `${SITE}/search?q={username}`, "query-input": "required name=username" },
  };
  const categories = [
    { href: "/gender",      emoji: "⚥", title: "Por Género",   desc: "Chicas, chicos, parejas y trans", accent: "#c084fc" },
    { href: "/country",     emoji: "🌍", title: "Por País",     desc: "Colombia, España, México y más",  accent: "#34d399" },
    { href: "/language",    emoji: "🗣", title: "Por Idioma",   desc: "Español, inglés, portugués...",   accent: "#fbbf24" },
    { href: "/top/latinas", emoji: "🌶️", title: "Top Latinas",  desc: "Las mejores latinas en vivo",    accent: "#f87171" },
  ];
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={SITE} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Campulse" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <style>{`
          *{box-sizing:border-box}
          html{background:#080810}
          body{margin:0;background:#080810}
          .cp{font-family:'DM Sans',system-ui,sans-serif;max-width:960px;margin:0 auto;padding:0 1.25rem 5rem;background:#080810;min-height:100vh;color:#e2e8f0}
          .cp-nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 0;border-bottom:1px solid rgba(255,255,255,.05);margin-bottom:0}
          .cp-nav a{text-decoration:none}
          .cp-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:#fff;letter-spacing:-.5px}
          .cp-nav-links{display:flex;gap:1.5rem}
          .cp-nav-link{font-size:.8125rem;color:#6b7280;font-weight:500;transition:color .2s}
          .cp-nav-link:hover{color:#c084fc}
          .cp-hero{text-align:center;padding:5rem 0 3rem}
          .cp-eyebrow{display:inline-flex;align-items:center;gap:7px;background:rgba(192,132,252,.07);border:1px solid rgba(192,132,252,.18);border-radius:100px;padding:5px 14px;font-size:.7rem;color:#c084fc;font-weight:600;letter-spacing:.07em;text-transform:uppercase;margin-bottom:1.5rem}
          .cp-live-dot{width:6px;height:6px;border-radius:50%;background:#ef4444;animation:pdot 2s infinite}
          @keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
          .cp-h1{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(2.8rem,9vw,5rem);line-height:1.03;margin:0 0 1rem;letter-spacing:-3px;background:linear-gradient(135deg,#fff 0%,#c084fc 55%,#818cf8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
          .cp-tagline{font-size:1rem;color:#6b7280;margin:0 auto 2rem;max-width:380px;line-height:1.65}
          .cp-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:100px;padding:9px 20px;font-size:.9375rem;color:#e2e8f0;font-weight:600}
          .cp-badge-num{color:#c084fc}
          .cp-search-wrap{margin:2rem 0 2.5rem}
          .cp-search{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:1rem 1.25rem;color:#374151;font-size:.9375rem;text-decoration:none;font-weight:500;transition:border-color .2s,background .2s}
          .cp-search:hover{border-color:rgba(192,132,252,.35);background:rgba(192,132,252,.04)}
          .cp-search-kbd{margin-left:auto;background:rgba(255,255,255,.06);border-radius:6px;padding:3px 8px;font-size:.6875rem;color:#374151;font-family:monospace}
          .cp-sec{margin-bottom:2.5rem}
          .cp-label{font-size:.6875rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#374151;margin-bottom:.875rem;display:flex;align-items:center;gap:8px}
          .cp-label::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}
          .cp-list{display:flex;flex-direction:column;gap:4px}
          .cp-row{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:13px 16px;text-decoration:none;color:#e2e8f0;transition:background .15s,border-color .15s,transform .15s}
          .cp-row:hover{background:rgba(192,132,252,.05);border-color:rgba(192,132,252,.18);transform:translateX(3px)}
          .cp-rank{font-size:.6875rem;color:#1f2937;width:22px;flex-shrink:0;font-weight:800;font-family:'Syne',sans-serif}
          .r1{color:#fbbf24}.r2{color:#9ca3af}.r3{color:#b87c4a}
          .cp-info{flex:1;min-width:0}
          .cp-name{font-weight:600;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .cp-meta{font-size:.75rem;color:#374151;display:flex;align-items:center;gap:4px;margin-top:2px}
          .cp-vwrap{text-align:right;flex-shrink:0}
          .cp-vnum{font-weight:800;color:#c084fc;font-size:.9375rem;font-family:'Syne',sans-serif}
          .cp-vlbl{font-size:.6875rem;color:#1f2937}
          .cp-more{display:block;text-align:center;margin-top:.875rem;color:#6b7280;font-size:.8125rem;text-decoration:none;transition:color .2s}
          .cp-more:hover{color:#c084fc}
          .cp-divider{height:1px;background:rgba(255,255,255,.05);margin:2rem 0}
          .cp-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:12px}
          .cp-cat{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:1.375rem 1.25rem;text-decoration:none;color:#e2e8f0;display:block;transition:transform .2s,border-color .2s,background .2s}
          .cp-cat:hover{transform:translateY(-2px)}
          .cp-cat-ico{font-size:1.5rem;margin-bottom:.75rem;display:block}
          .cp-cat-name{font-weight:700;font-size:.9375rem;margin-bottom:3px}
          .cp-cat-desc{font-size:.8125rem;color:#6b7280}
          .cp-pills{display:flex;flex-wrap:wrap;gap:7px}
          .cp-pill{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:100px;padding:6px 15px;text-decoration:none;color:#9ca3af;font-size:.8125rem;font-weight:500;transition:color .2s,border-color .2s,background .2s}
          .cp-pill:hover{color:#c084fc;border-color:rgba(192,132,252,.28);background:rgba(192,132,252,.05)}
          .cp-tag{color:#34d399}
          .cp-tag:hover{color:#34d399;border-color:rgba(52,211,153,.28);background:rgba(52,211,153,.05)}
          .cp-seo{margin-top:2.5rem;padding:1.375rem 1.5rem;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.05);border-radius:16px;color:#374151;font-size:.875rem;line-height:1.75}
          .cp-seo h2{color:#4b5563;font-size:.9375rem;margin:0 0 .625rem;font-weight:600}
          .cp-seo p{margin:0 0 .5rem}
          @media(max-width:640px){.cp-nav-links{gap:1rem}.cp-h1{letter-spacing:-2px}.cp-cats{grid-template-columns:1fr 1fr}}
        `}</style>
      </Head>

      <div className="cp">
        <nav className="cp-nav">
          <a href="/" className="cp-logo">Campulse</a>
          <div className="cp-nav-links">
            <a href="/gender" className="cp-nav-link">Géneros</a>
            <a href="/country" className="cp-nav-link">Países</a>
            <a href="/top/latinas" className="cp-nav-link">Latinas</a>
          </div>
        </nav>

        <section className="cp-hero">
          <div className="cp-eyebrow">
            <span className="cp-live-dot" />
            En tiempo real
          </div>
          <h1 className="cp-h1">Campulse</h1>
          <p className="cp-tagline">Estadísticas de Chaturbate en tiempo real.<br />Viewers, seguidores y mejores horarios.</p>
          {totalModels > 0 && (
            <div className="cp-badge">
              <span className="cp-live-dot" />
              <span className="cp-badge-num">{totalModels.toLocaleString("es")}</span> modelos online ahora
            </div>
          )}
        </section>

        <div className="cp-search-wrap">
          <a href="/search" className="cp-search">
            🔍 Buscar modelo por username...
            <span className="cp-search-kbd">buscar</span>
          </a>
        </div>

        {topModels.length > 0 && (
          <section className="cp-sec">
            <div className="cp-label">🔥 Top 10 en vivo ahora</div>
            <div className="cp-list">
              {topModels.map((m, i) => {
                const cc = m.country?.toLowerCase();
                const cn = COUNTRY_NAMES[m.country?.toUpperCase()] || m.country || null;
                const gi = GENDER_LABELS[m.gender] || "";
                const gc = GENDER_COLORS[m.gender] || "#4b5563";
                const rc = i===0?"cp-rank r1":i===1?"cp-rank r2":i===2?"cp-rank r3":"cp-rank";
                return (
                  <a key={m.username} href={`/model/${m.username}`} className="cp-row">
                    <span className={rc}>#{i+1}</span>
                    <div className="cp-info">
                      <div className="cp-name">{m.display_name}</div>
                      <div className="cp-meta">
                        {gi && <span style={{color:gc}}>{gi}</span>}
                        {cc && <img src={`https://flagcdn.com/16x12/${cc}.png`} alt={cn||m.country} width={16} height={12} style={{verticalAlign:"middle",borderRadius:2}} />}
                        {cn}
                      </div>
                    </div>
                    <div className="cp-vwrap">
                      <div className="cp-vnum">{m.num_users.toLocaleString("es")}</div>
                      <div className="cp-vlbl">viewers</div>
                    </div>
                  </a>
                );
              })}
            </div>
            <a href="/gender/female" className="cp-more">Ver más modelos →</a>
          </section>
        )}

        <div className="cp-divider" />

        <section className="cp-sec">
          <div className="cp-label">Explorar por categoría</div>
          <div className="cp-cats">
            {categories.map(cat => (
              <a key={cat.href} href={cat.href} className="cp-cat"
                onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.accent+"44";e.currentTarget.style.background=cat.accent+"0a"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="";e.currentTarget.style.background=""}}>
                <span className="cp-cat-ico">{cat.emoji}</span>
                <div className="cp-cat-name">{cat.title}</div>
                <div className="cp-cat-desc">{cat.desc}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="cp-sec">
          <div className="cp-label">Géneros populares</div>
          <div className="cp-pills">
            {[{href:"/gender/female",l:"♀ Chicas"},{href:"/gender/male",l:"♂ Chicos"},{href:"/gender/couple",l:"♥ Parejas"},{href:"/gender/trans",l:"⚧ Trans"},{href:"/top/latinas",l:"🌶️ Latinas"}].map(x=>(
              <a key={x.href} href={x.href} className="cp-pill">{x.l}</a>
            ))}
          </div>
        </section>

        <section className="cp-sec">
          <div className="cp-label">Países más activos</div>
          <div className="cp-pills">
            {[{href:"/country/co",l:"🇨🇴 Colombia"},{href:"/country/es",l:"🇪🇸 España"},{href:"/country/mx",l:"🇲🇽 México"},{href:"/country/ro",l:"🇷🇴 Rumania"},{href:"/country/us",l:"🇺🇸 EEUU"},{href:"/country/br",l:"🇧🇷 Brasil"}].map(x=>(
              <a key={x.href} href={x.href} className="cp-pill">{x.l}</a>
            ))}
          </div>
        </section>

        <section className="cp-sec">
          <div className="cp-label">Idiomas</div>
          <div className="cp-pills">
            {[{href:"/language/spanish",l:"🇪🇸 Español"},{href:"/language/english",l:"🇬🇧 English"},{href:"/language/portuguese",l:"🇧🇷 Português"},{href:"/language/romanian",l:"🇷🇴 Română"},{href:"/language/russian",l:"🇷🇺 Русский"}].map(x=>(
              <a key={x.href} href={x.href} className="cp-pill">{x.l}</a>
            ))}
          </div>
        </section>

        <section className="cp-sec">
          <div className="cp-label">Tags populares</div>
          <div className="cp-pills">
            {["latina","bigboobs","ebony","teen","curvy","lovense","squirt","colombia"].map(t=>(
              <a key={t} href={`/tag/${t}`} className="cp-pill cp-tag">#{t}</a>
            ))}
          </div>
        </section>

        <div className="cp-seo">
          <h2>Estadísticas de Chaturbate en tiempo real</h2>
          <p>Campulse rastrea viewers, seguidores y mejores horarios de miles de modelos, actualizado cada 2 horas desde Chaturbate.</p>
          <p>Encuentra las modelos más vistas de Colombia, España, México y 50 países más. Filtra por género, idioma o país para descubrir nuevas modelos en vivo.</p>
        </div>
      </div>
    </>
  );
}
