import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // В dev-режиме индикатор Next.js перекрывает нижнюю навигацию в узком окне.
  devIndicators: false,
};

export default nextConfig;
