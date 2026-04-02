// pages/api/rss.js — Live RSS feed for CampulseHub
export default async function handler(req, res) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://campulsehub.com';
    const resp = await fetch(`${apiBase}/api/rooms`);
    const rooms = await resp.json();
    const online = Array.isArray(rooms)
      ? rooms.filter(r => r.num_users > 0).sort((a, b) => b.num_users - a.num_users).slice(0, 30)
      : [];

    const items = online.map(r => `
    <item>
      <title>${escXml(r.display_name || r.username)} — ${r.num_users} viewers</title>
      <link>https://campulsehub.com/model/${r.username}</link>
      <guid isPermaLink="true">https://campulsehub.com/model/${r.username}</guid>
      <description>${escXml(`${r.username} está en vivo con ${r.num_users} viewers ahora mismo en CampulseHub.`)}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CampulseHub — Modelos en Vivo Ahora</title>
    <link>https://campulsehub.com</link>
    <atom:link href="https://campulsehub.com/api/rss" rel="self" type="application/rss+xml"/>
    <description>Las modelos más vistas en vivo en este momento en CampulseHub.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>5</ttl>
    ${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>');
  }
}

function escXml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
