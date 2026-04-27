// api/thumb.js — Proxy server-side para thumbnails de Chaturbate
// Estrategia: usar la API pública de Chaturbate (chaturbate.com, dominio permitido)
// para obtener image_url, luego redirigir al browser con esa URL directamente
// usando una respuesta 302. Si falla, retornar placeholder 1x1.
export const config = { runtime: 'edge' };

const AFF = 'rI8z3';
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get('u') || '').replace(/[^a-zA-Z0-9_]/g, '');

  if (!u) {
    return gifFallback();
  }

  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

  // Usar la misma API que rooms.js (chaturbate.com está en allowlist)
  const apiUrl = `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=1&keywords=${encodeURIComponent(u)}`;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': ua,
        'Accept': 'application/json',
        'Referer': 'https://chaturbate.com/',
        'Origin': 'https://chaturbate.com',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      }
    });
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      // Buscar el username exacto (puede haber matches parciales)
      const room = results.find(r => r.username === u) || results[0];

      if (room?.image_url) {
        // Redirigir al browser directamente con la URL del CDN
        // (el browser no tiene referer bloqueado para esta URL específica
        // ya que viene de una redirección 302, no de un img src directo)
        return new Response(null, {
          status: 302,
          headers: {
            'Location': room.image_url,
            'Cache-Control': 'public, max-age=20, s-maxage=20',
            'Access-Control-Allow-Origin': '*',
            'X-Thumb-Src': 'chaturbate-api',
            'X-Room': room.username,
          }
        });
      }
    }
  } catch (_) {
    // timeout o error de red
  }

  // Fallback: 1x1 GIF transparente — el browser nunca muestra ícono roto
  return gifFallback();
}

function gifFallback() {
  const blank = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const buf = Uint8Array.from(atob(blank), c => c.charCodeAt(0));
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'X-Thumb-Status': 'fallback',
    },
  });
}
