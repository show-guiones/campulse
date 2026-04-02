// api/hls-proxy.js
// Obtiene la URL de stream de Chaturbate via affiliates API (misma que rooms.js).
// La affiliates API devuelve iframe_embed_url y chat_room_url_revshare
// que son embed URLs válidos para afiliados — permitidos en iframes externos.

export const config = { runtime: 'edge' };

const AFF = 'rI8z3';
const UA  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get('username') || '').trim().toLowerCase();

  if (!username || !/^[a-z0-9_]{3,60}$/.test(username)) {
    return json({ error: 'invalid_username' }, 400);
  }

  // Estrategia 1: affiliates API — misma que usa rooms.js y que YA FUNCIONA
  try {
    const affUrl = `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=1&keywords=${encodeURIComponent(username)}`;

    const affRes = await fetch(affUrl, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://chaturbate.com/',
        'Origin': 'https://chaturbate.com',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
    });

    if (affRes.ok) {
      const data = await affRes.json();
      const room = (data.results || []).find(r => r.username === username);

      if (room) {
        // Devolver el embed URL de afiliado + debug de todos los campos de URL disponibles
        const embedUrl = room.iframe_embed_url
          || room.chat_room_url_revshare
          || `https://chaturbate.com/in/?tour=dT8X&campaign=${AFF}&room=${username}&autoplay=1&mobileRedirect=never`;

        return json({
          success: true,
          type: 'embed',
          url: embedUrl,
          room_status: room.current_show || 'public',
          _debug: {
            iframe_embed_url: room.iframe_embed_url || null,
            chat_room_url: room.chat_room_url || null,
            chat_room_url_revshare: room.chat_room_url_revshare || null,
          }
        });
      } else {
        return json({ success: false, room_status: 'offline', total: data.count });
      }
    } else {
      return json({ success: false, error: `aff_http_${affRes.status}` });
    }
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
