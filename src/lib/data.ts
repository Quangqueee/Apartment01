import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy, // Nhớ import cái này
  limit,   // Nhớ import cái này
  Query,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { Apartment, Favorite, UserProfile } from "./types";
import { removeVietnameseTones } from "./utils";
import { isPriceInRange, parsePriceRange } from "./price-range";

const apartmentsCollection = collection(firestore, "apartments");
const usersCollection = collection(firestore, "users");

// --- Helper Functions ---
export const toApartment = (docSnap: DocumentData): Apartment => {
  const data = docSnap.data();
  const createdAt = data.createdAt?.toDate ? {
    seconds: data.createdAt.seconds,
    nanoseconds: data.createdAt.nanoseconds,
  } : { seconds: 0, nanoseconds: 0 };
  const updatedAt = data.updatedAt?.toDate ? {
    seconds: data.updatedAt.seconds,
    nanoseconds: data.updatedAt.nanoseconds,
  } : { seconds: 0, nanoseconds: 0 };

  return { id: docSnap.id, ...data, createdAt, updatedAt } as Apartment;
};

export const toFavorite = (docSnap: DocumentData): Favorite => {
  const data = docSnap.data();
  return { id: docSnap.id, addedAt: data.addedAt }
}

// --- Main Function: Get Apartments ---
export async function getApartments(
  options: {
    query?: string;
    district?: string;
    priceRange?: string;
    roomType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    searchBy?: "title" | "sourceCode" | "sourceCodeOrAddress" | "titleOrSourceCode";
  } = {}
) {
  const {
    query: searchQuery,
    district,
    priceRange,
    roomType,
    page = 1,
    limit: pageSize = 9,
    sortBy = "newest",
  } = options;

  let baseQuery: Query = apartmentsCollection;
  let whereClauses = [];

  // 1. Lọc Firestore (District & RoomType)
  if (district && district !== "all") {
    whereClauses.push(where("district", "==", district));
  }
  if (roomType && roomType !== "all") {
    whereClauses.push(where("roomType", "==", roomType));
  }

  if (whereClauses.length > 0) {
    baseQuery = query(baseQuery, ...whereClauses);
  }

  const querySnapshot = await getDocs(baseQuery);
  let allMatchingApartments = querySnapshot.docs.map(toApartment);

  // 2. Lọc Giá (Client-side)
  if (priceRange && priceRange !== "all") {
    const parsedRange = parsePriceRange(priceRange);
    allMatchingApartments = allMatchingApartments.filter((apt) =>
      isPriceInRange(apt.price, parsedRange)
    );
  }

  // 3. FIX LỖI TÌM KIẾM TEXT (QUAN TRỌNG)
  if (searchQuery && searchQuery.trim() !== "") {
    const normalizedQuery = removeVietnameseTones(searchQuery.trim());

    allMatchingApartments = allMatchingApartments.filter((apt) => {
      // BẢO VỆ: Thêm || "" để tránh lỗi undefined gây crash
      const normalizedTitle = removeVietnameseTones(apt.title || "");
      const normalizedCode = removeVietnameseTones(apt.sourceCode || "");
      const normalizedAddress = removeVietnameseTones(apt.address || "");

      // Tìm quét trong cả: Tên, Mã căn (SourceCode), Địa chỉ
      return (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedCode.includes(normalizedQuery) ||
        normalizedAddress.includes(normalizedQuery)
      );
    });
  }

  // 4. Sắp xếp
  if (sortBy === 'price-asc') {
    allMatchingApartments.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    allMatchingApartments.sort((a, b) => b.price - a.price);
  } else {
    // Mặc định: Mới nhất
    allMatchingApartments.sort((a, b) => {
      const dateA = a.updatedAt?.seconds ? a.updatedAt : a.createdAt;
      const dateB = b.updatedAt?.seconds ? b.updatedAt : b.createdAt;
      return (dateB?.seconds || 0) - (dateA?.seconds || 0);
    });
  }

  // 5. Phân trang
  const totalResults = allMatchingApartments.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedApartments = allMatchingApartments.slice(startIndex, endIndex);

  return {
    apartments: paginatedApartments,
    totalResults,
  };
}

