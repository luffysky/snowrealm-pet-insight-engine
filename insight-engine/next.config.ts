import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverBodySizeLimit: '50mb',
  middlewareClientMaxBodySize: '50mb',
  reactCompiler: true,
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
