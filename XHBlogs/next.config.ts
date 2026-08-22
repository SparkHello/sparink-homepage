import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 音乐等接口需要服务端运行时，因此不启用纯静态导出。
  // Cloudflare Workers 由 OpenNext 适配器生成运行产物。
  agentRules: false,
  allowedDevOrigins: ['127.0.0.1'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
