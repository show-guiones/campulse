export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const offset   = parseInt(searchParams.get('offset') || '0', 10);
  const AFF = 'rI8z3';

  // Si viene username, buscar esa sala específica (sin offset — búsqueda puntual)
  const url = username
    ? `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=500&keywords=${encodeURIComponent(username)}`
    : `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=500&offset=${offset}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://chaturbate.com/',
      }
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=30, stale-while-revalidate=15',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, results: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
