import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configure Turbopack root directory
  turbopack: {
    root: path.join(__dirname),
  },
  // Configure server-only modules
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
