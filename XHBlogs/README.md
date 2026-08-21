# Sparink Homepage Frontend

Sparink 个人主页的 Next.js 前端，通过 OpenNext 部署到 Cloudflare Workers。

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## Cloudflare Workers 预览与部署

```bash
npm run preview
npm run deploy
```

网站内容与功能开关集中在 `siteConfig.ts`，更完整的说明见仓库根目录的 `README.md`。
