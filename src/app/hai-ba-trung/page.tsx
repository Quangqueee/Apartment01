import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const dynamic = "force-dynamic";
export const generateMetadata = districtGenerateMetadata("hai-ba-trung");
export default DistrictSlugPage("hai-ba-trung");
