// pages/language/[lang].jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";

const SUPPORTED_LANGS = ["spanish","english","portuguese","romanian","russian","german","french","italian"];

const LANGUAGE_INFO = {
  spanish:    { name:"Español",   flag:"es", keywords:"modelos español chaturbate, webcam español, latinas chaturbate" },
  english:    { name:"English",   flag:"gb", keywords:"english chaturbate models, webcam english, chaturbate english speakers" },
  portuguese: { name:"Português", flag:"br", keywords:"modelos português chaturbate, webcam português, brasileiras chaturbate" },
  romanian:   { name:"Română",    flag:"ro", keywords:"modele chaturbate română, webcam română, chaturbate romania" },
  russian:    { name:"Русский",   flag:"ru", keywords:"модели chaturbate русский, вебкам русский, chaturbate russia" },
  german:     { name:"Deutsch",   flag:"de", keywords:"chaturbate deutsch models, webcam deutsch, chaturbate deutschland" },
  french:     { name:"Français",  flag:"fr", keywords:"modèles chaturbate français, webcam français, chaturbate france" },
  italian:    { name:"Italiano",  flag:"it", keywords:"modelle chaturbate italiano, webcam italiano, chaturbate italia" },
};

const LANG_VARIANTS = {
  spanish:["spanish","español","espanol","es"],english:["english","inglés","ingles","en"],
  portuguese:["portuguese","portugués","portugues","pt"],romanian:["romanian","rumano","română","ro"],
  russian:["russian","ruso","русский","ru"],german:["german","alemán","aleman","deutsch","de"],
  french:["french","francés","frances","français","fr"],italian:["italian","italiano","it"],
};

const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",
  US:"Estados Unidos",ES:"España",BR:"Brasil",RO:"Rumania",RU:"Rusia",DE:"Alemania",FR:"Francia",
  GB:"Reino Unido",IT:"Italia",UA:"Ucrania",PH:"Filipinas",TH:"Tailandia",CA:"Canadá",
  AU:"Australia",NL:"Países Bajos",TR:"Turquía",HU:"Hungría",PL:"Polonia",CZ:"República Checa",SE:"Suecia",PT:"Portugal",
};

function detectsLang(raw, slug) {
  if (!raw) return false;
  const val = raw.toLowerCase().trim();
  return LANG_VARIANTS[slug]?.some(v=>val.includes(v))??false;
}

