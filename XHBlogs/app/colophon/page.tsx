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
      <p>
        首页的相片堆可以随手拨动，日记的日期选择器收起一只月份滚轮。关于页有一张固定的旅行照片，可以拿起玻璃透镜，看看里面的细节。它们各自在需要的地方出现，正文阅读保持安静。
      </p>
      <p>
        音乐收在一只纸袋里，播放时光盘才会转动。文字旁可以留一点补充，日记搜索从小入口展开；足够长的文章才出现页边阅读刻度。细节随着内容生长，短短两句话也能自在地放在这里。
      </p>
      <h2>代码与内容</h2>
      <p>
        现在的页面、阅读与相册交互，以及本地内容工作台，围绕这个网站独立实现。自有代码保留权利，照片和日记也留给生活本身。代码的使用范围与历史版本说明见{" "}
        <a
          href="https://github.com/SparkHello/sparink-homepage/blob/main/NOTICE.md"
          target="_blank"
          rel="noreferrer"
        >
          仓库中的来源与许可记录
        </a>{" "}
        。开源框架、字体和图标继续遵循各自的许可。
      </p>
      <h2>设计参考</h2>
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
      <p>
        相片堆的手感参考了 <a href="https://tympanus.net/codrops/2015/07/08/playful-interaction-for-draggable-elements/">Codrops 的相片拖动实验</a>；月份选择参考了 <a href="https://rauno.me/craft/wheel-input">Rauno 的 Wheel Input</a>；照片里的玻璃效果受到 <a href="https://github.com/tomoyukinakata/mouse-following-square-lens-effect">Tomoyuki Nakata 的 Square Lens</a> 启发。本站针对真实相册、日记日期和手机操作重新实现，透镜使用局部圆角折射与色散，仅在交互需要时绘制。
      </p>
      <Link href="/" className="text-link">
        返回首页 ↗
      </Link>
    </main>
  );
}
