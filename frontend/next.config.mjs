/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  webpack: (config) => {
    // pdf.js (used by the textbook reader) optionally requires the native
    // `canvas` package for Node rendering; the browser never needs it.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