export async function getServerSideProps({ params }) {
  const lang = (params.lang||"").toLowerCase();
  if (!SUPPORTED_LANGS.includes(lang)) return { notFound:true };
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL||!SUPABASE_KEY) return { notFound:true };
  try {
    const since = new Date(Date.now()-30*24*60*60*1000).toISOString();
    const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&spoken_languages=not.is.null&select=username,num_users,num_followers,display_name,country,spoken_languages&limit=50000`;
    const r = await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
    if (!r.ok) return { notFound:true };
    const rows = await r.json();
    if (!Array.isArray(rows)) return { notFound:true };
    const map = {};
    for (const row of rows) {
      if (!detectsLang(row.spoken_languages,lang)) continue;
      const u = row.username; if (!u) continue;
      if (!map[u]) map[u]={username:u,display_name:row.display_name||u,country:row.country||"",total_viewers:0,snapshots:0,max_followers:0};
      map[u].total_viewers+=row.num_users??0;
      map[u].snapshots+=1;
      if ((row.num_followers??0)>map[u].max_followers) map[u].max_followers=row.num_followers??0;
    }
    const models = Object.values(map).filter(m=>m.snapshots>=1).map(m=>({username:m.username,display_name:m.display_name,country:m.country,avg_viewers:Math.round(m.total_viewers/m.snapshots),max_followers:m.max_followers})).sort((a,b)=>b.avg_viewers-a.avg_viewers).slice(0,50);
    const info = LANGUAGE_INFO[lang];
    return { props:{ data:{ lang,...info,models,empty:models.length===0 } } };
  } catch {
    const info = LANGUAGE_INFO[lang]||{ name:lang,flag:"",keywords:"" };
    return { props:{ data:{ lang,...info,models:[],empty:true } } };
  }
}

export default function LanguagePage({ data }) {
  const { lang,name,flag,keywords,models,empty } = data;
  const top = models[0];
  const second = models[1];

  const pageTitle = top
    ? `Modelos Chaturbate en ${name} — ${top.display_name} con ${top.avg_viewers.toLocaleString("es")} viewers | Campulse`
    : `Modelos Chaturbate en ${name} | Campulse`;
  const pageDescription = empty
    ? `Modelos de Chaturbate que hablan ${name}. Estadísticas actualizadas cada 2 horas en Campulse.`
    : `Top ${models.length} modelos de Chaturbate que hablan ${name}. ` +
      (top ? `${top.display_name} lidera con ${top.avg_viewers.toLocaleString("es")} viewers promedio` : "") +
      (second ? `, seguida de ${second.display_name}. ` : ". ") +
      `Datos actualizados cada 2 horas.`;

  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/language/${lang}`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Campulse",item:SITE},{"@type":"ListItem",position:2,name:"Idiomas",item:`${SITE}/language`},{"@type":"ListItem",position:3,name,item:`${SITE}/language/${lang}`}]},
    hasPart:models.slice(0,10).map(m=>({"@type":"WebPage",name:`${m.display_name||m.username} Stats — Campulse`,url:`${SITE}/model/${m.username}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        {keywords && <meta name="keywords" content={keywords}/>}
        <meta name="robots" content={empty?"noindex, follow":"index, follow"}/>
        <link rel="canonical" href={`${SITE}/language/${lang}`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/language/${lang}`}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="Campulse"/>
        {flag && <meta property="og:image" content={`https://flagcdn.com/160x120/${flag}.png`}/>}
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
            <a href="/language" className="cmp-nav-link">Idiomas</a>
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/app.html">Campulse</a>
          <span className="cmp-bc-sep">›</span>
          <a href="/language">Idiomas</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>{name}</span>
        </nav>

        <div className="cmp-page-header">
          {flag && <img src={`https://flagcdn.com/32x24/${flag}.png`} alt={name} width={32} height={24} style={{borderRadius:3,marginBottom:".75rem",display:"block"}}/>}
          <h1 className="cmp-page-h1">Modelos Chaturbate en {name}</h1>
          <p className="cmp-page-sub">
            {empty ? "No hay modelos en línea en este idioma en este momento." : `Top ${models.length} modelos ordenadas por viewers promedio · últimos 30 días`}
          </p>
        </div>

        {/* Affiliate CTA */}
        {!empty && (
          <a href={`https://chaturbate.com/in/?tour=LQps&campaign=rI8z3&track=default&room=lexy_fox2`} target="_blank" rel="noopener noreferrer" className="cmp-cta">
            Ver modelos en {name} en vivo →
          </a>
        )}

        {empty ? (
          <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)",marginBottom:"2rem"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🎥</div>
            <p style={{fontSize:"1.125rem",fontWeight:700,color:"var(--txt)",marginBottom:".5rem"}}>Sin modelos en línea ahora</p>
            <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.6,marginBottom:"1.5rem"}}>
              No encontramos modelos de {name} activas en este momento.<br/>Los datos se actualizan cada 2 horas.
            </p>
            <a href="/language" style={{color:"var(--neon)",fontSize:".875rem"}}>← Ver otros idiomas</a>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {models.map((m,i)=>{
              const medal = i===0?"cmp-rank-1":i===1?"cmp-rank-2":i===2?"cmp-rank-3":"";
              return (
                <a key={m.username} href={`/model/${m.username}`}
                  style={{display:"flex",alignItems:"center",gap:16,background:"var(--surf)",borderRadius:"var(--radius)",padding:"14px 18px",border:"1px solid var(--bdr)",transition:"border-color .2s,background .15s",textDecoration:"none"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,182,212,.3)";e.currentTarget.style.background="rgba(56,182,212,.04)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.background="var(--surf)"}}>
                  <span className={`cmp-rank ${medal}`}>#{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.display_name||m.username}</div>
                    <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                      <span>@{m.username}</span>
                      {m.country && (<>
                        <span>·</span>
                        <img src={`https://flagcdn.com/16x12/${m.country.toLowerCase()}.png`} alt={COUNTRY_NAMES[m.country?.toUpperCase()]||m.country} width={16} height={12} style={{borderRadius:2,verticalAlign:"middle",display:"inline"}}/>
                        <span>{COUNTRY_NAMES[m.country?.toUpperCase()]||m.country}</span>
                      </>)}
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
        )}

        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>Modelos de Chaturbate en {name}</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginBottom:".75rem"}}>
            Campulse rastrea en tiempo real las estadísticas de las modelos de Chaturbate que hablan {name}.
            Los datos se actualizan cada 2 horas con el número de viewers, seguidores y los mejores horarios.
          </p>
          {top && (
            <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
              Actualmente, <strong style={{color:"var(--txt)"}}>{top.display_name||top.username}</strong> es la modelo más vista con un promedio de <strong style={{color:"var(--neon)"}}>{top.avg_viewers.toLocaleString("es")} viewers</strong>{top.max_followers>0?` y ${top.max_followers.toLocaleString("es")} seguidores.`:"."} 
            </p>
          )}
        </section>

        <div className="cmp-footer-links">
          <a href="/language" className="cmp-footer-link">← Ver otros idiomas</a>
          <a href="/country" className="cmp-footer-link">Ver por país →</a>
        </div>
      </div>
    </>
  );
}
