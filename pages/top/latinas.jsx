// pages/top/latinas.jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";
const LEXY = "lexy_fox2";
const CAMPAIGN = "rI8z3";

const LATINA_COUNTRIES = ["CO","MX","AR","CL","PE","VE","EC","BO","PY","UY","CR","PA","HN","SV","GT","DO","CU","PR","ES"];
const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",BO:"Bolivia",
  PY:"Paraguay",UY:"Uruguay",CR:"Costa Rica",PA:"Panamá",HN:"Honduras",SV:"El Salvador",GT:"Guatemala",
  DO:"Rep. Dominicana",CU:"Cuba",PR:"Puerto Rico",ES:"España",
};
const FLAG = (code) => code ? String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6-65+c.charCodeAt(0))) : "";

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const since = new Date(Date.now()-2*60*60*1000).toISOString();
  const countryFilter = LATINA_COUNTRIES.map(c=>`country.eq.${c}`).join(",");
  const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&or=(${countryFilter})&num_users=gt.0&select=username,display_name,num_users,country,gender,spoken_languages&order=num_users.desc&limit=300`;
  let models = [];
  try {
    const r = await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
    const raw = await r.json();
    const map = new Map();
    (Array.isArray(raw)?raw:[]).forEach(row=>{
      if (!map.has(row.username)||row.num_users>map.get(row.username).num_users) map.set(row.username,row);
    });
    models = [...map.values()].sort((a,b)=>b.num_users-a.num_users).slice(0,50);
  } catch {}
  return { props:{ models,fetchedAt:new Date().toISOString() } };
}

export default function TopLatinasPage({ models, fetchedAt }) {
  const lexyModel = models.find(m=>m.username===LEXY);
  const others = models.filter(m=>m.username!==LEXY);
  let ordered = [...others];
  if (lexyModel) {
    const slot = Math.floor(new Date(fetchedAt).getMinutes()/20)%3;
    ordered.splice(slot,0,lexyModel);
  }
  ordered = ordered.slice(0,50);
  const totalOnline = models.length;
  const topViewers = ordered[0]?.num_users??0;

  const pageTitle = `Top Latinas en Chaturbate — ${totalOnline} en vivo ahora | Campulse`;
  const pageDescription = `Las ${totalOnline} mejores modelos latinas en vivo en Chaturbate ahora mismo. Colombianas, mexicanas, argentinas y más — ordenadas por viewers reales. Datos actualizados cada 2 horas.`;

  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/top/latinas`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Campulse",item:SITE},{"@type":"ListItem",position:2,name:"Top Latinas",item:`${SITE}/top/latinas`}]},
    hasPart:ordered.slice(0,10).map(m=>({"@type":"WebPage",name:`${m.display_name||m.username} — Campulse`,url:`${SITE}/model/${m.username}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="keywords" content="modelos latinas chaturbate, latinas en vivo, colombianas chaturbate, mexicanas chaturbate, webcam latina"/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/top/latinas`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/top/latinas`}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="Campulse"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{DS_CSS}</style>
      </Head>

      <div className="cmp-page">
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/">Campulse</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>Top Latinas</span>
        </nav>

        {/* HERO */}
        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">🌶️ Top Latinas en vivo</h1>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:".75rem",flexWrap:"wrap"}}>
            <span style={{background:"rgba(232,48,90,.12)",color:"var(--hot)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(232,48,90,.3)",fontWeight:600}}>{totalOnline} en vivo</span>
            {topViewers>0 && <span style={{background:"rgba(56,182,212,.1)",color:"var(--neon)",fontSize:".75rem",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(56,182,212,.25)",fontWeight:600}}>Máx. {topViewers.toLocaleString("es")} viewers</span>}
          </div>
          <p className="cmp-page-sub">Las mejores modelos latinas de Chaturbate ordenadas por viewers en tiempo real. Colombianas, mexicanas, argentinas y más.</p>
        </div>

        {/* COUNTRY QUICK LINKS */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
          {["CO","MX","AR","CL","ES"].map(c=>(
            <a key={c} href={`/country/${c.toLowerCase()}`}
              style={{background:"var(--surf)",color:"var(--neon)",textDecoration:"none",padding:"6px 14px",borderRadius:20,fontSize:".8125rem",border:"1px solid var(--bdr2)",transition:"background .2s",fontWeight:500}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surf2)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--surf)"}>
              {FLAG(c)} {COUNTRY_NAMES[c]}
            </a>
          ))}
        </div>

        {/* AFFILIATE CTA */}
        <a href={`https://chaturbate.com/in/?tour=LQps&campaign=${CAMPAIGN}&track=default&room=${LEXY}`} target="_blank" rel="noopener noreferrer" className="cmp-cta-live">
          🔴 Ver latinas en vivo ahora →
        </a>

        {/* MODEL LIST */}
        {ordered.length===0 ? (
          <p style={{textAlign:"center",color:"var(--txt3)",padding:"48px 0",fontSize:".875rem"}}>No hay modelos latinas en línea en este momento. Vuelve pronto.</p>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ordered.map((m,i)=>{
              const isLexy = m.username===LEXY;
              const medal = i===0?"cmp-rank-1":i===1?"cmp-rank-2":i===2?"cmp-rank-3":"";
              return (
                <a key={m.username} href={`/model/${m.username}`}
                  style={{
                    display:"flex",alignItems:"center",gap:16,
                    background:isLexy?"linear-gradient(135deg,rgba(232,48,90,.08),rgba(56,182,212,.06))":"var(--surf)",
                    borderRadius:"var(--radius)",padding:"14px 18px",
                    border:isLexy?"1px solid rgba(232,48,90,.3)":"1px solid var(--bdr)",
                    transition:"border-color .2s,background .15s",textDecoration:"none",position:"relative",overflow:"hidden",
                  }}
                  onMouseEnter={e=>{ if(!isLexy){ e.currentTarget.style.borderColor="rgba(56,182,212,.3)"; e.currentTarget.style.background="rgba(56,182,212,.04)"; }}}
                  onMouseLeave={e=>{ if(!isLexy){ e.currentTarget.style.borderColor="var(--bdr)"; e.currentTarget.style.background="var(--surf)"; }}}>
                  {isLexy && <div style={{position:"absolute",top:8,right:12,fontSize:".65rem",color:"var(--hot)",fontWeight:800,letterSpacing:".08em"}}>✦ DESTACADA</div>}
                  <span className={`cmp-rank ${medal}`}>#{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.display_name||m.username}</div>
                    <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>@{m.username}</div>
                    {m.country && <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>{FLAG(m.country)} {COUNTRY_NAMES[m.country]||m.country}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:800,fontSize:"1.125rem",color:isLexy?"var(--hot)":"var(--neon)"}}>{m.num_users.toLocaleString("es")}</div>
                    <div style={{fontSize:".65rem",color:"var(--txt3)"}}>viewers</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* SEO SECTION */}
        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>Modelos latinas en Chaturbate</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginBottom:".75rem"}}>
            Campulse rastrea en tiempo real las estadísticas de las modelos latinas de Chaturbate,
            incluyendo colombianas, mexicanas, argentinas, chilenas y españolas. Los datos se actualizan automáticamente cada 2 horas.
          </p>
          {lexyModel && (
            <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
              Entre las modelos más destacadas se encuentra <a href="/model/lexy_fox2" style={{color:"var(--hot)"}}>lexy_fox2</a>, con {lexyModel.num_users.toLocaleString("es")} viewers en este momento.
            </p>
          )}
        </section>

        <div className="cmp-footer-links">
          <a href="/gender/female" className="cmp-footer-link">← Ver todas las chicas</a>
          <a href="/country/co" className="cmp-footer-link">Top Colombia →</a>
        </div>
      </div>
    </>
  );
}
