import { SITE } from "@/lib/site";
import {
  PWA_APPLE_TOUCH_ICON,
  PWA_MANIFEST_PATH,
  PWA_THEME_COLOR,
} from "@/lib/pwa";

/**
 * Safari reads PWA hints from the initial HTML <head>.
 * Next.js 15 streams Metadata API tags into <body>, so iOS Add to Home Screen
 * would otherwise create a Safari bookmark instead of standalone.
 */
export function PwaHead() {
  return (
    <head>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={SITE.name} />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
      />
      <link rel="manifest" href={PWA_MANIFEST_PATH} />
      <link rel="apple-touch-icon" href={PWA_APPLE_TOUCH_ICON} />
    </head>
  );
}
