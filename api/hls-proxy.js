// api/hls-proxy.js
// Obtiene la URL HLS (.m3u8) real de Chaturbate via get_edge_hls_url_ajax
// Usa Node.js runtime (no Edge) para poder leer cookies y body HTML sin restricciones.

// IMPORTANTE: En vercel.json asegúrate de tener:
// { "functions": { "api/hls-proxy.js": { "runtime": "nodejs20.x" } } }

export const config = { runtime: 'nodejs' };   // Node.js, NO edge

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const AFF = 'rI8z3';

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const username = ((req.query.username) || '').trim().toLowerCase();

  if (!username || !/^[a-z0-9_-]{3,60}$/.test(username)) {
    return res.status(400).json({ error: 'invalid_username' });
  }

  try {
    // ── PASO 1: GET a la página del modelo para obtener cookies + csrftoken ──
    const pageUrl = `https://chaturbate.com/${username}/`;
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!pageRes.ok) {
      return res.status(502).json({ success: false, error: `page_http_${pageRes.status}` });
    }

    // Extraer Set-Cookie para reenviarlos en el POST
    const rawCookies = pageRes.headers.getSetCookie
      ? pageRes.headers.getSetCookie()
      : (pageRes.headers.get('set-cookie') || '').split(/,(?=[^ ])/);

    const cookieStr = rawCookies
      .map(c => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');

    // Extraer csrftoken del cookie
    const csrfMatch = cookieStr.match(/csrftoken=([^;]+)/);
    if (!csrfMatch) {
      // Fallback: buscar en el HTML
      const htmlChunk = await pageRes.text().then(t => t.slice(0, 12000));
      const htmlCsrf = htmlChunk.match(/csrftoken['":\s]+([A-Za-z0-9]{20,64})/);
      if (!htmlCsrf) {
        return res.status(502).json({ success: false, error: 'no_csrf', hint: 'Chaturbate bloqueó el GET o la sala no existe' });
      }
      return await doHlsPost(res, username, htmlCsrf[1], cookieStr, AFF);
    }

    return await doHlsPost(res, username, csrfMatch[1], cookieStr, AFF);

  } catch (err) {
    console.error('[hls-proxy] error:', err.message);
    return res.status(500).json({ success: false, error: 'proxy_error', message: err.message });
  }
}

async function doHlsPost(res, username, csrf, cookieStr, aff) {
  // ── PASO 2: POST al endpoint HLS de Chaturbate ──
  const postUrl = `https://chaturbate.com/${username}/get_edge_hls_url_ajax/`;

  const body = new URLSearchParams({
    csrfmiddlewaretoken: csrf,
    room_slug: username,
    bandwidth: 'high',
  });

  const postRes = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Referer': `https://chaturbate.com/${username}/`,
      'Origin': 'https://chaturbate.com',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrf,
      'Cookie': cookieStr || `csrftoken=${csrf}`,
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    },
    body: body.toString(),
  });

  if (!postRes.ok) {
    return res.status(502).json({ success: false, error: `hls_http_${postRes.status}` });
  }

  const data = await postRes.json();

  // La respuesta tiene: { url: "https://...m3u8", room_status: "public"|"private"|"offline" }
  if (data.url) {
    return res.status(200).json({
      success: true,
      type: 'hls',
      url: data.url,
      room_status: data.room_status || 'public',
    });
  }

  // Si no hay URL, la sala está offline/privada
  return res.status(200).json({
    success: false,
    room_status: data.room_status || 'offline',
    _debug: data,
  });
}
