import webpush from 'web-push';

export const config = { runtime: 'nodejs' };

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { username, viewers, title, body, url } = req.body;

    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?favorites=cs.{"${username}"}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const subscriptions = await subRes.json();
    if (!subscriptions?.length) return res.json({ sent: 0 });

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
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) dead.push(sub.endpoint);
      }
    }));

    if (dead.length) {
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=in.(${dead.map(e => `"${e}"`).join(',')})`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
    }

    return res.json({ sent, dead: dead.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
