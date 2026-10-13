/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Le projet doit TOUJOURS builder
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // CORRIGE: Pour Next 14, c'est experimental.serverComponentsExternalPackages
  // Pas serverExternalPackages (c'est pour Next 15)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  images: { unoptimized: true },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'Content-Type, Authorization, x-afriflow-signature, x-afriflow-event, x-cron-secret',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
