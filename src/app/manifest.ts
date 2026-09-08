import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import {
  PWA_APPLE_TOUCH_ICON,
  PWA_BACKGROUND_COLOR,
  PWA_ICON_192,
  PWA_ICON_512,
  PWA_ORIENTATION,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE.name,
    short_name: PWA_SHORT_NAME,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "vi",
    dir: "ltr",
    orientation: PWA_ORIENTATION,
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["lifestyle", "business"],
    icons: [
      {
        src: PWA_APPLE_TOUCH_ICON,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
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