// --- Các hàm khác giữ nguyên (getApartmentById, CRUD...) ---
export async function getApartmentById(id: string): Promise<Apartment | null> {
  if (!id || typeof id !== 'string') return null;
  try {
    const docRef = doc(firestore, "apartments", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return toApartment(docSnap);
  } catch (error) {
    console.error("Error fetching apartment by ID:", error);
  }
  return null;
}

export async function createApartment(data: Omit<Apartment, "id">): Promise<Apartment> {
  const docRef = await addDoc(apartmentsCollection, data);
  const newDoc = await getDoc(docRef);
  return toApartment(newDoc);
}

export async function updateApartment(id: string, data: Partial<Omit<Apartment, "id">>): Promise<Apartment> {
  const docRef = doc(firestore, "apartments", id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return toApartment(updatedDoc);
}

export async function deleteApartment(id: string): Promise<void> {
  const docRef = doc(firestore, "apartments", id);
  await deleteDoc(docRef);
}

export async function addFavorite(userId: string, apartmentId: string) {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  return await setDoc(favoriteRef, { addedAt: Timestamp.now() });
}

export async function removeFavorite(userId: string, apartmentId: string) {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  return await deleteDoc(favoriteRef);
}

export async function isApartmentFavorited(userId: string, apartmentId: string): Promise<boolean> {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  const docSnap = await getDoc(favoriteRef);
  return docSnap.exists();
}

export async function getFavoriteApartments(userId: string): Promise<Favorite[]> {
  if (!userId) return [];
  const favoritesCol = collection(usersCollection, userId, "favorites");
  const q = query(favoritesCol, orderBy("addedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toFavorite);
}

export async function getFullFavoriteApartments(userId: string): Promise<Apartment[]> {
  if (!userId) return [];
  const favoriteIds = await getFavoriteApartments(userId);
  if (favoriteIds.length === 0) return [];
  const apartmentPromises = favoriteIds.map(fav => getApartmentById(fav.id));
  const apartments = await Promise.all(apartmentPromises);
  return apartments.filter((apt): apt is Apartment => apt !== null);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const userRef = doc(firestore, "users", userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      address: data.address,
      createdAt: data.createdAt,
    };
  }
  return null;
}

export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, "id" | "email" | "createdAt">>) {
  const userRef = doc(firestore, "users", userId);
  return await updateDoc(userRef, data);
}

export async function getRelatedApartments(currentApartment: Apartment): Promise<Apartment[]> {
  if (!currentApartment || !currentApartment.district) return [];

  try {
    // 1. Lấy danh sách căn hộ cùng quận
    const q = query(
      apartmentsCollection,
      where("district", "==", currentApartment.district),
      limit(30) // Lấy rộng hơn một chút để lọc
    );

    const snapshot = await getDocs(q);
    const fetched: Apartment[] = [];

    snapshot.forEach((docSnap) => {
      if (docSnap.id !== currentApartment.id) {
        fetched.push(toApartment(docSnap));
      }
    });

    const currentPrice = currentApartment.price;

    // 2. LỌC CỨNG (STRICT FILTER): Loại bỏ các căn lệch giá quá xa (ví dụ: lệch quá 30% hoặc lệch quá 3 triệu VNĐ)
    // Giúp chặn đứng tình trạng căn 7 triệu gợi ý lên tận 11 triệu.
    const priceLimit = Math.max(currentPrice * 0.3, 3); // Lệch tối đa 30% hoặc tối đa 3 triệu

    let filtered = fetched.filter((apt) => {
      const priceDiff = Math.abs(apt.price - currentPrice);
      return priceDiff <= priceLimit;
    });

    // 3. XỬ LÝ TRƯỜNG HỢP QUÁ ÍT CĂN (Dưới 4 căn): Nới lỏng nhẹ biên độ để vét thêm cho đủ tối thiểu 4 căn
    if (filtered.length < 4) {
      const relaxedLimit = priceLimit * 1.5; // Nới rộng thêm 50%
      filtered = fetched.filter((apt) => {
        const priceDiff = Math.abs(apt.price - currentPrice);
        return priceDiff <= relaxedLimit;
      });
    }

    // 4. CHẤM ĐIỂM (SCORING SYSTEM) TRÊN TẬP ĐÃ LỌC
    const scored = filtered.map((apt) => {
      let score = 0;

      // Ưu tiên cùng loại phòng: +5 điểm (tăng trọng số thiết kế)
      if (apt.roomType === currentApartment.roomType) score += 5;

      // Ưu tiên giá gần nhau nhất: Càng lệch ít điểm cộng càng cao
      const priceDiff = Math.abs(apt.price - currentPrice);
      const priceScore = Math.max(0, 3 - (priceDiff / priceLimit) * 3);
      score += priceScore;

      return { ...apt, score };
    });

    // 5. SẮP XẾP & CẮT GỌT (Tối đa 8 căn, KHÔNG CỐ NHÉT NẾU HẾT HÀNG)
    scored.sort((a, b) => b.score - a.score);

    const result = scored.slice(0, 8).map((apt) => {
      const { score, ...rest } = apt;
      return rest as Apartment;
    });

    return result;

  } catch (error) {
    console.error("Lỗi khi tìm căn hộ gợi ý:", error);
    return [];
  }
}