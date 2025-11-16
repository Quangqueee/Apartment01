
'use client';

import dynamic from 'next/dynamic';
import ApartmentFormSkeleton from "@/components/apartment-form-skeleton";

// Use dynamic import for the form to speed up initial page load
const ApartmentForm = dynamic(() => import('@/components/apartment-form'), {
  loading: () => <ApartmentFormSkeleton />,
});

export default function NewApartmentPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Add New Apartment
        </h2>
      </div>
      <ApartmentForm />
    </div>
  );
}
