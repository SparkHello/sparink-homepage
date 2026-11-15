import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function deploymentId() {
  if (process.env.NEXT_DEPLOYMENT_ID) return process.env.NEXT_DEPLOYMENT_ID;
  try { return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return 'sparink-atelier-20261115'; }
}

const nextConfig: NextConfig = {
  // Give every release its own asset URLs and client-navigation version.
  deploymentId: deploymentId(),
  // Next 16.3 can restore stale global CSS from a persisted build cache.
  experimental: { turbopackFileSystemCacheForBuild: false },
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
