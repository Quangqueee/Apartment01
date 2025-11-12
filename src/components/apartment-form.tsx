"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HANOI_DISTRICTS, ROOM_TYPES } from "@/lib/constants";
import { Apartment, RoomType } from "@/lib/types";
import { createOrUpdateApartmentAction, generateSummaryAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  internalCode: z.string().min(1, "Internal code is required."),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1, "District is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  detailedInformation: z
    .string()
    .min(20, "Detailed information must be at least 20 characters."),
  summary: z.string().optional(),
  exactAddress: z.string().min(1, "Exact address is required."),
  imageUrls: z
    .string()
    .min(1, "At least one image URL is required.")
    .refine(
      (val) => val.split("\n").every((url) => url.startsWith("http")),
      "Each line must be a valid URL."
    ),
});

type ApartmentFormProps = {
  apartment?: Apartment;
};

export default function ApartmentForm({ apartment }: ApartmentFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: apartment?.title || "",
      internalCode: apartment?.internalCode || "",
      roomType: apartment?.roomType || "studio",
      district: apartment?.district || "",
      price: apartment?.price || 0,
      detailedInformation: apartment?.detailedInformation || "",
      summary: apartment?.summary || "",
      exactAddress: apartment?.exactAddress || "",
      imageUrls: apartment?.imageUrls.join("\n") || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await createOrUpdateApartmentAction(apartment?.id, values);
    if (result.success) {
      toast({
        title: "Success",
        description: `Apartment ${apartment ? "updated" : "created"} successfully.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const formValues = form.getValues();
    const result = await generateSummaryAction({
      title: formValues.title,
      roomType: formValues.roomType,
      district: formValues.district,
      price: formValues.price,
      detailedInformation: formValues.detailedInformation,
    });
    if (result.summary) {
      form.setValue("summary", result.summary);
      toast({
        title: "Summary Generated",
        description: "AI-powered summary has been added.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate summary. Please try again.",
      });
    }
    setIsGenerating(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Core Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Luxury Apartment with Lake View" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="detailedInformation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the apartment in detail..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>AI Generated Summary</FormLabel>
                        <Button type="button" size="sm" variant="outline" onClick={handleGenerateSummary} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          Generate
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="AI summary will appear here..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="imageUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URLs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter one image URL per line. The first one will be the main image.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (triệu/tháng)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HANOI_DISTRICTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROOM_TYPES.map((rt) => (
                            <SelectItem key={rt.value} value={rt.value}>
                              {rt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
               <CardHeader>
                <CardTitle>Admin Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={form.control}
                  name="internalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. TH001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="exactAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exact Address</FormLabel>
                       <FormControl>
                        <Textarea placeholder="123 Example St, Hanoi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {apartment ? "Update" : "Create"} Apartment
        </Button>
      </form>
    </Form>
  );
}
