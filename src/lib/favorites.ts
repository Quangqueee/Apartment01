export const FAVORITES_PAGE_LIMIT = 30;

export function normalizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
}

/** Newest first: arrayUnion appends to the user-doc array; extras come from the subcollection. */
export function mergeFavoriteIds(
  arrayIds: unknown,
  subcollectionIds: string[],
): string[] {
  const fromArray = normalizeFavoriteIds(arrayIds);
  const seen = new Set<string>();
  const newestFirst: string[] = [];

  for (const id of [...fromArray].reverse()) {
    if (seen.has(id)) continue;
    seen.add(id);
    newestFirst.push(id);
  }

  for (const id of subcollectionIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    newestFirst.push(id);
  }

  return newestFirst;
}
