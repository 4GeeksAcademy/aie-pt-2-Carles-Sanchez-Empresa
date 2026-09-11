import type { NextConfig } from "next";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "localhost";
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || "8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@trackflow/core"],
  compress: true,
  // Optimización de imágenes
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    const apiTarget = `http://${API_HOST}:${API_PORT}`;
    return [
      { source: "/api/incidents/:path*", destination: `${apiTarget}/api/incidents/:path*` },
      { source: "/api/:path*", destination: `${apiTarget}/:path*` },
      { source: "/auth/:path*", destination: `${apiTarget}/auth/:path*` },
      { source: "/users/:path*", destination: `${apiTarget}/users/:path*` },
      { source: "/telemetry/:path*", destination: `${apiTarget}/telemetry/:path*` },
      { source: "/profiles/:path*", destination: `${apiTarget}/profiles/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:* http://api:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;