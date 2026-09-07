// src/lib/types.ts

export type RoomType =
  | "studio"
  | "1n1k"
  | "2n1k"
  | "3n1k"
  | "4n1k"
  | "duplex"
  | "penthouse"
  | "other";
export type ApartmentStatus = "available" | "rented"; // "available": Còn trống, "rented": Đã cho thuê
export type FeatureTag = "pet_friendly" | "lake_view";

// Workflow status for landlord-submitted apartments. Distinct from ApartmentStatus
// (which tracks room occupancy) — this tracks admin review of the listing itself.
export type SubmissionStatus = "pending" | "published" | "rejected";

// Interface chuẩn hóa đóng gói toàn bộ dữ liệu AI & SEO
export interface AiContent {
  seoTitle?: string;
  seoDescription?: string;
  description?: string; // Đổi từ b2cDescription sang description cho đồng bộ Data Flow
  highlights?: string[];
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  } | any;
}

export interface Apartment {
  id: string;
  title: string;
  sourceCode: string; // For admin use
  roomType: RoomType;
  area: number; // in m²
  district: string;
  price: number; // in millions VND
  details: string;

  listingSummary?: string;
  address: string; // For admin use
  landlordPhoneNumber: string; // For admin use
  commission?: number | string;
  isFavorited?: boolean;
  imageUrls: string[];
  searchKeywords?: string[]; // Dùng để Firebase tìm kiếm

  status?: ApartmentStatus;
  tags?: FeatureTag[];

  // Landlord submission workflow fields
  submissionStatus?: SubmissionStatus;
  landlordId?: string; // UID của chủ nhà đã đăng thông tin căn hộ này
  adminNotes?: string; // Phản hồi từ quản trị viên, hiển thị cho chủ nhà khi bị từ chối hoặc chỉnh sửa
  design?: string; // Thiết kế
  serviceFees?: string; // Phí dịch vụ
  contactPhone?: string; // Landlord-facing contact phone (distinct from admin-only landlordPhoneNumber)

  // SỬA: Ép kiểu chặt chẽ toàn bộ nội dung SEO/AI vào object này
  aiContent?: AiContent | null;

  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// Represents a document in the /users/{userId} collection
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  address?: string;

  // Quyền của người dùng
  role?: "user" | "collaborator" | "landlord" | "admin" | string;

  // Các trường phục vụ quy trình đăng ký và duyệt Chủ nhà (Landlord Workflow)
  landlordApprovalStatus?: "pending" | "approved" | "rejected";
  landlordRejectionReason?: string;
  landlordRequestData?: {
    displayName: string;
    phoneNumber: string;
    district: string;
    message?: string;
  };
  landlordRequestSubmittedAt?: any;

  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// Bí danh UserData ánh xạ từ UserProfile
export type UserData = UserProfile;

// ===============================================================
// Căn hộ NGẮN HẠN (short-term) — collection `short_term_apartments`
// Tách hoàn toàn khỏi `apartments` (dài hạn) để không ảnh hưởng
// luồng cũ. Giá tính theo ĐÊM, đơn vị VND (không phải triệu).
// ===============================================================

export interface ShortTermApartment {
  id: string;
  title: string;
  sourceCode: string; // For admin use
  roomType: RoomType;
  area: number; // m²
  district: string;
  nightlyPrice: number; // VND / đêm
  minNights: number; // số đêm tối thiểu
  maxGuests: number; // số khách tối đa
  checkInTime: string; // "14:00"
  checkOutTime: string; // "12:00"
  amenities: string[]; // danh sách tiện nghi
  blockedDates: string[]; // ngày admin/chủ nhà chặn tay, dạng "YYYY-MM-DD"
  details: string;
  address: string; // For admin use
  landlordPhoneNumber?: string; // For admin use
  contactPhone?: string; // SĐT liên hệ landlord tự khai
  imageUrls: string[];
  searchKeywords?: string[];
  status?: ApartmentStatus;
  submissionStatus?: SubmissionStatus;
  landlordId?: string;
  adminNotes?: string;
  aiContent?: AiContent | null;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// Trạng thái đơn đặt phòng ngắn hạn — collection `stay_bookings`
// pending → (admin duyệt) confirmed → completed
// Nhánh phụ: rejected (admin từ chối), cancelled (khách hủy)
// awaiting_payment / expired: trạng thái cũ (khi còn cổng thanh toán), không tạo mới
export type StayBookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

export interface StayBooking {
  id: string;
  apartmentId: string;
  apartmentTitle?: string;
  apartmentCode?: string;
  userId: string;
  guestName: string;
  guestPhone: string;
  checkIn: string; // "YYYY-MM-DD"
  checkOut: string; // "YYYY-MM-DD" (ngày trả phòng, không tính là đêm ở)
  nights: number;
  guestsCount: number;
  nightlyPrice: number; // VND, chốt tại thời điểm đặt
  totalAmount: number; // VND = nights × nightlyPrice (ước tính, môi giới — chưa thu online)
  status: StayBookingStatus;
  notes?: string;
  adminNotes?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export type UploadedImage = {
  file: File;
  preview: string;
};

// Represents a document in the /users/{userId}/favorites subcollection
export interface Favorite {
  id: string; // This will be the apartmentId
  addedAt: {
    seconds: number;
    nanoseconds: number;
  };
}
export interface LandlordApartmentInput {
  title: string;
  roomType: RoomType;
  district: string;
  area: number;
  price: number;
  details: string;
  commission?: string;
  contactPhone: string;
  status: ApartmentStatus;
  imageUrls: string[];

  // ĐỒNG BỘ LUỒNG DỮ LIỆU: Bắt buộc khai báo để TS không ném lỗi
  aiContent?: AiContent | null;
}