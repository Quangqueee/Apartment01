
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
} from "@/lib/data";
import { generateListingSummary } from "@/ai/flows/generate-listing-summary";
import { firebaseApp } from "@/firebase/server-init";
import { Apartment } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { ADMIN_PATH } from "@/lib/constants";

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

  try {
    let existingImageUrls: string[] | undefined = undefined;
    if (id) {
        const existingApartment = await getApartmentById(id);
        existingImageUrls = existingApartment?.imageUrls;
    }
    
    const finalImageUrls = await uploadAndCleanupImages(data.imageUrls, existingImageUrls);

    // Always update the 'updatedAt' timestamp
    const apartmentDataWithTimestamp = { 
        ...data,
        listingSummary: data.listingSummary || "",
        imageUrls: finalImageUrls,
        updatedAt: Timestamp.now(), // Add/update the timestamp here
    };

    if (id) {
      await updateApartment(id, apartmentDataWithTimestamp);
    } else {
      // For new apartments, 'createdAt' is also set
      const newApartmentData = {
          ...apartmentDataWithTimestamp,
          createdAt: Timestamp.now(),
      };
      await createApartment(newApartmentData as Omit<Apartment, "id">);
    }
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Database error. Failed to save apartment." };
  }

  revalidatePath(`/${ADMIN_PATH}`);
  revalidatePath("/");
  if (id) {
    revalidatePath(`/apartments/${id}`);
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
}) {
    // This action simply passes the options to the centralized getApartments function.
    const { apartments } = await getApartments(options);
    
    return {
        apartments,
    };
}
