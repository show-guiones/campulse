// pages/model/[username].jsx — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo, AppCTA } from "../../campulse-design-system";

const LANG_VARIANTS = {
  spanish:["spanish","español","espanol","es"],english:["english","inglés","ingles","en"],
  portuguese:["portuguese","portugués","portugues","pt"],romanian:["romanian","rumano","română","ro"],
  russian:["russian","ruso","русский","ru"],german:["german","alemán","deutsch","de"],
  french:["french","francés","français","fr"],italian:["italian","italiano","it"],
};
const LANG_NAMES = { spanish:"Español",english:"English",portuguese:"Português",romanian:"Română",russian:"Русский",german:"Deutsch",french:"Français",italian:"Italiano" };
function detectLangSlug(raw) {
  if (!raw) return null;
  const val = raw.toLowerCase().trim();
  for (const [slug,variants] of Object.entries(LANG_VARIANTS)) { if (variants.some(v=>val.includes(v))) return slug; }
  return null;
}
const SITE = "https://www.campulsehub.com";
const COUNTRY_NAMES = { CO:"Colombia",ES:"España",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",VE:"Venezuela",EC:"Ecuador",US:"Estados Unidos",BR:"Brasil",RO:"Rumania",RU:"Rusia",DE:"Alemania",FR:"Francia",GB:"Reino Unido",IT:"Italia",PH:"Filipinas",TH:"Tailandia",CZ:"República Checa",UA:"Ucrania",HU:"Hungría",PL:"Polonia",CA:"Canadá",AU:"Australia",NL:"Países Bajos",SE:"Suecia",TR:"Turquía" };
const GENDER_LABELS = { f:"Mujer",m:"Hombre",c:"Pareja",t:"Trans" };
const GENDER_COLORS = { f:"var(--female)",m:"var(--male)",c:"var(--couple)",t:"var(--trans)" };
function countryCodeToFlag(code) {
  if (!code||code.length!==2) return "";
  return code.toUpperCase().split("").map(c=>String.fromCodePoint(0x1f1e0+c.charCodeAt(0)-65)).join("");
}

function Sparkline({ data, width=360, height=64 }) {
  if (!data||data.length<2) return null;
  const values = data.map(d=>d.num_users??0);
  const max = Math.max(...values,1);
  const step = width/(values.length-1);
  const points = values.map((v,i)=>`${i*step},${height-(v/max)*(height-6)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38b6d4" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#38b6d4" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${(values.length-1)*step},${height}`} fill="url(#sg)"/>
      <polyline points={points} fill="none" stroke="#38b6d4" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {(()=>{ const li=values.length-1; const x=li*step; const y=height-(values[li]/max)*(height-6); return <circle cx={x} cy={y} r="3.5" fill="#38b6d4"/>; })()}
    </svg>
  );
}

export async function getServerSideProps({ params }) {
  const { username } = params;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL||!SUPABASE_KEY) return { props:{ username,history:[],bestHours:[],country:"",gender:"",displayName:"",languages:"",similarModels:[] } };
  const sbHeaders = { apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` };
  const since30d = new Date(Date.now()-30*24*60*60*1000).toISOString();
  const since2h  = new Date(Date.now()- 2*60*60*1000).toISOString();
  const enc = encodeURIComponent(username);
  try {
    const [histRes,bestRes,snapRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?username=eq.${enc}&captured_at=gte.${since30d}&select=captured_at,num_users,num_followers&order=captured_at.asc&limit=1000`,{headers:sbHeaders}),
      fetch(`${SUPABASE_URL}/rest/v1/best_hours?username=eq.${enc}&select=day_of_week,hour_est,avg_viewers,peak_viewers,sample_count&order=avg_viewers.desc&limit=168`,{headers:sbHeaders}),
      fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?username=eq.${enc}&select=country,gender,display_name,spoken_languages&order=captured_at.desc&limit=1`,{headers:sbHeaders}),
    ]);
    const history  = histRes.ok ? await histRes.json() : [];
    const bestHours= bestRes.ok ? await bestRes.json() : [];
    const snapRows = snapRes.ok ? await snapRes.json() : [];
    const snap     = Array.isArray(snapRows) ? snapRows[0]||{} : {};
    const countryCode = (snap.country||"").toUpperCase().trim();
    const gender      = snap.gender||"";
    let similarModels = [];
    if (countryCode||gender) {
      try {
        let filter = `captured_at=gte.${since2h}&username=neq.${enc}&num_users=gt.0`;
        if (countryCode) filter+=`&country=eq.${countryCode}`;
        else if (gender) filter+=`&gender=eq.${gender}`;
        const simRes = await fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?${filter}&select=username,display_name,num_users,country&order=num_users.desc&limit=20`,{headers:sbHeaders});
        if (simRes.ok) {
          const rows = await simRes.json();
          if (Array.isArray(rows)) {
            const seen=new Set();
            similarModels=rows.filter(r=>{ if(seen.has(r.username))return false; seen.add(r.username); return true; }).slice(0,6);
          }
        }
      } catch {}
    }
    return { props:{ username, history:Array.isArray(history)?history:[], bestHours:Array.isArray(bestHours)?bestHours:[], country:snap.country||"", gender, displayName:snap.display_name||"", languages:snap.spoken_languages||"", similarModels } };
  } catch {
    return { props:{ username,history:[],bestHours:[],country:"",gender:"",displayName:"",languages:"",similarModels:[] } };
  }
}

