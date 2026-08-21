import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const revalidate = 60;
export const generateMetadata = districtGenerateMetadata("ha-dong");
export default DistrictSlugPage("ha-dong");
