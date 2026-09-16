import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { projects } from "@/content/projects";
import { hasTeamProfiles } from "@/content/team";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();
  // Meet the Team is only worth indexing once it has real people on it.
  const pages = ["", "/services", "/projects", "/about", "/contact", "/quote", ...(hasTeamProfiles ? ["/meet-the-team"] : [])];
  const statics = pages.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : p === "/quote" ? 0.9 : 0.7,
  }));
  const serviceUrls = services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 }));
  // Placeholder case studies are excluded until real ones exist.
  const projectUrls = projects.filter((p) => !p.placeholder).map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.6 }));
  return [...statics, ...serviceUrls, ...projectUrls];
}
