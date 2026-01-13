/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    fetchCacheKeyPrefix: 'font-cache',
  },
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
