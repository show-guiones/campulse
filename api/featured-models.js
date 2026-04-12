export const config = { runtime: 'edge' };

export default async function handler(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado: faltan SUPABASE_URL o SUPABASE_KEY' }), { status: 500, headers });
  }

  // CRITICAL FIX: If ADMIN_SECRET is not set, return 500 (config error) not 401 (auth error)
  if (!ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Panel no configurado: falta ADMIN_SECRET en Vercel' }), { status: 503, headers });
  }

  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === '1';

    let sbFilter = 'active=eq.true';
    if (all) {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      if (token !== ADMIN_SECRET) {
        return new Response(JSON.stringify({ error: 'Clave incorrecta' }), { status: 401, headers });
      }
      sbFilter = '';
    }

    const filterStr = sbFilter ? `${sbFilter}&` : '';
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/featured_models?${filterStr}order=position.asc&select=username,position,label,active`,
      { headers: sbHeaders }
    );
    const data = await res.json();
    const cacheHeader = all ? 'no-store' : 's-maxage=60, stale-while-revalidate=30';
    return new Response(JSON.stringify(data), {
      headers: { ...headers, 'Cache-Control': cacheHeader }
    });
  }

  // Write operations - verify auth
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (token !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const { username, position, label } = body;
    if (!username) return new Response(JSON.stringify({ error: 'username requerido' }), { status: 400, headers });

    let pos = position;
    if (!pos) {
      const countRes = await fetch(`${SUPABASE_URL}/rest/v1/featured_models?active=eq.true&select=position&order=position.desc&limit=1`, { headers: sbHeaders });
      const countData = await countRes.json();
      pos = countData.length > 0 ? (countData[0].position + 1) : 1;
    }

    const r = await fetch(`${SUPABASE_URL}/rest/v1/featured_models`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ username, position: pos, label: label || 'VIP', active: true }),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok) return new Response(JSON.stringify({ error: d?.message || `Error ${r.status}` }), { status: r.status, headers });
    return new Response(JSON.stringify(d), { headers });
  }

  if (req.method === 'PUT') {
    const url = new URL(req.url);
    const username = url.searchParams.get('username');
    if (!username) return new Response(JSON.stringify({ error: 'username requerido' }), { status: 400, headers });
    const body = await req.json();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/featured_models?username=eq.${encodeURIComponent(username)}`, {
      method: 'PATCH',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok) return new Response(JSON.stringify({ error: d?.message || `Error ${r.status}` }), { status: r.status, headers });
    return new Response(JSON.stringify(d), { headers });
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const username = url.searchParams.get('username');
    if (!username) return new Response(JSON.stringify({ error: 'username requerido' }), { status: 400, headers });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/featured_models?username=eq.${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers: sbHeaders,
    });
    if (!r.ok) return new Response(JSON.stringify({ error: `Error ${r.status}` }), { status: r.status, headers });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
