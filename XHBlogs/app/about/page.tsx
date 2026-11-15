import Link from "next/link";
import { albums } from "../../data/albums";
import { siteConfig } from "../../siteConfig";
import PhotoLens from "../../components/atelier/PhotoLens";

export const metadata = {
  title: "关于",
  description: "关于 Sparink，和这个记录日常的小地方。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const travel = albums.find((album) => album.id === "travel-2026");
  const photo = travel?.photos.find((item) => item.caption === "路上的云") || travel?.photos[0];
  return (
    <main className="personal-wrap personal-about">
      <h1>关于这里</h1>
      <div className="about-life-grid">
        <div className="about-life-copy">
          <img className="living-avatar" src={siteConfig.avatarUrl} alt="Sparink 的头像" width={64} height={64} />
          <h2>你好，我是 Sparink。</h2>
          <p>这里是我记录生活的地方。几句话、一张照片，或者一段长一点的日记，都可以留下来。</p>
          <p>喜欢旅行、摄影，也喜欢折腾机械键盘和硬件。糯米和十一是相册里经常出现的两只猫。</p>
          <p>希望过一段时间再翻回来，还能想起那些普通日子里的小事。也欢迎你随便看看。</p>
          <div className="about-small-links">
            <Link href="/timeline">日记</Link>
            {siteConfig.features.photoWall && <Link href="/photowall">相册</Link>}
            <a href={`mailto:${siteConfig.social.email}`}>写封邮件</a>
          </div>
        </div>
        {photo && siteConfig.features.photoWall && <PhotoLens key={photo.url} src={photo.url} alt={photo.caption || "旅行中拍下的照片"} />}
      </div>
      <section className="about-other-things">
        <h2>也会折腾一些别的</h2>
        <p>我在学习计算机科学，偶尔做些关于 AI、记忆和日常工具的小项目。它们也收在这里。</p>
        <nav aria-label="其他内容">
          <Link href="/projects">折腾 ↗</Link>
          {siteConfig.features.music && <Link href="/music">听听歌 ↗</Link>}
          {siteConfig.features.lab && <Link href="/tree">随便玩玩 ↗</Link>}
          <a href={siteConfig.social.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </section>
    </main>
  );
}
