import type { NextConfig } from "next";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "api";
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || "8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@trackflow/core"],
  async rewrites() {
    const apiTarget = `http://${API_HOST}:${API_PORT}`;
    return [
      { source: "/api/incidents/:path*", destination: `${apiTarget}/api/incidents/:path*` },
      { source: "/api/:path*", destination: `${apiTarget}/:path*` },
      { source: "/auth/:path*", destination: `${apiTarget}/auth/:path*` },
      { source: "/users/:path*", destination: `${apiTarget}/users/:path*` },
      { source: "/profiles/:path*", destination: `${apiTarget}/profiles/:path*` },
    ];
  },
};

export default nextConfig;