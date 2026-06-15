/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Keep the better-sqlite3 native addon out of the server bundle so the
    // RAG chat route (lib/vector-db.ts) loads its prebuilt binding at runtime.
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
}

export default nextConfig