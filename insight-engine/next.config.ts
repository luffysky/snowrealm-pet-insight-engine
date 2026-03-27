import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  // ffmpeg 套件含 platform-specific binary，不能在 build 時 bundle
  // serverExternalPackages 同時適用 webpack 和 Turbopack
  serverExternalPackages: [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    '@ffprobe-installer/ffprobe',
  ],
  // Next.js 16 預設啟用 Turbopack；加 turbopack: {} 避免 webpack config 衝突警告
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // fallback：使用 webpack 時也排除這些模組
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
