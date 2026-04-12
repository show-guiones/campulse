export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return new Response(JSON.stringify({ online: false, error: 'username requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    // chaturbate.com/api/chatvideocontext/ es el endpoint que usa el embed oficial
    // Devuelve el estado exacto de una sala por username. Es público y preciso.
    const res = await fetch(
      `https://chaturbate.com/api/chatvideocontext/${encodeURIComponent(username)}/`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'application/json, */*',
          'Referer': 'https://chaturbate.com/',
          'Origin': 'https://chaturbate.com',
        }
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(JSON.stringify({ online: false, status: res.status }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
      });
    }

    const data = await res.json();

    // room_status: "public" = en vivo y pública
    // Otros valores: "private", "hidden", "away", "offline", "password protected"
    const status = data?.room_status || data?.status || '';
    const online = ['public','private','hidden','password protected'].includes(status);
    const num_users = data?.num_users ?? data?.viewers ?? 0;

    return new Response(
      JSON.stringify({ online, status, num_users, username }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store', // sin cache — necesitamos estado real
        }
      }
    );

  } catch (e) {
    clearTimeout(timeout);
    return new Response(
      JSON.stringify({ online: false, error: e.name === 'AbortError' ? 'timeout' : e.message }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
      }
    );
  }
}
