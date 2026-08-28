import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://playground.4geeks.com/tracker/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
