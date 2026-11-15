import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { MusicProvider } from "../components/MusicProvider";
import AtelierShell from "../components/atelier/AtelierShell";
const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://sparink.net"),
  title: { default: "Sparink — 保持好奇，持续构建", template: "%s · Sparink" },
  description:
    "Sparink 的个人数字工作室。探索 AI Agent、长期记忆、代码，以及屏幕之外的日常。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Sparink",
    title: "Sparink — 保持好奇，持续构建",
    description: "关于 AI、代码与生活的持续实验。",
    images: [{ url: "/atelier/og.png", width: 1200, height: 630 }],
  },
  icons: { icon: "/atelier/mark.svg", apple: "/avatar.png" },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <MusicProvider>
            <AtelierShell>{children}</AtelierShell>
          </MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
