// api/hls-proxy.js
// Proxy para obtener la URL HLS (.m3u8) de Chaturbate sin iframe.
// Estrategia 1: /api/chatvideocontext/ (sin CSRF, más directo)
// Estrategia 2: /get_edge_hls_url_ajax/ con CSRF token extraído de la página

export const config = { runtime: 'edge' };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const HEADERS_BASE = {
  'User-Agent': UA,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': '*/*',
};

function extractCookie(setCookieArr, name) {
  for (const line of setCookieArr) {
    const match = line.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get('username') || '').trim().toLowerCase();

  if (!username || !/^[a-z0-9_]{3,60}$/.test(username)) {
    return json({ error: 'invalid_username' }, 400);
  }

  // ── Estrategia 1: GET a la página del modelo — extraer CSRF de cookies ──
  // Chaturbate devuelve csrftoken en Set-Cookie en el primer GET, sin necesitar leer el body
  try {
    const pageRes = await fetch(`https://chaturbate.com/${username}/`, {
      headers: {
        ...HEADERS_BASE,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    const setCookies = pageRes.headers.getSetCookie
      ? pageRes.headers.getSetCookie()
      : [pageRes.headers.get('set-cookie') || ''];

    let csrfToken = extractCookie(setCookies, 'csrftoken');

    // Si no vino en Set-Cookie, leer solo los primeros 8KB del body (más eficiente)
    if (!csrfToken) {
      const reader = pageRes.body.getReader();
      let chunk = '';
      let done = false;
      while (!done && chunk.length < 8000) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) chunk += new TextDecoder().decode(value);
      }
      reader.cancel();
      const m = chunk.match(/csrftoken['":\s]+([a-zA-Z0-9]{20,64})/);
      if (m) csrfToken = m[1];
    }

    if (!csrfToken) {
      return json({ success: false, error: 'no_csrf_in_page' });
    }

    // ── POST con el CSRF obtenido ──
    const postRes = await fetch('https://chaturbate.com/get_edge_hls_url_ajax/', {
      method: 'POST',
      headers: {
        ...HEADERS_BASE,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': csrfToken,
        'Referer': `https://chaturbate.com/${username}/`,
        'Origin': 'https://chaturbate.com',
        'Cookie': `csrftoken=${csrfToken}`,
      },
      body: `room_slug=${username}&bandwidth=high&csrfmiddlewaretoken=${csrfToken}`,
    });

    if (!postRes.ok) {
      return json({ success: false, error: `cb_http_${postRes.status}` }, 502);
    }

    const data = await postRes.json();
    return json({ ...data, _csrf: csrfToken.slice(0, 6) + '...' }); // debug parcial

  } catch (err) {
    return json({ success: false, error: 'proxy_error', message: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

