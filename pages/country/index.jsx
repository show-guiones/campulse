// pages/country/index.jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";

const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",BO:"Bolivia",
  UY:"Uruguay",PY:"Paraguay",CR:"Costa Rica",PA:"Panamá",DO:"República Dominicana",CU:"Cuba",GT:"Guatemala",
  HN:"Honduras",SV:"El Salvador",NI:"Nicaragua",US:"Estados Unidos",CA:"Canadá",BR:"Brasil",PR:"Puerto Rico",
  ES:"España",RO:"Rumania",RU:"Rusia",DE:"Alemania",FR:"Francia",GB:"Reino Unido",IT:"Italia",UA:"Ucrania",
  HU:"Hungría",PL:"Polonia",CZ:"República Checa",SE:"Suecia",NL:"Países Bajos",PT:"Portugal",GR:"Grecia",
  BE:"Bélgica",AT:"Austria",CH:"Suiza",NO:"Noruega",DK:"Dinamarca",FI:"Finlandia",SK:"Eslovaquia",RS:"Serbia",
  HR:"Croacia",BG:"Bulgaria",MD:"Moldavia",LT:"Lituania",LV:"Letonia",EE:"Estonia",SI:"Eslovenia",KZ:"Kazajistán",
  PH:"Filipinas",TH:"Tailandia",IN:"India",AU:"Australia",TR:"Turquía",ZA:"Sudáfrica",NG:"Nigeria",KE:"Kenia",MG:"Madagascar",
};

const MIN_SNAPSHOTS = 5;
const DAYS = 30;

export async function getServerSideProps() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL||!SUPABASE_KEY) return { props:{ countries:[], error:'config' } };
  const since = new Date(Date.now()-DAYS*24*60*60*1000).toISOString();
  const sbHeaders = { apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` };
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&select=username,country&limit=50000`,{headers:sbHeaders});
    const rows = r.ok ? await r.json() : [];
    const snapshotCount = {};
    const usernamesByCountry = {};
    for (const row of (Array.isArray(rows)?rows:[])) {
      const c = (row.country||"").toUpperCase().trim();
      if (!c||c.length!==2) continue;
      const key = `${c}:${row.username}`;
      snapshotCount[key] = (snapshotCount[key]||0)+1;
    }
    for (const [key,count] of Object.entries(snapshotCount)) {
      if (count<MIN_SNAPSHOTS) continue;
      const [c] = key.split(":");
      if (!usernamesByCountry[c]) usernamesByCountry[c]=0;
      usernamesByCountry[c]++;
    }
    const countries = Object.entries(usernamesByCountry)
      .map(([code,modelCount])=>({ code, name:COUNTRY_NAMES[code]||code, models:modelCount, slug:`/country/${code.toLowerCase()}` }))
      .sort((a,b)=>b.models-a.models);
    return { props:{ countries, error:null } };
  } catch { return { props:{ countries:[], error:'config' } }; }
}

export default function CountriesPage({ countries, error }) {
  const pageTitle = "Modelos de Chaturbate por País | Campulse";
  const pageDescription = `Explora modelos de Chaturbate organizadas por país. Encuentra las mejores salas en vivo de ${countries.slice(0,4).map(c=>c.name).join(", ")} y más.`;
  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/country`,
    hasPart:countries.slice(0,10).map(c=>({"@type":"WebPage",name:`Modelos de ${c.name} en Chaturbate`,url:`${SITE}/country/${c.code.toLowerCase()}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/country`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/country`}/>
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
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/language" className="cmp-nav-link">Idiomas</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/app.html">Campulse</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>Países</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">Modelos por País</h1>
          <p className="cmp-page-sub">Descubre las mejores modelos de Chaturbate filtradas por país de origen.</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:12}}>
          {countries.map(c=>(
            <a key={c.code} href={`/country/${c.code.toLowerCase()}`}
              style={{background:"var(--surf)",borderRadius:14,padding:"1.25rem 1.125rem",border:"1px solid var(--bdr)",display:"block",transition:"border-color .2s,background .15s,transform .15s",textDecoration:"none"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,182,212,.3)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.transform=""}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <img src={`https://flagcdn.com/32x24/${c.code.toLowerCase()}.png`} alt={`Bandera de ${c.name}`} width={32} height={24} style={{borderRadius:3,display:"block"}}/>
                <span style={{fontSize:".65rem",color:"var(--txt3)",fontWeight:700}}>{c.code}</span>
              </div>
              <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",marginBottom:4}}>{c.name}</div>
              <div style={{fontSize:".8rem",color:"var(--neon)"}}>{c.models.toLocaleString("es")} modelos</div>
            </a>
          ))}
        </div>

        {countries.length===0 && (
          <p style={{color:"var(--txt3)",textAlign:"center",marginTop:40}}>{error ? `Error al cargar (${error})` : "Sin datos disponibles."}</p>
        )}

        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>Modelos de Chaturbate por País</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginBottom:".75rem"}}>
            Campulse rastrea en tiempo real las estadísticas de las modelos de Chaturbate de todo el mundo.
            Filtra por país para encontrar las mejores salas en vivo de Colombia, España, México, Rumania y más.
          </p>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
            Los datos se actualizan cada 2 horas con el número de viewers, seguidores y los mejores horarios.
          </p>
        </section>

        <div className="cmp-footer-links">
          <a href="/gender" className="cmp-footer-link">Ver por género →</a>
          <a href="/top/latinas" className="cmp-footer-link">🔥 Top Latinas ahora</a>
        </div>
      </div>
    </>
  );
}
