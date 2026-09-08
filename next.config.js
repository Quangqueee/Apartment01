/** @type {import('next').NextConfig} */
const isTurbopack =
  Boolean(process.env.TURBOPACK) ||
  process.argv.includes("--turbo") ||
  process.argv.includes("--turbopack");

const nextConfig = {
  // Isolate `next dev --turbo` from `next build` / `next start`.
  // Sharing `.next` lets Turbopack overwrite routes-manifest.json
  // (no dataRoutes) and pages/_document.js, which then crash production.
  distDir: isTurbopack ? ".next-turbo" : ".next",
  typescript: {
    ignoreBuildErrors: false, // Có thể chuyển thành true nếu muốn bỏ qua lỗi TypeScript trong quá trình build
  },
  // Safari/iOS PWA reads <head> from the first HTML chunk. Streaming metadata
  // into <body> makes Add to Home Screen open in Safari instead of standalone.
  htmlLimitedBots: /.*/,
  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
  },
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xuanphonggroup.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hoidisanvanhoa.vn',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: process.env.NODE_ENV !== 'production', // Disable image optimization in development mode
    qualities: [25, 50, 60, 75, 90, 100],
  },
};

module.exports = nextConfig;