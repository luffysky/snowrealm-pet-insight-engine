import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker image 才需要 standalone，Vercel 走自己的建置產物
  output: process.env.VERCEL ? undefined : "standalone",
  // ffmpeg 執行檔是 require 時才載入，要明確帶進影片轉檔函式
  outputFileTracingIncludes: {
    "/api/upload/video": [
      "./node_modules/@ffmpeg-installer/**/*",
      "./node_modules/@ffprobe-installer/**/*",
    ],
  },
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  // ffmpeg / adm-zip 不能在 build 時 bundle（含 native 或 CJS 相容問題）
  serverExternalPackages: [
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
    "adm-zip",
  ],
  // Next.js 16 預設啟用 Turbopack
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        "fluent-ffmpeg",
        "@ffmpeg-installer/ffmpeg",
        "@ffprobe-installer/ffprobe",
      ];
    }
    return config;
  },
};

export default nextConfig;
