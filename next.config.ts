import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["twitch-drops-alerts.duckdns.org"],
};

export default nextConfig;
