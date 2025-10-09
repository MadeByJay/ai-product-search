import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // NOTE: for CI/CD only; do not leave this on long-term
    ignoreDuringBuilds: true,
  },
  typescript: {
    // NOTE: for CI/CD only; do not leave this on long-term
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
export default nextConfig;
