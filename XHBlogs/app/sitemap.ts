import type { MetadataRoute } from "next";
import { siteConfig } from "../siteConfig";
import { albums } from "../data/albums";
import { listDiaryEntries } from "../lib/diary";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/projects", "/timeline", "/about", "/colophon"];

  if (siteConfig.features.photoWall) routes.push("/photowall");
  if (siteConfig.features.music) routes.push("/music");
  if (siteConfig.features.lab) routes.push("/tree");
  if (siteConfig.features.moments) routes.push("/moments");
  if (siteConfig.features.chatter) routes.push("/chatter");
  if (siteConfig.features.friends) routes.push("/friends");

  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.siteUrl}${route}`,
    lastModified: new Date("2026-11-15T00:00:00+08:00"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
  if (siteConfig.features.photoWall) {
    for (const album of albums) pages.push({ url: `${siteConfig.siteUrl}/photowall/${encodeURIComponent(album.id)}`, changeFrequency: "monthly", priority: 0.7 });
  }
  for (const entry of await listDiaryEntries()) pages.push({ url: `${siteConfig.siteUrl}${entry.href}`, ...(entry.date ? { lastModified: entry.date } : {}), changeFrequency: "monthly", priority: 0.6 });
  return pages;
}
