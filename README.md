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

## QQ 音乐本地同步（可选）

项目包含一个仅供本人本机使用的 QQ 音乐同步桥接。它可以在本地网页中显示 QQ 音乐当前播放的歌名、歌手、封面、歌词和进度，并把网页上的暂停、上一首、下一首和进度跳转传给 QQ 音乐。

这项功能只在 macOS 的 `localhost` 或 `127.0.0.1` 上启用。公开部署的 `sparink.net` 不会连接访客电脑，也不会上传音乐、歌词、播放记录或修改任何云端文件；本地桥接未运行时，网站自动使用原有的云端直链歌单。

### 环境依赖

- QQ 音乐 Mac 客户端
- Node.js 与项目依赖
- [`nowplaying-cli`](https://github.com/kirtan-shah/nowplaying-cli)，通过 macOS Now Playing 读取和控制当前媒体
- `sqlite3` 命令行工具，用于从 QQ 音乐本地数据库匹配歌曲 ID

安装缺少的媒体读取工具：

```bash
brew install nowplaying-cli
```

### 启动方式

先打开 QQ 音乐并开始播放歌曲，然后使用两个终端。

终端一启动本地音乐桥接：

```bash
cd XHBlogs
npm run local:music
```

终端二启动网站：

```bash
cd XHBlogs
npm run dev
```

浏览器访问 `http://localhost:3000`。只想浏览、不需要热更新时，可以在执行过 `npm run build` 后把 `npm run dev` 换成 `npm start`。停止时在两个终端分别按 `Control+C`。

### 实现与维护

- 本地服务入口：`XHBlogs/scripts/local-music-bridge.mjs`
- 网页接入与本地/云端切换：`XHBlogs/components/MusicProvider.tsx`
- 启动命令定义：`XHBlogs/package.json` 中的 `local:music`
- 桥接只监听 `127.0.0.1:3210`，网页每秒读取一次 `/now-playing`
- 歌名、封面、进度和播放状态来自 macOS Now Playing；歌曲 ID 从 QQ 音乐沙盒内的 `qqmusic.sqlite` 匹配；歌词在切歌时从 QQ 音乐歌词接口获取
- 歌词和数据库匹配结果只缓存在桥接进程内，重启后会重新读取

如果 QQ 音乐更新后同步失效，优先检查 `nowplaying-cli get-raw` 是否仍能读到 `com.tencent.QQMusicMac`，以及桥接脚本中的 QQ 音乐数据库路径和字段是否发生变化。网页显示正常但控制无响应时，先重启 `npm run local:music`。

## 主要配置

- 个人信息、社交链接、背景和功能开关：`XHBlogs/siteConfig.ts`
- 长简介：`XHBlogs/app/about/aboutContent.ts`
- 项目列表：`XHBlogs/data/projects.ts`
- 文章：`XHBlogs/posts/*.md`
- 灵感碎片：`XHBlogs/chatters/*.md`
- 动态：`XHBlogs/moments/*.md`
- 相册：`XHBlogs/data/albums.ts`

AI 聊天、评论和天气接口默认关闭，避免公开部署后出现无意的 API 配额消耗。需要时请先配置对应环境变量和访问保护，再在 `siteConfig.ts` 中启用。

仓库中的 `my-blog-manager` 是上游项目附带的本地管理控制台，目前仅作为参考保留，不参与网站构建和线上部署。现阶段直接编辑上述配置与内容文件更简单，也更容易审查变更。

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
