import type { Apartment, RoomType } from "@/lib/types";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE, SITE_PATHS, absoluteUrl } from "@/lib/site";

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function organizationId() {
  return `${SITE.url}/#organization`;
}

function websiteId() {
  return `${SITE.url}/#website`;
}

export function getBedroomCount(roomType: RoomType): number {
  const map: Record<RoomType, number> = {
    studio: 0,
    "1n1k": 1,
    "2n1k": 2,
    "3n1k": 3,
    "4n1k": 4,
    duplex: 2,
    penthouse: 3,
    other: 1,
  };
  return map[roomType] ?? 1;
}

export function getRoomCount(roomType: RoomType): number {
  if (roomType === "studio") return 1;
  return getBedroomCount(roomType) + 1;
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        "@id": organizationId(),
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        image: absoluteUrl(SITE.ogImage),
        logo: absoluteUrl("/favicon.ico"),
        telephone: SITE.telephone,
        email: SITE.email,
        priceRange: SITE.priceRange,
        areaServed: SITE.areaServed,
        sameAs: [...SITE.sameAs],
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.streetAddress,
          addressLocality: SITE.addressLocality,
          addressRegion: SITE.addressRegion,
          addressCountry: SITE.addressCountry,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: SITE.openingHours.opens,
          closes: SITE.openingHours.closes,
        },
        founder: {
          "@type": "Person",
          name: SITE.founderName,
          jobTitle: SITE.founderJobTitle,
          sameAs: SITE.sameAs[0],
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: SITE.telephone,
          email: SITE.email,
          contactType: "customer service",
          areaServed: "VN",
          availableLanguage: ["Vietnamese", "English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId(),
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: SITE.language,
        publisher: { "@id": organizationId() },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}${SITE_PATHS.search}?query={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `Câu hỏi thường gặp | ${SITE.name}`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function amenityFeatures(apartment: Apartment) {
  const features: Array<{
    "@type": "LocationFeatureSpecification";
    name: string;
    value?: boolean;
  }> = [];

  if (apartment.tags?.includes("pet_friendly")) {
    features.push({
      "@type": "LocationFeatureSpecification",
      name: "Cho phép nuôi thú cưng",
      value: true,
    });
  }
  if (apartment.tags?.includes("lake_view")) {
    features.push({
      "@type": "LocationFeatureSpecification",
      name: "View hồ",
      value: true,
    });
  }
  for (const highlight of apartment.aiContent?.highlights ?? []) {
    if (highlight?.trim()) {
      features.push({
        "@type": "LocationFeatureSpecification",
        name: highlight.trim(),
      });
    }
  }
  return features;
}

export function buildApartmentJsonLd(apartment: Apartment) {
  const pageUrl = absoluteUrl(`/apartments/${apartment.id}`);
  const priceVnd =
    typeof apartment.price === "number"
      ? apartment.price * 1_000_000
      : apartment.price;
  const description =
    apartment.aiContent?.seoDescription ||
    apartment.listingSummary ||
    apartment.details?.slice(0, 200) ||
    SITE.description;
  const images = (apartment.imageUrls || []).filter(Boolean);
  const bedrooms = getBedroomCount(apartment.roomType);
  const offerAvailability =
    apartment.status === "rented"
      ? "https://schema.org/SoldOut"
      : "https://schema.org/InStock";

  const apartmentNode: Record<string, unknown> = {
    "@type": "Apartment",
    "@id": `${pageUrl}#apartment`,
    name: apartment.aiContent?.seoTitle || apartment.title,
    url: pageUrl,
    description,
    numberOfRooms: getRoomCount(apartment.roomType),
    numberOfBedrooms: bedrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: apartment.area,
      unitCode: "MTK",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: apartment.address || apartment.district,
      addressLocality: apartment.district,
      addressRegion: SITE.addressRegion,
      addressCountry: SITE.addressCountry,
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      availability: offerAvailability,
      priceCurrency: "VND",
      price: priceVnd,
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: priceVnd,
        priceCurrency: "VND",
        unitText: "MONTH",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
      seller: { "@id": organizationId() },
    },
  };

  if (images.length > 0) {
    apartmentNode.image = images;
  }

  const amenities = amenityFeatures(apartment);
  if (amenities.length > 0) {
    apartmentNode.amenityFeature = amenities;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      apartmentNode,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Trang chủ",
            item: SITE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Tìm kiếm căn hộ",
            item: absoluteUrl(SITE_PATHS.search),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: apartment.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}
