import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  // 讓 Edge Runtime (middleware) 能讀到這些環境變數
  env: {
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

export default nextConfig;
