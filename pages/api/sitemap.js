import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("rooms_snapshot")
    .select("username")
    .gte("captured_at", since)
    .order("username");

  const usernames = error ? [] : [...new Set(data.map((r) => r.username))];

  const urls = usernames.map((u) => `  <url>
    <loc>https://www.campulsehub.com/model/${u}</loc>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.campulsehub.com/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
  res.status(200).send(xml);
}