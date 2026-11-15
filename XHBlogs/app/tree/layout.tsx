import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "形态实验室",
  description: "关于连接与记忆的原创交互视觉实验。",
};
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
