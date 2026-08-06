export type RoomType = "studio" | "1n1k" | "2n1k" | "other";
export type ApartmentStatus = "available" | "rented"; // "available": Còn trống, "rented": Đã cho thuê
export type FeatureTag = "pet_friendly" | "lake_view";

// Workflow status for landlord-submitted apartments. Distinct from ApartmentStatus
// (which tracks room occupancy) — this tracks admin review of the listing itself.
export type SubmissionStatus = "pending" | "published" | "rejected";

export interface Apartment {
  id: string;
  title: string;
  sourceCode: string; // For admin use
  roomType: RoomType;
  area: number; // in m²
  district: string;
  price: number; // in millions VND
  details: string;
  listingSummary: string; // AI-generated
  address: string; // For admin use
  landlordPhoneNumber: string; // For admin use
  commission?: number | string;
  isFavorited?: boolean;
  imageUrls: string[];
  searchKeywords?: string[]; // Dùng để Firebase tìm kiếm

  // Bổ sung thuộc tính mới:
  status?: ApartmentStatus;
  tags?: FeatureTag[];

  // Landlord submission workflow fields
  submissionStatus?: SubmissionStatus;
  landlordId?: string; // uid of the landlord who submitted this apartment
  adminNotes?: string; // Admin feedback, shown to landlord on rejection/edit
  design?: string; // Thiết kế
  serviceFees?: string; // Phí dịch vụ
  contactPhone?: string; // Landlord-facing contact phone (distinct from admin-only landlordPhoneNumber)

  // Sửa: Cho phép aiContent nhận kiểu object, undefined hoặc null
  aiContent?: {
    seoTitle: string;
    b2cDescription: string;
    highlights: string[];
    updatedAt?: any;
  } | null;

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

  // BỔ SUNG: Quyền của người dùng
  role?: "user" | "collaborator" | "landlord" | "admin" | string;

  // BỔ SUNG: Các trường phục vụ quy trình đăng ký và duyệt Chủ nhà (Landlord Workflow)
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

// BỔ SUNG: Bí danh UserData ánh xạ từ UserProfile để sửa lỗi định nghĩa kiểu trong auth-context
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