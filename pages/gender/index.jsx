// pages/gender/index.jsx — Premium UI Redesign

import Head from "next/head";

const SITE = "https://www.campulsehub.com";
const DB_TO_SLUG = { f:"female",m:"male",c:"couple",t:"trans" };
const GENDER_INFO = {
  female:{ name:"Chicas",emoji:"♀️",description:"Las mejores modelos femeninas de Chaturbate",icon:"♀",accent:"#f472b6" },
  male:{   name:"Chicos",emoji:"♂️",description:"Los mejores modelos masculinos de Chaturbate",icon:"♂",accent:"#60a5fa" },
  couple:{ name:"Parejas",emoji:"👫",description:"Las mejores parejas de Chaturbate en vivo",icon:"♥",accent:"#34d399" },
  trans:{  name:"Trans",emoji:"⚧️",description:"Las mejores modelos trans de Chaturbate",icon:"⚧",accent:"#c084fc" },
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
    const genders = Object.entries(GENDER_INFO).map(([key,info])=>({ gender:key,name:info.name,emoji:info.emoji,description:info.description,icon:info.icon,accent:info.accent,models:map[key]?map[key].size:0,slug:`/gender/${key}` })).filter(g=>g.models>0).sort((a,b)=>b.models-a.models);
    return { props:{ genders } };
  } catch { return { props:{ genders:[] } }; }
}

export default function GenderPage({ genders }) {
  const pageTitle = "Modelos de Chaturbate por Género | Campulse";
  const pageDescription = "Explora modelos de Chaturbate por género: chicas, chicos, parejas y trans. Ranking en tiempo real ordenado por viewers. Estadísticas actualizadas cada 2 horas.";
  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/gender`,
    hasPart:genders.map(g=>({ "@type":"WebPage",name:`${g.name} en Chaturbate`,url:`${SITE}/gender/${g.gender}` })),
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
        <meta property="og:site_name" content="Campulse"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{`
          *{box-sizing:border-box} html{background:#080810} body{margin:0;background:#080810}
          a{text-decoration:none}
          .gp{font-family:'DM Sans',system-ui,sans-serif;max-width:960px;margin:0 auto;padding:0 1.25rem 5rem;background:#080810;min-height:100vh;color:#e2e8f0}
          .gp-nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 0;border-bottom:1px solid rgba(255,255,255,.05)}
          .gp-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:#fff;letter-spacing:-.5px}
          .gp-nav-links{display:flex;gap:1.5rem}
          .gp-nav-link{font-size:.8125rem;color:#6b7280;font-weight:500;transition:color .2s}
          .gp-nav-link:hover{color:#c084fc}
          .gp-bc{font-size:.8125rem;color:#374151;padding:.875rem 0;display:flex;align-items:center;gap:6px}
          .gp-bc a{color:#6b7280;transition:color .2s}.gp-bc a:hover{color:#c084fc}
          .gp-hero{padding:2.5rem 0 2rem}
          .gp-h1{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(1.875rem,6vw,3rem);margin:0 0 .625rem;letter-spacing:-1.5px;color:#f8fafc}
          .gp-sub{color:#6b7280;font-size:.9375rem;margin:0 0 2.5rem;line-height:1.6}
          .gp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
          .gp-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:2rem 1.5rem;color:#e2e8f0;display:block;text-align:center;transition:transform .2s,border-color .2s,background .2s;position:relative;overflow:hidden}
          .gp-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent);opacity:0;transition:opacity .2s}
          .gp-card:hover{transform:translateY(-3px)}
          .gp-card:hover::before{opacity:1}
          .gp-ico{font-size:2.25rem;margin-bottom:1rem;display:block;line-height:1}
          .gp-cname{font-weight:700;font-size:1.1875rem;margin-bottom:.375rem;font-family:'Syne',sans-serif;color:#f8fafc}
          .gp-cdesc{font-size:.8125rem;color:#6b7280;margin-bottom:1rem;line-height:1.55}
          .gp-count{font-size:.875rem;font-weight:700;font-family:'Syne',sans-serif}
          .gp-count-lbl{font-size:.6875rem;color:#374151;margin-top:2px;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
          .gp-divider{height:1px;background:rgba(255,255,255,.05);margin:2.5rem 0}
          .gp-seo{background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:1.5rem;color:#374151;font-size:.875rem;line-height:1.75}
          .gp-seo h2{color:#4b5563;font-size:.9375rem;margin:0 0 .75rem;font-weight:600}
          .gp-seo p{margin:0 0 .5rem}
          .gp-seo a{color:#6b7280;transition:color .2s}.gp-seo a:hover{color:#c084fc}
          @media(max-width:480px){.gp-grid{grid-template-columns:1fr 1fr}}
        `}</style>
      </Head>

      <div className="gp">
        <nav className="gp-nav">
          <a href="/" className="gp-logo">Campulse</a>
          <div className="gp-nav-links">
            <a href="/country" className="gp-nav-link">Países</a>
            <a href="/language" className="gp-nav-link">Idiomas</a>
            <a href="/top/latinas" className="gp-nav-link">Latinas</a>
          </div>
        </nav>

        <nav className="gp-bc">
          <a href="/">Campulse</a>
          <span style={{color:"#1f2937"}}>›</span>
          <span style={{color:"#9ca3af"}}>Géneros</span>
        </nav>

        <div className="gp-hero">
          <h1 className="gp-h1">Modelos por Género</h1>
          <p className="gp-sub">Descubre las mejores modelos de Chaturbate filtradas por género.</p>

          <div className="gp-grid">
            {genders.map(g=>(
              <a key={g.gender} href={`/gender/${g.gender}`} className="gp-card"
                style={{"--accent":g.accent}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=g.accent+"44";e.currentTarget.style.background=g.accent+"0a"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="";e.currentTarget.style.background=""}}>
                <span className="gp-ico">{g.emoji}</span>
                <div className="gp-cname">{g.name}</div>
                <div className="gp-cdesc">{g.description}</div>
                <div className="gp-count" style={{color:g.accent}}>{g.models.toLocaleString("es")}</div>
                <div className="gp-count-lbl">modelos</div>
              </a>
            ))}
          </div>

          {genders.length===0 && (
            <p style={{color:"#374151",textAlign:"center",marginTop:"3rem",fontSize:".9375rem"}}>
              No hay datos disponibles en este momento.
            </p>
          )}
        </div>

        <div className="gp-divider"/>

        <div className="gp-seo">
          <h2>Modelos de Chaturbate por Género</h2>
          <p>Campulse rastrea en tiempo real las estadísticas de todas las categorías de modelos de Chaturbate. Filtra por género para encontrar las mejores salas en vivo de chicas, chicos, parejas y modelos trans.</p>
          <p>Los datos se actualizan cada 2 horas con el número de viewers y seguidores de cada modelo.</p>
          <p><a href="/country">Ver modelos por país →</a></p>
        </div>
      </div>
    </>
  );
}
