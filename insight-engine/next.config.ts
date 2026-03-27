import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  env: {
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // ffmpeg 套件含 platform-specific binary，不能在 build 時 bundle
  serverExternalPackages: [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    '@ffprobe-installer/ffprobe',
  ],
};

export default nextConfig;
