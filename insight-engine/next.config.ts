import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  // ffmpeg 套件含 platform-specific binary，不能在 build 時 bundle
  serverExternalPackages: [
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
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
