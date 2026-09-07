import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import {
  PWA_BACKGROUND_COLOR,
  PWA_ICON_192,
  PWA_ICON_512,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: SITE.url,
    name: SITE.name,
    short_name: PWA_SHORT_NAME,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "vi",
    dir: "ltr",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["lifestyle", "business"],
    display_override: ["standalone", "minimal-ui"],
    icons: [
      {
        src: PWA_ICON_192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: PWA_ICON_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
