import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { albums } from "../../data/albums";
import "../../components/atelier/secondary.css";

export const metadata = {
  title: "关于 Sparink",
  description: "一个喜欢拆开工具、比较工具，也喜欢亲手做工具的计算机学生。",
  alternates: { canonical: "/about" },
};

const interests = [
  {
    n: "01",
    name: "Agents & intelligence",
    title: "让工具学会协作",
    text: "探索多智能体之间的分工、路由与协作。关注的不只是模型能回答什么，也包括它们如何把一个复杂任务真正做完。",
  },
  {
    n: "02",
    name: "Memory & context",
    title: "让对话有所延续",
    text: "研究长期记忆、上下文管理与信息检索。希望 AI 能保留值得保留的东西，也能在需要的时候，恰当地想起来。",
  },
  {
    n: "03",
    name: "Code & everyday tools",
    title: "在使用中，重新创造",
    text: "学习计算机科学与软件开发，折腾 AI Coding、硬件和 Web 交互。遇到不顺手的地方，就试着自己做一个。",
  },
];

export default function AboutPage() {
  const travel = albums.find((album) => album.id === "travel-2026");
  const photo =
    travel?.photos.find((item) => item.caption === "路上的云") ||
    travel?.photos[0];
  return (
    <main className="page-wrap sp-secondary sp-about">
      <header className="sp-page-intro">
        <div className="eyebrow sp-overline">
          <span className="sp-small-dot" /> THE PERSON BEHIND THE PIXELS
        </div>
        <div className="sp-about-hero">
          <div>
            <p className="sp-about-greeting">你好，我是</p>
            <h1 className="sp-about-name">
              Sparink<span className="sp-blue">.</span>
            </h1>
            <p className="sp-about-tagline">保持好奇。亲手创造。</p>
          </div>
          <div className="sp-about-portrait">
            <img
              src="/avatar.webp"
              alt="Sparink 的头像"
              width={360}
              height={360}
            />
            <span className="eyebrow">COMPUTER SCIENCE / ALWAYS CURIOUS</span>
          </div>
        </div>
      </header>
      <section className="sp-about-story">
        <div className="eyebrow">01 / A LITTLE ABOUT ME</div>
        <div>
          <h2>
            喜欢拆开工具，
            <br />
            也喜欢造一把自己的。
          </h2>
          <p>
            我是一名计算机科学学生，对人工智能、软件开发和计算机硬件有着持续的兴趣。相比只把工具用起来，我更想知道它如何工作，又能不能做得更顺手一点。
          </p>
          <p>
            于是有了这里的项目：让 Agent 更好地协作，让 AI
            记住对话，也把日常生活里那些微小的不方便，变成一次动手的理由。
          </p>
          <Link className="sp-inline-link" href="/projects">
            看看我做了什么 <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="sp-about-interests">
        <div className="sp-section-heading">
          <span className="eyebrow">02 / CURRENT EXPLORATIONS</span>
          <h2>最近在想些什么</h2>
        </div>
        <div className="sp-interest-list">
          {interests.map((item) => (
            <article key={item.n}>
              <span className="sp-interest-number">{item.n}</span>
              <div>
                <span className="eyebrow">{item.name}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <ArrowUpRight size={26} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>
      <section className="sp-about-offline">
        <div className="sp-offline-image">
          {photo && (
            <img
              src={photo.url}
              alt={photo.caption || "旅行中的一刻"}
              loading="lazy"
            />
          )}
          <span className="eyebrow">A LITTLE LESS SCREEN TIME.</span>
        </div>
        <div>
          <span className="eyebrow">03 / AWAY FROM THE KEYBOARD</span>
          <h2>
            屏幕之外，
            <br />
            生活也在发生。
          </h2>
          <p>
            喜欢摄影、机械键盘和硬件，也会玩 Minecraft
            和原神。还有猫——糯米和十一，是相册里的常驻主角。
          </p>
          <p>
            把旅途中的云、窗外的风景和一些普通的日子留下来。它们和代码一样，也是我想认真收藏的东西。
          </p>
          <Link className="sp-inline-link" href="/photowall">
            翻翻我的相册 <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <div className="sp-page-end">
        <span>欢迎交流想法，也欢迎分享你的新发现。</span>
        <a href="mailto:sparinkme@gmail.com">
          写封邮件 <ArrowUpRight size={18} />
        </a>
      </div>
    </main>
  );
}
