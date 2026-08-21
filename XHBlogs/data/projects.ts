export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl?: string;
  visibility: "public" | "private";
  status: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    id: "memory-platform",
    name: "Memory Platform",
    githubUrl: "https://github.com/SparkHello/Memory_Platform",
    description:
      "一个本地优先、可审计的 AI 长期记忆层，为 OpenAI 兼容客户端和 MCP 提供自动召回、上下文注入与记忆提取。",
    icon: "🧠",
    visibility: "public",
    status: "持续开发",
    tags: ["AI Memory", "Multi-Agent", "MCP", "FastAPI", "React", "Local-first"],
  },
  {
    id: "cocoon",
    name: "Cocoon · 破茧",
    description:
      "一个本地优先的个性化推荐代理实验，让偏好、反馈和排序过程可审查、可回档，把推荐算法的主动权拿回来。",
    icon: "🦋",
    visibility: "private",
    status: "私有实验",
    tags: ["Recommendation", "LLM", "Agent", "SQLite", "Local-first", "Bilibili"],
  },
];
