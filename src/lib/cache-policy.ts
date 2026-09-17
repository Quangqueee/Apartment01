/**
 * Data Cache (`unstable_cache`) for listing queries. Stays until a write
 * calls revalidateApartmentListings(). No time-based refresh.
 *
 * Listing HTML (home, /tim-kiem, district landings) must NOT use
 * `export const revalidate = false` — that bakes Firestore into the
 * App Hosting image and comes back after cold start. Those pages use
 * `export const dynamic = "force-dynamic"` (literal in each page.tsx;
 * Next.js cannot follow imports for segment config).
 *
 * This constant is only for runtime APIs such as unstable_cache().
 */
export const LISTING_REVALIDATE = false;
