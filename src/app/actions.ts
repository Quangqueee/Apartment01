"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { generateSearchKeywords } from "@/lib/utils";
import {
  createApartment,
  updateApartment,
  deleteApartment as deleteApartmentFromDb,
  getApartmentById,
  getApartments,
  addFavorite,
  removeFavorite,
  isApartmentFavorited,
  updateUserProfile as updateUserProfileInDb,
} from "@/lib/data";
import { generateListingSummary } from "@/ai/flows/generate-listing-summary";
import { firebaseApp } from "@/firebase/server-init";
import { Apartment } from "@/lib/types";
import { Timestamp, doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { ADMIN_PATH, MAX_APARTMENT_IMAGES } from "@/lib/constants";
import { firestore } from "@/firebase/server-init";

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

const imageUrlsSchema = z
  .array(z.string().trim().min(1))
  .min(1, "At least one image is required.")
  .max(
    MAX_APARTMENT_IMAGES,
    `You can upload a maximum of ${MAX_APARTMENT_IMAGES} images.`,
  );

const apartmentBaseSchema = z.object({
  title: z.string().min(5),
  sourceCode: z.string().min(1),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1),
  area: z.coerce.number().min(1, "Area must be greater than 0."),
  price: z.coerce.number().min(0),
  commission: z.string().optional(),
  details: z.string().min(20),
  listingSummary: z.string().optional(),
  seoTitle: z.string().optional(),
  address: z.string().min(1),
  landlordPhoneNumber: z.string().min(1, "Landlord phone number is required."),
  // BỔ SUNG 2 TRƯỜNG STATUS VÀ TAGS Ở ĐÂY ĐỂ ĐỒNG BỘ VỚI FRONTEND
  status: z.enum(["available", "rented"]).optional().default("available"),
  tags: z.array(z.enum(["pet_friendly", "lake_view"])).optional().default([]),
});

const apartmentActionSchema = apartmentBaseSchema.extend({
  imageUrlsJson: z.string().min(2, "Image payload is required."),
});

function flattenImageUrls(value: unknown): string[] {
  const flatImageUrls: string[] = [];

  const visitValue = (currentValue: unknown) => {
    if (Array.isArray(currentValue)) {
      currentValue.forEach(visitValue);
      return;
    }

    if (typeof currentValue !== "string") {
      return;
    }

    const normalizedValue = currentValue.trim();
    if (normalizedValue.length > 0) {
      flatImageUrls.push(normalizedValue);
    }
  };

  visitValue(value);
  return flatImageUrls;
}

function parseImageUrlsJson(
  imageUrlsJson: string,
): z.SafeParseReturnType<unknown, string[]> {
  try {
    const parsedValue: unknown = JSON.parse(imageUrlsJson);
    return imageUrlsSchema.safeParse(flattenImageUrls(parsedValue));
  } catch (error) {
    console.error("Dữ liệu JSON của ảnh không hợp lệ:", error);
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: ["imageUrlsJson"],
          message: "Dữ liệu ảnh không hợp lệ.",
        },
      ]),
    };
  }
}

// Helper function to upload or update images
async function uploadAndCleanupImages(currentImageUrls: string[], existingImageUrls: string[] | undefined): Promise<string[]> {
  const newImageUrls: string[] = [];

  // Upload new images (data URIs)
  for (const url of currentImageUrls) {
    if (url.startsWith('data:')) {
      const storageRef = ref(storage, `apartments/${uuidv4()}`);
      const snapshot = await uploadString(storageRef, url, 'data_url');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      newImageUrls.push(downloadUrl);
    } else {
      // Keep existing URLs
      newImageUrls.push(url);
    }
  }

  // Determine which images to delete if we are editing an existing apartment
  if (existingImageUrls) {
    const urlsToDelete = existingImageUrls.filter(
      (url) => !newImageUrls.includes(url)
    );

    // Delete them
    await Promise.all(
      urlsToDelete.map(async (url) => {
        try {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
        } catch (error: any) {
          // Ignore if object doesn't exist (it might have been deleted already)
          if (error.code !== 'storage/object-not-found') {
            console.error(`Failed to delete old image: ${url}`, error);
          }
        }
      })
    );
  }

  return newImageUrls;
}

