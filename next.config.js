/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['jpeg.cpmimage.com', 'thumb.live.mmcdn.com'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/app.html',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
