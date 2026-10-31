import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const dynamic = "force-dynamic";
export const generateMetadata = districtGenerateMetadata("tay-ho");
export default DistrictSlugPage("tay-ho");
