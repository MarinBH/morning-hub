/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only include better-sqlite3 as external when not using Turso (local dev)
  ...(process.env.TURSO_DATABASE_URL
    ? {}
    : { serverExternalPackages: ['better-sqlite3'] }
  ),
};

export default nextConfig;
