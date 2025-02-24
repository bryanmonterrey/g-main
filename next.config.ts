import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')
    ].filter((domain): domain is string => Boolean(domain)),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;