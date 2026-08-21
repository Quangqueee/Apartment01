"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { generateSearchKeywords } from "@/lib/utils";
import { revalidateApartmentListings } from "@/lib/apartment-cache";
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
import { Timestamp, doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteField, writeBatch } from "firebase/firestore";
import { ADMIN_PATH, MAX_APARTMENT_IMAGES } from "@/lib/constants";
import { firestore } from "@/firebase/server-init";

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

const imageUrlsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .refine(
        (url) => !url.startsWith("blob:") && !url.startsWith("data:"),
        "Ảnh chưa được tải lên máy chủ.",
      ),
  )
  .min(1, "At least one image is required.")
  .max(
    MAX_APARTMENT_IMAGES,
    `You can upload a maximum of ${MAX_APARTMENT_IMAGES} images.`,
  );

const highlightsSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()));

const apartmentBaseSchema = z.object({
  title: z.string().min(5),
  sourceCode: z.string().min(1),
  roomType: z.enum([
    "studio",
    "1n1k",
    "2n1k",
    "3n1k",
    "4n1k",
    "duplex",
    "penthouse",
    "other",
  ]),
  district: z.string().min(1),
  area: z.coerce.number().min(1, "Area must be greater than 0."),
  price: z.coerce.number().min(0),
  commission: z.string().optional(),
  details: z.string().min(20),
  address: z.string().min(1),
  landlordPhoneNumber: z.string().min(1, "Landlord phone number is required."),
  status: z.enum(["available", "rented"]).optional().default("available"),
  tags: z.array(z.enum(["pet_friendly", "lake_view"])).optional().default([]),
  
  aiContent: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    description: z.string().optional(),
    highlights: highlightsSchema,
  }).nullable().optional(),
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
    if (typeof currentValue !== "string") return;
    const normalizedValue = currentValue.trim();
    if (normalizedValue.length > 0) flatImageUrls.push(normalizedValue);
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

