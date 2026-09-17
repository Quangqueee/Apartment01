import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const dynamic = "force-dynamic";
export const generateMetadata = districtGenerateMetadata("cau-giay");
export default DistrictSlugPage("cau-giay");
