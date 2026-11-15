# Sparink — 日记与相册

Sparink 用来长期记录生活的个人网站。日记、相册与随手写下的几句话，按时间慢慢积累。项目与代码保留在「关于 → 折腾」，不再占据首页主线。

延续米白、墨黑与钴蓝的排版，首页保留可拖动、切换和暂停的蓝色丝线雕塑。主导航是「日记 / 相册 / 关于」，名字返回首页。原有两本相册、62 张照片、项目与本地内容工作台全部保留，没有生成占位日记。

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

- 域名、数据及功能开关：`XHBlogs/siteConfig.ts`
- 首页介绍、最近日记和相册入口：`XHBlogs/app/page.tsx`
- 关于页：`XHBlogs/app/about/page.tsx`
- 导航和页脚：`XHBlogs/components/atelier/AtelierShell.tsx`
- 视觉设计：`XHBlogs/app/globals.css` 和 `XHBlogs/components/atelier/*.css`
- 项目列表：`XHBlogs/data/projects.ts`
- 长文章：`XHBlogs/posts/*.md`
- 日记：`XHBlogs/chatters/*.md`
- 随手记（也会汇入日记）：`XHBlogs/moments/*.md`
- 相册：`XHBlogs/data/albums.json`
- 歌单：`XHBlogs/data/music.json`
- 内容栏目开关：`XHBlogs/data/content-settings.json`

日记入口沿用 `/timeline`，按年、月、日合并三种记录，支持全文搜索和年月筛选。600 字以内的短记录直接阅读全文和图片；较长、含代码块或多个章节的记录进入详情。标题可以留空，不会补成「未命名」。原 `/posts/[slug]`、`/chatter/[slug]` 与 `/moments` 保留，新增 `/moments/[slug]`；日期统一按上海时区理解。`lib/diary.ts` 负责解析与排序，`components/atelier/diary.css` 控制安静的阅读排版。

相册入口沿用 `/photowall`，每本相册有独立的 `/photowall/[albumId]` 链接。照片查看支持原图、前后切换、方向键、Escape 与手机横滑。照片说明可空，原始标题、日期和说明来自现有 JSON。

首页的相册入口是一小叠可拨动的真实照片：封面优先预览最多 5 张，支持点击、横拖、左右按钮与方向键，标题单独进入完整相册。日记的日期按钮展开月份滚轮，只列出实际有记录的年月，支持跨年、全年、直接选择与清除筛选；尚无日记时保留空态。关于页的固定旅行照片提供圆角玻璃透镜，手机可以点按定位，也可用方向键移动、Escape 放下；透镜按需加载，静止、离屏和切换页面时停止绘制或释放资源，不影响正文阅读。

打开相册时，当前封面或首页手中的照片会连续移动到相册首图，标题随之衔接；浏览器返回时恢复那张预览照片和滚动位置。首图只调整本次浏览的展示顺序，原 JSON、照片索引和查看器顺序保持不变。过渡使用 Next.js App Router 内置的 React ViewTransition，不支持的浏览器正常导航，系统减少动态效果设置下关闭动画。

主导航的蓝色短线会跟随当前栏目移动。日记有内容后，「找一找」从小入口展开为全文搜索，仍可与年月组合筛选。长文真正超过一屏并有足够段落时，桌面显示页边阅读刻度，手机提供文章目录；短记录不会增加额外控件。

关于页中「糯米和十一」可以展开已有猫咪相册的预览。日记使用标准 Markdown 脚注即可加入文字补充：鼠标悬停或点击编号原地查看，手机点按展开；文末仍保留完整脚注和返回正文的链接。不同日记的脚注独立编号，不会串到另一篇。

```markdown
正文里的一句补充[^note]。

[^note]: 这里写说明，也可以放链接或图片。
```

「听听歌」采用纸袋与光盘：点按后光盘抽出，只有音频实际播放时旋转；暂停、缓冲、失败、离屏或后台时停住。初次进入不自动播放，播放失败可重试，仍沿用已有歌单、进度、音量和歌词。以上动效均尊重系统减少动态效果设置。

上游许可证保留，设计来处与致谢见 `/colophon`。阅读页继续支持 Markdown、代码高亮、公式和表格。音乐仅在首次进入歌单页时加载，首屏不请求音乐接口。

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

### 今天只有两句话和一张照片

1. 运行 `npm run studio`，直接进入「写日记」。
2. 写正文，标题可以不填。点击「添加照片」在光标处插入图片，无需图注。
3. 点击「保存到本地」即可预览。日期默认今天（上海时区），文件名自动生成；改日期、标签、摘要或封面时再展开「日期与其他选项」。
4. 满意后在「检查与发布」构建并推送。新日记自动进入首页和 `/timeline`，以后可按年月或正文关键词找回。

直接编辑 Markdown 也可以：日期加正文和 Markdown 图片已足够，不需要封面、摘要或标签。相册仍在「照片与相册」中创建，批量添加照片；名称、说明和每张照片的说明均可稍后再补。默认第一张照片作为封面，已有相册 ID 与链接保持稳定。

控制台源码位于 `XHBlogs/scripts/content-studio.mjs` 与 `XHBlogs/scripts/content-studio/`。也可以继续直接编辑内容文件，结果完全相同。

## Cloudflare Workers 部署

前端通过 OpenNext 运行在 Cloudflare Workers，静态资源由 Workers Static Assets 分发。部署前可以在本地使用真实 Workers 运行环境检查：

```bash
cd XHBlogs
npm run preview
```

确认无误后运行 `npm run deploy`，或让 Cloudflare Workers Builds 连接本仓库并自动部署。正式域名为 `sparink.net`。

生产构建关闭 Turbopack 文件系统缓存，避免 Next.js 16.3 在云端恢复缓存时复用旧 CSS。每次发布使用 Git 提交 SHA 作为 deploymentId，保证导航和静态资源版本一致。

## License & Attribution

本项目基于 [XingHuiSama/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 修改，并保留其原始许可证。

上游项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)：允许署名后的非商业性使用和修改。当前版本已由 Sparink 进行个人化修改；若未来需要商业化，应先取得原作者授权，或替换受该许可证约束的底层实现与素材。
