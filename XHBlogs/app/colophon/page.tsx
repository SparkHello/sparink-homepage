import Link from "next/link";
export const metadata = { title: "关于本站" };
export default function Colophon() {
  return (
    <main className="page-wrap colophon">
      <h1>关于本站</h1>
      <p>
        这是 Sparink
        用来长期记录生活的个人网站。日记、相片和随手写下的几句话，按日子慢慢积累。
      </p>
      <h2>设计与构建</h2>
      <p>
        米白纸面、墨色文字与一抹钴蓝。首页的蓝色丝线雕塑由代码实时绘制，可以拖动，也可以暂停。阅读时让文字安静一点；翻相册时，把空间留给照片。
      </p>
      <p>
        本站使用 Next.js、React、Three.js，部署于 Cloudflare Workers。字体使用
        Geist
        与设备本地中文字体。尊重系统的减少动态效果设置，也保留原生滚动与键盘导航。
      </p>
      <h2>来处与致谢</h2>
      <p>
        这个站点最初基于{" "}
        <a
          href="https://github.com/heiehiehi/XinghuisamaBlogs"
          target="_blank"
          rel="noreferrer"
        >
          XingHuiSama 的 XHBlogs
        </a>{" "}
        构建。本次重新设计了页面、导航、视觉和交互，仍沿用部分内容与服务基础。原有代码的{" "}
        <a
          href="https://creativecommons.org/licenses/by-nc/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-NC 4.0 许可
        </a>
        及署名继续保留在仓库中。
      </p>
      <p>
        视觉研究参考了{" "}
        <a href="https://linear.app/now/how-we-redesigned-the-linear-ui">
          Linear 的层级设计
        </a>
        、<a href="https://vercel.com/geist">Geist 的设计系统</a>、
        <a href="https://rauno.me/craft/interaction-design">Rauno 的交互思考</a>
        与 <a href="https://stripe.com/blog/globe">Stripe 的交互图形实践</a>
        。这些参考启发了设计原则；本站的构图与交互雕塑独立实现。
      </p>
      <Link href="/" className="text-link">
        返回首页 ↗
      </Link>
    </main>
  );
}
