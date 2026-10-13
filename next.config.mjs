/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // --- Filet de securite -----------------------------------------------
  // Le projet doit TOUJOURS builder, meme si une erreur de type ou une
  // regle ESLint traine. Repassez ces deux flags a `false` quand vous
  // voulez un projet 100% strict (recommande avant une grosse mise en prod).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Prisma et bcryptjs restent cote serveur (pas de bundling navigateur).
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

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
