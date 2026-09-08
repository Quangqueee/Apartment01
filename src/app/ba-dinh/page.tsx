import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = false;
export const generateMetadata = districtGenerateMetadata("ba-dinh");
export default DistrictSlugPage("ba-dinh");
