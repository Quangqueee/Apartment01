import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = false;
export const generateMetadata = districtGenerateMetadata("nam-tu-liem");
export default DistrictSlugPage("nam-tu-liem");