export async function createOrUpdateApartmentAction(
  id: string | undefined,
  values: z.infer<typeof apartmentActionSchema>
) {
  const validatedFields = apartmentActionSchema.safeParse(values);

  if (!validatedFields.success) {
    const errorIssues = validatedFields.error.issues;
    const errorMessage = errorIssues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    return { error: `Invalid fields! ${errorMessage}` };
  }

  const parsedImageUrls = parseImageUrlsJson(validatedFields.data.imageUrlsJson);
  if (!parsedImageUrls.success) {
    const errorMessage = parsedImageUrls.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { error: `Invalid fields! ${errorMessage}` };
  }

  const { imageUrlsJson: _imageUrlsJson, ...data } = validatedFields.data;
  let apartmentId = id;

  try {
    // Đưa biến existingApartment ra ngoài để tái sử dụng lấy dữ liệu AI cũ
    let existingApartment: any = null;
    let existingImageUrls: string[] | undefined = undefined;

    if (apartmentId) {
      existingApartment = await getApartmentById(apartmentId);
      existingImageUrls = existingApartment?.imageUrls;
    }

    const finalImageUrls = await uploadAndCleanupImages(parsedImageUrls.data, existingImageUrls);

    const textToSearch = `${data.title} ${data.address} ${data.sourceCode}`.trim();
    const searchKeywords = generateSearchKeywords(textToSearch);

    // ĐÃ SỬA: KHÔNG tự động gọi AI (generateListingSummary) ở đây nữa để tránh bị treo form
    let aiOptimizedContent = undefined;

    // Nếu trên giao diện có gửi kèm nội dung bài viết (do AI tạo trước đó hoặc do bạn tự viết)
    if (data.listingSummary || data.seoTitle) {
      aiOptimizedContent = {
        seoTitle: data.seoTitle || existingApartment?.aiContent?.seoTitle || data.title,
        b2cDescription: data.listingSummary || existingApartment?.aiContent?.b2cDescription || "",
        highlights: existingApartment?.aiContent?.highlights || [],
        updatedAt: Timestamp.now(),
      };
    } else if (existingApartment && existingApartment.aiContent) {
      aiOptimizedContent = existingApartment.aiContent;
    }

    const apartmentDataWithTimestamp = {
      ...data,
      listingSummary: data.listingSummary || "",
      ...(aiOptimizedContent && { aiContent: aiOptimizedContent }), // Cập nhật nội dung vào DB
      imageUrls: finalImageUrls,
      searchKeywords: searchKeywords,
      updatedAt: Timestamp.now(),
    };

    if (apartmentId) {
      await updateApartment(apartmentId, apartmentDataWithTimestamp);
    } else {
      const newApartmentData = {
        ...apartmentDataWithTimestamp,
        createdAt: Timestamp.now(),
      };
      const newApartment = await createApartment(newApartmentData as Omit<Apartment, "id">);
      apartmentId = newApartment.id;
    }
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Database error. Failed to save apartment." };
  }

  // Revalidation and redirection must happen outside the try...catch block
  revalidatePath(`/${ADMIN_PATH}`);
  revalidatePath("/");
  if (apartmentId) {
    revalidatePath(`/apartments/${apartmentId}`);
  }
  // redirect(`/${ADMIN_PATH}`);
  return { success: true };
}

export async function deleteApartmentAction(id: string) {
  if (!id) {
    return { error: "ID is required" };
  }
  try {
    const apartment = await getApartmentById(id);
    if (apartment && apartment.imageUrls.length > 0) {
      await Promise.all(apartment.imageUrls.map(async (url) => {
        try {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
        } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
            console.error(`Failed to delete image: ${url}`, error);
          }
        }
      }));
    }
    await deleteApartmentFromDb(id);
    revalidatePath(`/${ADMIN_PATH}`);
    revalidatePath("/");
    if (apartment) {
      revalidatePath(`/apartments/${id}`);
    }
  } catch (error) {
    console.error("Database error on delete:", error);
    return { error: "Database error. Failed to delete apartment." };
  }
}

