// pages/top/latinas.jsx — En vivo tiempo real, 1 request, fallback Supabase

import Head from "next/head";
import { DS_CSS, Logo, BottomNav} from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";
const LEXY = "lexy_fox2";
const CAMPAIGN = "rI8z3";
const AFF = "rI8z3";

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

const LATINA_COUNTRIES = new Set(["CO","MX","AR","CL","PE","VE","EC","BO","PY","UY","CR","PA","HN","SV","GT","DO","CU","PR","ES"]);
const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",BO:"Bolivia",
  PY:"Paraguay",UY:"Uruguay",CR:"Costa Rica",PA:"Panamá",HN:"Honduras",SV:"El Salvador",GT:"Guatemala",
  DO:"Rep. Dominicana",CU:"Cuba",PR:"Puerto Rico",ES:"España",
};
const FLAG = (code) => code ? String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6-65+c.charCodeAt(0))) : "";

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  let models = [];
  let isLiveData = false;

  // ── 1. Chaturbate en tiempo real — UNA request, filtrar latinas client-side ──
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
      const latinas = results.filter(r => LATINA_COUNTRIES.has((r.country || "").toUpperCase()) || r.username === LEXY);
      if (latinas.length > 0) {
        isLiveData = true;
        models = latinas
          .map(r => ({ username: r.username, display_name: r.display_name || r.username, num_users: r.num_users ?? 0, country: (r.country || "").toUpperCase(), gender: r.gender || "" }))
          .sort((a, b) => b.num_users - a.num_users)
          .slice(0, 50);
      }
    }
  } catch (_) {}

  // ── 2. Fallback Supabase ──
  if (models.length === 0 && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
      const countryFilter = [...LATINA_COUNTRIES].map(c => `country.eq.${c}`).join(",");
      const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&or=(${countryFilter})&num_users=gt.0&select=username,display_name,num_users,country,gender&order=num_users.desc&limit=1000`;
      const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      if (r.ok) {
        const raw = await r.json();
        const map = new Map();
        for (const row of (Array.isArray(raw) ? raw : [])) {
          if (!map.has(row.username) || row.num_users > map.get(row.username).num_users)
            map.set(row.username, row);
        }
        models = [...map.values()]
          .sort((a, b) => b.num_users - a.num_users)
          .slice(0, 50)
          .map(r => ({ ...r, country: (r.country || "").toUpperCase(), fromCache: true }));
      }
    } catch (_) {}
  }

  // ── 3. lexy_fox2 siempre presente ──
  if (!models.some(m => m.username === LEXY)) {
    let lexyData = { username: LEXY, display_name: LEXY, num_users: 0, country: "CO", gender: "f", offline: true };
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/rooms_snapshot?username=eq.${LEXY}&captured_at=gte.${since}&select=username,display_name,num_users&order=num_users.desc&limit=1`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const rows = r.ok ? await r.json() : [];
        if (Array.isArray(rows) && rows[0]) lexyData = { ...lexyData, display_name: rows[0].display_name || LEXY, num_users: rows[0].num_users ?? 0 };
      } catch (_) {}
    }
    models = [lexyData, ...models];
  }

  return { props: { models: models.slice(0, 50), isLiveData, fetchedAt: new Date().toISOString() } };
}

