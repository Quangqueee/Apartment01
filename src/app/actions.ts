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
} from "@/lib/data";
import { generateListingSummary } from "@/ai/flows/generate-listing-summary";
import { initializeFirebase } from "@/firebase";

// Initialize Firebase Storage
const { firebaseApp } = initializeFirebase();
const storage = getStorage(firebaseApp);


const formSchema = z.object({
  title: z.string().min(5),
  internalCode: z.string().min(1),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1),
  price: z.coerce.number().min(0),
  detailedInformation: z.string().min(20),
  summary: z.string().optional(),
  exactAddress: z.string().min(1),
  imageUrls: z.array(z.string()).min(1, "At least one image is required."),
});

// Helper function to upload or update images
async function uploadImages(imageUrls: string[]): Promise<string[]> {
  const uploadedUrls = await Promise.all(
    imageUrls.map(async (url) => {
      if (url.startsWith('data:')) {
        // This is a new image (base64 data URI)
        const storageRef = ref(storage, `apartments/${uuidv4()}`);
        const snapshot = await uploadString(storageRef, url, 'data_url');
        return getDownloadURL(snapshot.ref);
      }
      // This is an existing URL
      return url;
    })
  );
  return uploadedUrls;
}


// Helper to delete images from storage that are no longer in use
async function handleImageCleanup(existingUrls: string[], newUrls: string[]) {
    const urlsToDelete = existingUrls.filter(url => !newUrls.includes(url));
    await Promise.all(urlsToDelete.map(async (url) => {
        try {
            const imageRef = ref(storage, url);
            await deleteObject(imageRef);
        } catch (error: any) {
            // Ignore 'object-not-found' errors, as it might have been deleted already
            if (error.code !== 'storage/object-not-found') {
                console.error(`Failed to delete image: ${url}`, error);
            }
        }
    }));
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
    const finalImageUrls = await uploadImages(data.imageUrls);

    if (id) {
       // On update, check if we need to clean up old images
      const existingApartment = await getApartmentById(id);
      if (existingApartment) {
        await handleImageCleanup(existingApartment.imageUrls, finalImageUrls);
      }
      await updateApartment(id, { ...data, imageUrls: finalImageUrls });
    } else {
      await createApartment({ ...data, imageUrls: finalImageUrls });
    }
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Database error. Failed to save apartment." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteApartmentAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) {
    return { error: "ID is required" };
  }
  try {
     const apartment = await getApartmentById(id);
     if (apartment) {
        await handleImageCleanup(apartment.imageUrls, []);
     }
    await deleteApartmentFromDb(id);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
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
