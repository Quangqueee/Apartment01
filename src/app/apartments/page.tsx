import { redirect } from "next/navigation";
import { SITE_PATHS } from "@/lib/site";

export default function ApartmentsIndexPage() {
  redirect(SITE_PATHS.search);
}
