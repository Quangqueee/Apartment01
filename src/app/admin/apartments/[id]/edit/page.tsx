import ApartmentForm from "@/components/apartment-form";
import { getApartmentById } from "@/lib/data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type EditApartmentPageProps = {
  params: {
    id: string;
  };
};

export default async function EditApartmentPage({
  params,
}: EditApartmentPageProps) {
  const apartment = await getApartmentById(params.id);

  if (!apartment) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Edit Apartment
        </h2>
      </div>
      <ApartmentForm apartment={apartment} />
    </div>
  );
}