const generateSummarySchema = z.object({
  title: z.string(),
  roomType: z.string(),
  district: z.string(),
  address: z.string().optional(),
  price: z.number(),
  area: z.number().optional(),
  detailedInformation: z.string().optional(),
});
// THÊM ĐOẠN NÀY VÀO ĐỂ EXPORT CHO COMPONENT GỌI
export async function generateSummaryAction(
  input: z.infer<typeof generateSummarySchema>
) {
  const validatedInput = generateSummarySchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: "Invalid input for summary generation." };
  }
  // Trong src/app/actions.ts

  try {
    const result = await generateListingSummary({
      title: validatedInput.data.title,
      roomType: validatedInput.data.roomType,
      district: validatedInput.data.district,
      address: validatedInput.data.address || "", // Thêm address (mặc định chuỗi rỗng nếu chưa nhập)
      price: validatedInput.data.price,
      area: validatedInput.data.area || 0,        // Thêm area (mặc định 0 nếu chưa nhập)
      detailedInformation: validatedInput.data.detailedInformation || "",
    });

    // SỬA: Trả về nội dung mô tả VÀ tiêu đề do AI viết
    return { summary: result.description, seoTitle: result.seoTitle };
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return { error: "Failed to generate summary from AI." };
  }
}

// Sửa: Cập nhật lại hàm này để khớp với cấu trúc output mới của AI
export async function fetchApartmentsAction(options: {
  query?: string;
  district?: string;
  priceRange?: string;
  roomType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  userId?: string;
}) {

  const { apartments, totalResults } = await getApartments(options);

  // If a user is logged in, check which apartments are favorited
  if (options.userId) {
    const userRef = doc(firestore, "users", options.userId);
    const userSnapshot = await getDoc(userRef);
    const rawFavoriteIds = userSnapshot.exists()
      ? userSnapshot.data().favorites
      : [];
    const favoriteIds = Array.isArray(rawFavoriteIds) ? rawFavoriteIds : [];
    const favoriteIdSet = new Set<string>(favoriteIds);
    const apartmentsWithFavorites = apartments.map(apt => ({
      ...apt,
      isFavorited: favoriteIdSet.has(apt.id)
    }));
    return { apartments: apartmentsWithFavorites, totalResults };
  }

  return { apartments, totalResults };
}

export async function toggleFavoriteAction({
  userId,
  apartmentId,
  isFavorited
}: {
  userId: string;
  apartmentId: string;
  isFavorited?: boolean;
}) {
  if (!userId) {
    return { error: "User not authenticated." };
  }
  if (!apartmentId) {
    return { error: "Apartment ID missing." };
  }

  try {
    await createUserDocument(userId, "");
    const isCurrentlyFavorited = await isApartmentFavorited(userId, apartmentId);

    if (isCurrentlyFavorited) {
      try {
        await removeFavorite(userId, apartmentId);
      } catch (removeError: any) {
        if (removeError.code === 'not-found' || removeError.code === 5 || removeError.message?.includes('NOT_FOUND')) {
          console.warn(`[Favorite] Document already missing, ignoring error.`);
        } else {
          throw removeError;
        }
      }
    } else {
      try {
        await addFavorite(userId, apartmentId);
      } catch (addError: any) {
        console.error("Add favorite error:", addError);
        throw addError;
      }
    }

    return { success: true, isFavorited: !isCurrentlyFavorited };

  } catch (error) {
    console.error("Toggle favorite CRITICAL error:", error);
    return { error: "Failed to update favorite status." };
  }
}

export async function checkFavoriteStatusAction(userId: string, apartmentId: string) {
  if (!userId) {
    return { isFavorited: false };
  }
  try {
    const isFavorited = await isApartmentFavorited(userId, apartmentId);
    return { isFavorited };
  } catch (error) {
    console.error("Check favorite status error:", error);
    return { isFavorited: false };
  }
}

