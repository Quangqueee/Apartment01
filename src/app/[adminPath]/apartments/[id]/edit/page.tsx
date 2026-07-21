"use client";

import { getApartmentById } from "@/lib/data-client";
import { notFound } from "next/navigation";
import { useEffect, useState, use } from "react";
import { Apartment } from "@/lib/types";
import dynamic from "next/dynamic";
import ApartmentFormSkeleton from "@/components/apartment-form-skeleton";

const ApartmentForm = dynamic(() => import("@/components/apartment-form"), {
  loading: () => <ApartmentFormSkeleton />,
  ssr: false,
});

type EditApartmentPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditApartmentPage({ params }: EditApartmentPageProps) {
  const { id } = use(params);

  const [apartment, setApartment] = useState<Apartment | null | undefined>(
    undefined,
  );

  useEffect(() => {
    async function fetchApartment() {
      const data = await getApartmentById(id);
      setApartment(data);
    }
    fetchApartment();
  }, [id]);

  if (apartment === null) {
    notFound();
  }

  return (
    // Thêm bg-white để không bị trong suốt
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8 bg-white min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Edit Apartment
        </h2>
      </div>
      {apartment === undefined ? (
        <ApartmentFormSkeleton />
      ) : (
        <ApartmentForm apartment={apartment} />
      )}
    </div>
  );
}
