// pages/api/rss-lexy.js
// RSS feed específico para lexy_fox2 — sindicación de snapshots
// URL: /api/rss-lexy → accesible vía /rss/lexy_fox2 con rewrite en vercel.json

const SITE = "https://www.campulsehub.com";
const USERNAME = "lexy_fox2";
const CAMPAIGN = "rI8z3";

function escXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const url =
      `${SUPABASE_URL}/rest/v1/rooms_snapshot` +
      `?username=eq.${USERNAME}` +
      `&captured_at=gte.${since}` +
      `&select=num_users,num_followers,captured_at` +
      `&order=captured_at.desc&limit=20`;

    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const snapshots = await r.json();
    const rows = Array.isArray(snapshots) ? snapshots : [];

    const items = rows.map((snap, i) => {
      const viewers = snap.num_users ?? 0;
      const followers = snap.num_followers ?? 0;
      const date = new Date(snap.captured_at).toUTCString();
      const isLive = viewers > 0;
      const title = isLive
        ? `🔴 lexy_fox2 EN VIVO — ${viewers.toLocaleString("es")} viewers`
        : `lexy_fox2 — Snapshot ${new Date(snap.captured_at).toLocaleDateString("es")}`;
      const desc = isLive
        ? `lexy_fox2 está transmitiendo en vivo ahora mismo con ${viewers.toLocaleString("es")} viewers y ${followers.toLocaleString("es")} seguidores. Entra a verla en CampulseHub.`
        : `Snapshot de lexy_fox2: ${viewers.toLocaleString("es")} viewers, ${followers.toLocaleString("es")} seguidores.`;

      return `
    <item>
      <title>${escXml(title)}</title>
      <link>${SITE}/model/lexy_fox2</link>
      <guid isPermaLink="false">lexy_fox2-${snap.captured_at}</guid>
      <description>${escXml(desc)}</description>
      <pubDate>${date}</pubDate>
      ${isLive ? `<enclosure url="https://thumb.live.mmcdn.com/riw/lexy_fox2.jpg" type="image/jpeg" length="0"/>` : ""}
    </item>`;
    }).join("\n");

    const latestSnapshot = rows[0];
    const currentViewers = latestSnapshot?.num_users ?? 0;
    const isCurrentlyLive = currentViewers > 0;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>lexy_fox2 en CampulseHub — Stats en vivo</title>
    <link>${SITE}/model/lexy_fox2</link>
    <atom:link href="${SITE}/rss/lexy_fox2" rel="self" type="application/rss+xml"/>
    <description>${isCurrentlyLive
      ? `🔴 lexy_fox2 está EN VIVO ahora con ${currentViewers.toLocaleString("es")} viewers.`
      : "Estadísticas en tiempo real de lexy_fox2 en Chaturbate."
    } Suscríbete para recibir alertas cuando esté en vivo.</description>
    <language>es</language>
    <image>
      <url>https://thumb.live.mmcdn.com/riw/lexy_fox2.jpg</url>
      <title>lexy_fox2</title>
      <link>${SITE}/model/lexy_fox2</link>
    </image>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
    ${items}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send(`<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>`);
  }
}
