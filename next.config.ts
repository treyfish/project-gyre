import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["cesium"],
  turbopack: {
    resolveAlias: {
      "@spz-loader/core": "./src/render/spz-loader-stub.ts",
    },
  },
  headers: async () => [
    {
      source: "/cesium/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    {
      source: "/data/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ],
};

export default nextConfig;
