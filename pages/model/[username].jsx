// pages/model/[username].jsx — Mobile-first redesign con UX optimizada para afiliado

import Head from "next/head";
import { useState, useEffect } from "react";
import { DS_CSS, Logo } from "../../campulse-design-system";

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

function SparklineMini({ data, height=36 }) {
  if (!data||data.length<2) return null;
  const values = data.map(d=>d.num_users??0);
  const max = Math.max(...values,1);
  const w = 80;
  const step = w/(values.length-1);
  const points = values.map((v,i)=>`${i*step},${height-(v/max)*(height-4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width={w} height={height} style={{display:"block"}}>
      <defs>
        <linearGradient id="sgm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38b6d4" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#38b6d4" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${(values.length-1)*step},${height}`} fill="url(#sgm)"/>
      <polyline points={points} fill="none" stroke="#38b6d4" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
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
      fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?username=eq.${enc}&captured_at=gte.${since30d}&select=captured_at,num_users,num_followers&order=captured_at.desc&limit=1000`,{headers:sbHeaders}),
      fetch(`${SUPABASE_URL}/rest/v1/best_hours?username=eq.${enc}&select=day_of_week,hour_est,avg_viewers,peak_viewers,sample_count&order=avg_viewers.desc&limit=168`,{headers:sbHeaders}),
      fetch(`${SUPABASE_URL}/rest/v1/rooms_snapshot?username=eq.${enc}&select=country,gender,display_name,spoken_languages&order=captured_at.desc&limit=1`,{headers:sbHeaders}),
    ]);
    const historyDesc = histRes.ok ? await histRes.json() : [];
    const history   = Array.isArray(historyDesc) ? [...historyDesc].reverse() : [];
    const bestHours = bestRes.ok ? await bestRes.json() : [];
    const snapRows  = snapRes.ok ? await snapRes.json() : [];
    const snap      = Array.isArray(snapRows) ? snapRows[0]||{} : {};
    const countryCode = (snap.country||"").toUpperCase().trim();
    const genderVal   = snap.gender||"";
    let similarModels = [];
    if (countryCode||genderVal) {
      try {
        let filter = `captured_at=gte.${since2h}&username=neq.${enc}&num_users=gt.0`;
        if (countryCode) filter+=`&country=eq.${countryCode}`;
        else if (genderVal) filter+=`&gender=eq.${genderVal}`;
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
    return { props:{ username, history:Array.isArray(history)?history:[], bestHours:Array.isArray(bestHours)?bestHours:[], country:snap.country||"", gender:snap.gender||"", displayName:snap.display_name||"", languages:snap.spoken_languages||"", similarModels } };
  } catch {
    return { props:{ username,history:[],bestHours:[],country:"",gender:"",displayName:"",languages:"",similarModels:[] } };
  }
}


export default function ModelPage({ username,history,bestHours,country,gender,displayName,languages,similarModels }) {
  const last        = history[history.length-1]||{};
  const days        = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  const snapViewers = last.num_users??null;
  const followers   = last.num_followers??null;
  const snapCount   = history.length;
  const topHour     = bestHours[0];
  const peakViewers = history.length>0 ? Math.max(...history.map(r=>r.num_users??0)) : null;

  const [liveViewers, setLiveViewers] = useState(null);
  const [liveChecked, setLiveChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/live-check?username=${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        setLiveViewers(data?.online ? (data.num_users ?? 1) : null);
        setLiveChecked(true);
      })
      .catch(() => { if (!cancelled) setLiveChecked(true); });
    return () => { cancelled = true; };
  }, [username]);

  const isLive         = liveChecked && liveViewers !== null && liveViewers > 0;
  const currentViewers = isLive ? liveViewers : null;
  const viewers        = currentViewers ?? snapViewers;
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
  const maxHourViewers = bestHours.length>0 ? Math.max(...bestHours.slice(0,5).map(h=>Math.round(h.avg_viewers))) : 1;

  const trendPct = (() => {
    if (history.length<6) return null;
    const recent = history.slice(-3).reduce((s,r)=>s+(r.num_users??0),0)/3;
    const prev   = history.slice(-6,-3).reduce((s,r)=>s+(r.num_users??0),0)/3;
    if (prev===0) return null;
    return Math.round(((recent-prev)/prev)*100);
  })();

  const AFFILIATE_URL = `https://chaturbate.com/in/?tour=LQps&campaign=rI8z3&track=default&room=${username}`;

  const LEXY_USER = "lexy_fox2";
  let pageTitle = currentViewers!=null
    ? `${name} en Chaturbate — ${currentViewers.toLocaleString("es")} viewers ahora | CampulseHub`
    : `${name} en Chaturbate | CampulseHub`;
  if (countryName && !currentViewers) pageTitle = `${name} en Chaturbate — Modelo de ${countryName} | CampulseHub`;
  let pageDescription = `Estadísticas en tiempo real de ${name} en Chaturbate.`;
  if (countryName) pageDescription+=` Modelo de ${countryName}.`;
  if (followers!=null) pageDescription+=` ${followers.toLocaleString("es")} seguidores.`;
  if (peakViewers!=null) pageDescription+=` Pico: ${peakViewers.toLocaleString("es")} viewers.`;
  if (topHour) pageDescription+=` Mejor horario: ${days[topHour.day_of_week]} ${String(topHour.hour_est??0).padStart(2,"0")}:00 EST (~${Math.round(topHour.avg_viewers)} viewers).`;
  if (username===LEXY_USER) {
    pageTitle = isLive ? `lexy_fox2 en vivo — ${currentViewers.toLocaleString("es")} viewers ahora | CampulseHub` : "lexy_fox2 en Chaturbate — Perfil y estadísticas | CampulseHub";
    pageDescription = `lexy_fox2 es una de las modelos más vistas en CampulseHub. ${isLive?`Ahora mismo con ${currentViewers.toLocaleString("es")} viewers en vivo. `:""}Sigue sus estadísticas, historial y mejor horario en tiempo real.`;
  }
  const schema = {
    "@context":"https://schema.org","@type":"ProfilePage",name:username===LEXY_USER?"lexy_fox2 — Modelo destacada en CampulseHub":`${name} — Stats en Chaturbate`,
    description:pageDescription,url:`${SITE}/model/${username}`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"CampulseHub",item:SITE},...(countryName&&countryCode?[{"@type":"ListItem",position:2,name:countryName,item:`${SITE}/country/${countryCode.toLowerCase()}`}]:[]),{"@type":"ListItem",position:countryName?3:2,name,item:`${SITE}/model/${username}`}]},
    mainEntity:{"@type":"Person",name,identifier:username,url:`https://chaturbate.com/${username}/`,...(countryName&&{nationality:countryName}),...(followers!=null&&{interactionStatistic:{"@type":"InteractionCounter",interactionType:"https://schema.org/FollowAction",userInteractionCount:followers}})},
    ...(snapCount>0&&{dateModified:last.captured_at??undefined}),
  };

  function fmtDate(iso) {
    if (!iso) return "--";
    const d=new Date(iso);
    if (isNaN(d)) return "--";
    return d.toLocaleString("es-CO",{timeZone:"America/Bogota",hour12:false});
  }

  const mobileCSS = `
    @media(max-width:640px){
      .cmp-page{padding:0 0 5rem}
      .mob-sticky{position:sticky;top:0;z-index:100;background:rgba(15,16,20,.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:.625rem 1rem;gap:12px}
      .mob-sticky-back{font-size:.75rem;color:var(--txt2);display:flex;align-items:center;gap:4px;text-decoration:none}
      .mob-sticky-cta{background:var(--hot);color:#fff;font-size:.75rem;font-weight:700;padding:.5rem 1rem;border-radius:100px;display:flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;text-decoration:none}
      .mob-sticky-cta-off{background:var(--surf2);color:var(--neon);font-size:.75rem;font-weight:700;padding:.5rem 1rem;border-radius:100px;border:1px solid rgba(56,182,212,.25);display:flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;text-decoration:none}
      .mob-hero{padding:1rem 1rem .75rem;border-bottom:1px solid var(--bdr)}
      .mob-hero-top{display:flex;align-items:center;gap:.875rem;margin-bottom:.875rem}
      .mob-avatar{width:54px;height:54px;border-radius:16px;flex-shrink:0;background:linear-gradient(135deg,var(--hot),var(--purple));display:flex;align-items:center;justify-content:center;font-size:1.375rem;font-weight:800;color:#fff;position:relative}
      .mob-avatar-ring{position:absolute;inset:-3px;border-radius:19px;border:2px solid var(--hot);animation:cmpPulse 1.8s ease-in-out infinite}
      .mob-hero-name{font-size:1.125rem;font-weight:800;color:var(--txt);letter-spacing:-.02em;margin-bottom:1px}
      .mob-hero-handle{font-size:.75rem;color:var(--txt3);margin-bottom:.5rem}
      .mob-tags{display:flex;gap:5px;flex-wrap:wrap}
      .mob-viewer-card{background:rgba(56,182,212,.06);border:1px solid rgba(56,182,212,.18);border-radius:14px;padding:.75rem 1rem;display:flex;align-items:center;gap:.75rem}
      .mob-viewer-num{font-size:1.75rem;font-weight:800;color:var(--neon);letter-spacing:-1px;line-height:1}
      .mob-viewer-lbl{font-size:.625rem;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-top:2px}
      .mob-viewer-trend{font-size:.75rem;font-weight:700;margin-top:1px}
      .mob-viewer-trend.up{color:var(--grn)} .mob-viewer-trend.down{color:var(--hot)}
      .mob-cta-main{margin:.875rem 1rem 0;background:var(--hot);border-radius:18px;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;text-decoration:none;position:relative;overflow:hidden}
      .mob-cta-main-off{margin:.875rem 1rem 0;background:var(--surf);border:1px solid var(--bdr2);border-radius:18px;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;text-decoration:none}
      .mob-cta-title{font-size:1rem;font-weight:800;color:#fff;margin-bottom:2px}
      .mob-cta-title-off{font-size:1rem;font-weight:800;color:var(--neon);margin-bottom:2px}
      .mob-cta-sub{font-size:.6875rem;color:rgba(255,255,255,.65)}
      .mob-cta-sub-off{font-size:.6875rem;color:var(--txt3)}
      .mob-cta-arrow{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.125rem;color:#fff;flex-shrink:0}
      .mob-cta-arrow-off{width:40px;height:40px;border-radius:50%;background:rgba(56,182,212,.1);border:1px solid rgba(56,182,212,.2);display:flex;align-items:center;justify-content:center;font-size:1.125rem;color:var(--neon);flex-shrink:0}
      .mob-metrics{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:.875rem 1rem}
      .mob-metric{background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:.625rem .75rem;text-align:center}
      .mob-mval{font-size:1.125rem;font-weight:800;color:var(--neon);letter-spacing:-.5px}
      .mob-mlbl{font-size:.625rem;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;font-weight:600}
      .mob-section{padding:0 1rem .875rem}
      .mob-sec-title{font-size:.625rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);margin-bottom:.75rem;padding-top:1rem;border-top:1px solid var(--bdr);display:flex;align-items:center;gap:8px}
      .mob-sec-title::after{content:'';flex:1;height:1px;background:var(--bdr)}
      .mob-spark-wrap{background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:.875rem}
      .mob-hour{display:flex;align-items:center;gap:8px;padding:.5rem 0;border-bottom:1px solid var(--bdr)}
      .mob-hour:last-child{border-bottom:none}
      .mob-hour-badge{background:rgba(56,182,212,.1);color:var(--neon);border-radius:8px;padding:3px 8px;font-size:.6875rem;font-weight:700;min-width:72px;text-align:center;flex-shrink:0}
      .mob-hour-bar-wrap{flex:1;background:rgba(255,255,255,.05);height:4px;border-radius:2px;overflow:hidden}
      .mob-hour-fill{height:100%;background:linear-gradient(90deg,var(--purple),var(--neon));border-radius:2px}
      .mob-hour-val{font-size:.6875rem;color:var(--neon);font-weight:700;min-width:52px;text-align:right;flex-shrink:0}
      .mob-hist{display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid var(--bdr)}
      .mob-hist-date{font-size:.625rem;color:var(--txt3);width:110px;flex-shrink:0}
      .mob-hist-bar{flex:1;background:rgba(255,255,255,.04);border-radius:3px;height:4px;overflow:hidden}
      .mob-hist-fill{height:100%;background:linear-gradient(90deg,var(--purple),var(--neon));border-radius:3px;min-width:2px}
      .mob-hist-val{font-size:.6875rem;color:var(--neon);width:42px;text-align:right;flex-shrink:0;font-weight:600}
      .mob-cta-inline{margin:0 1rem .25rem;background:rgba(232,48,90,.07);border:1px solid rgba(232,48,90,.2);border-radius:14px;padding:1rem;text-align:center;display:block;text-decoration:none}
      .mob-cta-inline-off{margin:0 1rem .25rem;background:rgba(56,182,212,.06);border:1px solid rgba(56,182,212,.18);border-radius:14px;padding:1rem;text-align:center;display:block;text-decoration:none}
      .mob-cta-il-title{font-size:.9375rem;font-weight:800;margin-bottom:2px}
      .mob-cta-il-sub{font-size:.75rem;color:var(--txt3)}
      .mob-similar-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .mob-similar-scroll::-webkit-scrollbar{display:none}
      .mob-sim-card{flex-shrink:0;width:110px;background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:.75rem;display:block;text-decoration:none}
      .mob-sim-avatar{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:800;color:#fff;margin-bottom:6px}
      .mob-sim-name{font-size:.75rem;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
      .mob-sim-viewers{font-size:.6875rem;color:var(--neon);font-weight:600}
      .mob-embed-section{padding:0 1rem}
      .mob-embed-lbl{display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--txt2);font-weight:600;margin-bottom:.625rem}
      .mob-embed-note{font-size:.6875rem;color:var(--txt3);text-align:center;margin-top:.5rem}
      .mob-seo{margin:0 1rem 1rem;padding:1rem;background:var(--surf);border:1px solid var(--bdr);border-radius:14px}
      .mob-footer{display:flex;flex-direction:column;gap:6px;padding:0 1rem 1rem;align-items:center}
      .mob-footer a{color:var(--txt3);font-size:.8125rem;transition:color .2s;text-align:center;text-decoration:none}
      .mob-footer a:hover{color:var(--neon)}
      .cmp-nav-links{display:none}
      .cmp-nav{padding:.75rem 1rem}
      .cmp-bc{padding:.5rem 1rem}
      @keyframes cmpShimmer{0%{left:-100%}100%{left:200%}}
    }
    @media(min-width:641px){
      #mob-layout{display:none!important}
    }
  `;

  const gradients = [
    "linear-gradient(135deg,#7c5cbf,#e8305a)",
    "linear-gradient(135deg,#38b6d4,#22c77a)",
    "linear-gradient(135deg,#f0a830,#e8305a)",
    "linear-gradient(135deg,#22c77a,#38b6d4)",
    "linear-gradient(135deg,#e8305a,#f0a830)",
    "linear-gradient(135deg,#7c5cbf,#38b6d4)",
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        {username===LEXY_USER ? (<>
          <meta name="keywords" content="lexy_fox2, lexy fox, modelo en vivo, chaturbate, campulsehub, webcam latina"/>
          <meta name="robots" content="index,follow,max-image-preview:large"/>
          <meta property="og:image" content="https://thumb.live.mmcdn.com/riw/lexy_fox2.jpg"/>
        </>) : (<meta name="robots" content={shouldIndex?"index, follow":"noindex, nofollow"}/>)}
        <link rel="canonical" href={`${SITE}/model/${username}`}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/model/${username}`}/>
        <meta property="og:type" content="profile"/>
        <meta property="og:site_name" content="CampulseHub"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{DS_CSS}</style>
        <style>{mobileCSS}</style>
      </Head>

      {/* MOBILE LAYOUT */}
      <div id="mob-layout">

        {/* STICKY NAV */}
        <div className="mob-sticky">
          {countryName && countryCode
            ? <a href={`/country/${countryCode.toLowerCase()}`} className="mob-sticky-back">← {flag} {countryName}</a>
            : <a href="/app.html" className="mob-sticky-back">← Inicio</a>}
          <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer"
            className={isLive?"mob-sticky-cta":"mob-sticky-cta-off"}>
            {isLive && <span className="cmp-live-dot"/>}
            {isLive ? `${currentViewers?.toLocaleString("es")} viewers · Ver en vivo` : "Ver en Chaturbate"}
          </a>
        </div>

        {/* HERO */}
        <div className="mob-hero">
          <div className="mob-hero-top">
            <div className="mob-avatar">
              {(name[0]||"?").toUpperCase()}
              {isLive && <div className="mob-avatar-ring"/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="mob-hero-name">{name}</div>
              {name!==username && <div className="mob-hero-handle">@{username}</div>}
              <div className="mob-tags">
                {isLive && <span className="cmp-tag" style={{fontSize:".625rem",padding:"2px 8px",background:"rgba(232,48,90,.1)",color:"var(--hot)",border:"1px solid rgba(232,48,90,.25)",display:"inline-flex",alignItems:"center",gap:4}}><span className="cmp-live-dot"/>EN VIVO</span>}
                {genderLabel && <span className="cmp-tag" style={{fontSize:".625rem",padding:"2px 8px",color:genderColor,borderColor:genderColor.replace("var(","rgba(").replace(")",", .3)"),background:genderColor.replace("var(","rgba(").replace(")",", .08)")}}>{genderLabel}</span>}
                {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-tag-link" style={{fontSize:".625rem",padding:"2px 8px"}}>{flag} {countryName}</a>}
              </div>
            </div>
          </div>
          {/* Viewer count card */}
          <div className="mob-viewer-card">
            <div>
              <div className="mob-viewer-num">{currentViewers!=null ? currentViewers.toLocaleString("es") : "—"}</div>
              <div className="mob-viewer-lbl">viewers ahora</div>
              {trendPct!=null && <div className={`mob-viewer-trend ${trendPct>=0?"up":"down"}`}>{trendPct>=0?"▲":"▼"} {Math.abs(trendPct)}%</div>}
            </div>
            {sparkData.length>=2 && <div style={{flex:1,margin:"0 .75rem"}}><SparklineMini data={sparkData.slice(-10)} height={36}/></div>}
            {followers!=null && (
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:"1rem",fontWeight:800,color:"var(--txt)",letterSpacing:"-.5px"}}>{followers>=1000?(followers/1000).toFixed(1)+"k":followers.toLocaleString("es")}</div>
                <div style={{fontSize:".6rem",color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginTop:1}}>Seguidores</div>
              </div>
            )}
          </div>
        </div>

        {/* CTA PRINCIPAL */}
        {isLive ? (
          <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="mob-cta-main">
            <span style={{position:"absolute",top:0,left:"-100%",width:"60%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)",animation:"cmpShimmer 2.5s infinite",pointerEvents:"none"}}/>
            <div>
              <div className="mob-cta-title">{name} está EN VIVO ahora</div>
              <div className="mob-cta-sub">{currentViewers?.toLocaleString("es")} espectadores · Entra gratis</div>
            </div>
            <div className="mob-cta-arrow">→</div>
          </a>
        ) : (
          <>
            {topHour && (
              <div style={{margin:".875rem 1rem .5rem",background:"rgba(56,182,212,.05)",border:"1px solid rgba(56,182,212,.15)",borderRadius:12,padding:".75rem 1rem",display:"flex",alignItems:"center",gap:".75rem"}}>
                <span style={{fontSize:"1.25rem",flexShrink:0}}>🕙</span>
                <div>
                  <div style={{fontSize:".8125rem",fontWeight:700,color:"var(--neon)"}}>Mejor horario: {days[topHour.day_of_week]} {String(topHour.hour_est??0).padStart(2,"0")}:00 EST</div>
                  <div style={{fontSize:".6875rem",color:"var(--txt3)"}}>~{Math.round(topHour.avg_viewers)} viewers promedio · Offline ahora</div>
                </div>
              </div>
            )}
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="mob-cta-main-off">
              <div>
                <div className="mob-cta-title-off">Ver sala de {name}</div>
                <div className="mob-cta-sub-off">{peakViewers!=null?`Peak: ${peakViewers.toLocaleString("es")} viewers · `:""}chaturbate.com</div>
              </div>
              <div className="mob-cta-arrow-off">→</div>
            </a>
          </>
        )}

        {/* MÉTRICAS 3 COL */}
        <div className="mob-metrics">
          <div className="mob-metric" style={isLive?{background:"rgba(232,48,90,.08)",border:"1px solid rgba(232,48,90,.2)"}:{}}>
            <div className="mob-mval" style={isLive?{color:"var(--hot)"}:{}}>{currentViewers!=null?currentViewers.toLocaleString("es"):"—"}</div>
            <div className="mob-mlbl" style={isLive?{color:"rgba(232,48,90,.7)"}:{}}>{isLive?"Ahora":"Viewers"}</div>
          </div>
          <div className="mob-metric" style={peakViewers!=null?{background:"rgba(240,168,48,.07)",border:"1px solid rgba(240,168,48,.2)"}:{}}>
            <div className="mob-mval" style={peakViewers!=null?{color:"#f0a830"}:{}}>{peakViewers!=null?peakViewers.toLocaleString("es"):"—"}</div>
            <div className="mob-mlbl" style={peakViewers!=null?{color:"rgba(240,168,48,.7)"}:{}}>Peak</div>
          </div>
          <div className="mob-metric">
            <div className="mob-mval">{followers!=null?followers.toLocaleString("es"):"—"}</div>
            <div className="mob-mlbl">Seguidores</div>
          </div>
        </div>

        {/* EMBED MOBILE */}
        {isLive && (
          <div className="mob-embed-section">
            <div className="mob-embed-lbl"><span className="cmp-live-dot"/>En vivo · {currentViewers?.toLocaleString("es")} viewers</div>
            <div className="cmp-embed-wrap">
              <iframe src={`https://chaturbate.com/embed/${username}/?tour=LQps&campaign=rI8z3&bgcolor=0f1014&disable_sound=0&mobileRedirect=never`}
                className="cmp-embed-frame" allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen frameBorder="0" scrolling="no" referrerPolicy="no-referrer-when-downgrade"
                title={`${name} en vivo en Chaturbate`}/>
            </div>
            <p className="mob-embed-note">Al ver el stream en CampulseHub, apoyas a {name} directamente.</p>
          </div>
        )}

        {/* SPARKLINE */}
        {sparkData.length>=2 && (
          <div className="mob-section">
            <div className="mob-sec-title">Viewers últimos 30 días</div>
            <div className="mob-spark-wrap">
              <Sparkline data={sparkData}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:".375rem"}}>
                <span style={{fontSize:".625rem",color:"var(--txt3)"}}>hace 30 días</span>
                {peakViewers!=null && <span style={{fontSize:".6875rem",color:"var(--neon)",fontWeight:700}}>Máx: {peakViewers.toLocaleString("es")}</span>}
              </div>
            </div>
          </div>
        )}

        {/* MEJORES HORARIOS */}
        {bestHours.length>0 && (
          <div className="mob-section">
            <div className="mob-sec-title">Mejores horarios (EST)</div>
            {bestHours.slice(0,5).map((h,i)=>{
              const pct = Math.round((Math.round(h.avg_viewers)/maxHourViewers)*100);
              return (
                <div key={i} className="mob-hour">
                  <div className="mob-hour-badge">{days[h.day_of_week]} {String(h.hour_est??0).padStart(2,"0")}:00</div>
                  <div className="mob-hour-bar-wrap"><div className="mob-hour-fill" style={{width:`${pct}%`}}/></div>
                  <div className="mob-hour-val">{Math.round(h.avg_viewers).toLocaleString("es")}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA INLINE — 2do punto de conversión */}
        <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer"
          className={isLive?"mob-cta-inline":"mob-cta-inline-off"}>
          <div className="mob-cta-il-title" style={{color:isLive?"var(--hot)":"var(--neon)"}}>
            {isLive
              ? `${name} está en vivo — ${currentViewers?.toLocaleString("es")} viewers`
              : `Visita la sala de ${name} en Chaturbate`}
          </div>
          <div className="mob-cta-il-sub">
            {isLive ? "Entra ahora · Gratis" : `Peak: ${peakViewers!=null?peakViewers.toLocaleString("es")+" viewers · ":""}chaturbate.com`}
          </div>
        </a>

        {/* HISTORIAL */}
        {history.length>0 && (
          <div className="mob-section">
            <div className="mob-sec-title">Historial reciente</div>
            {history.slice(-12).reverse().map((r,i)=>{
              const pct = histMax>0 ? ((r.num_users??0)/histMax)*100 : 0;
              return (
                <div key={i} className="mob-hist">
                  <div className="mob-hist-date">{fmtDate(r.captured_at)}</div>
                  <div className="mob-hist-bar"><div className="mob-hist-fill" style={{width:`${pct}%`}}/></div>
                  <div className="mob-hist-val">{(r.num_users??0).toLocaleString("es")}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODELOS SIMILARES */}
        {similarModels.length>0 && (
          <div className="mob-section">
            <div className="mob-sec-title">{countryName?`Más de ${countryName} en vivo`:"Modelos similares"}</div>
            <div className="mob-similar-scroll">
              {similarModels.map((m,i)=>(
                <a key={m.username} href={`/model/${m.username}`} className="mob-sim-card">
                  <div className="mob-sim-avatar" style={{background:gradients[i%gradients.length]}}>
                    {(m.display_name||m.username)[0].toUpperCase()}
                  </div>
                  <div className="mob-sim-name">{m.display_name||m.username}</div>
                  <div className="mob-sim-viewers">{(m.num_users??0).toLocaleString("es")} viewers</div>
                </a>
              ))}
            </div>
            {countryCode && (
              <div style={{textAlign:"center",marginTop:".875rem"}}>
                <a href={`/country/${countryCode.toLowerCase()}`} style={{color:"var(--neon)",fontSize:".8125rem",fontWeight:600,textDecoration:"none"}}>
                  Ver todas las modelos de {countryName} →
                </a>
              </div>
            )}
          </div>
        )}

        {/* SEO */}
        <div className="mob-seo">
          <h2 style={{fontSize:".9375rem",fontWeight:700,marginBottom:".5rem",color:"var(--txt)"}}>Estadísticas de {name} en Chaturbate</h2>
          <p style={{color:"var(--txt2)",fontSize:".8125rem",lineHeight:1.6}}>
            CampulseHub rastrea en tiempo real las estadísticas de {name} en Chaturbate.{countryName?` Modelo de ${countryName}.`:""}{" "}
            {peakViewers!=null?`Pico de ${peakViewers.toLocaleString("es")} viewers en los últimos 30 días. `:""}
            {topHour?`Mejor horario: ${["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][topHour.day_of_week]} a las ${String(topHour.hour_est??0).padStart(2,"00")}:00 EST. `:""}
            Datos actualizados cada 2 horas.
          </p>
        </div>

        {/* FOOTER MOBILE */}
        <div className="mob-footer">
          {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`}>{flag} Ver más modelos de {countryName} →</a>}
          {langSlug && <a href={`/language/${langSlug}`}>Ver modelos en {langName} →</a>}
          <a href="/app.html">← Volver al inicio</a>
        </div>

      </div>{/* fin #mob-layout */}

      {/* DESKTOP LAYOUT */}
      <div className="cmp-page">
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-nav-link">{flag} {countryName}</a>}
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>
        <nav className="cmp-bc">
          <a href="/app.html">CampulseHub</a>
          {countryName && countryCode && (<><span className="cmp-bc-sep">›</span><a href={`/country/${countryCode.toLowerCase()}`}>{flag} {countryName}</a></>)}
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>{name}</span>
        </nav>
        <div className="cmp-page-header" style={{borderBottom:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"1rem",flexWrap:"wrap"}}>
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
        <div className="cmp-metrics">
          {[["Viewers ahora",currentViewers],["Seguidores",followers],["Peak viewers",peakViewers],["Snapshots",snapCount||null]].map(([label,val])=>(
            <div key={label} className="cmp-metric">
              <div className="cmp-mval">{val!=null ? val.toLocaleString("es") : "—"}</div>
              <div className="cmp-mlbl">{label}</div>
            </div>
          ))}
        </div>
        {sparkData.length>=2 && (
          <div className="cmp-spark">
            <div className="cmp-spark-header">
              <span className="cmp-spark-lbl">Viewers últimos 30 días</span>
              {peakViewers!=null && <span className="cmp-spark-peak">Máx: {peakViewers.toLocaleString("es")}</span>}
            </div>
            <Sparkline data={sparkData}/>
          </div>
        )}
        <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className={isLive?"cmp-cta-live":"cmp-cta"}>
          {isLive
            ? `🔴 Ver en vivo — ${currentViewers?.toLocaleString("es")} viewers ahora`
            : "Ver sala en Chaturbate →"}
        </a>
        {isLive && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:".75rem"}}>
              <span className="cmp-live-dot"/>
              <span style={{fontSize:".8125rem",color:"var(--txt2)",fontWeight:600}}>En vivo ahora · {currentViewers?.toLocaleString("es")} viewers</span>
            </div>
            <div className="cmp-embed-wrap">
              <iframe src={`https://chaturbate.com/embed/${username}/?tour=LQps&campaign=rI8z3&bgcolor=0f1014&disable_sound=0&mobileRedirect=never`}
                className="cmp-embed-frame" allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen frameBorder="0" scrolling="no" referrerPolicy="no-referrer-when-downgrade"
                title={`${name} en vivo en Chaturbate`}/>
            </div>
            <p className="cmp-embed-note">Al ver el stream en CampulseHub, apoyas a {name} directamente.</p>
          </div>
        )}
        {bestHours.length>0 && (<>
          <div className="cmp-sec">Mejores horarios (EST)</div>
          {bestHours.slice(0,5).map((h,i)=>(
            <div key={i} className="cmp-hour">
              <span className="cmp-hour-time">{days[h.day_of_week]} {String(h.hour_est??0).padStart(2,"0")}:00 EST</span>
              <span className="cmp-hour-val">{Math.round(h.avg_viewers)} viewers</span>
            </div>
          ))}
        </>)}
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
        <div className="cmp-footer-links">
          {countryName && countryCode && <a href={`/country/${countryCode.toLowerCase()}`} className="cmp-footer-link">{flag} Ver más modelos de {countryName} →</a>}
          {langSlug && <a href={`/language/${langSlug}`} className="cmp-footer-link">🗣 Ver modelos en {langName} →</a>}
          <a href="/app.html" className="cmp-footer-link" style={{marginTop:4}}>← Volver al inicio</a>
        </div>
      </div>
    </>
  );
}
