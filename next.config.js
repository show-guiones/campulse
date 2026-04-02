/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'jpeg.cpmimage.com' },
      { protocol: 'https', hostname: 'thumb.live.mmcdn.com' },
      { protocol: 'https', hostname: 'roomimg.stream.highwebmedia.com' },
      { protocol: 'https', hostname: 'flagcdn.com' }, // ← banderas por país
    ],
  },
  async redirects() {
    return [
      { source: '/', destination: '/app.html', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap' },
    ];
  },
};

export default nextConfig;
