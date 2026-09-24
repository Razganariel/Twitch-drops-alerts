import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["twitch-drops-alerts.duckdns.org"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.jtvnw.net" },
      { protocol: "https", hostname: "**.steamstatic.com" },
      { protocol: "https", hostname: "media.steampowered.com" },
    ],
  },
};

export default nextConfig;
