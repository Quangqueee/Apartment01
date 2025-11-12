export type RoomType = "studio" | "1n1k" | "2n1k" | "other";

export interface Apartment {
  id: string;
  title: string;
  internalCode: string; // For admin use
  roomType: RoomType;
  district: string;
  price: number; // in millions VND
  detailedInformation: string;
  summary: string; // AI-generated
  exactAddress: string; // For admin use
  imageUrls: string[];
  createdAt: string; // ISO 8601 date string
}
