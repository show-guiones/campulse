// pages/search.jsx — Redesign con design system app.html

import Head from "next/head";
import { useState } from "react";
import { DS_CSS, Logo, BottomNav } from "../campulse-design-system";

const SITE = "https://www.campulsehub.com";

const COUNTRY_FLAGS = {
  CO:"🇨🇴",ES:"🇪🇸",MX:"🇲🇽",AR:"🇦🇷",BR:"🇧🇷",US:"🇺🇸",
  RO:"🇷🇴",RU:"🇷🇺",DE:"🇩🇪",FR:"🇫🇷",GB:"🇬🇧",CL:"🇨🇱",
  PE:"🇵🇪",VE:"🇻🇪",PH:"🇵🇭",UA:"🇺🇦",HU:"🇭🇺",PL:"🇵🇱",
};

const GENDER_LABELS = { f:"Mujer",m:"Hombre",c:"Pareja",t:"Trans" };
const GENDER_COLORS = { f:"var(--female)",m:"var(--male)",c:"var(--couple)",t:"var(--trans)" };

export default function SearchPage() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await r.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const title = "Buscar modelos de Chaturbate | Campulse";
  const description = "Busca modelos de Chaturbate por nombre de usuario. Estadísticas en tiempo real: viewers, seguidores y mejores horarios.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/search`}/>
        <meta property="og:title" content={title}/>
        <meta property="og:description" content={description}/>
        <meta property="og:url" content={`${SITE}/search`}/>
        <meta property="og:site_name" content="Campulse"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <style>{DS_CSS}</style>
      </Head>

      <div className="cmp-page cmp-page-body">
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/top/latinas" className="cmp-nav-link">🔥 Top Latinas</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/">Campulse</a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>Buscar</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">Buscar modelos</h1>
          <p className="cmp-page-sub">Encuentra modelos de Chaturbate por nombre de usuario</p>
        </div>

        <form onSubmit={handleSearch} className="cmp-search-form">
          <input
            type="text"
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder="Escribe un username..."
            className="cmp-search-input"
            autoFocus
          />
          <button type="submit" className="cmp-search-btn" disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {searched && !loading && results.length===0 && (
          <p style={{color:"var(--txt3)",textAlign:"center",padding:"2rem 0",fontSize:".875rem"}}>
            No se encontraron modelos con ese nombre.
          </p>
        )}

        {results.length>0 && (
          <>
            <div style={{fontSize:".8rem",color:"var(--txt3)",marginBottom:"1rem"}}>{results.length} resultado{results.length!==1?"s":""} para <strong style={{color:"var(--txt2)"}}>{query}</strong></div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {results.map(m=>{
                const gc = GENDER_COLORS[m.gender]||"var(--txt2)";
                return (
                  <a key={m.username} href={`/model/${m.username}`}
                    style={{display:"flex",alignItems:"center",gap:14,background:"var(--surf)",borderRadius:"var(--radius)",padding:"14px 18px",border:"1px solid var(--bdr)",transition:"border-color .2s,background .15s",textDecoration:"none"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,182,212,.3)";e.currentTarget.style.background="rgba(56,182,212,.04)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.background="var(--surf)"}}>
                    {/* Avatar initials */}
                    <div style={{width:42,height:42,borderRadius:10,background:"rgba(56,182,212,.1)",border:"1px solid rgba(56,182,212,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",fontWeight:800,color:"var(--neon)",flexShrink:0}}>
                      {((m.display_name||m.username)[0]||"?").toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:".9375rem",color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.display_name||m.username}</div>
                      <div style={{fontSize:".75rem",color:"var(--txt3)",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span>@{m.username}</span>
                        {m.country && <span>{COUNTRY_FLAGS[m.country]||""} {m.country}</span>}
                        {m.gender && GENDER_LABELS[m.gender] && <span style={{color:gc}}>{GENDER_LABELS[m.gender]}</span>}
                      </div>
                    </div>
                    {m.num_users>0 && (
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontWeight:700,color:"var(--neon)",fontSize:"1rem"}}>{m.num_users.toLocaleString("es")}</div>
                        <div style={{fontSize:".65rem",color:"var(--txt3)"}}>viewers</div>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          </>
        )}

        {/* No search yet — show quick links */}
        {!searched && (
          <div style={{marginTop:"2rem"}}>
            <div className="cmp-sec">Explora por categoría</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
              {[
                {href:"/top/latinas",label:"🌶️ Top Latinas"},
                {href:"/country/co",label:"🇨🇴 Colombia"},
                {href:"/country/es",label:"🇪🇸 España"},
                {href:"/country/mx",label:"🇲🇽 México"},
                {href:"/gender/female",label:"♀️ Chicas"},
                {href:"/language/spanish",label:"🗣 Español"},
              ].map(l=>(
                <a key={l.href} href={l.href}
                  style={{background:"var(--surf)",border:"1px solid var(--bdr)",borderRadius:"var(--radius)",padding:".875rem 1rem",textDecoration:"none",color:"var(--txt2)",fontWeight:500,fontSize:".875rem",transition:"border-color .2s,color .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,182,212,.3)";e.currentTarget.style.color="var(--neon)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.color="var(--txt2)"}}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="cmp-footer-links">
          <a href="/" className="cmp-footer-link">← Volver al inicio</a>
        </div>
        <BottomNav active="/search" />
      </div>
    </>
  );
}
