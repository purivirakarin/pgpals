/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {}
  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Image optimization for Telegram images
  images: {
    domains: ['api.telegram.org'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig