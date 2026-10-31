"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import ApartmentFormSkeleton from "@/components/apartment-form-skeleton";
import { getShortTermApartmentByIdClient } from "@/lib/short-term-data-client";
import type { ShortTermApartment } from "@/lib/types";

const ShortTermForm = dynamic(() => import("@/components/short-term-form"), {
  loading: () => <ApartmentFormSkeleton />,
});

export default function EditShortTermPage() {
  const params = useParams<{ id: string }>();
  const [apartment, setApartment] = useState<ShortTermApartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    getShortTermApartmentByIdClient(params.id)
      .then(setApartment)
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="text-center py-20 text-gray-500">
        Không tìm thấy căn hộ ngắn hạn này.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Chỉnh sửa căn hộ ngắn hạn
        </h2>
      </div>
      <ShortTermForm mode="admin" apartment={apartment} />
    </div>
  );
}
