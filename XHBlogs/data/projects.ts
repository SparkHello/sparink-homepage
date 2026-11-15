export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl?: string;
  visibility: "public" | "private";
  status: string;
  tags: string[];
  category: "agents" | "memory" | "apps";
  subtitle: string;
};

export const projectsData: Project[] = [
  {
    id: "kun",
    name: "Kun",
    subtitle: "An agent, a workspace, a possibility.",
    icon: "K",
    githubUrl: "https://github.com/SparkHello/Kun",
    visibility: "public",
    status: "公开项目",
    category: "agents",
    description:
      "一个本地优先的 AI Agent 工作台。把代码、写作、设计与研究放进同一个工作流，让桌面与终端共享任务、上下文和交付。",
    tags: ["AI Agent", "GUI + TUI", "Local-first"],
  },
  {
    id: "memory-platform",
    name: "Memory Platform",
    subtitle: "Good conversations deserve a memory.",
    icon: "M",
    githubUrl: "https://github.com/SparkHello/Memory_Platform",
    visibility: "public",
    status: "公开项目",
    category: "memory",
    description:
      "给正在使用的 AI 聊天应用加上一层长期记忆。自动召回相关上下文，保存值得记住的事；换个窗口、换个模型，对话依然可以继续。",
    tags: ["AI Memory", "Android", "Docker"],
  },
  {
    id: "lastchat",
    name: "LastChat",
    subtitle: "A more personal conversation.",
    icon: "L",
    githubUrl: "https://github.com/SparkHello/LastChat",
    visibility: "public",
    status: "基于 RikkaHub",
    category: "apps",
    description:
      "面向 Android 的个性化 AI 助手。基于 RikkaHub 改进，支持多模型、多模态、RAG 记忆与 MCP，让工具更贴近自己的使用习惯。",
    tags: ["Kotlin", "Jetpack Compose", "MCP"],
  },
  {
    id: "cocoon",
    name: "Cocoon · 破茧",
    subtitle: "Take back your feed.",
    icon: "C",
    visibility: "private",
    status: "私有实验",
    category: "agents",
    description:
      "一个 B 站个性化推荐实验台。用可解释的排序、明确的偏好与真实观看反馈，探索由自己掌握推荐主动权的可能。",
    tags: ["Recommendation", "LLM", "SQLite"],
  },
  {
    id: "lastchat-android",
    name: "LastChat Android",
    subtitle: "A small window into many models.",
    icon: "L",
    githubUrl: "https://github.com/SparkHello/LastChat-Android",
    visibility: "public",
    status: "公开项目",
    category: "apps",
    description:
      "一个轻量的 Android AI 聊天项目。支持多个模型提供商、流式输出和自定义助手，将对话历史保存在设备本地。",
    tags: ["Android", "Multi-model", "Local-first"],
  },
];
