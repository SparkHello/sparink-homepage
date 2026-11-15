import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../components/atelier/personal.css";
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
  title: { default: "Sparink · 日记与相册", template: "%s · Sparink" },
  description:
    "Sparink 的个人生活记录。日记、相册和一些日常碎片，留给以后慢慢回看。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Sparink",
    title: "Sparink · 日记与相册",
    description: "写日记，放照片，留住一些普通的日子。",
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