export async function createUserDocument(userId: string, email: string) {
  if (!userId) return;
  try {
    const userRef = doc(firestore, "users", userId);
    await setDoc(userRef, {
      email: email,
      createdAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error("Failed to create user document:", error);
  }
}

const profileFormSchema = z.object({
  displayName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export async function updateUserProfileAction(
  userId: string,
  values: z.infer<typeof profileFormSchema>
) {
  if (!userId) {
    return { error: "User not authenticated." };
  }

  const validatedFields = profileFormSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid data provided." };
  }

  try {
    await updateUserProfileInDb(userId, validatedFields.data);
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return { error: "An error occurred while updating the profile." };
  }
}

// 1. Lấy danh sách các căn hộ chưa được đồng bộ
export async function getUnmigratedApartmentsAction() {
  try {
    const apartmentsCol = collection(firestore, "apartments");
    const querySnapshot = await getDocs(apartmentsCol);
    const unmigrated: { id: string; textToSearch: string }[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      // Nếu chưa có searchKeywords thì đưa vào danh sách cần đồng bộ
      if (!data.searchKeywords || data.searchKeywords.length === 0) {
        unmigrated.push({
          id: docSnap.id,
          textToSearch: `${data.title || ""} ${data.address || ""} ${data.sourceCode || ""}`.trim(),
        });
      }
    }
    return { success: true, data: unmigrated };
  } catch (error) {
    console.error("Lỗi khi kiểm tra dữ liệu:", error);
    return { error: "Không thể lấy danh sách đồng bộ." };
  }
}

// 2. Xử lý đồng bộ theo từng lô nhỏ (Batch)
export async function migrateApartmentsBatchAction(batch: { id: string; textToSearch: string }[]) {
  try {
    const promises = batch.map(async (item) => {
      const searchKeywords = generateSearchKeywords(item.textToSearch);
      const docRef = doc(firestore, "apartments", item.id);
      await updateDoc(docRef, { searchKeywords });
    });

    // Chạy song song nhiều update 1 lúc cho nhanh
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi đồng bộ Batch:", error);
    return { error: "Lỗi đồng bộ lô dữ liệu." };
  }
}

// 1. Lấy danh sách các căn hộ chưa có nội dung AI tối ưu
export async function getUnmigratedAiApartmentsAction() {
  try {
    const apartmentsCol = collection(firestore, "apartments");
    const querySnapshot = await getDocs(apartmentsCol);
    const unmigrated: { id: string; aptData: any }[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      // Nếu chưa có trường aiContent thì đưa vào danh sách cần chạy AI
      if (!data.aiContent) {
        unmigrated.push({
          id: docSnap.id,
          aptData: {
            title: data.title || "Căn hộ cho thuê",
            roomType: data.roomType || "studio",
            district: data.district || "Hà Nội",
            address: data.address || "",
            price: data.price || 0,
            area: data.area || 0,
            detailedInformation: data.details || "",
          },
        });
      }
    }
    return { success: true, data: unmigrated };
  } catch (error) {
    console.error("Lỗi khi quét danh sách căn hộ cho AI:", error);
    return { error: "Không thể lấy danh sách căn hộ chưa tối ưu AI." };
  }
}

// 2. Xử lý gọi AI và cập nhật theo từng lô (Batch)
export async function migrateAiApartmentsBatchAction(
  batch: { id: string; aptData: any }[]
): Promise<{ success: boolean; error?: string }> {
  const failedIds: string[] = [];

  // Xử lý tuần tự — rate limiter bên trong generateListingSummary
  // đã tự tối ưu tốc độ theo hạn mức token/phút của Groq
  for (const item of batch) {
    try {
      const aiResult = await generateListingSummary(item.aptData);

      const docRef = doc(firestore, "apartments", item.id);
      await updateDoc(docRef, {
        aiContent: {
          seoTitle: aiResult.seoTitle,
          b2cDescription: aiResult.description,
          highlights: aiResult.highlights,
          updatedAt: Timestamp.now(),
        },
      });
    } catch (error) {
      console.error(`Lỗi khi xử lý căn hộ ${item.id}:`, error);
      failedIds.push(item.id);
    }
  }

  if (failedIds.length > 0) {
    return {
      success: false,
      error: `Có ${failedIds.length} căn hộ xử lý thất bại: ${failedIds.join(", ")}`,
    };
  }

  return { success: true };
}


export async function pushApartmentAction(id: string) {
  if (!id) {
    return { error: "ID is required" };
  }

  try {
    const docRef = doc(firestore, "apartments", id);

    // Cập nhật lại thời gian để căn hộ trồi lên đầu
    await updateDoc(docRef, {
      updatedAt: Timestamp.now(),
      // Ghi đè createdAt để bộ lọc "Mới nhất" đẩy căn hộ lên vị trí đầu tiên
      createdAt: Timestamp.now(),
    });

    // Xóa cache chủ động (On-demand Revalidation)
    // Ngay sau lệnh này, các trang public sẽ được Next.js tự động fetch lại dữ liệu mới nhất 
    // và lưu thành một bản cache cứng mới, tối ưu chi phí reads.
    revalidatePath("/");
    revalidatePath(`/${ADMIN_PATH}`);
    revalidatePath("/apartments");

    return { success: true };
  } catch (error) {
    console.error("Database error on push:", error);
    return { error: "Database error. Failed to push apartment." };
  }
}