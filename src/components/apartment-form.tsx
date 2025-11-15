
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
import { useState, useRef, DragEvent, useCallback } from "react";
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
import { cn } from "@/lib/utils";
import Link from "next/link";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const IMAGE_QUALITY = 0.75;
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGES = 15;


const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  sourceCode: z.string().min(1, "Internal code is required."),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1, "District is required."),
  area: z.coerce.number().min(1, "Area must be greater than 0."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  details: z
    .string()
    .min(20, "Detailed information must be at least 20 characters."),
  listingSummary: z.string().optional(),
  address: z.string().min(1, "Exact address is required."),
  landlordPhoneNumber: z.string().min(1, "Landlord phone number is required."),
  imageUrls: z.array(z.string()).min(1, "At least one image is required.").max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`),
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
      className="relative aspect-video"
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

// Helper function to compress and resize an image
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let { width, height } = img;

                // Resize logic
                if (width > MAX_IMAGE_WIDTH) {
                    height = (height * MAX_IMAGE_WIDTH) / width;
                    width = MAX_IMAGE_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                // Get the data URL with the specified quality
                const dataUrl = canvas.toDataURL(file.type, IMAGE_QUALITY);
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};


export default function ApartmentForm({ apartment }: ApartmentFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
      area: apartment?.area || 0,
      price: apartment?.price || 0,
      details: apartment?.details || "",
      listingSummary: apartment?.listingSummary || "",
      address: apartment?.address || "",
      landlordPhoneNumber: apartment?.landlordPhoneNumber || "",
      imageUrls: apartment?.imageUrls || [],
    },
  });

  const removeImage = useCallback((indexToRemove: number) => {
    setPreviews(currentPreviews => {
      const updatedPreviews = currentPreviews.filter((_, i) => i !== indexToRemove);
      form.setValue("imageUrls", updatedPreviews, { shouldValidate: true });
      return updatedPreviews;
    });
  }, [form]);


  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

    const currentImageCount = previews.length;
    if (currentImageCount + files.length > MAX_IMAGES) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images.`,
      });
      return;
    }

    const filePromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          return reject(`File type not supported: ${file.name}`);
        }
        if (file.size > MAX_FILE_SIZE) {
          // We can still try to compress it if it's too large
           console.warn(`File too large, attempting to compress: ${file.name}`);
        }
        compressImage(file).then(resolve).catch(reject);
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
          title: "Error processing file",
          description:
            typeof error === "string" ? error : "An unexpected error occurred.",
        });
      });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files || []));
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
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
                      <FormLabel>Tiêu đề</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD. Luxury Apartment with Lake View"
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
                      <FormLabel>Thông tin chi tiết</FormLabel>
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
                        <div
                          className={cn(
                            "relative flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-4 text-center transition-colors",
                            isDragging && "border-primary bg-accent"
                          )}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
                          <p className="font-semibold text-muted-foreground">
                            Kéo và thả hoặc nhấp để tải ảnh lên
                          </p>
                          <p className="text-sm text-muted-foreground">
                            (Ảnh sẽ được tự động nén)
                          </p>
                          <Input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            onChange={handleFileChange}
                            onClick={(e) => e.stopPropagation()}
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            className="absolute inset-0 h-full w-full opacity-0"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload up to {MAX_IMAGES} images (JPG, PNG, WebP). Drag to reorder. The first image will be the main
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
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá (triệu/tháng)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diện tích (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="45" {...field} />
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
                      <FormLabel>Quận</FormLabel>
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
                            <SelectValue placeholder="Chọn dạng phòng" />
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
                      <FormLabel>Mã nguồn</FormLabel>
                      <FormControl>
                        <Input placeholder="VD. TH001" {...field} />
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
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder=""
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="landlordPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SĐT Chủ nhà</FormLabel>
                      <FormControl>
                        <Input placeholder="VD. 09xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {apartment ? "Update" : "Create"} Apartment
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
