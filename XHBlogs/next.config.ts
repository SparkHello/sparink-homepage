import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 音乐等接口需要服务端运行时，因此不启用纯静态导出。
  // Cloudflare Workers 由 OpenNext 适配器生成运行产物。
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
