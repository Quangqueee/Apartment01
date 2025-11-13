// This file mocks a database connection.
// In a real application, you would replace this with calls to a database like Firestore or a REST API.

import { Apartment, RoomType } from "./types";
import { PlaceHolderImages } from "./placeholder-images";
import { HANOI_DISTRICTS, ROOM_TYPES } from "./constants";

let apartments: Apartment[] = [
  {
    id: "apt-1",
    title: "Căn Hộ Cao Cấp Tại Trung Tâm Quận Ba Đình",
    internalCode: "BD001",
    roomType: "2n1k",
    district: "Ba Đình",
    price: 18,
    detailedInformation:
      "Nội thất đầy đủ, thiết kế hiện đại.\nView hồ tây, ban công rộng.\nGần các tiện ích công cộng, trường học, bệnh viện.\nAn ninh 24/7.",
    summary:
      "Trải nghiệm sống sang trọng tại căn hộ 2 ngủ 1 khách ở quận Ba Đình. Với giá 18 triệu, căn hộ này cung cấp nội thất hiện đại, tầm nhìn ra Hồ Tây và an ninh đảm bảo.",
    exactAddress: "123 Đường ABC, Phường XYZ, Quận Ba Đình, Hà Nội",
    imageUrls: [
      PlaceHolderImages[0].imageUrl,
      PlaceHolderImages[1].imageUrl,
      PlaceHolderImages[2].imageUrl,
    ],
    createdAt: "2023-10-26T10:00:00Z",
  },
  {
    id: "apt-2",
    title: "Studio Đầy Đủ Tiện Nghi Gần Lotte Tây Hồ",
    internalCode: "TH001",
    roomType: "studio",
    district: "Tây Hồ",
    price: 9,
    detailedInformation:
      "Studio rộng 40m2, thiết kế thông minh.\nBao gồm bếp, khu vực ngủ và làm việc.\nNội thất mới, hiện đại.\nMiễn phí dịch vụ dọn dẹp 1 lần/tuần.",
    summary:
      "Căn studio tiện nghi tại Tây Hồ, chỉ 9 triệu/tháng. Không gian 40m2 được thiết kế thông minh, nội thất mới và bao gồm dịch vụ dọn dẹp hàng tuần. Lý tưởng cho người độc thân hoặc chuyên gia trẻ.",
    exactAddress: "456 Đường DEF, Phường GHI, Quận Tây Hồ, Hà Nội",
    imageUrls: [
      PlaceHolderImages[4].imageUrl,
      PlaceHolderImages[5].imageUrl,
      PlaceHolderImages[7].imageUrl,
    ],
    createdAt: "2023-10-25T14:30:00Z",
  },
  {
    id: 'apt-3',
    title: 'Căn 1N1K View Đẹp Quận Cầu Giấy',
    internalCode: 'CG001',
    roomType: '1n1k',
    district: 'Cầu Giấy',
    price: 12,
    detailedInformation: 'Căn hộ 1 ngủ 1 khách, diện tích 55m2. Nội thất cơ bản, có điều hoà, nóng lạnh. Ban công hướng đông nam thoáng mát. Gần công viên, khu văn phòng.',
    summary: 'Căn hộ 1 ngủ 1 khách thoáng đãng tại Cầu Giấy, giá 12 triệu. Với diện tích 55m2 và ban công hướng đông nam, đây là lựa chọn tuyệt vời cho các cặp đôi hoặc chuyên gia làm việc tại khu vực.',
    exactAddress: '789 Đường KLM, Phường NOP, Quận Cầu Giấy, Hà Nội',
    imageUrls: [PlaceHolderImages[6].imageUrl, PlaceHolderImages[0].imageUrl, PlaceHolderImages[1].imageUrl],
    createdAt: '2023-10-24T11:00:00Z',
  },
  {
    id: 'apt-4',
    title: 'Chung Cư Mini Gần Bách Khoa',
    internalCode: 'HBT001',
    roomType: 'other',
    district: 'Hai Bà Trưng',
    price: 4.5,
    detailedInformation: 'Phòng trọ cao cấp dạng chung cư mini. Có gác xép, bếp riêng, vệ sinh khép kín. An ninh tốt, giờ giấc tự do.',
    summary: 'Phòng trọ cao cấp giá chỉ 4.5 triệu tại Hai Bà Trưng, gần khu vực đại học Bách Khoa. Thiết kế gác xép thông minh, bếp và vệ sinh riêng, đảm bảo sự riêng tư và tiện lợi.',
    exactAddress: '101 Đường QRS, Phường TUV, Quận Hai Bà Trưng, Hà Nội',
    imageUrls: [PlaceHolderImages[3].imageUrl, PlaceHolderImages[4].imageUrl],
    createdAt: '2023-10-23T09:00:00Z',
  },
  {
    id: 'apt-5',
    title: 'Biệt Thự Trên Không Penthouse Times City',
    internalCode: 'HM001',
    roomType: 'other',
    district: 'Hoàng Mai',
    price: 35,
    detailedInformation: 'Penthouse duplex, 2 tầng, tổng diện tích 200m2. 3 phòng ngủ, 1 phòng khách, 1 phòng làm việc. Nội thất nhập khẩu châu Âu. View toàn cảnh thành phố.',
    summary: 'Đẳng cấp sống thượng lưu với penthouse duplex tại Times City, quận Hoàng Mai. Diện tích 200m2, 3 phòng ngủ, nội thất nhập khẩu và tầm nhìn panorama ngoạn mục, tất cả với giá 35 triệu/tháng.',
    exactAddress: 'Tòa Park Hill, Times City, Quận Hoàng Mai, Hà Nội',
    imageUrls: [PlaceHolderImages[8].imageUrl, PlaceHolderImages[0].imageUrl, PlaceHolderImages[5].imageUrl],
    createdAt: '2023-10-22T18:00:00Z',
  },
  {
    id: 'apt-6',
    title: 'Căn Hộ Dịch Vụ Phố Cổ Hoàn Kiếm',
    internalCode: 'HK001',
    roomType: 'studio',
    district: 'Hoàn Kiếm',
    price: 14,
    detailedInformation: 'Vị trí vàng trung tâm phố cổ. Căn hộ studio đầy đủ nội thất, có cửa sổ lớn. Dịch vụ dọn phòng, giặt là bao gồm. Phù hợp cho người nước ngoài hoặc khách du lịch dài hạn.',
    summary: 'Sống giữa lòng di sản tại căn hộ dịch vụ studio ở quận Hoàn Kiếm với giá 14 triệu. Vị trí đắc địa, nội thất đầy đủ và dịch vụ trọn gói mang đến sự tiện nghi tối đa.',
    exactAddress: '22 Phố Hàng Bông, Quận Hoàn Kiếm, Hà Nội',
    imageUrls: [PlaceHolderImages[10].imageUrl, PlaceHolderImages[11].imageUrl],
    createdAt: '2023-10-21T12:00:00Z',
  },
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `apt-${i + 7}`,
    title: `Căn Hộ Mẫu ${i + 7}`,
    internalCode: `CODE${i + 7}`,
    roomType: ROOM_TYPES[i % ROOM_TYPES.length].value,
    district: HANOI_DISTRICTS[i % HANOI_DISTRICTS.length],
    price: Number(((Math.random() * 20) + 5).toFixed(1)),
    detailedInformation: `Thông tin chi tiết cho căn hộ mẫu số ${i + 7}. Nội thất đẹp, thoáng mát.`,
    summary: `Đây là tóm tắt cho căn hộ mẫu ${i + 7}. Một lựa chọn tuyệt vời trong tầm giá.`,
    exactAddress: `${i + 7} Đường Mẫu, Quận Mẫu, Hà Nội`,
    imageUrls: [PlaceHolderImages[i % PlaceHolderImages.length].imageUrl],
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  })),
];


