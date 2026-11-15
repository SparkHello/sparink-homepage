import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Command,
  Plus,
} from "lucide-react";
import HeroArt from "../components/atelier/HeroArt";
import Reveal from "../components/atelier/Reveal";
import { albums } from "../data/albums";
import { siteConfig } from "../siteConfig";
export default function Home() {
  const travel = albums.find((album) => album.id === "travel-2026");
  const photos = [
    travel?.photos[6],
    travel?.photos[0],
    albums[0]?.photos[0],
  ].filter(Boolean);
  return (
    <main className="home-page">
      <section className="hero page-wrap" aria-labelledby="hero-heading">
        <div className="hero-topline eyebrow">
          <span>
            <i className="live-dot" /> A PERSONAL SPACE FOR EXPLORATION
          </span>
          <span>CODE · CURIOSITY · LIFE</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-greeting">
              你好，我是 Sparink <span>↗</span>
            </p>
            <h1 id="hero-heading">
              保持好奇。
              <br />
              持续<span className="cobalt">构建</span>。
            </h1>
            <p className="hero-description">
              在代码与生活的交界处，
              <br />
              把一些好奇，变成摸得着的东西。
            </p>
            <div className="hero-actions">
              <Link href="/projects" className="button-primary">
                探索我的作品 <ArrowUpRight size={18} />
              </Link>
              <Link href="/about" className="text-link">
                认识我 <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-identity">
              <span className="identity-line" />
              <span>
                计算机科学学生
                <br />
                <small>INDEPENDENT BUILDER</small>
              </span>
            </div>
          </div>
          <HeroArt />
        </div>
        <div className="hero-baseline">
          <span className="eyebrow">BASED IN CURIOSITY.</span>
          <p>
            AI Agents <span>/</span> Long-term Memory <span>/</span> Everyday
            Experiments
          </p>
          <a href="#selected-work" aria-label="向下浏览精选项目">
            <ArrowDownRight size={23} />
          </a>
        </div>
      </section>
      <section
        id="selected-work"
        className="work-section page-wrap"
        aria-labelledby="work-heading"
      >
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="section-kicker">01 / SELECTED WORK</p>
              <h2 id="work-heading">
                让想法，
                <br />
                <span className="muted">开始运行。</span>
              </h2>
            </div>
            <div className="section-aside">
              <p>
                一些正在生长的项目。
                <br />
                关于更好的工具，也关于新的可能。
              </p>
              <Link href="/projects" className="text-link">
                全部作品 <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <Link href="/projects#kun" className="featured-project">
            <div className="project-visual kun-visual">
              <div className="visual-caption eyebrow">
                KUN / THE AGENT WORKSPACE
              </div>
              <div className="kun-window" aria-label="Kun 工作台概念示意">
                <div className="window-rail">
                  <span className="mini-k">K</span>
                  <Plus size={15} />
                  <span>⌘</span>
                  <span>◎</span>
                  <span>⊞</span>
                </div>
                <div className="window-main">
                  <div className="window-topbar">
                    <span>Workspace</span>
                    <span className="window-dots">● ● ●</span>
                  </div>
                  <div className="window-welcome">
                    <Command size={24} />
                    <h3>
                      A little curiosity.
                      <br />A world of possibility.
                    </h3>
                    <p>每一个想法，都值得一个开始。</p>
                  </div>
                  <div className="mock-prompt">
                    <span>今天，我们一起做点什么？</span>
                    <span className="prompt-submit">↑</span>
                  </div>
                  <div className="mock-modes">
                    <span>⌘ Code</span>
                    <span>✳ Write</span>
                    <span>◇ Design</span>
                  </div>
                </div>
              </div>
              <div className="visual-footnote">概念演绎 · GUI + TUI</div>
              <span className="project-open">
                <ArrowUpRight />
              </span>
            </div>
            <div className="project-caption">
              <div>
                <h3>
                  Kun <span>01</span>
                </h3>
                <p>从一个想法，到一次真正的交付。</p>
              </div>
              <span className="project-category">AI AGENT WORKSPACE</span>
            </div>
          </Link>
        </Reveal>
        <div className="project-pair">
          <Reveal>
            <Link href="/projects#memory-platform" className="project-card">
              <div className="project-visual memory-visual">
                <div className="visual-caption eyebrow">
                  MEMORY / CONTINUITY
                </div>
                <div className="memory-diagram" aria-hidden="true">
                  <div className="memory-orbit orbit-a" />
                  <div className="memory-orbit orbit-b" />
                  <div className="memory-orbit orbit-c" />
                  <span className="memory-node node-one">想法</span>
                  <span className="memory-node node-two">偏好</span>
                  <span className="memory-node node-three">日常</span>
                  <div className="memory-core">
                    m<span>·</span>
                  </div>
                </div>
                <span className="project-open">
                  <ArrowUpRight />
                </span>
              </div>
              <div className="project-caption">
                <div>
                  <h3>
                    Memory Platform <span>02</span>
                  </h3>
                  <p>让对话结束之后，记忆仍然继续。</p>
                </div>
              </div>
            </Link>
          </Reveal>
          <Reveal>
            <Link href="/projects#lastchat" className="project-card">
              <div className="project-visual chat-visual">
                <div className="visual-caption eyebrow">
                  LASTCHAT / A PERSONAL AI
                </div>
                <div className="chat-composition">
                  <div className="chat-orb">✳</div>
                  <div className="chat-bubble chat-question">
                    好的工具，应该是什么样子？
                  </div>
                  <div className="chat-bubble chat-answer">
                    理解你的习惯，
                    <br />
                    也尊重你的不同。
                    <span className="chat-cursor" />
                  </div>
                  <div className="chat-meta">
                    LOCAL FIRST <span>↗</span> MADE PERSONAL
                  </div>
                </div>
                <span className="project-open">
                  <ArrowUpRight />
                </span>
              </div>
              <div className="project-caption">
                <div>
                  <h3>
                    LastChat <span>03</span>
                  </h3>
                  <p>一个更贴近自己的 Android AI 助手。</p>
                </div>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>
      <section className="about-band">
        <div className="page-wrap">
          <Reveal>
            <div className="about-band-grid">
              <div>
                <p className="section-kicker">02 / THE PERSON BEHIND</p>
                <div className="about-symbol" aria-hidden="true">
                  ✳
                </div>
                <span className="eyebrow">
                  A WORK IN PROGRESS.
                  <br />
                  JUST LIKE ME.
                </span>
              </div>
              <div>
                <h2>
                  喜欢拆开工具，
                  <br />
                  也喜欢<span>亲手创造。</span>
                </h2>
                <p>
                  我是 Sparink，一名计算机科学学生。我关心 AI
                  如何协作、记忆如何延续，也享受把一个模糊的念头，一点点做成真实工具的过程。
                </p>
                <p>屏幕之外，是旅行、摄影、机械键盘，以及猫。</p>
                <Link href="/about" className="text-link">
                  更多关于我 <ArrowUpRight size={18} />
                </Link>
                <div className="interest-line">
                  <span>AI & AGENTS</span>
                  <span>CODE & HARDWARE</span>
                  <span>CATS & LIFE</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      {siteConfig.features.photoWall && (
        <section className="life-section page-wrap">
          <Reveal>
            <div className="section-heading">
              <div>
                <p className="section-kicker">03 / OFF THE SCREEN</p>
                <h2>
                  也看看，
                  <br />
                  <span className="muted">屏幕之外。</span>
                </h2>
              </div>
              <div className="section-aside">
                <p>
                  不只有代码。
                  <br />
                  还有路上的云，和一些小小的日常。
                </p>
                <Link href="/photowall" className="text-link">
                  打开相册 <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </Reveal>
          <div className="life-grid">
            {photos.map(
              (photo, index) =>
                photo && (
                  <Reveal
                    key={photo.url}
                    className={`life-photo life-photo-${index}`}
                  >
                    <Link href="/photowall">
                      <div className="life-image">
                        <img
                          src={photo.url}
                          alt={photo.caption || "糯米与十一的日常"}
                          loading="lazy"
                        />
                        <span className="photo-hover">
                          <ArrowUpRight /> 查看相册
                        </span>
                      </div>
                      <div className="photo-caption">
                        <span>
                          {index === 2
                            ? "糯米 & 十一"
                            : photo.caption || "途中"}
                        </span>
                        <small>
                          0{index + 1} /{" "}
                          {index === 2 ? "EVERYDAY" : "ON THE ROAD"}
                        </small>
                      </div>
                    </Link>
                  </Reveal>
                ),
            )}
          </div>
        </section>
      )}
      <section className="journal-teaser page-wrap">
        <Reveal>
          <div className="journal-line">
            <span className="section-kicker">04 / FIELD NOTES</span>
            <div>
              <h2>思考，也留下痕迹。</h2>
              <p>把折腾过的过程、试错和新发现，慢慢写下来。</p>
            </div>
            <Link
              className="circle-link"
              href="/timeline"
              aria-label="阅读手记"
            >
              <ArrowUpRight size={26} />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
