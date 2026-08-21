import type { Metadata } from "next";
import { HANOI_DISTRICTS } from "@/lib/constants";
import { SITE } from "@/lib/site";

export type DistrictLanding = {
  slug: string;
  name: (typeof HANOI_DISTRICTS)[number];
  title: string;
  description: string;
  intro: string;
  image: string;
  highlights: [string, string, string];
};

/**
 * Ảnh hero: sửa field `image` trỏ tới file trong `public/images/`.
 * Repo hiện chỉ có 5 ảnh — các quận đang xoay vòng để không trùng nhau.
 * Nên thêm ảnh riêng từng quận, ví dụ `/images/districts/tay-ho.webp`.
 */
const HERO_IMAGES = [
  "/images/hero-bg.webp",
  "/images/photo-1741776326857-0f5859c55370.webp",
  "/images/cau-giay.webp",
  "/images/lotte-lieu-giai.webp",
  "/images/van-mieu-quoc-tu-giam-9.webp",
] as const;

function heroImage(index: number) {
  return HERO_IMAGES[index % HERO_IMAGES.length];
}

export const DISTRICT_LANDINGS: DistrictLanding[] = [
  {
    slug: "ba-dinh",
    name: "Ba Đình",
    title: "Cho thuê căn hộ Ba Đình, Hà Nội",
    description:
      "Căn hộ và căn hộ dịch vụ cho thuê tại quận Ba Đình, Hà Nội. Giá niêm yết, hình ảnh thực tế, hỗ trợ xem nhà.",
    intro:
      "Ba Đình là quận trung tâm Hà Nội, có nhiều khu dân cư và căn hộ cho thuê với nhiều loại phòng, mức giá. Hanoi Residences đăng tin còn trống tại Ba Đình; khách nên xem nhà trực tiếp trước khi đặt cọc.",
    image: heroImage(0),
    highlights: ["Quận trung tâm", "Nhiều loại căn hộ", "Xem nhà trước khi cọc"],
  },
  {
    slug: "hoan-kiem",
    name: "Hoàn Kiếm",
    title: "Cho thuê căn hộ Hoàn Kiếm, Hà Nội",
    description:
      "Căn hộ cho thuê tại quận Hoàn Kiếm, Hà Nội. Thông tin giá, diện tích và tiện ích ghi trên từng tin đăng.",
    intro:
      "Hoàn Kiếm nằm ở trung tâm Hà Nội, nhu cầu thuê căn hộ khá đa dạng. Nguồn căn thường ít hơn các quận khác. Hanoi Residences lọc tin còn trống và ghi rõ diện tích, chi phí khi có dữ liệu.",
    image: heroImage(1),
    highlights: ["Trung tâm thành phố", "Nguồn căn hạn chế", "Giá ghi trên từng tin"],
  },
  {
    slug: "tay-ho",
    name: "Tây Hồ",
    title: "Cho thuê căn hộ Tây Hồ, Hà Nội",
    description:
      "Thuê căn hộ tại quận Tây Hồ, Hà Nội: studio đến nhiều phòng ngủ, căn hộ dịch vụ. Hỗ trợ khách Việt Nam và người nước ngoài.",
    intro:
      "Tây Hồ là quận phía tây Hà Nội, có nhiều khu dân cư và căn hộ cho thuê. Hanoi Residences hỗ trợ xem nhà, hợp đồng và hướng dẫn thủ tục khi nguồn cho phép. Giá từng căn ghi theo tháng trên trang chi tiết.",
    image: heroImage(2),
    highlights: ["Đa dạng loại phòng", "Phù hợp ở dài hạn", "Hỗ trợ khách thuê"],
  },
  {
    slug: "cau-giay",
    name: "Cầu Giấy",
    title: "Cho thuê căn hộ Cầu Giấy, Hà Nội",
    description:
      "Căn hộ cho thuê tại quận Cầu Giấy, Hà Nội. Phù hợp người đi làm và chuyên gia, giá niêm yết trên từng tin.",
    intro:
      "Cầu Giấy là quận phía tây Hà Nội, tập trung nhiều khu dân cư và căn hộ cho thuê. Tin đăng Hanoi Residences nêu loại phòng, diện tích và chi phí; không mặc định giá đã gồm phí dịch vụ hay gửi xe.",
    image: heroImage(3),
    highlights: ["Nhiều khu dân cư", "Phù hợp người đi làm", "Chi phí ghi rõ từng căn"],
  },
  {
    slug: "dong-da",
    name: "Đống Đa",
    title: "Cho thuê căn hộ Đống Đa, Hà Nội",
    description:
      "Thuê căn hộ tại quận Đống Đa, Hà Nội: căn hộ dịch vụ và chung cư, hình ảnh thực tế, tư vấn xem nhà.",
    intro:
      "Đống Đa nằm ở trung tâm Hà Nội, kết nối thuận với nhiều quận lân cận. Danh mục gồm căn hộ dịch vụ và chung cư cho thuê, phù hợp khách ở dài hạn. Nên xem nhà để đối chiếu với mô tả trên tin đăng.",
    image: heroImage(4),
    highlights: ["Trung tâm Hà Nội", "Căn hộ dịch vụ & chung cư", "Ở dài hạn"],
  },
  {
    slug: "hai-ba-trung",
    name: "Hai Bà Trưng",
    title: "Cho thuê căn hộ Hai Bà Trưng, Hà Nội",
    description:
      "Căn hộ cho thuê tại quận Hai Bà Trưng, Hà Nội. Giá và tiện ích ghi trên trang chi tiết từng căn.",
    intro:
      "Hai Bà Trưng có cả khu đô thị và khu dân cư hiện hữu. Hanoi Residences đăng tin căn hộ cho thuê tại đây với diện tích, số phòng ngủ và tình trạng còn trống; khách nên xem nhà trước khi chốt cọc.",
    image: heroImage(0),
    highlights: ["Khu đô thị & dân cư", "Nhiều loại căn hộ", "Xem nhà trước khi cọc"],
  },
  {
    slug: "thanh-xuan",
    name: "Thanh Xuân",
    title: "Cho thuê căn hộ Thanh Xuân, Hà Nội",
    description:
      "Thuê căn hộ tại quận Thanh Xuân, Hà Nội: căn hộ dịch vụ và chung cư, hỗ trợ khách Việt Nam và người nước ngoài.",
    intro:
      "Thanh Xuân là quận phía tây nam Hà Nội, có nhiều tòa căn hộ và chung cư cho thuê. Hanoi Residences ghi rõ giá theo tháng; phí quản lý, gửi xe, internet đối chiếu trên từng tin đăng.",
    image: heroImage(1),
    highlights: ["Phía tây nam thành phố", "Chung cư & căn hộ dịch vụ", "Giá theo tháng"],
  },
  {
    slug: "hoang-mai",
    name: "Hoàng Mai",
    title: "Cho thuê căn hộ Hoàng Mai, Hà Nội",
    description:
      "Căn hộ cho thuê tại quận Hoàng Mai, Hà Nội. Giá minh bạch, ảnh thực tế, đặt lịch xem nhà qua Hanoi Residences.",
    intro:
      "Hoàng Mai có quỹ căn hộ chung cư lớn, nhiều mức giá. Hanoi Residences lọc tin đã đăng, mô tả loại phòng; xác nhận tình trạng còn trống khi xem nhà.",
    image: heroImage(2),
    highlights: ["Nhiều lựa chọn chung cư", "Nhiều mức giá", "Xác nhận khi xem nhà"],
  },
  {
    slug: "long-bien",
    name: "Long Biên",
    title: "Cho thuê căn hộ Long Biên, Hà Nội",
    description:
      "Thuê căn hộ tại quận Long Biên, Hà Nội: căn hộ cho thuê dài hạn, thông tin giá và tiện ích trên từng listing.",
    intro:
      "Long Biên nằm phía đông Hà Nội, có nhiều khu dân cư và căn hộ cho thuê. Hanoi Residences đăng tin khi có nguồn; khách xem nhà trực tiếp để kiểm tra nội thất và phí tòa nhà.",
    image: heroImage(3),
    highlights: ["Phía đông thành phố", "Căn hộ dài hạn", "Xem nhà trực tiếp"],
  },
  {
    slug: "nam-tu-liem",
    name: "Nam Từ Liêm",
    title: "Cho thuê căn hộ Nam Từ Liêm, Hà Nội",
    description:
      "Căn hộ cho thuê tại quận Nam Từ Liêm, Hà Nội: studio đến nhiều phòng ngủ, hỗ trợ người đi làm và khách nước ngoài.",
    intro:
      "Nam Từ Liêm là quận phía tây Hà Nội, có nhiều khu đô thị và căn hộ cho thuê. Giá trên Hanoi Residences niêm yết theo tháng; thủ tục hợp đồng hỗ trợ khi chủ nhà cho phép.",
    image: heroImage(4),
    highlights: ["Phía tây Hà Nội", "Đa dạng loại phòng", "Giá niêm yết theo tháng"],
  },
  {
    slug: "bac-tu-liem",
    name: "Bắc Từ Liêm",
    title: "Cho thuê căn hộ Bắc Từ Liêm, Hà Nội",
    description:
      "Thuê căn hộ tại quận Bắc Từ Liêm, Hà Nội. Tin đăng có giá, diện tích và ảnh thực tế.",
    intro:
      "Bắc Từ Liêm phục vụ nhu cầu thuê ở phía tây bắc Hà Nội, với nhiều khu dân cư và căn hộ. Hanoi Residences chỉ hiển thị tin đã đăng; chi tiết phí dịch vụ và nội thất nằm trên trang căn hộ.",
    image: heroImage(0),
    highlights: ["Phía tây bắc Hà Nội", "Nhiều khu dân cư", "Chi tiết trên từng tin"],
  },
  {
    slug: "ha-dong",
    name: "Hà Đông",
    title: "Cho thuê căn hộ Hà Đông, Hà Nội",
    description:
      "Căn hộ cho thuê tại quận Hà Đông, Hà Nội: chung cư và căn hộ dịch vụ, giá ghi rõ trên từng tin.",
    intro:
      "Hà Đông có nhiều chung cư và căn hộ cho thuê, kết nối về các quận trung tâm. Hanoi Residences cập nhật tin còn trống; khách xem nhà để đối chiếu thực tế với mô tả.",
    image: heroImage(1),
    highlights: ["Nhiều chung cư", "Kết nối trung tâm", "Đối chiếu khi xem nhà"],
  },
];

