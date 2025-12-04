import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*" }],
  },
  allowedDevOrigins: ["http://10.0.0.126:3000", "http://localhost:3000"],
};

export default nextConfig;
