/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the app to build even if env vars are not present at build time;
  // Supabase clients are created lazily at request time.
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
