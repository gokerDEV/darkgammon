import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    CHEATING: process.env.CHEATING,
  },
  allowedDevOrigins: ["dev.tavla.be", "tavla.be"],
};

export default nextConfig;
