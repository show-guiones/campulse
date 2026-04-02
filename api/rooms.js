export const config = { runtime: 'edge' };

const AFF = 'rI8z3';

// User-Agents rotativos para reducir bloqueos de Chaturbate
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const offset   = parseInt(searchParams.get('offset') || '0', 10);
  const limit    = parseInt(searchParams.get('limit')  || '500', 10);

  // Seleccionar User-Agent aleatorio del pool
  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

  const cbUrl = username
    ? `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=${limit}&keywords=${encodeURIComponent(username)}`
    : `https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=${AFF}&client_ip=request_ip&format=json&limit=${limit}&offset=${offset}`;

  // Timeout de 8 segundos para evitar que Vercel cuelgue
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(cbUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': ua,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://chaturbate.com/',
        'Origin': 'https://chaturbate.com',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      }
    });

    clearTimeout(timeoutId);

    // Si Chaturbate devuelve 4xx/5xx, retornar error útil para debug
    if (!res.ok) {
      console.error(`[rooms] Chaturbate HTTP ${res.status} para offset=${offset}`);
      return new Response(
        JSON.stringify({
          error: `Chaturbate devolvió HTTP ${res.status}`,
          results: [],
          count: 0,
          _debug: { status: res.status, offset, limit }
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          }
        }
      );
    }

    const data = await res.json();

    // Validar que la respuesta tenga el formato esperado
    const results = Array.isArray(data?.results) ? data.results : [];

    // Si Chaturbate devuelve 0 resultados siendo la primera página, es sospechoso
    if (results.length === 0 && offset === 0 && !username) {
      console.warn('[rooms] Chaturbate devolvió 0 resultados en offset=0 — posible bloqueo');
    }

    return new Response(
      JSON.stringify({ ...data, results }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          // Cache agresivo: Vercel CDN sirve la respuesta en cache durante 60s
          // Esto reduce la cantidad de requests directos a Chaturbate
          'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
          'X-Results-Count': String(results.length),
        }
      }
    );

  } catch (e) {
    clearTimeout(timeoutId);
    const isTimeout = e.name === 'AbortError';
    console.error(`[rooms] ${isTimeout ? 'TIMEOUT' : 'ERROR'}: ${e.message}`);

    return new Response(
      JSON.stringify({
        error: isTimeout ? 'Timeout: Chaturbate tardó más de 8s' : e.message,
        results: [],
        count: 0,
        _debug: { offset, limit, errorType: isTimeout ? 'timeout' : 'fetch_error' }
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        }
      }
    );
  }
}
