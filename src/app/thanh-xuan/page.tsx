import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const dynamic = "force-dynamic";
export const generateMetadata = districtGenerateMetadata("thanh-xuan");
export default DistrictSlugPage("thanh-xuan");
