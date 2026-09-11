import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@trackflow/core"],
  async rewrites() {
    return [
      // Preserve the backend prefix used by the centralized incident manager.
      { source: "/api/incidents/:path*", destination: "http://localhost:8000/api/incidents/:path*" },
      // Proxy /api/* → backend stripping /api prefix
      { source: "/api/:path*", destination: "http://localhost:8000/:path*" },
      // Direct proxies for routes called by @trackflow/core without /api prefix
      { source: "/auth/:path*", destination: "http://localhost:8000/auth/:path*" },
      { source: "/users/:path*", destination: "http://localhost:8000/users/:path*" },
      { source: "/profiles/:path*", destination: "http://localhost:8000/profiles/:path*" },
    ];
  },
};

export default nextConfig;