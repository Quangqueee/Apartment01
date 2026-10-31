export const SITE = {
  name: "Hanoi Residences",
  legalName: "Hanoi Residences",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://hanoiresidence.site",
  locale: "vi_VN",
  language: "vi-VN",
  description:
    "Nền tảng cho thuê căn hộ cao cấp và căn hộ dịch vụ tại Hà Nội, phục vụ khách Việt Nam và cộng đồng chuyên gia nước ngoài.",
  telephone: "+84812442111",
  telephoneDisplay: "081.2442.111",
  email: "quangluxury6886@gmail.com",
  founderName: "Nguyễn Đức Quang",
  founderJobTitle: "Chuyên viên tư vấn",
  streetAddress: "173B Trường Chinh",
  addressLocality: "Đống Đa",
  addressRegion: "Hà Nội",
  addressCountry: "VN",
  geo: {
    latitude: 21.0015,
    longitude: 105.8317,
  },
  openingHours: {
    opens: "08:00",
    closes: "22:00",
  },
  priceRange: "5,000,000 VND - 50,000,000 VND",
  areaServed: [
    "Tây Hồ, Hà Nội",
    "Ba Đình, Hà Nội",
    "Cầu Giấy, Hà Nội",
    "Đống Đa, Hà Nội",
    "Thanh Xuân, Hà Nội",
    "Nam Từ Liêm, Hà Nội",
  ],
  sameAs: [
    "https://www.facebook.com/quangluxury.9999/",
    "https://www.instagram.com/qquangquee/",
    "https://zalo.me/0812442111",
  ],
  ogImage: "/images/hero-bg.webp",
} as const;

export const SITE_PATHS = {
  home: "/",
  search: "/tim-kiem",
  about: "/about",
  faq: "/faq",
  privacy: "/chinh-sach-bao-mat",
  terms: "/dieu-khoan-dich-vu",
  partnerRegister: "/partner-register",
  llms: "/llms.txt",
} as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized === "/" ? "" : normalized}`;
}
