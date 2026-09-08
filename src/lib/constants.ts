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
  { label: "3 Phòng ngủ", value: "3n1k" },
  { label: "4 Phòng ngủ", value: "4n1k" },
  { label: "Duplex", value: "duplex" },
  { label: "Penthouse", value: "penthouse" },
  { label: "Khác", value: "other" },
];

export const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá: Thấp đến cao", value: "price-asc" },
  { label: "Giá: Cao đến thấp", value: "price-desc" },
];

export const MAX_APARTMENT_IMAGES = 15;

// ===== Căn hộ ngắn hạn =====
/** Tạm ẩn nút/link truy cập ngắn hạn phía khách. Đặt `true` để hiện lại. Route + logic vẫn giữ nguyên. */
export const SHORT_TERM_PUBLIC_ACCESS = false;

export const STAY_BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  awaiting_payment: "Chờ duyệt",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  rejected: "Bị từ chối",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

export const STAY_AMENITIES = [
  "Wifi",
  "Điều hòa",
  "Máy giặt",
  "Bếp đầy đủ",
  "TV",
  "Nóng lạnh",
  "Ban công",
  "Thang máy",
  "Chỗ để xe",
  "Máy sấy tóc",
  "Bàn làm việc",
  "View hồ",
];

export const NIGHTLY_PRICE_RANGES = [
  { label: "Dưới 500k", value: "0-500000" },
  { label: "500k - 1tr", value: "500000-1000000" },
  { label: "1tr - 2tr", value: "1000000-2000000" },
  { label: "Trên 2tr", value: "2000000-" },
];

export const APARTMENT_DELETE_LIMIT_PER_HOUR = 10;
export const APARTMENT_DELETE_WINDOW_MS = 60 * 60 * 1000;

// This path is now dynamic and controlled by an environment variable.
// It serves as a default/fallback if the env var is not set.
export const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "admin";

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-WBW36JRV";
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID || "G-4LXVB7FZW8";
