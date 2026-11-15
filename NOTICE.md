# 来源与权利范围

Sparink 是 SparkHello 的个人生活记录网站。当前界面、生活内容组织、相册浏览、交互效果和本地 Sparink Studio 围绕本站独立实现。音乐底层在本次整理中按播放器的输入输出合同重新实现，未继续使用旧模板的播放逻辑。

## 历史版本

仓库最初来自 [XingHuiSama 的 XinghuisamaBlogs / XHBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)。上游基线为 `06d490a`，历史版本包含其代码、素材以及后续修改，适用当时的 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 及相应署名要求。完整许可与免责声明原文保存在 [LICENSES/XHBlogs-CC-BY-NC-4.0.txt](LICENSES/XHBlogs-CC-BY-NC-4.0.txt)。

本次整理保留 Git 历史与上述来处记录；删除的是当前发布树中的旧实现和未使用素材。新声明不会撤销历史版本或已发布材料已经授予的许可。CC 对既有许可不可撤销的说明见[官方 FAQ](https://creativecommons.org/faq/#what-if-i-change-my-mind-about-using-a-cc-license)。

当前自有贡献按根目录 [LICENSE](LICENSE) 保留权利，公开可查看，额外复用请联系 `sparinkme@gmail.com`。这不是将历史上游材料改为自有版权，也不构成对所有代码、内容权属的法律鉴定。技术核对范围见[来源审计记录](docs/source-audit.md)。

## 第三方基础设施

本站继续使用第三方开源库；独立实现不等于重新编写框架。以下项目和各自依赖仍适用其自身许可证，完整版本树由 `XHBlogs/package-lock.json` 记录，许可文件随安装包提供：

- Next.js、React / React DOM：网页框架。
- Three.js：丝线雕塑与局部照片透镜。
- Lucide：界面图标；Geist：通过 Next.js 加载的字体。
- unified、remark、rehype、highlight.js、KaTeX、YAML：日记解析、代码高亮、公式和数据格式。
- Tailwind CSS / PostCSS：样式构建；Sharp：本地导入图片。
- OpenNext Cloudflare、Wrangler：部署适配与工具。

设计研究引用保留在网站 `/colophon` 页面。它们是设计灵感来源，不是本站源码的替代许可。

## 个人内容与外部音乐

用户提供的日记、相册、照片和头像不随代码获得新的复用许可；网站也不对其中可能存在的第三方权利作额外授权。歌单只保存歌曲 ID，音频、歌词和专辑图片来自外部音乐服务，权利归相应权利人。本次整理未将这些材料改署为 Sparink 原创。
