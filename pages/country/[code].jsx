// pages/country/[code].jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";

// No whitelist — cualquier código de 2 letras válido se sirve dinámicamente desde Supabase.
// Si no hay datos, se muestra estado vacío en vez de 404.

const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",BO:"Bolivia",
  US:"Estados Unidos",CA:"Canadá",BR:"Brasil",ES:"España",RO:"Rumania",RU:"Rusia",DE:"Alemania",
  FR:"Francia",GB:"Reino Unido",IT:"Italia",UA:"Ucrania",HU:"Hungría",PL:"Polonia",CZ:"República Checa",
  SE:"Suecia",NL:"Países Bajos",PT:"Portugal",GR:"Grecia",BE:"Bélgica",AT:"Austria",CH:"Suiza",
  NO:"Noruega",DK:"Dinamarca",FI:"Finlandia",SK:"Eslovaquia",RS:"Serbia",BG:"Bulgaria",MD:"Moldavia",
  LT:"Lituania",LV:"Letonia",EE:"Estonia",SI:"Eslovenia",KZ:"Kazajistán",
  PH:"Filipinas",TH:"Tailandia",IN:"India",AU:"Australia",TR:"Turquía",ZA:"Sudáfrica",NG:"Nigeria",KE:"Kenia",MG:"Madagascar",
  CN:"China",JP:"Japón",KR:"Corea del Sur",SV:"El Salvador",GT:"Guatemala",HN:"Honduras",NI:"Nicaragua",CR:"Costa Rica",PA:"Panamá",
  DO:"República Dominicana",CU:"Cuba",PR:"Puerto Rico",PY:"Paraguay",UY:"Uruguay",GH:"Ghana",TN:"Túnez",MA:"Marruecos",EG:"Egipto",
  IS:"Islandia",NZ:"Nueva Zelanda",SG:"Singapur",MY:"Malasia",ID:"Indonesia",VN:"Vietnam",TW:"Taiwán",HK:"Hong Kong",
  IL:"Israel",SA:"Arabia Saudita",AE:"Emiratos Árabes",IR:"Irán",PK:"Pakistán",BD:"Bangladés",LK:"Sri Lanka",
  HR:"Croacia",BA:"Bosnia",MK:"Macedonia",AL:"Albania",ME:"Montenegro",XK:"Kosovo",CY:"Chipre",MT:"Malta",LU:"Luxemburgo",
  IE:"Irlanda",SC:"Seychelles",MU:"Mauricio",RE:"Reunión",CI:"Costa de Marfil",CM:"Camerún",SN:"Senegal",ET:"Etiopía",TZ:"Tanzania",
  UZ:"Uzbekistán",TM:"Turkmenistán",AZ:"Azerbaiyán",GE:"Georgia",AM:"Armenia",BY:"Bielorrusia",
};

const COUNTRY_DEMONYM = {
  CO:"colombianas",MX:"mexicanas",AR:"argentinas",CL:"chilenas",ES:"españolas",BR:"brasileñas",
  RO:"rumanas",RU:"rusas",DE:"alemanas",FR:"francesas",GB:"británicas",IT:"italianas",
  UA:"ucranianas",PH:"filipinas",US:"estadounidenses",CA:"canadienses",PE:"peruanas",VE:"venezolanas",EC:"ecuatorianas",
};

const GENDER_LABELS = { f:"Mujer",m:"Hombre",c:"Pareja",t:"Trans" };
const GENDER_COLORS = { f:"var(--female)",m:"var(--male)",c:"var(--couple)",t:"var(--trans)" };

const DAYS = 7;
const MIN_SNAPSHOTS = 1;
const LIMIT = 50;

function flag(code) {
  if (!code||code.length!==2) return "";
  return code.toUpperCase().split("").map(c=>String.fromCodePoint(0x1f1e0+c.charCodeAt(0)-65)).join("");
}

