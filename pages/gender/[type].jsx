// pages/gender/[type].jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo, AppCTA } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";
const SUPPORTED_GENDERS = ["female","male","couple","trans"];
const GENDER_DB_MAP = { female:"f",male:"m",couple:"c",trans:"t" };

const GENDER_INFO = {
  female:{ name:"Chicas",nameEs:"Mujeres",emoji:"♀️",keywords:"chicas chaturbate, modelos femeninas chaturbate, webcam chicas",accent:"var(--female)" },
  male:{   name:"Chicos",nameEs:"Hombres",emoji:"♂️",keywords:"chicos chaturbate, modelos masculinos chaturbate, webcam hombres",accent:"var(--male)" },
  couple:{ name:"Parejas",nameEs:"Parejas",emoji:"👫",keywords:"parejas chaturbate, couples chaturbate, webcam parejas",accent:"var(--couple)" },
  trans:{  name:"Trans",nameEs:"Trans",emoji:"⚧️",keywords:"trans chaturbate, modelos trans chaturbate, webcam trans",accent:"var(--trans)" },
};

// Cam Listing embed — gender filter param para Chaturbate
const GENDER_CB_PARAM = {
  female: "f",
  male:   "m",
  couple: "c",
  trans:  "t",
};

const COUNTRY_NAMES = {
  CO:"Colombia",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",
  US:"Estados Unidos",ES:"España",BR:"Brasil",RO:"Rumania",RU:"Rusia",DE:"Alemania",FR:"Francia",
  GB:"Reino Unido",IT:"Italia",UA:"Ucrania",PH:"Filipinas",TH:"Tailandia",CA:"Canadá",
  AU:"Australia",NL:"Países Bajos",TR:"Turquía",HU:"Hungría",PL:"Polonia",CZ:"República Checa",SE:"Suecia",
};

export async function getServerSideProps({ params }) {
  const type = params.type.toLowerCase();
  if (!SUPPORTED_GENDERS.includes(type)) return { notFound:true };
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL||!SUPABASE_KEY) return { notFound:true };
  try {
    const dbGender = GENDER_DB_MAP[type];
    const since = new Date(Date.now()-14*24*60*60*1000).toISOString();
    const url = `${SUPABASE_URL}/rest/v1/rooms_snapshot?captured_at=gte.${since}&gender=eq.${dbGender}&select=username,num_users,num_followers,display_name,country&order=captured_at.desc&limit=10000`;
    const r = await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
    if (!r.ok) return { notFound:true };
    const rows = await r.json();
    if (!Array.isArray(rows)||rows.length===0) return { notFound:true };
    const map = {};
    for (const row of rows) {
      const u = row.username; if (!u) continue;
      if (!map[u]) map[u]={username:u,display_name:row.display_name||u,country:row.country||"",total_viewers:0,snapshots:0,max_followers:0};
      map[u].total_viewers+=row.num_users??0;
      map[u].snapshots+=1;
      if ((row.num_followers??0)>map[u].max_followers) map[u].max_followers=row.num_followers??0;
    }
    const models = Object.values(map).filter(m=>m.snapshots>=1).map(m=>({username:m.username,display_name:m.display_name,country:m.country,avg_viewers:Math.round(m.total_viewers/m.snapshots),max_followers:m.max_followers})).sort((a,b)=>b.avg_viewers-a.avg_viewers).slice(0,50);
    if (models.length===0) return { notFound:true };
    return { props:{ data:{ gender:type,...GENDER_INFO[type],models } } };
  } catch { return { notFound:true }; }
}

