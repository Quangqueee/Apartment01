import { MetadataRoute } from "next";
import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { SITE, SITE_PATHS, absoluteUrl } from "@/lib/site";

/** ISR: Google crawls sitemap often; avoid a Firestore round-trip every hit. */
export const revalidate = 3600;

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const FIRESTORE_TIMEOUT_MS = 8_000;

function toLastModified(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (value && typeof value === "object") {
    const withToDate = value as { toDate?: () => Date };
    if (typeof withToDate.toDate === "function") {
      try {
        const parsed = withToDate.toDate();
        if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        // Fall through to seconds / default.
      }
    }

    const withSeconds = value as { seconds?: number };
    if (typeof withSeconds.seconds === "number") {
      const parsed = new Date(withSeconds.seconds * 1000);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`sitemap Firestore timeout after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl(SITE_PATHS.search),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl(SITE_PATHS.about),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl(SITE_PATHS.faq),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl(SITE_PATHS.privacy),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl(SITE_PATHS.terms),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl(SITE_PATHS.partnerRegister),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/huong-dan-cong-viec"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl(SITE_PATHS.llms),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}

async function getPublishedApartmentEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const apartmentsRef = collection(firestore, "apartments");
  let lastDoc: QueryDocumentSnapshot<DocumentData> | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const pageQuery = lastDoc
      ? query(
          apartmentsRef,
          where("submissionStatus", "==", "published"),
          startAfter(lastDoc),
          limit(PAGE_SIZE),
        )
      : query(
          apartmentsRef,
          where("submissionStatus", "==", "published"),
          limit(PAGE_SIZE),
        );

    const snapshot = await withTimeout(
      getDocs(pageQuery),
      FIRESTORE_TIMEOUT_MS,
    );
    if (snapshot.empty) break;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      entries.push({
        url: absoluteUrl(`/apartments/${docSnap.id}`),
        lastModified: toLastModified(data.updatedAt ?? data.createdAt),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < PAGE_SIZE) break;
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls = staticEntries();

  try {
    const apartmentEntries = await getPublishedApartmentEntries();
    return [...staticUrls, ...apartmentEntries];
  } catch (error) {
    console.error("Lỗi khi tạo sitemap căn hộ:", error);
    return staticUrls;
  }
}
