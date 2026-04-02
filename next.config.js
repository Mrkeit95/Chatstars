/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      { source: '/apply', destination: '/apply.html' },
      { source: '/training', destination: '/training.html' },
      { source: '/website', destination: '/index.html' },
    ];
  },
};
module.exports = nextConfig;
