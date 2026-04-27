// pages/404.jsx
//
// Página de error 404 personalizada.
// Next.js la sirve automáticamente para cualquier ruta no encontrada.
// Mantiene el diseño oscuro de Campulse y ofrece links de navegación útiles.

import Head from "next/head";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Página no encontrada | Campulse</title>
        <meta name="description" content="Esta página no existe en Campulse." />
        <meta name="robots" content="noindex" />
      </Head>

      <main style={styles.main}>
        <div style={styles.code}>404</div>
        <h1 style={styles.h1}>Modelo o página no encontrada</h1>
        <p style={styles.sub}>
          Puede que el username haya cambiado, o que la página nunca haya existido.
        </p>

        <div style={styles.links}>
          <a href="/" style={styles.primary}>← Volver al inicio</a>
          <a href="/search" style={styles.secondary}>🔍 Buscar modelo</a>
        </div>

        <div style={styles.cats}>
          <a href="/gender/female" style={styles.pill}>♀ Chicas</a>
          <a href="/gender/male"   style={styles.pill}>♂ Chicos</a>
          <a href="/country/co"    style={styles.pill}>🇨🇴 Colombia</a>
          <a href="/country/es"    style={styles.pill}>🇪🇸 España</a>
          <a href="/language/spanish" style={styles.pill}>🗣 Español</a>
          <a href="/tag/latina"    style={styles.pill}>#latina</a>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    fontFamily: "sans-serif",
    maxWidth: 600,
    margin: "0 auto",
    padding: "6rem 1.5rem 4rem",
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#f0f0f0",
    textAlign: "center",
  },
  code: {
    fontSize: 96,
    fontWeight: 900,
    color: "#1a1a2e",
    lineHeight: 1,
    marginBottom: 16,
    letterSpacing: -4,
  },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 12 },
  sub: { fontSize: 15, color: "#666", marginBottom: 40 },
  links: { display: "flex", gap: 12, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" },
  primary: {
    background: "#a78bfa",
    color: "#000",
    padding: "12px 24px",
    borderRadius: 10,
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 15,
  },
  secondary: {
    background: "#1a1a2e",
    color: "#a78bfa",
    padding: "12px 24px",
    borderRadius: 10,
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 15,
  },
  cats: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  pill: {
    background: "#1a1a2e",
    borderRadius: 20,
    padding: "8px 16px",
    textDecoration: "none",
    color: "#a78bfa",
    fontSize: 13,
  },
};
