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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 讓 webpack 完全不分析這些模組，runtime 才 require
      const externals = Array.isArray(config.externals) ? config.externals : []
      config.externals = [
        ...externals,
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
      ]
    }
    return config
  },
};

export default nextConfig;