export default function GenderTypePage({ data }) {
  const { gender,name,nameEs,emoji,keywords,accent,models } = data;
  const top = models[0];
  const second = models[1];

  const pageTitle = top
    ? `${emoji} ${name} en Chaturbate — ${top.display_name} con ${top.avg_viewers.toLocaleString("es")} viewers | Campulse`
    : `${name} en Chaturbate — Top ${models.length} | Campulse`;
  const pageDescription =
    `Las ${models.length} mejores ${nameEs.toLowerCase()} de Chaturbate ordenadas por viewers. ` +
    (top ? `${top.display_name} lidera con ${top.avg_viewers.toLocaleString("es")} viewers promedio` : "") +
    (second ? `, seguida de ${second.display_name} con ${second.avg_viewers.toLocaleString("es")}. ` : ". ") +
    `Datos actualizados cada 2 horas en Campulse.`;

  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/gender/${gender}`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Campulse",item:SITE},{"@type":"ListItem",position:2,name:"Géneros",item:`${SITE}/gender`},{"@type":"ListItem",position:3,name,item:`${SITE}/gender/${gender}`}]},
    hasPart:models.slice(0,10).map(m=>({"@type":"WebPage",name:`${m.display_name||m.username} Stats — Campulse`,url:`${SITE}/model/${m.username}`})),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="keywords" content={keywords}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/gender/${gender}`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/gender/${gender}`}/>
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
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/app.html">Campulse</a>
          <span className="cmp-bc-sep">›</span>
          <a href="/gender">Géneros</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>{emoji} {name}</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">{emoji} {name} en Chaturbate</h1>
          <p className="cmp-page-sub">Top {models.length} {nameEs.toLowerCase()} ordenadas por viewers promedio · últimos 14 días</p>
        </div>

        {/* Affiliate CTA */}
        <a href={`https://chaturbate.com/in/?tour=x1Rd&campaign=rI8z3&track=cta_top&gender=${GENDER_CB_PARAM[gender]||"f"}`} target="_blank" rel="noopener noreferrer" className="cmp-cta">
          🔴 Ver {name} en vivo ahora →
        </a>

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
                      <img src={`https://flagcdn.com/16x12/${m.country.toLowerCase()}.png`} alt={COUNTRY_NAMES[m.country]||m.country} width={16} height={12} style={{borderRadius:2,verticalAlign:"middle",display:"inline"}}/>
                      <span>{COUNTRY_NAMES[m.country]||m.country}</span>
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

        {/* EMBED — Cam Listing por género */}
        <section style={{marginTop:40,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
            <span style={{fontSize:".75rem",fontWeight:700,color:"var(--txt2)",letterSpacing:".06em",textTransform:"uppercase"}}>{name} más popular en vivo ahora</span>
          </div>
          <div style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)"}}>
            <iframe
              src={`https://chaturbate.com/in/?tour=x1Rd&campaign=rI8z3&track=default&c=15&p=1&gender=${GENDER_CB_PARAM[gender]||"f"}`}
              style={{width:"100%",height:"56dvh",minHeight:280,maxHeight:"62dvh",border:"none",display:"block"}}
              frameBorder="0"
              scrolling="yes"
            />
          </div>
          <p style={{fontSize:".6875rem",color:"var(--txt3)",textAlign:"center",marginTop:6}}>
            Stream en vivo desde Chaturbate ·{" "}
            <a href={`https://chaturbate.com/in/?tour=x1Rd&campaign=rI8z3&track=fullscreen_gender_${gender}&gender=${GENDER_CB_PARAM[gender]||"f"}`} target="_blank" rel="noopener noreferrer" style={{color:"var(--neon)"}}>Ver en pantalla completa →</a>
          </p>
        </section>

        <section style={{marginTop:48,padding:"1.5rem",background:"var(--surf)",borderRadius:14,border:"1px solid var(--bdr)"}}>
          <h2 style={{fontSize:"1.125rem",fontWeight:700,marginBottom:".75rem",color:"var(--txt)"}}>{name} en Chaturbate</h2>
          <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7,marginBottom:".75rem"}}>
            Campulse rastrea en tiempo real las estadísticas de las {nameEs.toLowerCase()} de Chaturbate.
            Los datos se actualizan cada 2 horas con el número de viewers, seguidores y los mejores horarios.
          </p>
          {top && (
            <p style={{color:"var(--txt2)",fontSize:".875rem",lineHeight:1.7}}>
              Actualmente, <strong style={{color:"var(--txt)"}}>{top.display_name||top.username}</strong> lidera con <strong style={{color:"var(--neon)"}}>{top.avg_viewers.toLocaleString("es")} viewers promedio</strong>{top.max_followers>0?` y ${top.max_followers.toLocaleString("es")} seguidores.`:"."} 
            </p>
          )}
        </section>
        {/* CTA APP - todas las modelos */}
        <AppCTA />


        <div className="cmp-footer-links">
          <a href="/gender" className="cmp-footer-link">← Ver todos los géneros</a>
          <a href="/country" className="cmp-footer-link">Ver por país →</a>
        </div>
      </div>
    </>
  );
}