async function uploadAndCleanupImages(currentImageUrls: string[], existingImageUrls: string[] | undefined): Promise<string[]> {
  const newImageUrls: string[] = [];

  for (const url of currentImageUrls) {
    if (url.startsWith('data:')) {
      const storageRef = ref(storage, `apartments/${uuidv4()}`);
      const snapshot = await uploadString(storageRef, url, 'data_url');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      newImageUrls.push(downloadUrl);
    } else {
      newImageUrls.push(url);
    }
  }

  if (existingImageUrls) {
    const urlsToDelete = existingImageUrls.filter((url) => !newImageUrls.includes(url));
    await Promise.all(
      urlsToDelete.map(async (url) => {
        try {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
        } catch (error: any) {
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
    const errorMessage = parsedImageUrls.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    return { error: `Invalid fields! ${errorMessage}` };
  }

  const { imageUrlsJson: _imageUrlsJson, aiContent, ...data } = validatedFields.data;
  let apartmentId = id;

  try {
    let existingApartment: any = null;
    let existingImageUrls: string[] | undefined = undefined;

    if (apartmentId) {
      existingApartment = await getApartmentById(apartmentId);
      existingImageUrls = existingApartment?.imageUrls;
    }

    const finalImageUrls = await uploadAndCleanupImages(parsedImageUrls.data, existingImageUrls);
    const textToSearch = `${data.title} ${data.address} ${data.sourceCode}`.trim();
    const searchKeywords = generateSearchKeywords(textToSearch);

    const apartmentDataWithTimestamp = {
      ...data,
      aiContent: aiContent || null, 
      imageUrls: finalImageUrls,
      searchKeywords: searchKeywords,
      updatedAt: Timestamp.now(),
    };

    if (apartmentId) {
      await updateApartment(apartmentId, apartmentDataWithTimestamp);
    } else {
      const newApartmentData = {
        ...apartmentDataWithTimestamp,
        submissionStatus: "published" as const,
        createdAt: Timestamp.now(),
      };
      const newApartment = await createApartment(newApartmentData as Omit<Apartment, "id">);
      apartmentId = newApartment.id;
    }
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Database error. Failed to save apartment." };
  }

  revalidateApartmentListings(apartmentId);
  return { success: true };
}

export async function deleteApartmentAction(id: string) {
  if (!id) return { error: "ID is required" };
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
    revalidateApartmentListings(id);
    return { success: true };
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

export async function generateSummaryAction(
  input: z.infer<typeof generateSummarySchema>
) {
  const validatedInput = generateSummarySchema.safeParse(input);
  if (!validatedInput.success) return { error: "Invalid input for summary generation." };

  try {
    const result = await generateListingSummary({
      title: validatedInput.data.title,
      roomType: validatedInput.data.roomType,
      district: validatedInput.data.district,
      address: validatedInput.data.address || "", 
      price: validatedInput.data.price,
      area: validatedInput.data.area || 0,        
      detailedInformation: validatedInput.data.detailedInformation || "",
    });
    
    return {
      description: result.description, 
      seoTitle: result.seoTitle,
      seoDescription: result.seoDescription,
      highlights: result.highlights
    };
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return { error: "Failed to generate summary from AI." };
  }
}

export async function fetchApartmentsAction(options: {
  query?: string;
  district?: string;
  priceRange?: string;
  roomType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  cursor?: string;
  skipCount?: boolean;
  totalHint?: number;
}) {
  try {
    const { apartments, totalResults, nextCursor } = await getApartments({
      query: options.query,
      district: options.district,
      priceRange: options.priceRange,
      roomType: options.roomType,
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      cursor: options.cursor,
      skipCount: options.skipCount,
      totalHint: options.totalHint,
    });

    return JSON.parse(
      JSON.stringify({ apartments, totalResults, nextCursor }),
    ) as {
      apartments: Apartment[];
      totalResults: number;
      nextCursor: string | null;
    };
  } catch (error) {
    console.error("Lỗi khi tải danh sách căn hộ:", error);
    return {
      apartments: [] as Apartment[],
      totalResults: 0,
      nextCursor: null,
      error: "Không tải được danh sách căn hộ. Vui lòng thử lại.",
    };
  }
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
  if (!userId) return { error: "User not authenticated." };
  if (!apartmentId) return { error: "Apartment ID missing." };

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
  if (!userId) return { isFavorited: false };
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
    await setDoc(userRef, { email: email, createdAt: Timestamp.now() }, { merge: true });
  } catch (error) {
    console.error("Failed to create user document:", error);
  }
}

const profileFormSchema = z.object({
  displayName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export async function updateUserProfileAction(userId: string, values: z.infer<typeof profileFormSchema>) {
  if (!userId) return { error: "User not authenticated." };
  const validatedFields = profileFormSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Invalid data provided." };

  try {
    await updateUserProfileInDb(userId, validatedFields.data);
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return { error: "An error occurred while updating the profile." };
  }
}

export async function getUnmigratedApartmentsAction() {
  try {
    const apartmentsCol = collection(firestore, "apartments");
    const querySnapshot = await getDocs(apartmentsCol);
    const unmigrated: { id: string; textToSearch: string }[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (!data.searchKeywords || data.searchKeywords.length === 0) {
        unmigrated.push({
          id: docSnap.id,
          textToSearch: `${data.title || ""} ${data.address || ""} ${data.sourceCode || ""}`.trim(),
        });
      }
    }
    return JSON.parse(JSON.stringify({ success: true, data: unmigrated }));
  } catch (error) {
    console.error("Lỗi khi kiểm tra dữ liệu:", error);
    return { error: "Không thể lấy danh sách đồng bộ." };
  }
}

export async function migrateApartmentsBatchAction(batch: { id: string; textToSearch: string }[]) {
  try {
    const promises = batch.map(async (item) => {
      const searchKeywords = generateSearchKeywords(item.textToSearch);
      const docRef = doc(firestore, "apartments", item.id);
      await updateDoc(docRef, { searchKeywords });
    });
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi đồng bộ Batch:", error);
    return { error: "Lỗi đồng bộ lô dữ liệu." };
  }
}

// =========================================================================
// 🚀 LOGIC KIỂM TRA MIGRATION & GỌI AI
// =========================================================================

export async function getUnmigratedAiApartmentsAction() {
  try {
    const apartmentsCol = collection(firestore, "apartments");
    const querySnapshot = await getDocs(apartmentsCol);
    const unmigrated: { id: string; aptData: any }[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      // Cần migration nếu chưa có aiContent HOẶC vẫn còn sót listingSummary/seoTitle ở cấp gốc
      const hasAiContent = data.aiContent && data.aiContent.description;
      const hasLegacyRootData = !!data.listingSummary || !!data.seoTitle || !!data.seoDescription;

      if (!hasAiContent || hasLegacyRootData) {
        unmigrated.push({
          id: docSnap.id,
          aptData: {
            ...data, 
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
    
    return JSON.parse(JSON.stringify({ success: true, data: unmigrated }));
  } catch (error) {
    console.error("Lỗi khi quét danh sách căn hộ cho AI:", error);
    return { error: "Không thể lấy danh sách căn hộ chưa tối ưu AI." };
  }
}

export async function migrateAiApartmentsBatchAction(
  batch: { id: string; aptData: any }[]
): Promise<{ success: boolean; error?: string }> {
  const failedIds: string[] = [];

  for (const item of batch) {
    try {
      const docRef = doc(firestore, "apartments", item.id);
      const data = item.aptData;

      // 1. TÁI CHẾ DỮ LIỆU CŨ (MIGRATION TRỰC TIẾP, BỎ QUA GỌI API AI)
      if (data.listingSummary || data.seoTitle || data.seoDescription) {
        let parsedHighlights: string[] = [];
        if (data.highlights) {
          parsedHighlights = Array.isArray(data.highlights) 
            ? data.highlights 
            : data.highlights.split("\n").filter((h: string) => h.trim() !== "");
        }

        await updateDoc(docRef, {
          aiContent: {
            seoTitle: data.seoTitle || data.title || "",
            seoDescription: data.seoDescription || "",
            description: data.listingSummary || "",
            highlights: parsedHighlights,
            updatedAt: Timestamp.now(),
          },
          // Dọn rác DB bằng deleteField()
          listingSummary: deleteField(),
          seoTitle: deleteField(),
          seoDescription: deleteField(),
          highlights: deleteField(),
        });
        continue; 
      }

      // 2. NẾU KHÔNG CÓ DỮ LIỆU CŨ -> MỚI CHẠY GỌI GROQ AI
      const aiResult = await generateListingSummary(item.aptData);
      
      // ✅ SỬA LỖI: AiSummaryResponse đã quy định rõ highlights là Array, không cần dùng split() nữa
      const parsedHighlights: string[] = aiResult.highlights || [];

      await updateDoc(docRef, {
        aiContent: {
          seoTitle: aiResult.seoTitle || "",
          seoDescription: aiResult.seoDescription || "",
          description: aiResult.description || "", // ✅ Đã xóa thuộc tính 'summary' gây lỗi
          highlights: parsedHighlights,
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

// =========================================================================

export async function pushApartmentAction(id: string) {
  if (!id) return { error: "ID is required" };
  try {
    const docRef = doc(firestore, "apartments", id);
    await updateDoc(docRef, { updatedAt: Timestamp.now(), createdAt: Timestamp.now() });
    revalidateApartmentListings(id);
    return { success: true };
  } catch (error) {
    console.error("Database error on push:", error);
    return { error: "Database error. Failed to push apartment." };
  }
}

export async function pushApartmentsBatchAction(ids: string[]) {
  if (!ids?.length) return { error: "Chưa chọn căn hộ nào." };
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return { error: "Chưa chọn căn hộ nào." };
  if (uniqueIds.length > 500) return { error: "Tối đa 500 căn hộ mỗi lần đẩy." };

  try {
    const now = Date.now();
    const CHUNK = 450;
    for (let i = 0; i < uniqueIds.length; i += CHUNK) {
      const chunk = uniqueIds.slice(i, i + CHUNK);
      const batch = writeBatch(firestore);
      chunk.forEach((id, chunkIndex) => {
        const globalIndex = i + chunkIndex;
        const ts = Timestamp.fromMillis(now + (uniqueIds.length - globalIndex));
        batch.update(doc(firestore, "apartments", id), {
          updatedAt: ts,
          createdAt: ts,
        });
      });
      await batch.commit();
    }
    revalidateApartmentListings();
    return { success: true, pushedCount: uniqueIds.length };
  } catch (error) {
    console.error("Database error on batch push:", error);
    return { error: "Không thể đẩy hàng loạt căn hộ." };
  }
}

export async function backfillSubmissionStatusAction() {
  try {
    const apartmentsCol = collection(firestore, "apartments");
    const querySnapshot = await getDocs(apartmentsCol);
    const toBackfill = querySnapshot.docs.filter((docSnap) => !docSnap.data().submissionStatus);

    await Promise.all(
      toBackfill.map((docSnap) =>
        updateDoc(doc(firestore, "apartments", docSnap.id), { submissionStatus: "published" })
      )
    );
    return { success: true, updatedCount: toBackfill.length };
  } catch (error) {
    console.error("Lỗi khi backfill submissionStatus:", error);
    return { error: "Không thể backfill trạng thái tin đăng." };
  }
}