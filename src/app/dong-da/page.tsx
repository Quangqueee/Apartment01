import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = 60;
export const generateMetadata = districtGenerateMetadata("dong-da");
export default DistrictSlugPage("dong-da");
