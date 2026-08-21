import type { Metadata } from "next";
import SearchResults from "@/components/search-results";
import { SITE_PATHS } from "@/lib/site";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 60;

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Tìm kiếm căn hộ",
  description:
    "Kết quả tìm kiếm căn hộ cho thuê tại Hà Nội theo khu vực, loại phòng và ngân sách.",
  alternates: {
    canonical: SITE_PATHS.search,
    languages: {
      "vi-VN": SITE_PATHS.search,
      "x-default": SITE_PATHS.search,
    },
  },
});

export default async function SearchResultsPage({ searchParams }: PageProps) {
  const sParams = await searchParams;
  return <SearchResults searchParams={sParams} />;
}
