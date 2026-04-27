// pages/language/index.js — Redesign con design system app.html

import Head from "next/head";
import { DS_CSS, Logo, BottomNav } from "../../campulse-design-system";

const SITE = "https://www.campulsehub.com";

const LANGUAGES = [
  { slug:"spanish",    name:"Español",    flag:"🇪🇸", desc:"Modelos hispanohablantes" },
  { slug:"english",    name:"English",    flag:"🇬🇧", desc:"English-speaking models" },
  { slug:"portuguese", name:"Português",  flag:"🇧🇷", desc:"Modelos que falam português" },
  { slug:"romanian",   name:"Română",     flag:"🇷🇴", desc:"Modele vorbitoare de română" },
  { slug:"russian",    name:"Русский",    flag:"🇷🇺", desc:"Русскоязычные модели" },
  { slug:"german",     name:"Deutsch",    flag:"🇩🇪", desc:"Deutschsprachige Models" },
  { slug:"french",     name:"Français",   flag:"🇫🇷", desc:"Modèles francophones" },
  { slug:"italian",    name:"Italiano",   flag:"🇮🇹", desc:"Modelle italiane" },
];

export default function LanguageIndex() {
  const pageTitle = "Modelos de Chaturbate por Idioma | CampulseHub";
  const pageDescription = "Encuentra modelos de Chaturbate por idioma: español, inglés, portugués, rumano y más. Estadísticas en tiempo real actualizadas cada 2 horas.";
  const schema = {
    "@context":"https://schema.org","@type":"CollectionPage",name:pageTitle,description:pageDescription,url:`${SITE}/language`,
    breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"CampulseHub",item:SITE},{"@type":"ListItem",position:2,name:"Idiomas",item:`${SITE}/language`}]},
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href={`${SITE}/language`}/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={pageTitle}/>
        <meta name="twitter:description" content={pageDescription}/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={`${SITE}/language`}/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
        <style>{DS_CSS}</style>
      </Head>

      <div className="cmp-page cmp-page-body">
        <nav className="cmp-nav">
          <Logo/>
          <div className="cmp-nav-links">
            <a href="/country" className="cmp-nav-link">Países</a>
            <a href="/gender" className="cmp-nav-link">Géneros</a>
            <a href="/search" className="cmp-nav-link">Buscar</a>
          </div>
        </nav>

        <nav className="cmp-bc">
          <a href="/app.html" style={{display:"inline-flex",alignItems:"center",gap:"0",fontWeight:800,letterSpacing:"-.5px",textDecoration:"none",color:"#fff"}}>Campulse<span style={{color:"#c084fc"}}>Hub</span></a>
          <span className="cmp-bc-sep">›</span>
          <span style={{color:"var(--txt2)"}}>Idiomas</span>
        </nav>

        <div className="cmp-page-header">
          <h1 className="cmp-page-h1">Modelos por Idioma</h1>
          <p className="cmp-page-sub">Encuentra modelos de Chaturbate según el idioma que hablan.</p>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,220px),1fr))",
          gap:12,
          marginTop:"1.5rem"
        }}>
          {LANGUAGES.map(l=>(
            <a key={l.slug} href={`/language/${l.slug}`}
              style={{background:"var(--surf)",borderRadius:14,padding:"1.125rem 1rem",display:"flex",alignItems:"center",gap:".75rem",border:"1px solid var(--bdr)",transition:"border-color .2s,background .15s,transform .15s",textDecoration:"none",minWidth:0}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(56,182,212,.3)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";e.currentTarget.style.transform=""}}>
              <span style={{fontSize:"1.75rem",flexShrink:0,lineHeight:1}}>{l.flag}</span>
              <div style={{minWidth:0,overflow:"hidden"}}>
                <div style={{fontWeight:700,fontSize:"1rem",color:"var(--txt)",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}</div>
                <div style={{fontSize:".775rem",color:"var(--txt2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.desc}</div>
              </div>
            </a>
          ))}
        </div>

        <div className="cmp-footer-links">
          <a href="/country" className="cmp-footer-link">Ver por país →</a>
          <a href="/gender" className="cmp-footer-link">Ver por género →</a>
        </div>
        <BottomNav active="/language" />
      </div>
    </>
  );
}
