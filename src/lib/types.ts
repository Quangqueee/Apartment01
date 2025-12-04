export type RoomType = "studio" | "1n1k" | "2n1k" | "other";

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
  imageUrls: string[];
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
