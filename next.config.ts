import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Piper (browser text-to-speech) ships Node-only branches that bundlers cannot resolve in the browser.
  turbopack: {
    resolveAlias: {
      fs: { browser: "./lib/tts/empty-module.ts" },
      path: { browser: "./lib/tts/empty-module.ts" },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
