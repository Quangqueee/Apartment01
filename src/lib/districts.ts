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
 * Ảnh hero đã crop 2400×800 (3:1) từ Wikimedia Commons, nén WebP.
 * Tái tạo: `node scripts/optimize-district-heroes.mjs`
 */

export const DISTRICT_LANDINGS: DistrictLanding[] = [
  {
    slug: "ba-dinh",
    name: "Ba Đình",
    title: "Cho thuê căn hộ Ba Đình, Hà Nội",
    description:
      "Căn hộ và căn hộ dịch vụ cao cấp cho thuê tại Ba Đình. Tận hưởng không gian sống yên tĩnh, an ninh, giao thoa giữa nét cổ kính và tiện ích hiện đại.",
    intro:
      "Ba Đình mang đến nhịp sống thanh bình giữa lòng thủ đô với những tuyến phố rợp bóng cây xanh và mạng lưới tiện ích đa dạng. Khu vực này luôn thu hút giới chuyên gia và người nước ngoài nhờ môi trường an ninh tuyệt đối, vị trí đắc địa cùng hệ thống nhà hàng, dịch vụ chuẩn quốc tế.",
    image: "/images/districts/ba-dinh.webp",
    highlights: [
      "Trung tâm hành chính",
      "Môi trường sống yên tĩnh",
      "Nhiều tiện ích quốc tế",
    ],
  },
  {
    slug: "hoan-kiem",
    name: "Hoàn Kiếm",
    title: "Cho thuê căn hộ Hoàn Kiếm, Hà Nội",
    description:
      "Cho thuê căn hộ quận Hoàn Kiếm vị trí đắc địa. Trải nghiệm nhịp sống sôi động, đậm chất văn hóa ngay trái tim thủ đô Hà Nội.",
    intro:
      "Là trái tim của thủ đô, Hoàn Kiếm mang đến trải nghiệm sống độc đáo giữa không gian văn hóa di sản và nhịp sống đô thị nhộn nhịp. Khu vực này luôn được săn đón gắt gao nhờ hệ thống tiện ích đẳng cấp, ẩm thực tinh hoa và khả năng kết nối không thể hoàn hảo hơn.",
    image: "/images/districts/hoan-kiem.webp",
    highlights: ["Trái tim thủ đô", "Không gian văn hóa", "Tiện ích đẳng cấp"],
  },
  {
    slug: "tay-ho",
    name: "Tây Hồ",
    title: "Cho thuê căn hộ Tây Hồ, Hà Nội",
    description:
      "Khám phá căn hộ cho thuê quận Tây Hồ với tầm nhìn hồ thoáng đãng. Không gian sống lý tưởng, cộng đồng tinh hoa, trọn vẹn tiện ích nội khu.",
    intro:
      "Được mệnh danh là 'đất vàng' của cộng đồng quốc tế, Tây Hồ sở hữu không gian sống trong lành với tầm nhìn đắt giá ra mặt hồ. Nơi đây hội tụ phong cách sống thư thái, tách biệt khỏi sự ồn ào nhưng vẫn đầy đủ các tiện ích giải trí, ẩm thực và nghệ thuật cao cấp.",
    image: "/images/districts/tay-ho.webp",
    highlights: [
      "Không gian trong lành",
      "Cộng đồng quốc tế",
      "Tiện ích nội khu",
    ],
  },
  {
    slug: "cau-giay",
    name: "Cầu Giấy",
    title: "Cho thuê căn hộ Cầu Giấy, Hà Nội",
    description:
      "Thuê căn hộ quận Cầu Giấy với thiết kế hiện đại, tiện nghi tối ưu. Vị trí thuận tiện, lý tưởng cho giới văn phòng và chuyên gia trẻ.",
    intro:
      "Cầu Giấy là cực phát triển năng động bậc nhất thủ đô, tập trung hàng loạt tòa nhà văn phòng, khu công nghệ cao và hệ thống giáo dục đa dạng. Không gian sống tại đây mang hơi thở hiện đại, tiện lợi với mạng lưới giao thông đồng bộ cùng vô vàn trung tâm thương mại sầm uất.",
    image: "/images/districts/cau-giay.webp",
    highlights: [
      "Trung tâm văn phòng",
      "Nhịp sống năng động",
      "Tiện ích hiện đại",
    ],
  },
  {
    slug: "dong-da",
    name: "Đống Đa",
    title: "Cho thuê căn hộ Đống Đa, Hà Nội",
    description:
      "Danh sách căn hộ và chung cư cho thuê tại Đống Đa. Vị trí trung tâm kết nối linh hoạt, nhịp sống sầm uất với vô vàn tiện ích bao quanh.",
    intro:
      "Sở hữu mật độ dân cư đông đúc và nhịp sống sầm uất, Đống Đa là điểm nút giao thông quan trọng kết nối linh hoạt tới mọi khu vực của thành phố. Nơi đây mang đến sự tiện lợi tối đa với mạng lưới tiện ích dày đặc từ y tế, giáo dục đến các khu vui chơi, giải trí đa dạng.",
    image: "/images/districts/dong-da.webp",
    highlights: ["Giao thông kết nối", "Nhịp sống sầm uất", "Tiện ích dày đặc"],
  },
  {
    slug: "hai-ba-trung",
    name: "Hai Bà Trưng",
    title: "Cho thuê căn hộ Hai Bà Trưng, Hà Nội",
    description:
      "Cho thuê căn hộ cao cấp và dịch vụ tại Hai Bà Trưng. Tận hưởng không gian sống cân bằng giữa nét đô thị truyền thống và khu đô thị kiểu mới.",
    intro:
      "Sự giao thoa hoàn hảo giữa những khu phố sầm uất truyền thống và các đại đô thị quy mô tạo nên sức hút riêng cho Hai Bà Trưng. Nơi đây cung cấp môi trường sống chất lượng cao với các công viên lớn, trung tâm thương mại hiện đại và hệ thống dịch vụ thiết yếu hàng đầu.",
    image: "/images/districts/hai-ba-trung.webp",
    highlights: [
      "Giao thoa cũ & mới",
      "Đại đô thị hiện đại",
      "Hệ thống y tế & giáo dục",
    ],
  },
  {
    slug: "thanh-xuan",
    name: "Thanh Xuân",
    title: "Cho thuê căn hộ Thanh Xuân, Hà Nội",
    description:
      "Tìm thuê căn hộ quận Thanh Xuân với đa dạng lựa chọn từ studio đến chung cư cao cấp. Vị trí thuận lợi, hạ tầng đồng bộ, tiện nghi đầy đủ.",
    intro:
      "Là một trong những khu vực phát triển hạ tầng mạnh mẽ, Thanh Xuân mang đến trải nghiệm sống tiện nghi với hàng loạt tổ hợp chung cư thương mại quy mô lớn. Vị trí cửa ngõ giúp cư dân dễ dàng di chuyển, đồng thời tận hưởng trọn vẹn các tiện ích sống nội khu phong phú.",
    image: "/images/districts/thanh-xuan.webp",
    highlights: ["Hạ tầng đồng bộ", "Tổ hợp chung cư lớn", "Tiện ích trọn vẹn"],
  },
  {
    slug: "hoang-mai",
    name: "Hoàng Mai",
    title: "Cho thuê căn hộ Hoàng Mai, Hà Nội",
    description:
      "Căn hộ cho thuê quận Hoàng Mai view hồ thoáng mát, không gian sống xanh. Đa dạng phân khúc, thiết kế tối ưu cho gia đình và cá nhân.",
    intro:
      "Được thiên nhiên ưu ái với nhiều hồ điều hòa và công viên cây xanh quy mô lớn, Hoàng Mai mang đến không gian sống thoáng đãng, gần gũi với thiên nhiên. Quỹ căn hộ tại đây đa dạng, đáp ứng hoàn hảo nhu cầu của những cư dân mong muốn một môi trường sống cân bằng và trong lành.",
    image: "/images/districts/hoang-mai.webp",
    highlights: ["Không gian xanh", "Nhiều hồ điều hòa", "Phù hợp an cư"],
  },
  {
    slug: "long-bien",
    name: "Long Biên",
    title: "Cho thuê căn hộ Long Biên, Hà Nội",
    description:
      "Thuê căn hộ quận Long Biên không gian rộng rãi, quy hoạch chuẩn mực. Trải nghiệm cuộc sống thanh bình chỉ cách phố cổ một cây cầu.",
    intro:
      "Long Biên nổi bật với quy hoạch hạ tầng rộng rãi, hiện đại cùng bầu không khí trong lành, thoáng đãng. Chỉ cách trung tâm phố cổ một cây cầu, nơi đây là lựa chọn lý tưởng cho những ai tìm kiếm sự bình yên, tách biệt khỏi khói bụi nhưng vẫn sở hữu hệ thống tiện ích chuẩn quốc tế.",
    image: "/images/districts/long-bien.webp",
    highlights: ["Quy hoạch rộng rãi", "Không gian bình yên", "Tiện ích quốc tế"],
  },
  {
    slug: "nam-tu-liem",
    name: "Nam Từ Liêm",
    title: "Cho thuê căn hộ Nam Từ Liêm, Hà Nội",
    description:
      "Cho thuê chung cư và căn hộ quận Nam Từ Liêm. Tâm điểm phát triển mới với hạ tầng thông minh, kiến trúc hiện đại và cộng đồng văn minh.",
    intro:
      "Là tâm điểm phát triển mới của thủ đô, Nam Từ Liêm quy tụ hàng loạt biểu tượng kiến trúc và các khu đô thị thông minh mang tầm vóc quốc tế. Khu vực này thu hút tầng lớp trí thức trẻ và cộng đồng cư dân đa quốc gia nhờ môi trường sống văn minh, không gian mở và hạ tầng giao thông xuất sắc.",
    image: "/images/districts/nam-tu-liem.webp",
    highlights: [
      "Tâm điểm mới",
      "Cộng đồng đa quốc gia",
      "Khu đô thị thông minh",
    ],
  },
  {
    slug: "bac-tu-liem",
    name: "Bắc Từ Liêm",
    title: "Cho thuê căn hộ Bắc Từ Liêm, Hà Nội",
    description:
      "Khám phá căn hộ cho thuê quận Bắc Từ Liêm. Môi trường sống trong lành, quy hoạch hiện đại, không gian lý tưởng để an cư và làm việc.",
    intro:
      "Bắc Từ Liêm đang chuyển mình mạnh mẽ với các đại đô thị được quy hoạch bài bản và mật độ cây xanh cao. Sự hiện diện của các khu ngoại giao và công viên rộng lớn giúp nơi đây duy trì được nhịp sống thanh bình, an ninh đảm bảo cùng một không gian an cư lý tưởng.",
    image: "/images/districts/bac-tu-liem.webp",
    highlights: [
      "Quy hoạch bài bản",
      "Mật độ cây xanh cao",
      "Không gian an ninh",
    ],
  },
  {
    slug: "ha-dong",
    name: "Hà Đông",
    title: "Cho thuê căn hộ Hà Đông, Hà Nội",
    description:
      "Cho thuê căn hộ quận Hà Đông đa dạng diện tích. Vị trí kết nối thuận tiện qua tuyến metro, tiện ích nội khu phong phú cho cuộc sống năng động.",
    intro:
      "Hà Đông vươn mình trở thành một cực an cư sầm uất với nhịp sống trẻ trung và năng động. Hệ thống tiện ích phong phú từ các trung tâm thương mại lớn đến sự tiện lợi của tuyến đường sắt trên cao giúp cư dân tại đây tận hưởng một cuộc sống trọn vẹn, dễ dàng kết nối tới muôn nơi.",
    image: "/images/districts/ha-dong.webp",
    highlights: ["Nhịp sống trẻ trung", "Kết nối Metro", "Tiện ích phong phú"],
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
  before?: string | null;
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
  if (input.before && input.page && input.page > 1) {
    params.set("before", input.before);
  }

  const queryString = params.toString();
  return queryString ? `/tim-kiem?${queryString}` : "/tim-kiem";
}

export function buildDistrictLandingHref(
  slug: string,
  input: Pick<SearchHrefInput, "sort" | "page" | "cursor" | "before"> = {},
): string {
  const params = new URLSearchParams();
  if (input.sort && input.sort !== "newest") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.cursor && input.page && input.page > 1) {
    params.set("cursor", input.cursor);
  }
  if (input.before && input.page && input.page > 1) {
    params.set("before", input.before);
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