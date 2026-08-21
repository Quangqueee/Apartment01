import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export { revalidate } from "@/lib/district-page";
export const generateMetadata = districtGenerateMetadata("long-bien");
export default DistrictSlugPage("long-bien");