export async function getApartments(options: {
  query?: string;
  district?: string;
  priceRange?: string;
  roomType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  searchBy?: "title" | "internalCode";
} = {}) {
  const { 
    query, 
    district, 
    priceRange, 
    roomType, 
    page = 1, 
    limit = 9,
    sortBy = 'newest',
    searchBy = 'title'
  } = options;

  let filteredApartments = [...apartments];

  if (query) {
    const lowercasedQuery = query.toLowerCase();
    filteredApartments = filteredApartments.filter((apt) => {
      if (searchBy === 'internalCode') {
        return apt.internalCode.toLowerCase().includes(lowercasedQuery);
      }
      return apt.title.toLowerCase().includes(lowercasedQuery);
    });
  }

  if (district) {
    filteredApartments = filteredApartments.filter((apt) => apt.district === district);
  }

  if (roomType) {
    filteredApartments = filteredApartments.filter((apt) => apt.roomType === roomType);
  }

  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min) : 0;
    const maxPrice = max ? parseInt(max) : Infinity;
    filteredApartments = filteredApartments.filter(
      (apt) => apt.price >= minPrice && apt.price <= maxPrice
    );
  }
  
  if (sortBy === 'price-asc') {
    filteredApartments.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredApartments.sort((a, b) => b.price - a.price);
  } else { // Default to newest
    filteredApartments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const totalPages = Math.ceil(filteredApartments.length / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedApartments = filteredApartments.slice(start, end);

  return { apartments: paginatedApartments, totalPages };
}

export async function getApartmentById(id: string) {
  return apartments.find((apt) => apt.id === id) || null;
}

export async function getAllApartments() {
  return apartments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createApartment(data: Omit<Apartment, "id" | "createdAt">) {
  const newApartment: Apartment = {
    ...data,
    id: `apt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  apartments.unshift(newApartment);
  return newApartment;
}

export async function updateApartment(id: string, data: Partial<Apartment>) {
  const index = apartments.findIndex((apt) => apt.id === id);
  if (index === -1) return null;

  apartments[index] = { ...apartments[index], ...data };
  return apartments[index];
}

export async function deleteApartment(id: string) {
  const index = apartments.findIndex((apt) => apt.id === id);
  if (index === -1) return false;

  apartments.splice(index, 1);
  return true;
}