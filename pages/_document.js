// pages/_document.js
//
// Branding completo CampulseHub:
//   · Twitter Card global (summary_large_image)
//   · OG site_name global → "CampulseHub"
//   · WebSite schema con SearchAction → sitelinks search box en Google
//   · Organization schema → Knowledge Panel de Google

import { Html, Head, Main, NextScript } from "next/document";

const SITE = "https://www.campulsehub.com";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CampulseHub",
  alternateName: "Campulse",
  url: SITE,
  description: "Estadísticas en tiempo real de modelos de Chaturbate. Viewers, seguidores, historial y mejores horarios.",
  inLanguage: "es",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CampulseHub",
  url: SITE,
  logo: { "@type": "ImageObject", url: `${SITE}/og-image.png`, width: 1200, height: 630 },
  description: "Dashboard de estadísticas de Chaturbate en tiempo real. Filtra modelos por país, género e idioma.",
};

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />

        {/* ── Branding global ── */}
        <meta name="theme-color" content="#0f1014" />
        <meta name="application-name" content="CampulseHub" />
        <meta name="author" content="CampulseHub" />

        {/* ── Twitter Card global ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@campulsehub" />

        {/* ── OG global fallback ── */}
        <meta property="og:site_name" content="CampulseHub" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="CampulseHub — Estadísticas de Chaturbate en vivo" />

        {/* ── Preconnect ── */}
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="preconnect" href="https://thumb.live.mmcdn.com" />
        <link rel="dns-prefetch" href="https://thumb.live.mmcdn.com" />

        {/* ── Favicon con colores de la marca ── */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230f1014'/><rect width='100' height='100' rx='22' fill='url(%23g)'/><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23e8305a'/><stop offset='100%25' stop-color='%237c5cbf'/></linearGradient></defs><text x='50' y='68' text-anchor='middle' font-family='system-ui,sans-serif' font-size='52' font-weight='900' fill='white'>C</text></svg>"
        />

        {/* ── Schema.org WebSite + Organization ── */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
