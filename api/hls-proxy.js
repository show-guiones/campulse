// api/hls-proxy.js
// Proxy para obtener la URL HLS (.m3u8) de un stream de Chaturbate.
// Chaturbate bloquea el POST desde el browser (CORS), pero desde el servidor funciona.
// El .m3u8 en sí tiene CORS abierto y puede reproducirse directamente con hls.js.

export const config = { runtime: 'edge' };

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

export default async function handler(req) {
  // Solo GET desde el cliente — el proxy hace el POST a Chaturbate
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get('username') || '').trim().toLowerCase();

  if (!username || !/^[a-z0-9_]{3,60}$/.test(username)) {
    return new Response(JSON.stringify({ error: 'invalid username' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

  try {
    const cbRes = await fetch('https://chaturbate.com/get_edge_hls_url_ajax/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': ua,
        'Referer': `https://chaturbate.com/${username}/`,
        'Origin': 'https://chaturbate.com',
      },
      body: `room_slug=${username}&bandwidth=high`,
    });

    if (!cbRes.ok) {
      return new Response(JSON.stringify({ error: 'chaturbate_error', status: cbRes.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await cbRes.json();
    // data = { success: true, url: "https://edge...m3u8", room_status: "public" }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // Cache 15s: el .m3u8 URL cambia poco pero no queremos staleness larga
        'Cache-Control': 'public, max-age=15',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'proxy_error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
