/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig

