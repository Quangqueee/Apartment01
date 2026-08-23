/**
 * Cache listing pages forever. Fresh data only after a write
 * (push / save / delete) calls revalidateApartmentListings().
 *
 * Next.js `export const revalidate` on pages/routes MUST be the literal
 * `false` — the compiler cannot follow imports or re-exports
 * (invalid-page-config). Keep those exports in sync with this value.
 * This constant is for runtime APIs such as unstable_cache().
 */
export const LISTING_REVALIDATE = false;
