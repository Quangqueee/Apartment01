import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export { revalidate } from "@/lib/district-page";
export const generateMetadata = districtGenerateMetadata("dong-da");
export default DistrictSlugPage("dong-da");
