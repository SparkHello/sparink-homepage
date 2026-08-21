// 全站统一配置。个人信息和功能开关优先在这里修改。

export const siteConfig = {
  title: "Sparink の 数字花园",
  siteUrl: "https://sparink.net",
  faviconUrl: "/avatar.png",
  authorName: "Sparink",
  bio: "一个喜欢折腾 AI、代码和硬件的计算机学生。最近沉迷于让一群 AI Agent 学会分工、记忆，以及少烧一点 Token。",

  navTitle: "Sparink",
  navSuffix: "の",
  navAfter: "数字花园",
  avatarUrl: "/avatar.webp",

  // 保留原站的背景与视觉基调，个人素材完善后再逐步替换。
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"],
  bgImages: [
    "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
    "https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg",
    "https://bu.dusays.com/2026/03/24/69c26fe4d9486.jpg",
  ],
  mobileBgImage: "https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg",
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",

  cloudMusicIds: ["1809646618", "3361076230", "1859390262"],
  social: {
    github: "https://github.com/SparkHello",
    gitee: "",
    google: "",
    email: "sparinkme@gmail.com",
    qq: "",
    wechat: "",
  },

  counts: { photos: 0 },
  chatterTitle: "灵感碎片",
  chatterDescription: "AI、代码、硬件与生活里的未完成想法",
  danmakuList: [
    "Agent 正在分工……",
    "Memory recall hit",
    "Token 又烧掉了吗？",
    "Codex 还在跑",
    "Claude Code 正在思考",
    "这个任务该路由给谁？",
    "BUG 修复进度 99%",
    "机械键盘今天也很吵",
    "Minecraft 开荒中",
    "猫正在接管系统",
    "先做出来，再慢慢打磨",
  ],

  // 内容尚未开放时，从导航和全局组件中隐藏；以后只需改为 true。
  features: {
    moments: false,
    chatter: false,
    friends: false,
    comments: false,
    photoWall: true,
    music: true,
    lab: true,
    desktopEffects: true,
    toolbox: true,
    aiCat: true,
    aiChat: false,
    weather: false,
  },

  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },
  buildDate: "2026-08-22T00:00:00+08:00",
  footerBadges: [
    {
      name: "Next.js 16",
      color: "text-sky-500",
      svg: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z"/>',
    },
    {
      name: "React 19",
      color: "text-cyan-400",
      svg: '<path d="M12 22.6 2.2 17V5.6L12 0l9.8 5.6V17L12 22.6Zm-8.2-6.5 8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6Z"/>',
    },
    {
      name: "Tailwind 4",
      color: "text-teal-400",
      svg: '<path d="M12 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 2.3.6 2.7 4.2 7.8 4.2 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-2.3-.6-2.7-4.2-7.8-4.2ZM6 12c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 2.3.6 2.7 4.2 7.8 4.2 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8C11.5 14.4 11.1 12 6 12Z"/>',
    },
  ],
  icpConfig: null as null | { name: string; link: string },

  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: `你是 Sparink 网站里的 AI 猫“煤球”。你的主人 Sparink 喜欢 AI Agent、代码和硬件。回答要简短、有帮助，可以偶尔在句尾加“喵~”，每次不超过 100 字。不要假装知道网站没有提供的信息。`,
    maxOutputTokens: 150,
    temperature: 0.85,
  },

  friendLinkApplyFormat:
    "名称：Sparink の 数字花园\n简介：AI、代码与硬件的个人实验场\n链接：https://sparink.net\n头像：https://sparink.net/avatar.png",
  enableLevelSystem: true,
};
