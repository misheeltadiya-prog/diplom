import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const PATHS = ["/", "/jobs", "/freelancers", "/companies", "/login", "/register"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  return PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "daily",
    priority: path === "/" ? 1 : 0.8,
  }));
}
