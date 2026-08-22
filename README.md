# Sparink の 数字花园

Sparink 的个人主页与数字花园，记录 AI Agent、长期记忆、代码、硬件，以及偶尔冒出来的灵感。

当前阶段以个人主页和项目展示为主。文章、杂谈、动态、相册与友链的模板示例内容已经清空，后续再逐步加入自己的内容。

## 本地预览

前端项目位于 `XHBlogs`：

```bash
cd XHBlogs
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。生产构建检查：

```bash
npm run build
```

## 主要配置

- 个人信息、社交链接、背景和功能开关：`XHBlogs/siteConfig.ts`
- 长简介：`XHBlogs/app/about/aboutContent.ts`
- 项目列表：`XHBlogs/data/projects.ts`
- 文章：`XHBlogs/posts/*.md`
- 灵感碎片：`XHBlogs/chatters/*.md`
- 动态：`XHBlogs/moments/*.md`
- 相册：`XHBlogs/data/albums.json`
- 歌单：`XHBlogs/data/music.json`
- 内容栏目开关：`XHBlogs/data/content-settings.json`

AI 聊天、评论和天气接口默认关闭，避免公开部署后出现无意的 API 配额消耗。需要时请先配置对应环境变量和访问保护，再在 `siteConfig.ts` 中启用。

## Sparink Studio 本地内容控制台

仓库内置了一个不参与线上部署的本地内容工具，可用于写文章和日记、发布动态、批量导入照片、整理相册与歌单，以及控制内容栏目的显示状态。

```bash
cd XHBlogs
npm install
npm run studio
```

命令会打开 `http://127.0.0.1:4317`，并在需要时启动 `http://127.0.0.1:3000` 网站预览。控制台只监听本机回环地址，数据仍保存在仓库的 Markdown、JSON 和 `public/uploads` 中，不需要数据库，也不会随网站公开。

- 导入图片时自动校正方向、限制最长边为 2560px，并转换为 WebP。
- 保存只修改本地文件；可以先反复预览，不会自动上传。
- “构建并推送”会先执行生产构建，只暂存内容目录，再提交到 GitHub `main`。
- 如果仓库存在控制台范围外的源码改动，发布会停止，避免误提交其他工作。
- 删除的 Markdown 会移入本机 `.content-studio/trash`，该目录不会进入 Git。

控制台源码位于 `XHBlogs/scripts/content-studio.mjs` 与 `XHBlogs/scripts/content-studio/`。也可以继续直接编辑内容文件，结果完全相同。

## Cloudflare Workers 部署

前端通过 OpenNext 运行在 Cloudflare Workers，静态资源由 Workers Static Assets 分发。部署前可以在本地使用真实 Workers 运行环境检查：

```bash
cd XHBlogs
npm run preview
```

确认无误后运行 `npm run deploy`，或让 Cloudflare Workers Builds 连接本仓库并自动部署。正式域名为 `sparink.net`。

## License & Attribution

本项目基于 [XingHuiSama/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 修改，并保留其原始许可证。

上游项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)：允许署名后的非商业性使用和修改。当前版本已由 Sparink 进行个人化修改；若未来需要商业化，应先取得原作者授权，或替换受该许可证约束的底层实现与素材。
