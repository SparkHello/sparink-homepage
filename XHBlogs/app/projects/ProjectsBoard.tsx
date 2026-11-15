"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight, LockKeyhole } from "lucide-react";
import { projectsData, type Project } from "../../data/projects";

const categories = [
  { id: "all", label: "全部作品", en: "ALL" },
  { id: "agents", label: "智能体", en: "AGENTS" },
  { id: "memory", label: "记忆", en: "MEMORY" },
  { id: "apps", label: "应用", en: "APPS" },
];

function ProjectArtwork({ project }: { project: Project }) {
  if (project.id === "kun")
    return (
      <div className="sp-project-art sp-art-kun" aria-hidden="true">
        <span className="sp-art-caption">IDEA → ACTION</span>
        <div className="sp-kun-lines">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ transform: `rotate(${i * 20}deg)` }} />
          ))}
        </div>
        <span className="sp-kun-letter">K</span>
        <span className="sp-art-corner">A SHARED RUNTIME</span>
      </div>
    );
  if (project.id === "memory-platform")
    return (
      <div className="sp-project-art sp-art-memory" aria-hidden="true">
        <span className="sp-art-caption">CONTEXT, CONNECTED.</span>
        <svg viewBox="0 0 640 380" className="sp-memory-network">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M85 190 220 80 320 190 220 310 85 190 475 90 545 270 320 190 475 90M220 80 545 270 220 310 475 90" />
            <circle cx="320" cy="190" r="87" />
            <circle cx="320" cy="190" r="125" strokeDasharray="3 8" />
          </g>
          <g fill="currentColor">
            {[
              [85, 190],
              [220, 80],
              [320, 190],
              [220, 310],
              [475, 90],
              [545, 270],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 2 ? 12 : 5} />
            ))}
          </g>
        </svg>
        <span className="sp-memory-word">remember.</span>
        <span className="sp-art-corner">PAST ↔ PRESENT</span>
      </div>
    );
  if (project.id === "cocoon")
    return (
      <div className="sp-project-art sp-art-cocoon" aria-hidden="true">
        <span className="sp-art-caption">YOUR FEED. YOUR RULES.</span>
        <div className="sp-cocoon-shape">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ transform: `rotate(${i * 15}deg)` }} />
          ))}
        </div>
        <span className="sp-art-corner">BREAK THE LOOP</span>
      </div>
    );
  return (
    <div
      className={`sp-project-art sp-art-chat ${project.id === "lastchat-android" ? "sp-art-chat-light" : ""}`}
      aria-hidden="true"
    >
      <span className="sp-art-caption">A SPACE FOR CONVERSATION</span>
      <div className="sp-chat-symbol">
        <span />
        <span />
        <span />
      </div>
      <span className="sp-art-corner">HUMAN × AI</span>
    </div>
  );
}

export default function ProjectsBoard() {
  const [active, setActive] = useState("all");
  const [anchor, setAnchor] = useState<string | null>(null);
  const filtered = projectsData.filter(
    (project) => active === "all" || project.category === active,
  );
  useEffect(() => {
    function followHash() {
      const id = window.location.hash.slice(1);
      if (projectsData.some((project) => project.id === id)) {
        setActive("all");
        setAnchor(id);
      }
    }
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, []);
  useEffect(() => {
    if (!anchor || active !== "all") return;
    document
      .getElementById(anchor)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    setAnchor(null);
  }, [anchor, active]);
  function selectCategory(category: string) {
    setActive(category);
    setAnchor(null);
    const target = projectsData.find(
      (project) => `#${project.id}` === window.location.hash,
    );
    if (target && category !== "all" && target.category !== category) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }
  return (
    <main className="page-wrap sp-secondary sp-projects">
      <header className="sp-page-intro">
        <div className="eyebrow sp-overline">
          <span className="sp-small-dot" /> SELECTED WORK / 持续探索
        </div>
        <div className="sp-intro-grid">
          <h1>
            让好奇心，
            <br />
            有迹可循<span className="sp-blue">。</span>
          </h1>
          <p>
            从一个想法，到一个可以使用的工具。
            <br />
            这里收录我在 AI、记忆与日常软件里的探索。
            <span className="sp-intro-en">
              A collection of things I care enough to build.
            </span>
          </p>
        </div>
      </header>
      <div className="sp-filter-row">
        <div className="sp-filter-list" aria-label="筛选项目">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={active === category.id}
              onClick={() => selectCategory(category.id)}
              className={active === category.id ? "is-active" : ""}
            >
              <span>{category.label}</span>
              <small>{category.en}</small>
            </button>
          ))}
        </div>
        <span className="sp-filter-count" aria-live="polite">
          {String(filtered.length).padStart(2, "0")} PROJECTS
        </span>
      </div>
      <div className="sp-project-grid">
        {filtered.map((project) => (
          <article className="sp-project" id={project.id} key={project.id}>
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`在 GitHub 查看 ${project.name}`}
                className="sp-art-link"
              >
                <ProjectArtwork project={project} />
                <span className="sp-art-open">
                  <ArrowUpRight size={22} />
                </span>
              </a>
            ) : (
              <ProjectArtwork project={project} />
            )}
            <div className="sp-project-topline">
              <span className="eyebrow">{project.category.toUpperCase()}</span>
              <span>
                {project.visibility === "private" && <LockKeyhole size={12} />}
                {project.status}
              </span>
            </div>
            <h2>
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.name}
                  <ArrowUpRight size={24} />
                </a>
              ) : (
                project.name
              )}
            </h2>
            <p className="sp-project-subtitle">{project.subtitle}</p>
            <p className="sp-project-description">{project.description}</p>
            <div className="sp-project-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="sp-page-end">
        <span>还有一些想法，正在变成现实。</span>
        <a
          href="https://github.com/SparkHello"
          target="_blank"
          rel="noopener noreferrer"
        >
          更多 GitHub 仓库 <ArrowRight size={18} />
        </a>
      </div>
    </main>
  );
}
