import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @react-pdf/renderer in the App Router
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
