/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "net": false,
        "tls": false,
        "fs": false,
      };
      return config;
    },
    images: {
      domains: [
        process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')
      ].filter((domain) => Boolean(domain)),
    },
    typescript: {
      // Ignore TypeScript errors during build
      ignoreBuildErrors: true,
    },
    eslint: {
      // Ignore ESLint errors during build
      ignoreDuringBuilds: true,
    },
  }
  
  module.exports = nextConfig