export default function TopLatinasPage({ models, isLiveData, fetchedAt }) {
  const lexyModel = models.find(m => m.username === LEXY);
  const others = models.filter(m => m.username !== LEXY);
  let ordered = [...others];
  if (lexyModel) {
    const slot = Math.floor(new Date(fetchedAt).getMinutes() / 20) % 3;
    ordered.splice(slot, 0, lexyModel);
  }
  ordered = ordered.slice(0, 50);
  const liveCount = ordered.filter(m => !m.offline && !m.fromCache).length;
  const topViewers = ordered.filter(m => !m.offline && !m.fromCache)[0]?.num_users ?? 0;

  const pageTitle = `Top Latinas en Chaturbate — ${liveCount} en vivo ahora | CampulseHub`;
  const pageDescription = `Las ${liveCount} mejores modelos latinas en vivo en Chaturbate ahora mismo. Colombianas, mexicanas, argentinas y más — viewers reales.`;

  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/top/latinas`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"CampulseHub",item:SITE},{"@type":"ListItem",position:2,name:"Top Latinas",item:`${SITE}/top/latinas`}]},
    hasPart:ordered.slice(0,10).map(m=>({"@type":"WebPage",name:`${m.display_name||m.username} — CampulseHub`,url:`${SITE}/model/${m.username}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="keywords" content="modelos latinas chaturbate, latinas en vivo, colombianas chaturbate, mexicanas chaturbate, webcam latina"/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/top/latinas`}/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={pageTitle}/>
        <meta name="twitter:description" content={pageDescription}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/top/latinas`}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="CampulseHub"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{DS_CSS}</style>
      </Head>

      <div className="cmp-page cmp-page-body">
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/app.html" style={{display:"inline-flex",alignItems:"center",gap:"0",fontWeight:800,letterSpacing:"-.5px",textDecoration:"none",color:"#fff"}}>Campulse<span style={{color:"#c084fc"}}>Hub</span></a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>Top Latinas</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">🌶️ Top Latinas en vivo</h1>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:".75rem",flexWrap:"wrap"}}>
            <span style={{background:"rgba(232,48,90,.12)",color:"var(--hot)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(232,48,90,.3)",fontWeight:600}}>
              {liveCount} en vivo
            </span>
            {topViewers > 0 && <span style={{background:"rgba(56,182,212,.1)",color:"var(--neon)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(56,182,212,.25)",fontWeight:600}}>Máx. {topViewers.toLocaleString("es")} viewers</span>}
            {!isLiveData && <span style={{background:"rgba(100,100,100,.12)",color:"var(--txt3)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(100,100,100,.2)"}}>datos recientes</span>}
          </div>
          <p className="cmp-page-sub">Las mejores modelos latinas de Chaturbate ordenadas por viewers en tiempo real.</p>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
          {["CO","MX","AR","CL","ES"].map(c=>(
            <a key={c} href={`/country/${c.toLowerCase()}`}
              style={{background:"var(--surf)",color:"var(--neon)",textDecoration:"none",padding:"6px 14px",borderRadius:20,fontSize:".8125rem",border:"1px solid var(--bdr2)",fontWeight:500}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surf2)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--surf)"}>
              {FLAG(c)} {COUNTRY_NAMES[c]}
            </a>
          ))}
        </div>

        <a href={`https://chaturbate.com/in/?tour=LQps&campaign=${CAMPAIGN}&track=default&room=${LEXY}`} target="_blank" rel="noopener noreferrer" className="cmp-cta-live">
          🔴 Ver latinas en vivo ahora →
        </a>

        {ordered.length === 0 ? (
          <p style={{textAlign:"center",color:"var(--txt3)",padding:"48px 0",fontSize:".875rem"}}>No hay modelos latinas disponibles en este momento. Vuelve pronto.</p>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ordered.map((m,i) => {
              const isLexy = m.username === LEXY;
              const isOffline = !!(m.offline || m.fromCache);
              const medal = i===0?"cmp-rank-1":i===1?"cmp-rank-2":i===2?"cmp-rank-3":"";
              return (
                <a key={m.username} href={`/model/${m.username}`}
                  style={{display:"flex",alignItems:"center",gap:16,background:isLexy?"linear-gradient(135deg,rgba(232,48,90,.08),rgba(56,182,212,.06))":"var(--surf)",borderRadius:"var(--radius)",padding:"14px 18px",border:isLexy?"1px solid rgba(232,48,90,.3)":"1px solid var(--bdr)",transition:"border-color .2s,background .15s",textDecoration:"none",position:"relative",overflow:"hidden"}}
                  onMouseEnter={e=>{ if(!isLexy){ e.currentTarget.style.borderColor="rgba(56,182,212,.3)"; e.currentTarget.style.background="rgba(56,182,212,.04)"; }}}
                  onMouseLeave={e=>{ if(!isLexy){ e.currentTarget.style.borderColor="var(--bdr)"; e.currentTarget.style.background="var(--surf)"; }}}>
                  {isLexy && <div style={{position:"absolute",top:8,right:12,fontSize:".65rem",color:"var(--hot)",fontWeight:800,letterSpacing:".08em"}}>✦ DESTACADA</div>}
                  {!isOffline && !isLexy && <div style={{position:"absolute",top:8,right:12,display:"flex",alignItems:"center",gap:4,fontSize:".65rem",color:"#22c55e",fontWeight:700}}><span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>EN VIVO</div>}
                  <span className={`cmp-rank ${medal}`}>#{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.display_name||m.username}</div>
                    <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>@{m.username}</div>
                    {m.country && COUNTRY_NAMES[m.country] && <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>{FLAG(m.country)} {COUNTRY_NAMES[m.country]}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {m.num_users > 0
                      ? <><div style={{fontWeight:800,fontSize:"1.125rem",color:isLexy?"var(--hot)":"var(--neon)"}}>{m.num_users.toLocaleString("es")}</div><div style={{fontSize:".65rem",color:"var(--txt3)"}}>viewers</div></>
                      : <div style={{fontSize:".75rem",color:"var(--txt3)"}}>Ver sala →</div>}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* EMBED — Top Female en vivo */}
        <section style={{marginTop:40,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
            <span style={{fontSize:".75rem",fontWeight:700,color:"var(--txt2)",letterSpacing:".06em",textTransform:"uppercase"}}>Latina más popular en vivo ahora</span>
          </div>
          <div style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)",background:"#000",position:"relative",paddingTop:"56.25%"}}>
            <iframe
              src="https://cbxyz.com/in/?tour=dTm0&campaign=rI8z3&track=top_latinas&disable_sound=1&mobileRedirect=auto&embed_video_only=1"
              style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
              allow="autoplay; fullscreen; encrypted-media"
              scrolling="no"
            />
          </div>
          <p style={{fontSize:".6875rem",color:"var(--txt3)",textAlign:"center",marginTop:6}}>
            Stream en vivo desde Chaturbate ·{" "}
            <a href="https://chaturbate.com/in/?tour=LQps&campaign=rI8z3&track=top_latinas" target="_blank" rel="noopener noreferrer" style={{color:"var(--neon)"}}>Ver en pantalla completa →</a>
          </p>
        </section>

        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>Modelos latinas en Chaturbate</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
            CampulseHub rastrea en tiempo real las modelos latinas de Chaturbate: colombianas, mexicanas, argentinas, chilenas y españolas.
          </p>
          {lexyModel && !lexyModel.offline && (
            <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginTop:".75rem"}}>
              Entre las más destacadas: <a href="/model/lexy_fox2" style={{color:"var(--hot)"}}>lexy_fox2</a>, con {lexyModel.num_users.toLocaleString("es")} viewers ahora.
            </p>
          )}
        </section>

        <div className="cmp-footer-links">
          <a href="/gender/female" className="cmp-footer-link">← Ver todas las chicas</a>
          <a href="/country/co" className="cmp-footer-link">Top Colombia →</a>
        </div>
      </div>
      <BottomNav active="/top/latinas" />
    </>
  );
}
