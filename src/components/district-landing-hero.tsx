import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, Phone } from "lucide-react";
import { DISTRICT_LANDINGS, districtPath, type DistrictLanding } from "@/lib/districts";
import { SITE, SITE_PATHS } from "@/lib/site";

export default function DistrictLandingHero({
  landing,
  totalResults,
}: {
  landing: DistrictLanding;
  totalResults: number;
}) {
  const otherDistricts = DISTRICT_LANDINGS.filter(
    (item) => item.slug !== landing.slug,
  );
  const telHref = `tel:${SITE.telephone.replace(/\s/g, "")}`;

  return (
    <section>
      <div className="relative h-[316px] w-full overflow-hidden sm:h-[372px] md:h-[416px]">
        <Image
          src={landing.image}
          alt={`Căn hộ cho thuê tại ${landing.name}, Hà Nội`}
          fill
          priority
          fetchPriority="high"
          quality={60}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/45 bg-gradient-to-t from-black/70 via-black/35 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-[1920px] px-4 pb-6 pt-4 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="mb-2 flex flex-wrap items-center gap-1 text-xs text-white/80 sm:text-sm"
            >
              <Link href={SITE_PATHS.home} className="hover:text-white">
                Trang chủ
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <Link href={SITE_PATHS.search} className="hover:text-white">
                Căn hộ
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="font-medium text-white">{landing.name}</span>
            </nav>

            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-xs">
              Hà Nội · {landing.name}
            </p>
            <h1 className="font-headline max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Căn hộ cho thuê tại {landing.name}
            </h1>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              {totalResults.toLocaleString("vi-VN")} căn đang đăng
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1920px] px-4 pt-5 lg:px-8 md:pt-6">
        <div className="overflow-x-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-muted-foreground md:text-[15px] md:leading-7">
                {landing.intro} Hiện có {totalResults} căn đang đăng.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {landing.highlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-gray-800 sm:text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={telHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 lg:w-auto lg:min-w-[220px]"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Tư vấn {SITE.telephoneDisplay}
            </a>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Khám phá quận khác
            </p>
            <div className="flex flex-wrap gap-2">
              {otherDistricts.map((item) => (
                <Link
                  key={item.slug}
                  href={districtPath(item.name)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-gray-900 sm:text-sm"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
