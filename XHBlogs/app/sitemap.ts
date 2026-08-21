import type { MetadataRoute } from "next";
import { siteConfig } from "../siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/projects", "/timeline", "/about"];

  if (siteConfig.features.photoWall) routes.push("/photowall");
  if (siteConfig.features.music) routes.push("/music");
  if (siteConfig.features.lab) routes.push("/tree");
  if (siteConfig.features.moments) routes.push("/moments");
  if (siteConfig.features.chatter) routes.push("/chatter");
  if (siteConfig.features.friends) routes.push("/friends");

  return routes.map((route) => ({
    url: `${siteConfig.siteUrl}${route}`,
    lastModified: new Date("2026-08-22T00:00:00+08:00"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
