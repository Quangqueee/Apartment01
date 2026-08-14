import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_PATH } from "@/lib/constants";
import { APARTMENTS_CACHE_TAG } from "@/lib/apartment-cache-tag";

export { APARTMENTS_CACHE_TAG };

/**
 * Bust Data Cache (unstable_cache) + route cache after apartment mutations.
 * Server-only: import this from Server Actions / Route Handlers, never from client code.
 * revalidatePath alone does NOT clear unstable_cache — need revalidateTag.
 */
export function revalidateApartmentListings(apartmentId?: string) {
  revalidateTag(APARTMENTS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/tim-kiem");
  revalidatePath("/apartments");
  revalidatePath(`/${ADMIN_PATH}`);
  revalidatePath(`/${ADMIN_PATH}/apartments`);
  if (apartmentId) {
    revalidatePath(`/apartments/${apartmentId}`);
  }
}
