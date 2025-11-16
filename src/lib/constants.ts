import { RoomType } from "./types";

export const HANOI_DISTRICTS = [
  "Ba Đình",
  "Hoàn Kiếm",
  "Tây Hồ",
  "Cầu Giấy",
  "Đống Đa",
  "Hai Bà Trưng",
  "Thanh Xuân",
  "Hoàng Mai",
  "Long Biên",
  "Nam Từ Liêm",
  "Bắc Từ Liêm",
  "Hà Đông",
];

export const PRICE_RANGES = [
  { label: "Dưới 5tr", value: "0-5" },
  { label: "5 - 7tr", value: "5-7" },
  { label: "8 - 10tr", value: "8-10" },
  { label: "11 - 15tr", value: "11-15" },
  { label: "16 - 20tr", value: "16-20" },
  { label: "Trên 20tr", value: "20-" },
];

export const ROOM_TYPES: { label: string; value: RoomType }[] = [
  { label: "Studio", value: "studio" },
  { label: "1 Phòng ngủ", value: "1n1k" },
  { label: "2 Phòng ngủ", value: "2n1k" },
  { label: "Khác", value: "other" },
];

export const SORT_OPTIONS = [
    { label: "Mới nhất", value: "newest" },
    { label: "Giá: Thấp đến cao", value: "price-asc" },
    { label: "Giá: Cao đến thấp", value: "price-desc" },
];

// This path is now dynamic and controlled by an environment variable.
// It serves as a default/fallback if the env var is not set.
export const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "admin";