export async function getServerSideProps({ params }) {
  const code = (params.code||"").toLowerCase();
  // Validar que sea exactamente 2 letras ISO — rechazar rutas malformadas
  if (!/^[a-z]{2}$/.test(code)) return { notFound:true };
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL||!SUPABASE_KEY) { const cu=(params.code||"").toUpperCase(); return { props:{ code:(params.code||"").toLowerCase(), codeUC:cu, name:COUNTRY_NAMES[cu]||cu, models:[], fetchError:"env_missing" } }; }
  const codeUC = code.toUpperCase();
  const since = new Date(Date.now()-DAYS*24*60*60*1000).toISOString();
  try {
    const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&country=eq.${codeUC}&select=username,num_users,num_followers,display_name,gender&limit=50000`;
    const r = await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Range":"0-49999","Prefer":"count=none"}});
    if (!r.ok) { const codeUC3=(params.code||"").toUpperCase(); return { props:{ code:(params.code||"").toLowerCase(), codeUC:codeUC3, name:COUNTRY_NAMES[codeUC3]||codeUC3, models:[], fetchError:r.status } }; }
    const rows = await r.json();
    if (!Array.isArray(rows)) { const codeUC4=(params.code||"").toUpperCase(); return { props:{ code:(params.code||"").toLowerCase(), codeUC:codeUC4, name:COUNTRY_NAMES[codeUC4]||codeUC4, models:[], fetchError:"invalid_response" } }; }
    const map = {};
    for (const row of rows) {
      const u = row.username; if (!u) continue;
      if (!map[u]) map[u]={username:u,display_name:row.display_name||u,gender:row.gender||"",total_viewers:0,snapshots:0,max_followers:0};
      map[u].total_viewers += row.num_users??0;
      map[u].snapshots += 1;
      if ((row.num_followers??0)>map[u].max_followers) map[u].max_followers=row.num_followers??0;
    }
    const models = Object.values(map)
      .filter(m=>m.snapshots>=MIN_SNAPSHOTS)
      .map(m=>({username:m.username,display_name:m.display_name,gender:m.gender,avg_viewers:Math.round(m.total_viewers/m.snapshots),max_followers:m.max_followers,snapshots:m.snapshots}))
      .sort((a,b)=>b.avg_viewers-a.avg_viewers).slice(0,LIMIT);
    // empty but valid — show empty state
    const name = COUNTRY_NAMES[codeUC]||codeUC;
    return { props:{ code,codeUC,name,models } };
  } catch(e) { const codeUC5=(params.code||"").toUpperCase(); return { props:{ code:(params.code||"").toLowerCase(), codeUC:codeUC5, name:COUNTRY_NAMES[codeUC5]||codeUC5, models:[], fetchError:"exception" } }; }
}

export default function CountryPage({ code, codeUC, name, models, fetchError }) {
  const top = models[0];
  const second = models[1];
  const demonym = COUNTRY_DEMONYM[codeUC]||`de ${name}`;
  const flagEmoji = flag(code);

  const pageTitle = top
    ? `Top Modelos ${name} en Chaturbate — ${top.display_name} con ${top.avg_viewers.toLocaleString("es")} viewers | Campulse`
    : `Modelos de ${name} en Chaturbate — Top ${models.length} | Campulse`;
  const pageDescription =
    `Las ${models.length} mejores modelos ${demonym} de Chaturbate, ordenadas por viewers promedio. ` +
    (top ? `${top.display_name} lidera con ${top.avg_viewers.toLocaleString("es")} viewers` : "") +
    (second ? `, seguida de ${second.display_name} con ${second.avg_viewers.toLocaleString("es")}. ` : ". ") +
    `Estadísticas actualizadas cada 2 horas en Campulse.`;

  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/country/${code}`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Campulse",item:SITE},{"@type":"ListItem",position:2,name:"Países",item:`${SITE}/country`},{"@type":"ListItem",position:3,name,item:`${SITE}/country/${code}`}]},
    hasPart:models.slice(0,10).map(m=>({"@type":"WebPage",name:`${m.display_name||m.username} Stats — Campulse`,url:`${SITE}/model/${m.username}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/country/${code}`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/country/${code}`}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="Campulse"/>
        <meta property="og:image" content={`https://flagcdn.com/160x120/${code}.png`}/>
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
          <a href="/app.html">Campulse</a>
          <span className="cmp-bc-sep">›</span>
          <a href="/country">Países</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>{flagEmoji} {name}</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">
            <img src={`https://flagcdn.com/32x24/${code}.png`} alt={`Bandera de ${name}`} width={32} height={24} style={{borderRadius:3,verticalAlign:"middle",marginRight:10,display:"inline"}}/>
            Modelos de {name} en Chaturbate
          </h1>
          <p className="cmp-page-sub">Top {models.length} modelos ordenadas por viewers promedio · últimos 30 días</p>
        </div>

        {/* MODEL LIST */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {models.map((m,i)=>{
            const gc = GENDER_COLORS[m.gender]||"var(--txt2)";
            const medal = i===0?"cmp-rank-1":i===1?"cmp-rank-2":i===2?"cmp-rank-3":"";
            return (
              <a key={m.username} href={`/model/${m.username}`}
                style={{display:"flex",alignItems:"center",gap:16,background:"var(--surf)",borderRadius:"var(--radius)",padding:"14px 18px",border:"1px solid var(--bdr)",transition:"border-color .2s,background .15s",textDecoration:"none"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,182,212,.3)";e.currentTarget.style.background="rgba(56,182,212,.04)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.background="var(--surf)"}}>
                <span className={`cmp-rank ${medal}`}>#{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.display_name||m.username}</div>
                  <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>
                    @{m.username}
                    {m.gender && GENDER_LABELS[m.gender] && <span style={{marginLeft:6,fontWeight:600,color:gc}}>{GENDER_LABELS[m.gender]}</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,color:"var(--neon)",fontSize:"1rem"}}>{m.avg_viewers.toLocaleString("es")} <span style={{fontSize:".7rem",color:"var(--txt3)",fontWeight:400}}>avg</span></div>
                  {m.max_followers>0 && <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2}}>{m.max_followers.toLocaleString("es")} seg.</div>}
                </div>
              </a>
            );
          })}
        </div>

        {/* SEO SECTION */}
        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>Modelos {demonym} en Chaturbate</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginBottom:".75rem"}}>
            Campulse rastrea en tiempo real las estadísticas de las modelos {demonym} en Chaturbate.
            Los datos se actualizan cada 2 horas con el número de viewers, seguidores y los mejores horarios.
          </p>
          {top && (
            <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
              Actualmente, <strong style={{color:"var(--txt)"}}>{top.display_name||top.username}</strong> es la modelo más vista de {name} con un promedio de <strong style={{color:"var(--neon)"}}>{top.avg_viewers.toLocaleString("es")} viewers</strong>{top.max_followers>0?` y ${top.max_followers.toLocaleString("es")} seguidores.`:"."} 
            </p>
          )}
        </section>

        <div className="cmp-footer-links" style={{marginTop:"2rem"}}>
          <a href="/country" className="cmp-footer-link">← Ver modelos de otros países</a>
          <a href="/gender" className="cmp-footer-link">Ver por género →</a>
          <a href="/top/latinas" className="cmp-footer-link">🔥 Top Latinas ahora</a>
        </div>
      </div>
    </>
  );
}
