import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDistrictLandingHref, buildSearchHref } from "@/lib/districts";

type SearchPaginationProps = {
  currentPage: number;
  totalPages: number;
  nextCursor: string | null;
  prevAnchor?: string | null;
  query: string;
  district: string;
  price: string;
  roomType: string;
  sort: string;
  basePath?: string;
};

const buildHref = ({
  query,
  district,
  price,
  roomType,
  sort,
  page,
  cursor,
  before,
  basePath,
}: {
  query: string;
  district: string;
  price: string;
  roomType: string;
  sort: string;
  page: number;
  cursor?: string | null;
  before?: string | null;
  basePath?: string;
}) => {
  if (basePath) {
    return buildDistrictLandingHref(basePath.replace(/^\//, ""), {
      sort,
      page,
      cursor,
      before,
    });
  }
  return buildSearchHref({
    query,
    districts: district ? district.split(",").filter(Boolean) : [],
    price,
    roomType,
    sort,
    page,
    cursor,
    before,
  });
};

export default function SearchPagination({
  currentPage,
  totalPages,
  nextCursor,
  prevAnchor,
  query,
  district,
  price,
  roomType,
  sort,
  basePath,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const shared = { query, district, price, roomType, sort, basePath };

  return (
    <nav
      aria-label="Phân trang kết quả tìm kiếm"
      className="mt-6 flex flex-wrap items-center justify-center gap-2 overflow-x-hidden"
    >
      <Link
        href={
          currentPage <= 2
            ? buildHref({ ...shared, page: 1 })
            : buildHref({
                ...shared,
                page: currentPage - 1,
                before: prevAnchor,
              })
        }
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

      <span className="min-w-[7.5rem] px-2 text-center text-sm font-semibold text-gray-600">
        Trang {currentPage} / {totalPages}
      </span>

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
