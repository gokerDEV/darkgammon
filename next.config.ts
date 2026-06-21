import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    CHEATING: process.env.CHEATING,
  },
  allowedDevOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [],
};

export default nextConfig;
