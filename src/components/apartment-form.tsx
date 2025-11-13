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
import { Apartment } from "@/lib/types";
import {
  createOrUpdateApartmentAction,
  generateSummaryAction,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  sourceCode: z.string().min(1, "Internal code is required."),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1, "District is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  details: z
    .string()
    .min(20, "Detailed information must be at least 20 characters."),
  listingSummary: z.string().optional(),
  address: z.string().min(1, "Exact address is required."),
  imageUrls: z.array(z.string()).min(1, "At least one image is required."),
});

type SortableImageProps = {
  src: string;
  index: number;
  removeImage: (index: number) => void;
};

const SortableImage = ({ src, index, removeImage }: SortableImageProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: src });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-video touch-none"
    >
      <Image
        src={src}
        alt={`Preview ${index + 1}`}
        fill
        className="rounded-md object-cover"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-1 top-1 z-10 h-6 w-6"
        onClick={(e) => {
          e.stopPropagation(); // Prevent dnd listeners from firing
          removeImage(index);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

type ApartmentFormProps = {
  apartment?: Apartment;
};

export default function ApartmentForm({ apartment }: ApartmentFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previews, setPreviews] = useState<string[]>(
    apartment?.imageUrls || []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: apartment?.title || "",
      sourceCode: apartment?.sourceCode || "",
      roomType: apartment?.roomType || "studio",
      district: apartment?.district || "",
      price: apartment?.price || 0,
      details: apartment?.details || "",
      listingSummary: apartment?.listingSummary || "",
      address: apartment?.address || "",
      imageUrls: apartment?.imageUrls || [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentImageCount = previews.length;
    if (currentImageCount + files.length > 10) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: "You can upload a maximum of 10 images.",
      });
      return;
    }

    const filePromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          return reject(`File type not supported: ${file.name}`);
        }
        if (file.size > MAX_FILE_SIZE) {
          return reject(`File too large: ${file.name}`);
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then((newPreviews) => {
        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);
        form.setValue("imageUrls", updatedPreviews, { shouldValidate: true });
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error uploading file",
          description:
            typeof error === "string" ? error : "An unexpected error occurred.",
        });
      });
  };

  const removeImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    form.setValue("imageUrls", updatedPreviews, { shouldValidate: true });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = previews.findIndex((p) => p === active.id);
      const newIndex = previews.findIndex((p) => p === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedPreviews = arrayMove(previews, oldIndex, newIndex);
        setPreviews(updatedPreviews);
        form.setValue("imageUrls", updatedPreviews, { shouldValidate: true });
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await createOrUpdateApartmentAction(apartment?.id, values);
    if (result?.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
    setIsSubmitting(false);
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const formValues = form.getValues();
    const result = await generateSummaryAction({
      title: formValues.title,
      roomType: formValues.roomType,
      district: formValues.district,
      price: formValues.price,
      detailedInformation: formValues.details,
    });
    if (result.summary) {
      form.setValue("listingSummary", result.summary);
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
                        <Input
                          placeholder="e.g. Luxury Apartment with Lake View"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details"
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
                  name="listingSummary"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>AI Generated Summary</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleGenerateSummary}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
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
                  render={() => (
                    <FormItem>
                      <FormLabel>Apartment Images</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            onChange={handleFileChange}
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Images
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload one or more images (JPG, PNG, WebP). Max 5MB
                        each. Drag to reorder. The first image will be the main
                        one.
                      </FormDescription>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={previews}
                          strategy={rectSortingStrategy}
                        >
                          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {previews.map((src, index) => (
                              <SortableImage
                                key={src}
                                src={src}
                                index={index}
                                removeImage={removeImage}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                  name="sourceCode"
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exact Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="123 Example St, Hanoi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {apartment ? "Update" : "Create"} Apartment
        </Button>
      </form>
    </Form>
  );
}
