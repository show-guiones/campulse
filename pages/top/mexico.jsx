// pages/top/mexico.jsx — Top modelos mexicanas en Chaturbate en vivo

import Head from "next/head";
import { DS_CSS, Logo } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";
const LEXY = "lexy_fox2";
const AFF = "rI8z3";

const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",
  ES:"España",US:"Estados Unidos",BR:"Brasil",EC:"Ecuador",
};
const FLAG = (code) => code ? String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6-65+c.charCodeAt(0))) : "";
const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
];

export async function getServerSideProps() {
  let models = [];
  let isLiveData = false;

  try {
    const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=500&offset=0`,
      { signal: ctrl.signal, headers: { "User-Agent": ua, "Accept": "application/json", "Referer": "https://chaturbate.com/" } }
    );
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      const mexicanas = results.filter(r => (r.country||"").toUpperCase() === "MX");
      if (mexicanas.length > 0) {
        isLiveData = true;
        models = mexicanas
          .map(r => ({ username:r.username, display_name:r.display_name||r.username, num_users:r.num_users??0, country:"MX", gender:r.gender||"" }))
          .sort((a,b) => b.num_users - a.num_users)
          .slice(0,50);
      }
    }
  } catch (_) {}

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (models.length === 0 && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const since = new Date(Date.now()-26*60*60*1000).toISOString();
      const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&country=eq.MX&num_users=gt.0&select=username,display_name,num_users,country,gender&order=num_users.desc&limit=200`;
      const r = await fetch(url, { headers: { apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
      if (r.ok) {
        const raw = await r.json();
        const map = new Map();
        for (const row of (Array.isArray(raw)?raw:[])) {
          if (!map.has(row.username) || row.num_users > map.get(row.username).num_users)
            map.set(row.username, row);
        }
        models = [...map.values()].sort((a,b)=>b.num_users-a.num_users).slice(0,50).map(r=>({...r,country:"MX",fromCache:true}));
      }
    } catch (_) {}
  }

  return { props: { models:models.slice(0,50), isLiveData, fetchedAt:new Date().toISOString() } };
}

export default function TopMexicoPage({ models, isLiveData }) {
  const liveCount = models.filter(m => !m.offline && !m.fromCache).length;
  const topViewers = models.filter(m => !m.offline && !m.fromCache)[0]?.num_users ?? 0;

  const pageTitle = liveCount > 0
    ? `Top ${liveCount} Mexicanas en Chaturbate en vivo ahora 🇲🇽 | CampulseHub`
    : `Top Mexicanas en Chaturbate — Modelos de México en vivo | CampulseHub`;
  const pageDescription = `Las ${liveCount||"mejores"} modelos mexicanas en vivo en Chaturbate ahora mismo.${topViewers>0?` La más vista tiene ${topViewers.toLocaleString("es")} viewers.`:""} Stats en tiempo real.`;

  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,
    url:`${SITE}/top/mexico`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[
      {"@type":"ListItem",position:1,name:"CampulseHub",item:SITE},
      {"@type":"ListItem",position:2,name:"Top México 🇲🇽",item:`${SITE}/top/mexico`}
    ]},
    hasPart:models.slice(0,10).map(m=>({ "@type":"WebPage",name:`${m.display_name||m.username} — modelo mexicana en Chaturbate`,url:`${SITE}/model/${m.username}` })),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="keywords" content="mexicanas chaturbate, modelos mexicanas en vivo, chaturbate mexico, webcam mexico, mexicanas online"/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/top/mexico`}/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={pageTitle}/>
        <meta name="twitter:description" content={pageDescription}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/top/mexico`}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="CampulseHub"/>
        <meta property="og:image" content={`${SITE}/og-image.png`}/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{DS_CSS}</style>
      </Head>

      <div className="cmp-page">
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/top/latinas" className="cmp-nav-link">Top Latinas</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/" style={{fontWeight:700,textDecoration:"none",color:"var(--txt2)"}}>CampulseHub</a>
          <span className="cmp-bc-sep">›</span>
          <a href="/country/mx" style={{fontWeight:500,textDecoration:"none",color:"var(--txt2)"}}>México</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt)"}}>Top Mexicanas</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">🇲🇽 Top Mexicanas en vivo</h1>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:".75rem",flexWrap:"wrap"}}>
            <span style={{background:"rgba(232,48,90,.12)",color:"var(--hot)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(232,48,90,.3)",fontWeight:600}}>{liveCount} en vivo</span>
            {topViewers > 0 && <span style={{background:"rgba(56,182,212,.1)",color:"var(--neon)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(56,182,212,.25)",fontWeight:600}}>Máx. {topViewers.toLocaleString("es")} viewers</span>}
            {!isLiveData && <span style={{background:"rgba(100,100,100,.12)",color:"var(--txt3)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(100,100,100,.2)"}}>datos recientes</span>}
          </div>
          <p className="cmp-page-sub">Las mejores modelos mexicanas de Chaturbate ordenadas por viewers en tiempo real.</p>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
          {["CO","AR","CL","ES","PE"].map(c=>(
            <a key={c} href={`/country/${c.toLowerCase()}`}
              style={{background:"var(--surf)",color:"var(--neon)",textDecoration:"none",padding:"6px 14px",borderRadius:20,fontSize:".8125rem",border:"1px solid var(--bdr2)",fontWeight:500}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surf2)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--surf)"}>
              {FLAG(c)} {COUNTRY_NAMES[c]}
            </a>
          ))}
        </div>

        <a href={`https://chaturbate.com/in/?tour=LQps&campaign=${AFF}&track=default`} target="_blank" rel="noopener noreferrer" className="cmp-cta-live">
          🔴 Ver mexicanas en vivo ahora →
        </a>

        {models.length === 0 ? (
          <p style={{textAlign:"center",color:"var(--txt3)",padding:"48px 0",fontSize:".875rem"}}>No hay modelos mexicanas disponibles en este momento. Vuelve pronto.</p>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {models.map((m,i) => {
              const isOffline = !!(m.offline||m.fromCache);
              const medal = i===0?"cmp-rank-1":i===1?"cmp-rank-2":i===2?"cmp-rank-3":"";
              return (
                <a key={m.username} href={`/model/${m.username}`}
                  style={{display:"flex",alignItems:"center",gap:16,background:"var(--surf)",borderRadius:"var(--radius)",padding:"14px 18px",border:"1px solid var(--bdr)",transition:"border-color .2s,background .15s",textDecoration:"none",position:"relative",overflow:"hidden"}}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(56,182,212,.3)"; e.currentTarget.style.background="rgba(56,182,212,.04)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--bdr)"; e.currentTarget.style.background="var(--surf)"; }}>
                  {!isOffline && <div style={{position:"absolute",top:8,right:12,display:"flex",alignItems:"center",gap:4,fontSize:".65rem",color:"#22c55e",fontWeight:700}}><span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>EN VIVO</div>}
                  <span className={`cmp-rank ${medal}`}>#{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.display_name||m.username}</div>
                    <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>@{m.username}</div>
                    <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>🇲🇽 México</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {m.num_users > 0
                      ? <><div style={{fontWeight:800,fontSize:"1.125rem",color:"var(--neon)"}}>{m.num_users.toLocaleString("es")}</div><div style={{fontSize:".65rem",color:"var(--txt3)"}}>viewers</div></>
                      : <div style={{fontSize:".75rem",color:"var(--txt3)"}}>Ver sala →</div>}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>Modelos mexicanas en Chaturbate</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
            México tiene una de las comunidades más grandes de modelos en Chaturbate. CampulseHub rastrea en tiempo real las estadísticas de las mexicanas en vivo: viewers, seguidores y mejores horarios.
          </p>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginTop:".75rem"}}>
            Explora también el <a href="/top/latinas" style={{color:"var(--neon)"}}>ranking completo de latinas</a> o el <a href="/top/colombia" style={{color:"var(--neon)"}}>top de colombianas</a>.
          </p>
        </section>

        <div className="cmp-footer-links">
          <a href="/top/colombia" className="cmp-footer-link">← Top Colombia</a>
          <a href="/top/espana" className="cmp-footer-link">Top España →</a>
        </div>
      </div>
    </>
  );
}
