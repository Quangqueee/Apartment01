import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Query params that belong on /tim-kiem — keep `/` fully static for ISR/CDN. */
const SEARCH_KEYS = [
  "query",
  "q",
  "district",
  "price",
  "roomType",
  "sort",
  "page",
  "cursor",
  "before",
] as const;

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const { searchParams } = request.nextUrl;
  const hasSearchIntent = SEARCH_KEYS.some((key) => searchParams.has(key));
  if (!hasSearchIntent) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/tim-kiem";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