export default function ModelPage({ username,history,bestHours,country,gender,displayName,languages,similarModels }) {
  const last      = history[history.length-1]||{};
  const days      = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  const viewers   = last.num_users??null;
  const followers = last.num_followers??null;
  const snapCount = history.length;
  const topHour   = bestHours[0];
  const peakViewers = history.length>0 ? Math.max(...history.map(r=>r.num_users??0)) : null;
  const isLive    = viewers!=null&&viewers>0;
  const countryCode = (country||"").toUpperCase().trim();
  const countryName = COUNTRY_NAMES[countryCode]||countryCode||null;
  const flag        = countryCodeToFlag(countryCode);
  const genderLabel = GENDER_LABELS[gender]||null;
  const genderColor = GENDER_COLORS[gender]||"var(--txt2)";
  const name        = displayName||username;
  const langSlug    = detectLangSlug(languages);
  const langName    = langSlug ? LANG_NAMES[langSlug] : null;
  const sparkData   = history.slice(-30);
  const histMax     = peakViewers||1;
  const shouldIndex = snapCount>=3;

  const LEXY_USER = "lexy_fox2";
  let pageTitle = viewers!=null
    ? `${name} en Chaturbate — ${viewers.toLocaleString("es")} viewers ahora | Campulse`
    : `${name} Stats en Chaturbate | Campulse`;
  let pageDescription = `Estadísticas en tiempo real de ${name} en Chaturbate.`;
  if (countryName) pageDescription+=` Modelo de ${countryName}.`;
  if (followers!=null) pageDescription+=` ${followers.toLocaleString("es")} seguidores.`;
  if (topHour) pageDescription+=` Mejor horario: ${days[topHour.day_of_week]} a las ${String(topHour.hour_est??0).padStart(2,"0")}:00 EST con ${Math.round(topHour.avg_viewers)} viewers promedio.`;
  if (snapCount>0) pageDescription+=` ${snapCount} snapshots en los últimos 30 días.`;
  if (username===LEXY_USER) {
    pageTitle = isLive ? `lexy_fox2 en vivo — ${viewers.toLocaleString("es")} viewers ahora | CampulseHub` : "lexy_fox2 en Chaturbate — Perfil y estadísticas | CampulseHub";
    pageDescription = `lexy_fox2 es una de las modelos más vistas en CampulseHub. ${isLive?`Ahora mismo con ${viewers.toLocaleString("es")} viewers en vivo. `:""}Sigue sus estadísticas, historial y mejor horario en tiempo real.`;
  }
  const schema = {
    "@context":"https://schema.org","@type":"ProfilePage",name:username===LEXY_USER?"lexy_fox2 — Modelo destacada en CampulseHub":`${name} — Stats en Chaturbate`,
    description:pageDescription,url:`${SITE}/model/${username}`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Campulse",item:SITE},...(countryName&&countryCode?[{"@type":"ListItem",position:2,name:countryName,item:`${SITE}/country/${countryCode.toLowerCase()}`}]:[]),{"@type":"ListItem",position:countryName?3:2,name,item:`${SITE}/model/${username}`}]},
    mainEntity:{"@type":"Person",name,identifier:username,url:`https://chaturbate.com/${username}/`,...(countryName&&{nationality:countryName}),...(followers!=null&&{interactionStatistic:{"@type":"InteractionCounter",interactionType:"https://schema.org/FollowAction",userInteractionCount:followers}})},
    ...(snapCount>0&&{dateModified:last.captured_at??undefined}),
  };

  function fmtDate(iso) {
    if (!iso) return "--";
    const d=new Date(iso);
    if (isNaN(d)) return "--";
    return d.toLocaleString("es-CO",{timeZone:"America/Bogota",hour12:false});
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        {username===LEXY_USER ? (<>
          <meta name="keywords" content="lexy_fox2, lexy fox, modelo en vivo, chaturbate, campulse, webcam latina"/>
          <meta name="robots" content="index,follow,max-image-preview:large"/>
          <meta property="og:image" content="https://thumb.live.mmcdn.com/riw/lexy_fox2.jpg"/>
        </>) : (<meta name="robots" content={shouldIndex?"index, follow":"noindex, nofollow"}/>)}
        <link rel="canonical" href={`${SITE}/model/${username}`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/model/${username}`}/>
        <meta property="og:type" content="profile"/>
        <meta property="og:site_name" content="Campulse"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{DS_CSS}</style>
      </Head>

      <div className="cmp-page">
        {/* NAV */}
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-nav-link">{flag} {countryName}</a>}
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <nav className="cmp-bc">
          <a href="/">Campulse</a>
          {countryName && countryCode && (<><span className="cmp-bc-sep">›</span><a href={`/country/${countryCode.toLowerCase()}`}>{flag} {countryName}</a></>)}
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>{name}</span>
        </nav>

        {/* HEADER */}
        <div className="cmp-page-header" style={{borderBottom:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"1rem",flexWrap:"wrap"}}>
            {/* Avatar */}
            <div style={{width:60,height:60,borderRadius:14,background:"linear-gradient(135deg,rgba(56,182,212,.15),rgba(124,92,191,.15))",border:"1px solid rgba(56,182,212,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",fontWeight:800,color:"var(--neon)",flexShrink:0}}>
              {(name[0]||"?").toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
                <h1 className="cmp-page-h1" style={{margin:0}}>{name}</h1>
                {isLive && <span className="cmp-live-badge"><span className="cmp-live-dot"/>EN VIVO</span>}
              </div>
              {name!==username && <div style={{fontSize:".8rem",color:"var(--txt3)",marginBottom:".625rem"}}>@{username}</div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:".5rem"}}>
                {genderLabel && <span className="cmp-tag" style={{color:genderColor,borderColor:genderColor.replace("var(","rgba(").replace(")",", .35)"),background:genderColor.replace("var(","rgba(").replace(")",", .1)")}}>{genderLabel}</span>}
                {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-tag-link">{flag} {countryName}</a>}
                {langSlug ? <a href={`/language/${langSlug}`} className="cmp-tag-link">🗣 {langName}</a> : languages ? <span className="cmp-tag">🗣 {languages}</span> : null}
              </div>
            </div>
          </div>
        </div>

        {/* METRICS */}
        <div className="cmp-metrics">
          {[["Viewers ahora",viewers],["Seguidores",followers],["Peak viewers",peakViewers],["Snapshots",snapCount||null]].map(([label,val])=>(
            <div key={label} className="cmp-metric">
              <div className="cmp-mval">{val!=null ? val.toLocaleString("es") : "—"}</div>
              <div className="cmp-mlbl">{label}</div>
            </div>
          ))}
        </div>

        {/* SPARKLINE */}
        {sparkData.length>=2 && (
          <div className="cmp-spark">
            <div className="cmp-spark-header">
              <span className="cmp-spark-lbl">Viewers últimos 30 días</span>
              {peakViewers!=null && <span className="cmp-spark-peak">Máx: {peakViewers.toLocaleString("es")}</span>}
            </div>
            <Sparkline data={sparkData}/>
          </div>
        )}

        {/* CTA AFFILIATE */}
        <a href={`https://chaturbate.com/in/?tour=LQps&campaign=rI8z3&track=default&room=${username}`}
          target="_blank" rel="noopener noreferrer"
          className={isLive?"cmp-cta-live":"cmp-cta"}>
          {isLive ? "🔴 Ver sala en vivo" : "Ver sala en Chaturbate →"}
        </a>

        {/* EMBED */}
        {isLive && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:".75rem"}}>
              <span className="cmp-live-dot"/>
              <span style={{fontSize:".8125rem",color:"var(--txt2)",fontWeight:600}}>En vivo ahora · {viewers?.toLocaleString("es")} viewers</span>
            </div>
            <div className="cmp-embed-wrap">
              <iframe
                src={`https://chaturbate.com/embed/${username}/?tour=LQps&campaign=rI8z3&bgcolor=0f1014&disable_sound=0&mobileRedirect=never`}
                className="cmp-embed-frame"
                width="100%" height="100%"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen frameBorder="0" scrolling="no"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${name} en vivo en Chaturbate`}
              />
            </div>
            <p className="cmp-embed-note">Al ver el stream en Campulse, apoyas a {name} directamente.</p>
          </div>
        )}

        {/* BEST HOURS */}
        {bestHours.length>0 && (<>
          <div className="cmp-sec">Mejores horarios (EST)</div>
          {bestHours.slice(0,5).map((h,i)=>(
            <div key={i} className="cmp-hour">
              <span className="cmp-hour-time">{days[h.day_of_week]} {String(h.hour_est??0).padStart(2,"0")}:00 EST</span>
              <span className="cmp-hour-val">{Math.round(h.avg_viewers)} viewers</span>
            </div>
          ))}
        </>)}

        {/* HISTORY */}
        {history.length>0 && (<>
          <div className="cmp-sec">Historial reciente</div>
          {history.slice(-15).reverse().map((r,i)=>{
            const pct = histMax>0 ? ((r.num_users??0)/histMax)*100 : 0;
            return (
              <div key={i} className="cmp-hist">
                <div className="cmp-hist-date">{fmtDate(r.captured_at)}</div>
                <div className="cmp-hist-bar"><div className="cmp-hist-fill" style={{width:`${pct}%`}}/></div>
                <div className="cmp-hist-val">{(r.num_users??0).toLocaleString("es")}</div>
              </div>
            );
          })}
        </>)}

        {/* SIMILAR MODELS */}
        {similarModels.length>0 && (<>
          <div className="cmp-divider"/>
          <div className="cmp-sec">{countryName?`Más modelos de ${countryName} ahora`:"Modelos similares en vivo"}</div>
          <div className="cmp-grid">
            {similarModels.map(m=>(
              <a key={m.username} href={`/model/${m.username}`} className="cmp-card">
                <div className="cmp-card-name">{m.display_name||m.username}</div>
                <div className="cmp-card-handle">@{m.username}</div>
                <div className="cmp-card-viewers">👁 {(m.num_users??0).toLocaleString("es")} viewers</div>
                {m.country && <div className="cmp-card-sub">{countryCodeToFlag(m.country)} {m.country.toUpperCase()}</div>}
              </a>
            ))}
          </div>
          {countryCode && (
            <p style={{textAlign:"center",marginTop:"1rem"}}>
              <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-footer-link">Ver todas las modelos de {countryName} →</a>
            </p>
          )}
        </>)}

        {/* FOOTER LINKS */}
        {/* CTA APP - todas las modelos */}
        <AppCTA />

        <div className="cmp-footer-links">
          {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-footer-link">{flag} Ver más modelos de {countryName} →</a>}
          {langSlug && <a href={`/language/${langSlug}`} className="cmp-footer-link">🗣 Ver modelos en {langName} →</a>}
          <a href="/app.html" className="cmp-footer-link" style={{marginTop:4}}>← Ver todas las modelos en vivo</a>
        </div>
      </div>
    </>
  );
}
