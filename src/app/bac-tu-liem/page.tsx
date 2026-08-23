import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = false;
export const generateMetadata = districtGenerateMetadata("bac-tu-liem");
export default DistrictSlugPage("bac-tu-liem");
