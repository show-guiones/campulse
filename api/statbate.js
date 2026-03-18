export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const platform = searchParams.get('platform') || 'chaturbate';

  if (!username) {
    return new Response(JSON.stringify({ error: 'username requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const res = await fetch(`https://statbate.com/${platform}/list/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://statbate.com/',
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ income: null }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const html = await res.text();

    // Buscar la fila con el username en el HTML de Statbate
    const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `/${escaped}['\"\\s][^>]*>[^<]+<\\/a><\\/td>[\\s\\S]{0,400}?<td>([\\$\\d.,]+)<\\/td>`,
      'i'
    );
    const m = re.exec(html);

    return new Response(JSON.stringify({ income: m ? m[1] : null }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ income: null, error: e.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
