"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackButton from "../../components/BackButton";
import { Project, projectsData } from "../../data/projects";

const cardClassName =
  "block h-full rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden hover:shadow-indigo-500/20 transition-all duration-700 hover:-translate-y-1 group relative p-6 md:p-8";

function ProjectCard({ project }: { project: Project }) {
  const content = (
    <>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors duration-700" />

      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-4xl shrink-0" aria-hidden="true">{project.icon}</span>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {project.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border ${project.visibility === "public" ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20"}`}>
                {project.visibility === "public" ? "Public" : "Private"}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{project.status}</span>
            </div>
          </div>
        </div>

        {project.githubUrl ? (
          <svg aria-hidden="true" className="w-8 h-8 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        ) : (
          <span className="text-2xl text-amber-500 shrink-0" title="私有仓库" aria-label="私有仓库">🔒</span>
        )}
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed mb-6 relative z-10 min-h-[60px]">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 relative z-10 mt-auto">
        {project.tags.map((tag) => (
          <span key={tag} className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md shadow-sm border border-indigo-500/20">
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  if (project.githubUrl) {
    return (
      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={cardClassName} aria-label={`在 GitHub 查看 ${project.name}`}>
        {content}
      </a>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}

export default function ProjectsBoard() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projectsData;

    return projectsData.filter((project) =>
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-10 relative z-10">
      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6"><BackButton /></div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-widest drop-shadow-sm uppercase">
            Projects Matrix
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif">
            关于 AI Agent、长期记忆与个性化软件的一些实践。
          </p>
        </div>
      </div>

      <div className="mb-12 flex justify-center w-full">
        <div className="relative w-full max-w-lg">
          <input
            type="search"
            placeholder="搜索项目名称、描述或技术栈…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-6 py-3 pl-12 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500 font-serif"
          />
          <svg aria-hidden="true" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              key={project.id}
              className="h-full"
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 text-slate-500 font-serif w-full">
            没有找到与“{searchQuery}”匹配的项目。
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
