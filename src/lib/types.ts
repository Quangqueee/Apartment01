// src/lib/types.ts

export type RoomType = "studio" | "1n1k" | "2n1k" | "other";
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