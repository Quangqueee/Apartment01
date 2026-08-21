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

/**
 * Bust Data Cache (unstable_cache) + route cache after apartment mutations.
 * Server-only: import this from Server Actions / Route Handlers, never from client code.
 * revalidatePath alone does NOT clear unstable_cache — need revalidateTag / expireTag.
 * expire* is immediate so push/sửa/xóa hiện ngay, không phụ thuộc TTL.
 */
export function revalidateApartmentListings(apartmentId?: string) {
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
