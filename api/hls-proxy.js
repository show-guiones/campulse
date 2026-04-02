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

  // ── Estrategia 1: chatvideocontext API (no requiere CSRF) ──
  try {
    const ctxRes = await fetch(`https://chaturbate.com/api/chatvideocontext/${username}/`, {
      headers: {
        ...HEADERS_BASE,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://chaturbate.com/${username}/`,
      },
    });

    if (ctxRes.ok) {
      const data = await ctxRes.json();
      if (data.hls_source && data.room_status === 'public') {
        return json({ success: true, url: data.hls_source, room_status: 'public' });
      }
      if (data.room_status) {
        return json({ success: false, room_status: data.room_status });
      }
    }
  } catch (_) { /* continúa */ }

  // ── Estrategia 2: get_edge_hls_url_ajax con CSRF ──
  try {
    // GET a la página del modelo para obtener csrftoken
    const pageRes = await fetch(`https://chaturbate.com/${username}/`, {
      headers: { ...HEADERS_BASE, 'Accept': 'text/html,application/xhtml+xml' },
    });

    const setCookies = pageRes.headers.getSetCookie
      ? pageRes.headers.getSetCookie()
      : [pageRes.headers.get('set-cookie') || ''];

    let csrfToken = extractCookie(setCookies, 'csrftoken');

    if (!csrfToken) {
      const html = await pageRes.text();
      const m = html.match(/csrftoken['"]\s*:\s*['"]([a-zA-Z0-9]+)['"]/);
      if (m) csrfToken = m[1];
    }

    if (!csrfToken) {
      return json({ success: false, error: 'no_csrf', room_status: 'unknown' });
    }

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
    return json(data);

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

