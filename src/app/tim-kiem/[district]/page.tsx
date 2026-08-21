import { notFound, permanentRedirect } from "next/navigation";
import {
  DISTRICT_LANDINGS,
  buildDistrictLandingHref,
  getDistrictBySlug,
} from "@/lib/districts";
import { toParamString } from "@/components/search-results";

type PageProps = {
  params: Promise<{ district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return DISTRICT_LANDINGS.map((item) => ({ district: item.slug }));
}

export default async function LegacyDistrictRedirect({
  params,
  searchParams,
}: PageProps) {
  const { district } = await params;
  const landing = getDistrictBySlug(district);
  if (!landing) notFound();

  const sParams = await searchParams;
  permanentRedirect(
    buildDistrictLandingHref(landing.slug, {
      sort: toParamString(sParams.sort),
      page: Number(toParamString(sParams.page) || "1") || 1,
      cursor: toParamString(sParams.cursor) || null,
    }),
  );
}
