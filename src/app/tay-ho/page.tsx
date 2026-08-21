import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export { revalidate } from "@/lib/district-page";
export const generateMetadata = districtGenerateMetadata("tay-ho");
export default DistrictSlugPage("tay-ho");
