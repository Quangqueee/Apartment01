import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export { revalidate } from "@/lib/district-page";
export const generateMetadata = districtGenerateMetadata("bac-tu-liem");
export default DistrictSlugPage("bac-tu-liem");
