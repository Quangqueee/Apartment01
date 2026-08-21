import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictLandingPage from "@/components/district-landing-page";
import { districtMetadata, getDistrictBySlug } from "@/lib/districts";

export { LISTING_REVALIDATE as revalidate } from "@/lib/cache-policy";

export function districtGenerateMetadata(slug: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const landing = getDistrictBySlug(slug);
    if (!landing) return { title: "Không tìm thấy khu vực" };
    return districtMetadata(landing);
  };
}

export function DistrictSlugPage(slug: string) {
  return async function Page({
    searchParams,
  }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }) {
    const landing = getDistrictBySlug(slug);
    if (!landing) notFound();
    const sParams = await searchParams;
    return <DistrictLandingPage landing={landing} searchParams={sParams} />;
  };
}
