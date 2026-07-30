export type RoomType = "studio" | "1n1k" | "2n1k" | "other";
export type ApartmentStatus = "available" | "rented"; // "available": Còn trống, "rented": Đã cho thuê
export type FeatureTag = "pet_friendly" | "lake_view";

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
  createdAt: {
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
