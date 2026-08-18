import { MetadataRoute } from "next";
import { SITE, SITE_PATHS } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallowRoutes = [
    "/api/",
    "/ctv-register",
    "/admin/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/profile",
    "/favorites",
  ];

  const aiUserAgents = [
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "PerplexityBot",
    "ClaudeBot",
    "anthropic-ai",
    "Claude-SearchBot",
    "Google-Extended",
    "GoogleOther",
    "Applebot-Extended",
    "Amazonbot",
    "CCBot",
    "meta-externalagent",
    "Bytespider",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", SITE_PATHS.llms],
        disallow: disallowRoutes,
      },
      {
        userAgent: aiUserAgents,
        allow: ["/", SITE_PATHS.llms],
        disallow: disallowRoutes,
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
