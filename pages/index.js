// pages/index.js — CampulseHub Home
// Estrategia SEO: página indexable por Google que presenta el dashboard
// y lleva al usuario a /app.html con un clic, maximizando clicks desde SERP.

import Head from "next/head";

const SITE = "https://www.campulsehub.com";

const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",ES:"España",
  US:"Estados Unidos",BR:"Brasil",RO:"Rumania",RU:"Rusia",DE:"Alemania",
  FR:"Francia",GB:"Reino Unido",IT:"Italia",UA:"Ucrania",PH:"Filipinas",
  CA:"Canadá",AU:"Australia",HU:"Hungría",PL:"Polonia",PE:"Perú",VE:"Venezuela",
};
const GENDER_LABELS = { f:"♀",m:"♂",c:"♥",t:"⚧" };
const GENDER_COLORS = { f:"#e8305a",m:"#3080e8",c:"#d48020",t:"#9248c8" };

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  let totalModels = 0, topModels = [], liveCount = 0;
  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
      const sbHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
      const [countRes, topRes, liveRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&select=username`,
          { headers: { ...sbHeaders, "Prefer": "count=exact", "Range": "0-0" } }),
        fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&select=username,display_name,num_users,num_followers,country,gender&order=num_users.desc&limit=200`,
          { headers: sbHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${new Date(Date.now()-2*60*60*1000).toISOString()}&num_users=gt.0&select=username`,
          { headers: { ...sbHeaders, "Prefer": "count=exact", "Range": "0-0" } }),
      ]);
      if (countRes.ok) {
        const range = countRes.headers.get("content-range");
        if (range) { const t = parseInt(range.split("/")[1],10); if (!isNaN(t)) totalModels = t; }
      }
      if (liveRes.ok) {
        const range = liveRes.headers.get("content-range");
        if (range) { const t = parseInt(range.split("/")[1],10); if (!isNaN(t)) liveCount = t; }
      }
      if (topRes.ok) {
        const rows = await topRes.json();
        if (Array.isArray(rows)) {
          const seen = new Set();
          for (const r of rows) {
            if (!r.username || seen.has(r.username)) continue;
            seen.add(r.username);
            topModels.push({ username:r.username, display_name:r.display_name||r.username, num_users:r.num_users??0, country:r.country||"", gender:r.gender||"" });
            if (topModels.length >= 12) break;
          }
        }
      }
    }
  } catch {}
  return { props: { totalModels, topModels, liveCount } };
}

export default function Home({ totalModels, topModels, liveCount }) {
  const top = topModels[0];
  const pageTitle = totalModels > 0
    ? `CampulseHub — ${totalModels.toLocaleString("es")} modelos Chaturbate en vivo ahora`
    : "CampulseHub — Dashboard de Chaturbate en Tiempo Real";
  const pageDescription = top
    ? `${(liveCount||totalModels).toLocaleString("es")} modelos en vivo en Chaturbate ahora mismo. ${top.display_name} lidera con ${top.num_users.toLocaleString("es")} viewers. Filtra por país, género, idioma y tags. Stats actualizados en tiempo real.`
    : "Dashboard de estadísticas de Chaturbate en tiempo real. Filtra modelos por país, género e idioma. Viewers, seguidores y mejores horarios actualizados cada hora.";

  const schema = {
    "@context":"https://schema.org","@type":"WebSite",name:"CampulseHub",
    description:pageDescription,url:SITE,
    potentialAction:{"@type":"SearchAction",target:`${SITE}/search?q={search_term_string}`,"query-input":"required name=search_term_string"},
  };

  const cats = [
    { href:"/gender/female", emoji:"♀️", title:"Chicas",      desc:"Las más vistas ahora",       accent:"#e8305a" },
    { href:"/gender/male",   emoji:"♂️", title:"Chicos",      desc:"Top hombres en vivo",         accent:"#3080e8" },
    { href:"/gender/couple", emoji:"♥️", title:"Parejas",     desc:"Parejas en directo",          accent:"#d48020" },
    { href:"/gender/trans",  emoji:"⚧️", title:"Trans",       desc:"Modelos trans en vivo",       accent:"#9248c8" },
    { href:"/top/latinas",   emoji:"🌶️", title:"Top Latinas", desc:"Colombia, México, Argentina", accent:"#f0a830" },
    { href:"/country/co",    emoji:"🇨🇴", title:"Colombia",    desc:`${topModels.filter(m=>m.country==="CO").length > 0 ? "429+ modelos" : "Modelos colombianas"}`, accent:"#22c77a" },
  ];

  const countries = [
    {href:"/country/co",l:"🇨🇴 Colombia"},{href:"/country/es",l:"🇪🇸 España"},
    {href:"/country/mx",l:"🇲🇽 México"},{href:"/country/ar",l:"🇦🇷 Argentina"},
    {href:"/country/ro",l:"🇷🇴 Rumania"},{href:"/country/us",l:"🇺🇸 EEUU"},
    {href:"/country/br",l:"🇧🇷 Brasil"},{href:"/country/ru",l:"🇷🇺 Rusia"},
    {href:"/country/ph",l:"🇵🇭 Filipinas"},{href:"/country/gb",l:"🇬🇧 UK"},
  ];

  const langs = [
    {href:"/language/spanish",l:"🇪🇸 Español"},{href:"/language/english",l:"🇬🇧 English"},
    {href:"/language/portuguese",l:"🇧🇷 Português"},{href:"/language/romanian",l:"🇷🇴 Română"},
    {href:"/language/russian",l:"🇷🇺 Русский"},{href:"/language/german",l:"🇩🇪 Deutsch"},
  ];

  const tags = ["latina","bigboobs","ebony","teen","curvy","lovense","squirt","colombia","anal","lesbians"];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={SITE}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={SITE}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="CampulseHub"/>
        <meta property="og:image" content={`${SITE}/og-image.png`}/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={pageTitle}/>
        <meta name="twitter:description" content={pageDescription}/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          html,body{background:#0f1014;color:#e8eaf0;font-family:'Outfit',sans-serif;font-size:15px;-webkit-font-smoothing:antialiased}
          a{text-decoration:none;color:inherit}
          :root{
            --bg:#0f1014;--bg2:#151720;--surf:#1e2130;--surf2:#252839;
            --bdr:rgba(255,255,255,.07);--bdr2:rgba(255,255,255,.12);
            --txt:#e8eaf0;--txt2:#8892a8;--txt3:#505870;
            --hot:#e8305a;--neon:#38b6d4;--gold:#f0a830;--purple:#7c5cbf;
            --radius:12px;
          }
          .pg{max-width:940px;margin:0 auto;padding:0 1.25rem 5rem}

          /* NAV */
          .nav{display:flex;align-items:center;justify-content:space-between;padding:1.125rem 0;border-bottom:1px solid var(--bdr);margin-bottom:0}
          .logo{display:flex;align-items:center;gap:.45rem;font-weight:800;font-size:1.05rem;letter-spacing:-.03em}
          .logo-icon{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--hot),var(--purple));display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;color:#fff}
          .logo em{color:var(--neon);font-style:normal}
          .nav-links{display:flex;gap:1.25rem}
          .nav-link{font-size:.8125rem;color:var(--txt2);font-weight:500;transition:color .2s}
          .nav-link:hover{color:var(--neon)}

          /* HERO */
          .hero{padding:3.5rem 0 2rem;text-align:center}
          .live-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(232,48,90,.1);border:1px solid rgba(232,48,90,.25);border-radius:100px;padding:5px 14px;font-size:.7rem;font-weight:700;color:var(--hot);letter-spacing:.06em;text-transform:uppercase;margin-bottom:1.25rem}
          .live-dot{width:6px;height:6px;border-radius:50%;background:var(--hot);animation:pulse 1.8s ease-in-out infinite;flex-shrink:0}
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
          .h1{font-size:clamp(2.4rem,8vw,4.25rem);font-weight:900;line-height:1.04;letter-spacing:-2.5px;margin-bottom:.875rem}
          .h1 em{color:var(--neon);font-style:normal}
          .tagline{font-size:1rem;color:var(--txt2);margin-bottom:1.875rem;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.65}
          .stats-row{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:2rem}
          .stat-pill{background:var(--surf);border:1px solid var(--bdr2);border-radius:100px;padding:8px 18px;font-size:.875rem;font-weight:600;color:var(--txt);display:flex;align-items:center;gap:7px}
          .stat-pill em{color:var(--neon);font-style:normal;font-weight:800}

          /* CTA PRINCIPAL */
          .cta-wrap{margin-bottom:2.5rem}
          .cta-btn{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--hot),var(--purple));color:#fff;font-weight:800;font-size:1rem;padding:1rem 2rem;border-radius:14px;letter-spacing:-.02em;transition:transform .18s,box-shadow .18s;box-shadow:0 4px 24px rgba(232,48,90,.3)}
          .cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(232,48,90,.45)}
          .cta-btn svg{width:18px;height:18px;flex-shrink:0}
          .cta-sub{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:.875rem;flex-wrap:wrap}
          .cta-link{font-size:.8125rem;color:var(--txt2);display:flex;align-items:center;gap:5px;transition:color .2s}
          .cta-link:hover{color:var(--neon)}

          /* SECCIÓN */
          .sec{margin-top:2.25rem}
          .sec-label{font-size:.6875rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);margin-bottom:.875rem;display:flex;align-items:center;gap:10px}
          .sec-label::after{content:'';flex:1;height:1px;background:var(--bdr)}

          /* TOP MODELS */
          .model-list{display:flex;flex-direction:column;gap:4px}
          .model-row{display:flex;align-items:center;gap:12px;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--radius);padding:12px 16px;transition:border-color .15s,background .15s}
          .model-row:hover{background:var(--surf2);border-color:var(--bdr2)}
          .rank{font-size:.6875rem;font-weight:800;width:22px;flex-shrink:0;color:var(--txt3)}
          .rank.r1{color:#f0a830}.rank.r2{color:#8892a8}.rank.r3{color:#b87c4a}
          .model-info{flex:1;min-width:0}
          .model-name{font-weight:600;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .model-meta{font-size:.75rem;color:var(--txt2);display:flex;align-items:center;gap:5px;margin-top:2px}
          .model-viewers{text-align:right;flex-shrink:0}
          .viewers-num{font-weight:800;color:var(--neon);font-size:.9375rem}
          .viewers-lbl{font-size:.6875rem;color:var(--txt3)}
          .see-more{display:block;text-align:center;margin-top:.75rem;color:var(--txt2);font-size:.8125rem;padding:.5rem;border-radius:8px;transition:color .18s}
          .see-more:hover{color:var(--neon)}

          /* CATEGORÍAS */
          .cats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
          @media(max-width:580px){.cats-grid{grid-template-columns:repeat(2,1fr)}}
          .cat-card{background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:1.125rem 1rem;transition:border-color .2s,background .2s,transform .2s;display:block}
          .cat-card:hover{transform:translateY(-2px)}
          .cat-emoji{font-size:1.375rem;margin-bottom:.5rem;display:block}
          .cat-name{font-weight:700;font-size:.875rem;margin-bottom:2px}
          .cat-desc{font-size:.75rem;color:var(--txt2)}

          /* PILLS */
          .pills{display:flex;flex-wrap:wrap;gap:7px}
          .pill{background:rgba(255,255,255,.04);border:1px solid var(--bdr);border-radius:100px;padding:6px 14px;font-size:.8125rem;color:var(--txt2);font-weight:500;transition:color .18s,border-color .18s,background .18s}
          .pill:hover{color:var(--neon);border-color:rgba(56,182,212,.3);background:rgba(56,182,212,.07)}
          .pill-tag{color:var(--grn,#22c77a)}
          .pill-tag:hover{color:#22c77a;border-color:rgba(34,199,122,.3);background:rgba(34,199,122,.07)}

          /* SEO BLOCK */
          .seo-block{margin-top:2.5rem;padding:1.375rem 1.5rem;background:var(--surf);border:1px solid var(--bdr);border-radius:16px;color:var(--txt2);font-size:.875rem;line-height:1.75}
          .seo-block h2{color:var(--txt);font-size:.9375rem;margin-bottom:.625rem;font-weight:700}
          .seo-block p{margin-bottom:.5rem}
          .seo-block p:last-child{margin-bottom:0}

          .divider{height:1px;background:var(--bdr);margin:2rem 0}
          @media(max-width:640px){.nav-links{gap:1rem}.h1{letter-spacing:-1.5px}}
        `}</style>
      </Head>

      <div className="pg">
        {/* NAV */}
        <nav className="nav">
          <a href="/app.html" className="logo">
            <span className="logo-icon">CH</span>
            Campulse<em>Hub</em>
          </a>
          <div className="nav-links">
            <a href="/gender" className="nav-link">Géneros</a>
            <a href="/country" className="nav-link">Países</a>
            <a href="/search" className="nav-link">Buscar</a>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="live-pill">
            <span className="live-dot"/>
            En vivo ahora
          </div>
          <h1 className="h1">Campulse<em>Hub</em></h1>
          <p className="tagline">Dashboard de Chaturbate en tiempo real. Viewers, seguidores, filtros por país, género e idioma.</p>

          {/* Stats */}
          {totalModels > 0 && (
            <div className="stats-row">
              <div className="stat-pill">
                <span className="live-dot"/>
                <em>{(liveCount||totalModels).toLocaleString("es")}</em> modelos online
              </div>
              {topModels[0] && (
                <div className="stat-pill">
                  🔥 Top: <em>{topModels[0].num_users.toLocaleString("es")}</em> viewers
                </div>
              )}
              <div className="stat-pill">
                📡 Actualizado <em>en tiempo real</em>
              </div>
            </div>
          )}

          {/* CTA PRINCIPAL — lleva al dashboard */}
          <div className="cta-wrap">
            <a href="/app.html" className="cta-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
              </svg>
              Abrir Dashboard en Vivo
            </a>
            <div className="cta-sub">
              <a href="/search" className="cta-link">🔍 Buscar modelo</a>
              <a href="/top/latinas" className="cta-link">🌶️ Top Latinas</a>
              <a href="/country/co" className="cta-link">🇨🇴 Colombia</a>
            </div>
          </div>
        </section>

        {/* TOP MODELOS */}
        {topModels.length > 0 && (
          <section className="sec">
            <div className="sec-label">🔥 Top 12 en vivo ahora</div>
            <div className="model-list">
              {topModels.map((m,i) => {
                const cc = m.country?.toLowerCase();
                const cn = COUNTRY_NAMES[m.country?.toUpperCase()]||m.country||null;
                const gi = GENDER_LABELS[m.gender]||"";
                const gc = GENDER_COLORS[m.gender]||"var(--txt3)";
                const rc = i===0?"rank r1":i===1?"rank r2":i===2?"rank r3":"rank";
                return (
                  <a key={m.username} href={`/model/${m.username}`} className="model-row">
                    <span className={rc}>#{i+1}</span>
                    <div className="model-info">
                      <div className="model-name">{m.display_name}</div>
                      <div className="model-meta">
                        {gi && <span style={{color:gc}}>{gi}</span>}
                        {cc && <img src={`https://flagcdn.com/16x12/${cc}.png`} alt={cn||m.country} width={16} height={12} style={{verticalAlign:"middle",borderRadius:2}}/>}
                        {cn}
                      </div>
                    </div>
                    <div className="model-viewers">
                      <div className="viewers-num">{m.num_users.toLocaleString("es")}</div>
                      <div className="viewers-lbl">viewers</div>
                    </div>
                  </a>
                );
              })}
            </div>
            <a href="/app.html" className="see-more">Ver todas las modelos en vivo →</a>
          </section>
        )}

        <div className="divider"/>

        {/* CATEGORÍAS */}
        <section className="sec">
          <div className="sec-label">Explorar por género</div>
          <div className="cats-grid">
            {cats.map(c => (
              <a key={c.href} href={c.href} className="cat-card"
                onMouseEnter={e=>{e.currentTarget.style.borderColor=c.accent+"44";e.currentTarget.style.background=c.accent+"0d"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="";e.currentTarget.style.background=""}}>
                <span className="cat-emoji">{c.emoji}</span>
                <div className="cat-name">{c.title}</div>
                <div className="cat-desc">{c.desc}</div>
              </a>
            ))}
          </div>
        </section>

        {/* PAÍSES */}
        <section className="sec">
          <div className="sec-label">Países más activos</div>
          <div className="pills">
            {countries.map(x=>(
              <a key={x.href} href={x.href} className="pill">{x.l}</a>
            ))}
          </div>
        </section>

        {/* IDIOMAS */}
        <section className="sec">
          <div className="sec-label">Por idioma</div>
          <div className="pills">
            {langs.map(x=>(
              <a key={x.href} href={x.href} className="pill">{x.l}</a>
            ))}
          </div>
        </section>

        {/* TAGS */}
        <section className="sec">
          <div className="sec-label">Tags populares</div>
          <div className="pills">
            {tags.map(t=>(
              <a key={t} href={`/tag/${t}`} className="pill pill-tag">#{t}</a>
            ))}
          </div>
        </section>

        {/* SEO BLOCK — texto indexable por Google */}
        <div className="seo-block">
          <h2>Dashboard de Chaturbate en tiempo real — CampulseHub</h2>
          <p>CampulseHub rastrea en tiempo real las estadísticas de miles de modelos de Chaturbate: viewers activos, seguidores, mejores horarios y más. Los datos se actualizan automáticamente cada hora.</p>
          <p>Filtra modelos por país (Colombia, España, México, Rumania, Brasil), por género (chicas, chicos, parejas, trans) o por idioma (español, inglés, portugués). Descubre qué modelos están en vivo ahora mismo y cuál es su audiencia real.</p>
          <p>Cada perfil muestra el historial de viewers de los últimos 30 días, el mejor horario para conectarse y estadísticas comparativas con otras modelos del mismo país.</p>
        </div>
      </div>
    </>
  );
}
