// pages/model/[username].jsx — Premium UI Redesign

import Head from "next/head";

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
const GENDER_COLORS = { f:"#f472b6",m:"#60a5fa",c:"#34d399",t:"#c084fc" };
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
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${(values.length-1)*step},${height}`} fill="url(#sg)"/>
      <polyline points={points} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {(()=>{ const li=values.length-1; const x=li*step; const y=height-(values[li]/max)*(height-6); return <circle cx={x} cy={y} r="3.5" fill="#c084fc"/>; })()}
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
  const genderColor = GENDER_COLORS[gender]||"#9ca3af";
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
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{`
          *{box-sizing:border-box} html{background:#080810} body{margin:0;background:#080810}
          .mp{font-family:'DM Sans',system-ui,sans-serif;max-width:760px;margin:0 auto;padding:0 1.25rem 5rem;background:#080810;min-height:100vh;color:#e2e8f0}
          a{text-decoration:none}
          .mp-nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 0;border-bottom:1px solid rgba(255,255,255,.05);margin-bottom:0}
          .mp-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:#fff;letter-spacing:-.5px}
          .mp-nav-links{display:flex;gap:1.25rem}
          .mp-nav-link{font-size:.8125rem;color:#6b7280;font-weight:500;transition:color .2s}
          .mp-nav-link:hover{color:#c084fc}
          .mp-bc{font-size:.8125rem;color:#374151;padding:.875rem 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
          .mp-bc a{color:#6b7280;transition:color .2s}.mp-bc a:hover{color:#c084fc}
          .mp-sep{color:#1f2937}
          .mp-header{padding:2rem 0 1.5rem;border-bottom:1px solid rgba(255,255,255,.05)}
          .mp-header-top{display:flex;align-items:flex-start;gap:1rem;flex-wrap:wrap}
          .mp-avatar{width:60px;height:60px;border-radius:14px;background:linear-gradient(135deg,rgba(192,132,252,.15),rgba(129,140,248,.15));border:1px solid rgba(192,132,252,.2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#c084fc;font-family:'Syne',sans-serif;flex-shrink:0;letter-spacing:-1px}
          .mp-header-info{flex:1;min-width:0}
          .mp-h1{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(1.5rem,5vw,2.125rem);line-height:1.1;margin:0 0 4px;letter-spacing:-1px;color:#f8fafc}
          .mp-handle{font-size:.8125rem;color:#374151;margin-bottom:.625rem}
          .mp-live-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:100px;padding:4px 12px;font-size:.6875rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
          .mp-live-dot{width:5px;height:5px;border-radius:50%;background:#ef4444;animation:pdot 2s infinite}
          @keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
          .mp-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:.625rem}
          .mp-tag{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:100px;padding:4px 12px;font-size:.75rem;color:#9ca3af}
          .mp-tag-link{background:rgba(192,132,252,.07);border:1px solid rgba(192,132,252,.18);border-radius:100px;padding:4px 12px;font-size:.75rem;color:#c084fc;transition:background .2s}
          .mp-tag-link:hover{background:rgba(192,132,252,.15)}
          .mp-metrics{display:flex;gap:10px;margin:1.5rem 0;flex-wrap:wrap}
          .mp-metric{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1rem 1.125rem;flex:1;min-width:100px}
          .mp-mval{font-size:1.5rem;font-weight:800;color:#c084fc;font-family:'Syne',sans-serif;letter-spacing:-1px}
          .mp-mlbl{font-size:.6875rem;color:#374151;margin-top:3px;font-weight:500;text-transform:uppercase;letter-spacing:.06em}
          .mp-spark{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:1.125rem 1.25rem;margin-bottom:1.5rem}
          .mp-spark-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.875rem}
          .mp-spark-lbl{font-size:.6875rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#374151}
          .mp-spark-peak{font-size:.8125rem;color:#c084fc;font-weight:600}
          .mp-cta-live{display:flex;align-items:center;justify-content:center;gap:8px;background:#c084fc;color:#09090b;padding:1rem;border-radius:12px;font-weight:700;font-size:.9375rem;margin:1.5rem 0;transition:background .2s,transform .2s}
          .mp-cta-live:hover{background:#a855f7;transform:translateY(-1px)}
          .mp-cta{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#c084fc;padding:1rem;border-radius:12px;font-weight:600;font-size:.9375rem;margin:1.5rem 0;transition:border-color .2s,background .2s}
          .mp-cta:hover{border-color:rgba(192,132,252,.35);background:rgba(192,132,252,.06)}
          .mp-embed-wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:14px;background:#111;border:1px solid rgba(255,255,255,.07);margin-bottom:1rem}
          .mp-embed-frame{position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:14px}
          .mp-embed-note{font-size:.75rem;color:#1f2937;text-align:center;margin-bottom:1.5rem}
          .mp-embed-header{display:flex;align-items:center;gap:8px;margin-bottom:.75rem}
          .mp-embed-lbl{font-size:.8125rem;color:#9ca3af;font-weight:600}
          .mp-sec-lbl{font-size:.6875rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#374151;margin-bottom:.875rem;margin-top:2rem;display:flex;align-items:center;gap:8px}
          .mp-sec-lbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}
          .mp-hour{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:.875rem 1rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:.875rem}
          .mp-hour-time{color:#9ca3af;font-weight:500}
          .mp-hour-val{color:#c084fc;font-weight:700;font-family:'Syne',sans-serif}
          .mp-hist{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.04)}
          .mp-hist-date{font-size:.6875rem;color:#1f2937;width:130px;flex-shrink:0}
          .mp-hist-bar{flex:1;background:rgba(255,255,255,.04);border-radius:4px;height:5px;overflow:hidden}
          .mp-hist-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#c084fc);border-radius:4px;min-width:2px}
          .mp-hist-val{font-size:.75rem;color:#c084fc;width:48px;text-align:right;flex-shrink:0;font-weight:600}
          .mp-similar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px}
          .mp-sim-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:1rem;transition:border-color .2s,background .2s,transform .15s}
          .mp-sim-card:hover{border-color:rgba(192,132,252,.25);background:rgba(192,132,252,.04);transform:translateY(-2px)}
          .mp-sim-name{font-weight:700;font-size:.875rem;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e2e8f0}
          .mp-sim-handle{font-size:.6875rem;color:#374151;margin-bottom:.5rem}
          .mp-sim-viewers{font-size:.8125rem;color:#c084fc;font-weight:600}
          .mp-sim-country{font-size:.75rem;color:#374151;margin-top:2px}
          .mp-cat-links{display:flex;flex-direction:column;gap:6px;margin-top:2rem}
          .mp-cat-link{text-align:center;color:#6b7280;font-size:.8125rem;transition:color .2s}
          .mp-cat-link:hover{color:#c084fc}
          .mp-back{color:#374151;font-size:.8125rem;text-align:center;margin-top:.5rem;display:block;transition:color .2s}
          .mp-back:hover{color:#6b7280}
          .mp-divider{height:1px;background:rgba(255,255,255,.05);margin:1.5rem 0}
          @media(max-width:540px){.mp-metrics{gap:8px}.mp-metric{min-width:90px}.mp-avatar{width:48px;height:48px;font-size:1.125rem}}
        `}</style>
      </Head>

      <div className="mp">
        <nav className="mp-nav">
          <a href="/" className="mp-logo">Campulse</a>
          <div className="mp-nav-links">
            {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="mp-nav-link">{flag} {countryName}</a>}
            <a href="/gender" className="mp-nav-link">Géneros</a>
          </div>
        </nav>

        <nav className="mp-bc">
          <a href="/">Campulse</a>
          {countryName && countryCode && (<><span className="mp-sep">›</span><a href={`/country/${countryCode.toLowerCase()}`}>{flag} {countryName}</a></>)}
          <span className="mp-sep">›</span>
          <span style={{color:"#9ca3af"}}>{name}</span>
        </nav>

        <div className="mp-header">
          <div className="mp-header-top">
            <div className="mp-avatar">{(name[0]||"?").toUpperCase()}</div>
            <div className="mp-header-info">
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
                <h1 className="mp-h1">{name}</h1>
                {isLive && (
                  <span className="mp-live-badge">
                    <span className="mp-live-dot"/>EN VIVO
                  </span>
                )}
              </div>
              {name!==username && <div className="mp-handle">@{username}</div>}
              <div className="mp-tags">
                {genderLabel && <span className="mp-tag" style={{color:genderColor,borderColor:genderColor+"33",background:genderColor+"10"}}>{genderLabel}</span>}
                {countryName && countryCode && (
                  <a href={`/country/${countryCode.toLowerCase()}`} className="mp-tag-link">{flag} {countryName}</a>
                )}
                {langSlug ? (
                  <a href={`/language/${langSlug}`} className="mp-tag-link">🗣 {langName}</a>
                ) : languages ? (
                  <span className="mp-tag">🗣 {languages}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mp-metrics">
          {[["Viewers ahora",viewers],["Seguidores",followers],["Peak viewers",peakViewers],["Snapshots",snapCount||null]].map(([label,val])=>(
            <div key={label} className="mp-metric">
              <div className="mp-mval">{val!=null ? val.toLocaleString("es") : "—"}</div>
              <div className="mp-mlbl">{label}</div>
            </div>
          ))}
        </div>

        {sparkData.length>=2 && (
          <div className="mp-spark">
            <div className="mp-spark-header">
              <span className="mp-spark-lbl">Viewers últimos 30 días</span>
              {peakViewers!=null && <span className="mp-spark-peak">Máx: {peakViewers.toLocaleString("es")}</span>}
            </div>
            <Sparkline data={sparkData}/>
          </div>
        )}

        <a href={`https://chaturbate.com/in/?tour=LQps&campaign=rI8z3&track=default&room=${username}`}
          target="_blank" rel="noopener noreferrer"
          className={isLive?"mp-cta-live":"mp-cta"}>
          {isLive ? "🔴 Ver sala en vivo" : "Ver sala en Chaturbate →"}
        </a>

        {isLive && (
          <div>
            <div className="mp-embed-header">
              <span className="mp-live-dot"/>
              <span className="mp-embed-lbl">En vivo ahora · {viewers?.toLocaleString("es")} viewers</span>
            </div>
            <div className="mp-embed-wrap">
              <iframe
                src={`https://chaturbate.com/embed/${username}/?tour=LQps&campaign=rI8z3&bgcolor=000000&disable_sound=0&mobileRedirect=never`}
                className="mp-embed-frame"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen frameBorder="0" scrolling="no"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${name} en vivo en Chaturbate`}
              />
            </div>
            <p className="mp-embed-note">Al ver el stream en Campulse, apoyas a {name} directamente.</p>
          </div>
        )}

        {bestHours.length>0 && (<>
          <div className="mp-sec-lbl">Mejores horarios (EST)</div>
          {bestHours.slice(0,5).map((h,i)=>(
            <div key={i} className="mp-hour">
              <span className="mp-hour-time">{days[h.day_of_week]} {String(h.hour_est??0).padStart(2,"0")}:00 EST</span>
              <span className="mp-hour-val">{Math.round(h.avg_viewers)} viewers</span>
            </div>
          ))}
        </>)}

        {history.length>0 && (<>
          <div className="mp-sec-lbl">Historial reciente</div>
          {history.slice(-15).reverse().map((r,i)=>{
            const pct = histMax>0 ? ((r.num_users??0)/histMax)*100 : 0;
            return (
              <div key={i} className="mp-hist">
                <div className="mp-hist-date">{fmtDate(r.captured_at)}</div>
                <div className="mp-hist-bar"><div className="mp-hist-fill" style={{width:`${pct}%`}}/></div>
                <div className="mp-hist-val">{(r.num_users??0).toLocaleString("es")}</div>
              </div>
            );
          })}
        </>)}

        {similarModels.length>0 && (<>
          <div className="mp-divider"/>
          <div className="mp-sec-lbl">{countryName?`Más modelos de ${countryName} ahora`:"Modelos similares en vivo"}</div>
          <div className="mp-similar-grid">
            {similarModels.map(m=>(
              <a key={m.username} href={`/model/${m.username}`} className="mp-sim-card">
                <div className="mp-sim-name">{m.display_name||m.username}</div>
                <div className="mp-sim-handle">@{m.username}</div>
                <div className="mp-sim-viewers">👁 {(m.num_users??0).toLocaleString("es")} viewers</div>
                {m.country && <div className="mp-sim-country">{countryCodeToFlag(m.country)} {m.country.toUpperCase()}</div>}
              </a>
            ))}
          </div>
          {countryCode && (
            <p style={{textAlign:"center",marginTop:"1rem"}}>
              <a href={`/country/${countryCode.toLowerCase()}`} className="mp-cat-link">Ver todas las modelos de {countryName} →</a>
            </p>
          )}
        </>)}

        <div className="mp-cat-links">
          {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="mp-cat-link">{flag} Ver más modelos de {countryName} →</a>}
          {langSlug && <a href={`/language/${langSlug}`} className="mp-cat-link">🗣 Ver modelos en {langName} →</a>}
          <a href="/" className="mp-back">← Volver al inicio</a>
        </div>
      </div>
    </>
  );
}
