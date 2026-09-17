"use client";

import dynamic from "next/dynamic";
import ApartmentFormSkeleton from "@/components/apartment-form-skeleton";

const ShortTermForm = dynamic(() => import("@/components/short-term-form"), {
  loading: () => <ApartmentFormSkeleton />,
});

export default function NewShortTermPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Thêm căn hộ ngắn hạn
        </h2>
      </div>
      <ShortTermForm mode="admin" />
    </div>
  );
}