const bySlug = new Map(DISTRICT_LANDINGS.map((item) => [item.slug, item]));
const byName = new Map(DISTRICT_LANDINGS.map((item) => [item.name, item]));

export function getDistrictBySlug(slug: string): DistrictLanding | undefined {
  return bySlug.get(slug);
}

export function getDistrictByName(name: string): DistrictLanding | undefined {
  return byName.get(name);
}

export function districtPath(name: string): string {
  const landing = getDistrictByName(name);
  if (landing) return `/${landing.slug}`;
  return `/tim-kiem?district=${encodeURIComponent(name)}`;
}

export function districtFromPathname(pathname: string): string | undefined {
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const searchMatch = trimmed.match(/^\/tim-kiem\/([^/?#]+)/);
  if (searchMatch) return getDistrictBySlug(searchMatch[1])?.name;
  if (trimmed === "/" || trimmed.includes("/", 1)) return undefined;
  return getDistrictBySlug(trimmed.slice(1))?.name;
}

export type SearchHrefInput = {
  query?: string;
  districts?: string[];
  price?: string;
  roomType?: string;
  sort?: string;
  page?: number;
  cursor?: string | null;
};

export function buildSearchHref(input: SearchHrefInput): string {
  const districts = (input.districts ?? []).filter(Boolean);
  const params = new URLSearchParams();

  if (input.query) params.set("query", input.query);
  if (districts.length > 0) {
    params.set("district", districts.join(","));
  }
  if (input.price) params.set("price", input.price);
  if (input.roomType) params.set("roomType", input.roomType);
  if (input.sort && input.sort !== "newest") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.cursor && input.page && input.page > 1) {
    params.set("cursor", input.cursor);
  }

  const queryString = params.toString();
  return queryString ? `/tim-kiem?${queryString}` : "/tim-kiem";
}

export function buildDistrictLandingHref(
  slug: string,
  input: Pick<SearchHrefInput, "sort" | "page" | "cursor"> = {},
): string {
  const params = new URLSearchParams();
  if (input.sort && input.sort !== "newest") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.cursor && input.page && input.page > 1) {
    params.set("cursor", input.cursor);
  }
  const queryString = params.toString();
  return queryString ? `/${slug}?${queryString}` : `/${slug}`;
}

export function districtMetadata(landing: DistrictLanding): Metadata {
  const path = `/${landing.slug}`;
  return {
    title: landing.title,
    description: landing.description,
    keywords: [
      `thuê căn hộ ${landing.name}`,
      `căn hộ dịch vụ ${landing.name}`,
      `${landing.name} apartment for rent`,
      "hanoi apartment for rent",
    ],
    alternates: {
      canonical: path,
      languages: {
        "vi-VN": path,
        "x-default": path,
      },
    },
    openGraph: {
      title: `${landing.title} | ${SITE.name}`,
      description: landing.description,
      url: path,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
      images: [
        {
          url: landing.image,
          alt: landing.title,
        },
      ],
    },
  };
}
