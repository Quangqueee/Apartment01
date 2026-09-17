import {
  DistrictSlugPage,
  districtGenerateMetadata,
} from "@/lib/district-page";

export const dynamic = "force-dynamic";
export const generateMetadata = districtGenerateMetadata("dong-da");
export default DistrictSlugPage("dong-da");
