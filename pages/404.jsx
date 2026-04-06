// pages/404.jsx — Campulse design system, logo a /app.html
import Head from "next/head";
import { DS_CSS, Logo } from "../campulse-design-system";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Página no encontrada | Campulse</title>
        <meta name="description" content="Esta página no existe en Campulse." />
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
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
        <div style={{textAlign:"center",padding:"5rem 1rem 3rem"}}>
          <div style={{fontSize:"6rem",fontWeight:900,background:"linear-gradient(135deg,var(--hot),var(--purple))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",lineHeight:1,marginBottom:"1rem",letterSpacing:-4}}>404</div>
          <h1 style={{fontSize:"1.5rem",fontWeight:800,marginBottom:".75rem",color:"var(--txt)"}}>Modelo o página no encontrada</h1>
          <p style={{color:"var(--txt2)",fontSize:".9375rem",marginBottom:"2.5rem",lineHeight:1.6}}>Puede que el username haya cambiado, o que la página nunca haya existido.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:"2rem",flexWrap:"wrap"}}>
            <a href="/app.html" style={{background:"var(--hot)",color:"#fff",padding:"12px 24px",borderRadius:"var(--radius)",fontWeight:700,textDecoration:"none",fontSize:".9375rem"}}>← Volver al inicio</a>
            <a href="/search" style={{background:"var(--surf)",color:"var(--neon)",padding:"12px 24px",borderRadius:"var(--radius)",fontWeight:600,textDecoration:"none",fontSize:".9375rem",border:"1px solid var(--bdr2)"}}>🔍 Buscar modelo</a>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {[{href:"/gender/female",l:"♀ Chicas"},{href:"/gender/male",l:"♂ Chicos"},{href:"/country/co",l:"🇨🇴 Colombia"},{href:"/country/es",l:"🇪🇸 España"},{href:"/language/spanish",l:"🗣 Español"},{href:"/tag/latina",l:"#latina"}].map(x=>(<a key={x.href} href={x.href} className="cmp-tag-link">{x.l}</a>))}
          </div>
        </div>
      </div>
    </>
  );
}
