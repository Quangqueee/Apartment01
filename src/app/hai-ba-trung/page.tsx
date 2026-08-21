import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = 60;
export const generateMetadata = districtGenerateMetadata("hai-ba-trung");
export default DistrictSlugPage("hai-ba-trung");
