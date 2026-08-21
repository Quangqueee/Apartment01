import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export { revalidate } from "@/lib/district-page";
export const generateMetadata = districtGenerateMetadata("cau-giay");
export default DistrictSlugPage("cau-giay");
