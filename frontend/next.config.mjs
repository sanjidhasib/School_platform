/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // Hosted setup: the website forwards /api and /uploads to the backend, so
  // the browser only ever talks to one domain and login cookies just work.
  // Unset locally, where the browser calls http://localhost:5000 directly.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, '');
    if (!target) return [];
    return [
      { source: '/api/:path*', destination: `${target}/api/:path*` },
      { source: '/uploads/:path*', destination: `${target}/uploads/:path*` },
    ];
  },
  webpack: (config) => {
    // pdf.js (used by the textbook reader) optionally requires the native
    // `canvas` package for Node rendering; the browser never needs it.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
