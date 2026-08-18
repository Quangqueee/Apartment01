import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { SITE, SITE_PATHS, absoluteUrl } from "@/lib/site";

async function getApartmentEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getDocs(collection(firestore, "apartments"));

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const lastModified =
        data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();

      return {
        url: absoluteUrl(`/apartments/${doc.id}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.9,
      };
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách căn hộ cho sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apartmentEntries = await getApartmentEntries();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl(SITE_PATHS.search),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl(SITE_PATHS.about),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl(SITE_PATHS.faq),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl(SITE_PATHS.privacy),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl(SITE_PATHS.terms),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl(SITE_PATHS.partnerRegister),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/huong-dan-cong-viec"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl(SITE_PATHS.llms),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  return [...staticEntries, ...apartmentEntries];
}
