export const config = { runtime: 'edge' };

export default async function handler(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const ADMIN_SECRET = process.env.ADMIN_SECRET; // clave para proteger POST/PUT/DELETE

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), { status: 500, headers });
  }

  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  // ─── GET — listar featured activas ordenadas por posición ───────
  if (req.method === 'GET') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/featured_models?active=eq.true&order=position.asc&select=username,position,label`,
      { headers: sbHeaders }
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...headers, 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' }
    });
  }

  // ─── Verificar ADMIN_SECRET para métodos de escritura ──────────
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (ADMIN_SECRET && token !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  // ─── POST — agregar modelo ──────────────────────────────────────
  if (req.method === 'POST') {
    const body = await req.json();
    const { username, position, label } = body;

    if (!username) {
      return new Response(JSON.stringify({ error: 'username requerido' }), { status: 400, headers });
    }

    // Si no se especifica posición, poner al final
    let pos = position;
    if (!pos) {
      const countRes = await fetch(
        `${SUPABASE_URL}/rest/v1/featured_models?active=eq.true&select=position&order=position.desc&limit=1`,
        { headers: sbHeaders }
      );
      const countData = await countRes.json();
      pos = countData.length > 0 ? (countData[0].position + 1) : 1;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/featured_models`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ username: username.toLowerCase().trim(), position: pos, label: label || null, active: true })
    });
    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ ok: true, data }), { headers });
  }

  // ─── PUT — actualizar posición / label / estado ─────────────────
  if (req.method === 'PUT') {
    const body = await req.json();
    const { username, position, label, active } = body;

    if (!username) {
      return new Response(JSON.stringify({ error: 'username requerido' }), { status: 400, headers });
    }

    const update = {};
    if (position !== undefined) update.position = position;
    if (label !== undefined) update.label = label;
    if (active !== undefined) update.active = active;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/featured_models?username=eq.${encodeURIComponent(username)}`,
      { method: 'PATCH', headers: { ...sbHeaders, 'Prefer': 'return=representation' }, body: JSON.stringify(update) }
    );
    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, data }), { headers });
  }

  // ─── DELETE — quitar modelo ────────────────────────────────────
  if (req.method === 'DELETE') {
    const { username } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ error: 'username requerido' }), { status: 400, headers });
    }

    await fetch(
      `${SUPABASE_URL}/rest/v1/featured_models?username=eq.${encodeURIComponent(username)}`,
      { method: 'DELETE', headers: sbHeaders }
    );
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: 'Método no soportado' }), { status: 405, headers });
}
