export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Permitir CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), { status: 500 });
  }

  try {
    const { email } = await req.json();
    if (!email) return new Response(JSON.stringify({ tier: 'free' }), { status: 200 });

    // Buscar o crear perfil
    const url = `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=tier,trial_start,trial_end`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });

    const data = await res.json();

    if (!data || data.length === 0) {
      // Crear perfil nuevo con trial de 14 días
      const trialStart = new Date().toISOString();
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email,
          tier: 'trial',
          trial_start: trialStart,
          trial_end: trialEnd,
        })
      });

      return new Response(JSON.stringify({
        tier: 'trial',
        trial_end: trialEnd,
        is_new: true,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const profile = data[0];

    // Si está en trial, verificar si expiró
    if (profile.tier === 'trial' && profile.trial_end) {
      const expired = new Date(profile.trial_end) < new Date();
      if (expired) {
        // Degradar a free
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tier: 'free' })
        });
        profile.tier = 'free';
      }
    }

    return new Response(JSON.stringify({
      tier: profile.tier,
      trial_end: profile.trial_end,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ tier: 'free', error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
