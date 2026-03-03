import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  turbopack: {
    // @ts-ignore
    root: process.cwd(),
  }
};

export default nextConfig;
