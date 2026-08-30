import {
  revalidatePath,
  revalidateTag,
  unstable_expirePath,
  unstable_expireTag,
} from "next/cache";
import { ADMIN_PATH } from "@/lib/constants";
import { APARTMENTS_CACHE_TAG } from "@/lib/apartment-cache-tag";
import { DISTRICT_LANDINGS } from "@/lib/districts";

export { APARTMENTS_CACHE_TAG };

function applyLocalRevalidate(apartmentId?: string) {
  unstable_expireTag(APARTMENTS_CACHE_TAG);
  revalidateTag(APARTMENTS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  unstable_expirePath("/");
  revalidatePath("/tim-kiem");
  unstable_expirePath("/tim-kiem");
  revalidatePath("/apartments");
  revalidatePath("/sitemap.xml");
  unstable_expirePath("/sitemap.xml");
  revalidatePath(`/${ADMIN_PATH}`);
  revalidatePath(`/${ADMIN_PATH}/apartments`);
  for (const landing of DISTRICT_LANDINGS) {
    revalidatePath(`/${landing.slug}`);
    unstable_expirePath(`/${landing.slug}`);
  }
  if (apartmentId) {
    revalidatePath(`/apartments/${apartmentId}`);
    unstable_expirePath(`/apartments/${apartmentId}`);
  }
}

/**
 * When admin writes run on localhost, also bust App Hosting cache.
 * Skipped on production (NODE_ENV=production) to avoid a self-HTTP loop.
 * Requires REVALIDATE_SECRET on both local `.env` and App Hosting.
 */
async function pingProductionRevalidate(apartmentId?: string) {
  if (process.env.NODE_ENV === "production") return;
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;

  const base = (
    process.env.PRODUCTION_REVALIDATE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://hanoiresidence.site"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apartmentId: apartmentId ?? null }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Production revalidate failed:", res.status, detail);
    }
  } catch (error) {
    console.error("Production revalidate error:", error);
  }
}

/**
 * Bust Data Cache (unstable_cache) + route cache after apartment mutations.
 * Server-only: import this from Server Actions / Route Handlers, never from client code.
 * revalidatePath alone does NOT clear unstable_cache — need revalidateTag / expireTag.
 * expire* is immediate so push/sửa/xóa hiện ngay, không phụ thuộc TTL.
 */
export async function revalidateApartmentListings(
  apartmentId?: string,
  options?: { skipRemote?: boolean },
) {
  applyLocalRevalidate(apartmentId);
  if (!options?.skipRemote) {
    await pingProductionRevalidate(apartmentId);
  }
}
