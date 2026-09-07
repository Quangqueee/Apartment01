"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Moon,
  Ruler,
  Users,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ApartmentImageGallery from "@/components/apartment-image-gallery";
import StayBookingWidget from "@/components/stay-booking-widget";
import { Calendar } from "@/components/ui/calendar";
import { getUnavailableDatesClient } from "@/lib/short-term-data-client";
import { ROOM_TYPES } from "@/lib/constants";
import type { ShortTermApartment } from "@/lib/types";

export default function ShortTermDetailClient({
  apartment,
}: {
  apartment: ShortTermApartment;
}) {
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(
    new Set(apartment.blockedDates || []),
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    getUnavailableDatesClient(apartment.id, apartment.blockedDates || []).then(
      setUnavailableDates,
    );
  }, [apartment.id, apartment.blockedDates]);

  const disabledDays = useMemo(() => {
    const blocked = Array.from(unavailableDates).map(
      (d) => new Date(`${d}T00:00:00`),
    );
    return [{ before: new Date() }, ...blocked];
  }, [unavailableDates]);

  const roomTypeLabel =
    ROOM_TYPES.find((type) => type.value === apartment.roomType)?.label ||
    apartment.roomType;

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-clip">
      <Header />
      <main className="flex-1 container mx-auto px-0 md:px-6 pb-28 lg:pb-16 max-w-7xl overflow-x-clip">
        <div className="md:pt-6">
          <ApartmentImageGallery
            imageUrls={apartment.imageUrls}
            apartmentCode={apartment.sourceCode}
            onLightboxChange={setLightboxOpen}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-5 md:px-0 pt-6">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <span className="inline-block mb-2 rounded-full bg-[#cda533]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#b88e22]">
                Căn hộ ngắn hạn · theo đêm
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                {apartment.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4" /> {apartment.district}, Hà Nội
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <BedDouble className="mx-auto h-5 w-5 text-[#cda533]" />
                <p className="mt-1 text-xs text-gray-500">Loại phòng</p>
                <p className="text-sm font-bold text-gray-900">
                  {roomTypeLabel}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <Ruler className="mx-auto h-5 w-5 text-[#cda533]" />
                <p className="mt-1 text-xs text-gray-500">Diện tích</p>
                <p className="text-sm font-bold text-gray-900">
                  {apartment.area} m²
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <Users className="mx-auto h-5 w-5 text-[#cda533]" />
                <p className="mt-1 text-xs text-gray-500">Số khách</p>
                <p className="text-sm font-bold text-gray-900">
                  Tối đa {apartment.maxGuests}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <Moon className="mx-auto h-5 w-5 text-[#cda533]" />
                <p className="mt-1 text-xs text-gray-500">Tối thiểu</p>
                <p className="text-sm font-bold text-gray-900">
                  {apartment.minNights} đêm
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#cda533]" /> Nhận phòng từ{" "}
                <strong>{apartment.checkInTime}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#cda533]" /> Trả phòng trước{" "}
                <strong>{apartment.checkOutTime}</strong>
              </span>
            </div>

            {apartment.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Tiện nghi
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {apartment.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Mô tả chi tiết
              </h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
                {apartment.details}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#cda533]" /> Lịch còn
                trống
              </h2>
              <div className="rounded-2xl border border-gray-100 p-2 sm:p-4 inline-block max-w-full overflow-x-auto">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  disabled={disabledDays}
                  className="pointer-events-none"
                  classNames={{
                    months:
                      "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Ngày mờ là ngày đã kín hoặc không nhận khách.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <StayBookingWidget
              apartment={apartment}
              unavailableDates={unavailableDates}
              hideMobileBar={lightboxOpen}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
