// pages/_document.js
//
// Mejoras respecto a la versión anterior:
//   · lang="es" — Google usa esto para geolocalizar el contenido
//   · theme-color — colorea la barra del navegador en móvil (Android Chrome)
//   · preconnect a flagcdn — reduce latencia de las imágenes de banderas
//   · Favicon SVG inline — sin archivo extra en /public

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Charset */}
        <meta charSet="utf-8" />

        {/* Branding */}
        <meta name="theme-color" content="#0d0d0d" />
        <meta name="application-name" content="Campulse" />

        {/* Preconnect — acelera banderas de país */}
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />

        {/* Favicon SVG sin archivo extra */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📡</text></svg>"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
