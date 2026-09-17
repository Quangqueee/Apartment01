import { notFound } from "next/navigation";
import { ADMIN_PATH } from "@/lib/constants";
import AdminLayoutClient from "./admin-layout-client";

export default async function AdminPathLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminPath: string }>;
}) {
  const { adminPath } = await params;
  if (adminPath !== ADMIN_PATH) {
    notFound();
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
