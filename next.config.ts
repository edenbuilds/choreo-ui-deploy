import type { NextConfig } from "next";

// The home directory above this repo has its own lockfile. Pin the root so Turbopack does not pick it.
const nextConfig: NextConfig = { turbopack: { root: __dirname } };

export default nextConfig;
