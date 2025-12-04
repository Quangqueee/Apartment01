"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

import {
  createApartment,
  updateApartment,
  deleteApartment as deleteApartmentFromDb,
  getApartmentById,
  getApartments,
  addFavorite,
  removeFavorite,
  getFavoriteApartments,
  isApartmentFavorited,
  updateUserProfile as updateUserProfileInDb,
} from "@/lib/data";
import { generateListingSummary } from "@/ai/flows/generate-listing-summary";
import { firebaseApp } from "@/firebase/server-init";
import { Apartment } from "@/lib/types";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import { ADMIN_PATH } from "@/lib/constants";
import { firestore } from "@/firebase/server-init";

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

const formSchema = z.object({
  title: z.string().min(5),
  sourceCode: z.string().min(1),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1),
  area: z.coerce.number().min(1, "Area must be greater than 0."),
  price: z.coerce.number().min(0),
  details: z.string().min(20),
  listingSummary: z.string().optional(),
  address: z.string().min(1),
  landlordPhoneNumber: z.string().min(1, "Landlord phone number is required."),
  imageUrls: z.array(z.string()).min(1, "At least one image is required."),
});

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
  values: z.infer<typeof formSchema>
) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    const errorIssues = validatedFields.error.issues;
    const errorMessage = errorIssues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    return { error: `Invalid fields! ${errorMessage}` };
  }

  const data = validatedFields.data;
  let apartmentId = id;

  try {
    let existingImageUrls: string[] | undefined = undefined;
    if (apartmentId) {
      const existingApartment = await getApartmentById(apartmentId);
      existingImageUrls = existingApartment?.imageUrls;
    }

    const finalImageUrls = await uploadAndCleanupImages(data.imageUrls, existingImageUrls);

    const apartmentDataWithTimestamp = {
      ...data,
      listingSummary: data.listingSummary || "",
      imageUrls: finalImageUrls,
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
  redirect(`/${ADMIN_PATH}`);
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

const summaryInputSchema = z.object({
  title: z.string(),
  roomType: z.string(),
  district: z.string(),
  price: z.number(),
  detailedInformation: z.string(),
});

export async function generateSummaryAction(
  input: z.infer<typeof summaryInputSchema>
) {
  const validatedInput = summaryInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: "Invalid input for summary generation." };
  }
  try {
    const result = await generateListingSummary(validatedInput.data);
    return { summary: result.summary };
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
  userId?: string;
}) {
  const { apartments, totalResults } = await getApartments(options);

  // If a user is logged in, check which apartments are favorited
  if (options.userId) {
    const favoriteIds = await getFavoriteApartments(options.userId);
    const favoriteIdSet = new Set(favoriteIds.map(fav => fav.id));
    const apartmentsWithFavorites = apartments.map(apt => ({
      ...apt,
      isFavorited: favoriteIdSet.has(apt.id)
    }));
    return { apartments: apartmentsWithFavorites, totalResults };
  }

  return { apartments, totalResults };
}

// ---------------------------------------------------------
// FIX: Hàm toggleFavoriteAction đã được nâng cấp xử lý lỗi
// ---------------------------------------------------------
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
    // BƯỚC 0: Đảm bảo User Document tồn tại (Phòng trường hợp user mới chưa được lưu vào DB)
    // Nếu user đã có thì hàm này tự merge, không mất dữ liệu cũ.
    await createUserDocument(userId, "");

    // BƯỚC 1: Kiểm tra trạng thái
    const isCurrentlyFavorited = await isApartmentFavorited(userId, apartmentId);

    if (isCurrentlyFavorited) {
      // UNFAVORITE
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
      // FAVORITE
      try {
        // Vì data.ts đã sửa thành setDoc, nên dòng này sẽ chạy mượt
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
