import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Skip static generation for app routes that require auth at runtime */
  typescript: {
    ignoreBuildErrors: false,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
