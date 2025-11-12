'use server';

/**
 * @fileOverview Generates a concise and engaging summary of an apartment listing using AI.
 *
 * - generateListingSummary - A function that generates the listing summary.
 * - GenerateListingSummaryInput - The input type for the generateListingSummary function.
 * - GenerateListingSummaryOutput - The return type for the generateListingSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateListingSummaryInputSchema = z.object({
  title: z.string().describe('The title of the apartment listing.'),
  roomType: z.string().describe('The type of the room (e.g., 1n1k, 2n1k, studio).'),
  district: z.string().describe('The district where the apartment is located.'),
  price: z.number().describe('The price of the apartment.'),
  detailedInformation: z.string().describe('Detailed information about the apartment.'),
});
export type GenerateListingSummaryInput = z.infer<typeof GenerateListingSummaryInputSchema>;

const GenerateListingSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise and engaging summary of the apartment listing.'),
});
export type GenerateListingSummaryOutput = z.infer<typeof GenerateListingSummaryOutputSchema>;

export async function generateListingSummary(
  input: GenerateListingSummaryInput
): Promise<GenerateListingSummaryOutput> {
  return generateListingSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateListingSummaryPrompt',
  input: {schema: GenerateListingSummaryInputSchema},
  output: {schema: GenerateListingSummaryOutputSchema},
  prompt: `You are an expert real estate copywriter. Generate a concise and engaging summary of the apartment listing based on the following information:\n\nTitle: {{{title}}}\nRoom Type: {{{roomType}}}\nDistrict: {{{district}}}\nPrice: {{{price}}}\nDetailed Information: {{{detailedInformation}}}\n\nSummary: `,
});

const generateListingSummaryFlow = ai.defineFlow(
  {
    name: 'generateListingSummaryFlow',
    inputSchema: GenerateListingSummaryInputSchema,
    outputSchema: GenerateListingSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
