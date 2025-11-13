"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createApartment,
  updateApartment,
  deleteApartment,
} from "@/lib/data";
import { generateListingSummary } from "@/ai/flows/generate-listing-summary";

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

export async function createOrUpdateApartmentAction(
  id: string | undefined,
  values: z.infer<typeof formSchema>
) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    // Manually construct a user-friendly error message
    const errorIssues = validatedFields.error.issues;
    const errorMessage = errorIssues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    return { error: `Invalid fields! ${errorMessage}` };
  }
  
  const data = {
    ...validatedFields.data,
    summary: validatedFields.data.summary || "", // Ensure summary is not undefined
  };

  try {
    if (id) {
      await updateApartment(id, data);
    } else {
      await createApartment(data);
    }
  } catch (error) {
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
    await deleteApartment(id);
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
