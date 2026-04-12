export const config = { runtime: 'edge' };

const AFF = 'rI8z3';
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return new Response(JSON.stringify({ online: false, error: 'username requerido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
  const headers = {
    'User-Agent': ua,
    'Accept': 'application/json',
    'Referer': 'https://chaturbate.com/',
    'Origin': 'https://chaturbate.com',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  };

  // Estrategia: paginar la API de afiliados en bloques de 500 buscando el username exacto.
  // Máximo 3 páginas (1500 salas) para no exceder el timeout de Edge (10s).
  // La mayoría de modelos activas aparecen en las primeras 1500 salas ordenadas por viewers.
  const maxPages = 3;

  try {
    for (let page = 0; page < maxPages; page++) {
      const offset = page * 500;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(
        `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=500&offset=${offset}`,
        { signal: controller.signal, headers }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        return new Response(JSON.stringify({ online: false, status: res.status }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
        });
      }

      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      // Buscar username exacto en esta página
      const match = results.find(r => r.username === username);
      if (match) {
        return new Response(
          JSON.stringify({ online: true, num_users: match.num_users ?? 0, status: match.current_show || 'public' }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
        );
      }

      // Si la página tiene menos de 500 resultados, no hay más páginas
      if (results.length < 500) break;
    }

    // No encontrada en ninguna página = offline
    return new Response(
      JSON.stringify({ online: false, num_users: 0 }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ online: false, error: e.name === 'AbortError' ? 'timeout' : e.message }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
    );
  }
}
