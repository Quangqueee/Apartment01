import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchPaginationProps = {
  currentPage: number;
  totalPages: number;
  nextCursor: string | null;
  query: string;
  district: string;
  price: string;
  roomType: string;
  sort: string;
};

const buildHref = ({
  query,
  district,
  price,
  roomType,
  sort,
  page,
  cursor,
}: {
  query: string;
  district: string;
  price: string;
  roomType: string;
  sort: string;
  page: number;
  cursor?: string | null;
}) => {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (district) params.set("district", district);
  if (price) params.set("price", price);
  if (roomType) params.set("roomType", roomType);
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  if (cursor && page > 1) params.set("cursor", cursor);
  const queryString = params.toString();
  return queryString ? `/tim-kiem?${queryString}` : "/tim-kiem";
};

const getVisiblePages = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)
    .reduce<(number | "ellipsis")[]>((items, page, index, list) => {
      if (index > 0 && page - (list[index - 1] as number) > 1) {
        items.push("ellipsis");
      }
      items.push(page);
      return items;
    }, []);
};

export default function SearchPagination({
  currentPage,
  totalPages,
  nextCursor,
  query,
  district,
  price,
  roomType,
  sort,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const shared = { query, district, price, roomType, sort };
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Phân trang kết quả tìm kiếm"
      className="mt-6 flex flex-wrap items-center justify-center gap-1.5 overflow-x-hidden"
    >
      <Link
        href={buildHref({ ...shared, page: Math.max(1, currentPage - 1) })}
        aria-disabled={currentPage <= 1}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm font-semibold transition-colors",
          currentPage <= 1
            ? "pointer-events-none border-gray-100 text-gray-300"
            : "border-gray-200 text-gray-700 hover:border-[#cda533] hover:text-[#cda533]",
        )}
      >
        <ChevronLeft className="h-4 w-4" /> Trước
      </Link>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-gray-400"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref({
              ...shared,
              page,
              cursor:
                page === currentPage + 1 && nextCursor ? nextCursor : null,
            })}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors",
              page === currentPage
                ? "border-[#cda533] bg-[#cda533] text-white"
                : "border-gray-200 text-gray-700 hover:border-[#cda533] hover:text-[#cda533]",
            )}
          >
            {page}
          </Link>
        ),
      )}

      <Link
        href={buildHref({
          ...shared,
          page: Math.min(totalPages, currentPage + 1),
          cursor: nextCursor,
        })}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm font-semibold transition-colors",
          currentPage >= totalPages
            ? "pointer-events-none border-gray-100 text-gray-300"
            : "border-gray-200 text-gray-700 hover:border-[#cda533] hover:text-[#cda533]",
        )}
      >
        Sau <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
