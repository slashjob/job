import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// The skill's own lockfile sits one directory up, so Turbopack has to be told where this app starts.
const nextConfig: NextConfig = {
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  allowedDevOrigins: ["127.0.0.1", "*.loca.lt"],
  serverExternalPackages: ["better-sqlite3"],
  devIndicators: false,
};

export default nextConfig;
