import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = 60;
export const generateMetadata = districtGenerateMetadata("thanh-xuan");
export default DistrictSlugPage("thanh-xuan");
