export const config = { runtime: 'nodejs' };

const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { username, viewers, title, body, url } = req.body;

    // Obtener todas las suscripciones que tienen esta modelo como favorita
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?favorites=cs.{"${username}"}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const subscriptions = await subRes.json();

    if (!subscriptions || !subscriptions.length) {
      return res.json({ sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || `${username} está en vivo`,
      body: body || `${viewers} viewers ahora · Entra a verla`,
      tag: `online-${username}`,
      url: url || `https://www.campulsehub.com`,
      icon: 'https://www.campulsehub.com/icon-192.png'
    });

    let sent = 0;
    const dead = [];

    await Promise.all(subscriptions.map(async sub => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload);
        sent++;
      } catch (e) {
        // Suscripción expirada — marcar para eliminar
        if (e.statusCode === 410 || e.statusCode === 404) {
          dead.push(sub.endpoint);
        }
      }
    }));

    // Limpiar suscripciones muertas
    if (dead.length) {
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=in.(${dead.map(e => `"${e}"`).join(',')})`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
    }

    return res.json({ sent, dead: dead.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
