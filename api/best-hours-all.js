export const config = { runtime: 'edge' };

export default async function handler(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Traer solo username y avg_viewers de toda la tabla
  // Limitado a 10.000 filas — suficiente para cubrir todas las modelos activas
  const url = `${SUPABASE_URL}/rest/v1/best_hours` +
    `?select=username,avg_viewers` +
    `&limit=10000`;

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // Cache 30 minutos — los promedios no cambian muy frecuentemente
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=300',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
