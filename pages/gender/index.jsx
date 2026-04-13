// pages/gender/index.jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";
const DB_TO_SLUG = { f:"female",m:"male",c:"couple",t:"trans" };
const GENDER_INFO = {
  female:{ name:"Chicas",emoji:"♀️",description:"Las mejores modelos femeninas de Chaturbate",accent:"var(--female)" },
  male:{   name:"Chicos",emoji:"♂️",description:"Los mejores modelos masculinos de Chaturbate",accent:"var(--male)" },
  couple:{ name:"Parejas",emoji:"👫",description:"Las mejores parejas de Chaturbate en vivo",accent:"var(--couple)" },
  trans:{  name:"Trans",emoji:"⚧️",description:"Las mejores modelos trans de Chaturbate",accent:"var(--trans)" },
};

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL||!SUPABASE_KEY) return { props:{ genders:[] } };
  const since = new Date(Date.now()-30*24*60*60*1000).toISOString();
  const sbHeaders = { apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` };
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&select=username,gender&limit=50000`,{headers:sbHeaders});
    const rows = r.ok ? await r.json() : [];
    const map = {};
    for (const row of (Array.isArray(rows)?rows:[])) {
      const slug = DB_TO_SLUG[(row.gender||"").toLowerCase().trim()];
      if (!slug||!GENDER_INFO[slug]) continue;
      if (!map[slug]) map[slug]=new Set();
      map[slug].add(row.username);
    }
    const genders = Object.entries(GENDER_INFO).map(([key,info])=>({ gender:key,...info,models:map[key]?map[key].size:0,slug:`/gender/${key}` })).filter(g=>g.models>0).sort((a,b)=>b.models-a.models);
    return { props:{ genders } };
  } catch { return { props:{ genders:[] } }; }
}

export default function GenderPage({ genders }) {
  const pageTitle = "Modelos de Chaturbate por Género | CampulseHub";
  const pageDescription = "Explora modelos de Chaturbate por género: chicas, chicos, parejas y trans. Ranking en tiempo real ordenado por viewers. Estadísticas actualizadas cada 2 horas.";
  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/gender`,
    hasPart:genders.map(g=>({"@type":"WebPage",name:`${g.name} en Chaturbate`,url:`${SITE}/gender/${g.gender}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/gender`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/gender`}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="CampulseHub"/>
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
            <a href="/language" className="cmp-nav-link">Idiomas</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/app.html" style={{display:"inline-flex",alignItems:"center",gap:"0",fontWeight:800,letterSpacing:"-.5px",textDecoration:"none",color:"#fff"}}>Campulse<span style={{color:"#c084fc"}}>Hub</span></a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>Géneros</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">Modelos por Género</h1>
          <p className="cmp-page-sub">Explora todas las categorías de modelos en Chaturbate. Estadísticas en tiempo real.</p>
        </div>

        <div className="cmp-cat-grid">
          {genders.map(g=>(
            <a key={g.gender} href={`/gender/${g.gender}`}
              style={{background:"var(--surf)",borderRadius:14,padding:"1.375rem",display:"flex",alignItems:"center",gap:"1rem",border:"1px solid var(--bdr)",transition:"border-color .2s,background .15s,transform .15s",textDecoration:"none"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=g.accent.includes("var")?`rgba(56,182,212,.3)`:g.accent+"55";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.transform=""}}>
              <span style={{fontSize:"2rem",flexShrink:0,lineHeight:1}}>{g.emoji}</span>
              <div>
                <div style={{fontWeight:700,fontSize:"1.0625rem",color:"var(--txt)",marginBottom:2}}>{g.name}</div>
                <div style={{fontSize:".8rem",color:"var(--txt3)"}}>{g.models.toLocaleString("es")} modelos</div>
                <div style={{fontSize:".75rem",color:"var(--txt2)",marginTop:3}}>{g.description}</div>
              </div>
            </a>
          ))}
        </div>

        <div className="cmp-footer-links">
          <a href="/country" className="cmp-footer-link">Ver por país →</a>
          <a href="/top/latinas" className="cmp-footer-link">🔥 Top Latinas ahora</a>
        </div>
      </div>
    </>
  );
}
