"use client";
import React from "react";

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
import {
  ADMIN_PATH,
  HANOI_DISTRICTS,
  MAX_APARTMENT_IMAGES,
  ROOM_TYPES,
} from "@/lib/constants";
import { Apartment } from "@/lib/types";
import {
  createOrUpdateApartmentAction,
  generateSummaryAction,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  useState,
  useRef,
  DragEvent,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { useRouter } from "next/navigation";

// --- IMPORT FIREBASE STORAGE ---
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const IMAGE_QUALITY = 0.95; // Chất lượng nén ảnh (0.0 - 1.0)
const MAX_IMAGE_WIDTH = 3840; // Giới hạn chiều rộng ảnh để giảm dung lượng, tránh quá lớn

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  sourceCode: z.string().min(1, "Internal code is required."),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1, "District is required."),
  area: z.coerce.number().min(1, "Area must be greater than 0."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  commission: z.string().optional(),
  details: z
    .string()
    .min(20, "Detailed information must be at least 20 characters."),
  listingSummary: z.string().optional(),
  address: z.string().min(1, "Exact address is required."),
  landlordPhoneNumber: z.string().min(1, "Landlord phone number is required."),
  imageUrls: z
    .array(z.string())
    .min(1, "At least one image is required.")
    .max(
      MAX_APARTMENT_IMAGES,
      `You can upload a maximum of ${MAX_APARTMENT_IMAGES} images.`,
    ),
});

type FormSchema = z.infer<typeof formSchema>;

type SortableImageProps = {
  id: string;
  src: string;
  index: number;
  removeImage: (id: string) => void;
};

const SortableImage = React.memo(function SortableImage({
  id,
  src,
  index,
  removeImage,
}: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    willChange: transform ? "transform" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-video touch-none"
    >
      <img
        src={src}
        alt={`Preview ${index + 1}`}
        className="h-full w-full rounded-md object-cover pointer-events-none [-webkit-touch-callout:none]"
        draggable={false}
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-1 top-1 z-10 h-6 w-6 color-red-500 p-0 text-red-500 hover:bg-red-500/10"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          removeImage(id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

type ApartmentFormProps = {
  apartment?: Apartment;
};

// Cấu trúc lại PreviewItem để chứa cả File (Blob) thật bên cạnh đường link ảo
type PreviewItem = {
  id: string;
  src: string;
  blob?: Blob; // Lưu trữ Blob nhị phân nếu là ảnh mới upload
};

const flattenImageSources = (value: unknown): string[] => {
  const flatImageSources: string[] = [];

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
      flatImageSources.push(normalizedValue);
    }
  };

  visitValue(value);
  return flatImageSources;
};

// 🛠️ TỐI ƯU HÓA: Xuất ra Blob thay vì Base64 Data URL
const compressImage = (file: File): Promise<{ src: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let { width, height } = img;
        if (width > MAX_IMAGE_WIDTH) {
          height = (height * MAX_IMAGE_WIDTH) / width;
          width = MAX_IMAGE_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Xuất file nhị phân (Blob) để đẩy lên Firebase
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Lỗi xử lý ảnh trên canvas."));
              return;
            }
            // Tạo một URL ảo để hiển thị trên trình duyệt cực mượt, không tốn text
            const objectUrl = URL.createObjectURL(blob);
            resolve({ src: objectUrl, blob });
          },
          "image/jpeg",
          IMAGE_QUALITY,
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const createPreviewId = () =>
  `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createInitialPreviewItems = (imageUrls: unknown): PreviewItem[] =>
  flattenImageSources(imageUrls).map((src, index) => ({
    id: `initial-${index}`,
    src,
  }));

const getPreviewSources = (previewItems: PreviewItem[]) =>
  previewItems.map((item) => item.src);

export default function ApartmentForm({ apartment }: ApartmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>(
    createInitialPreviewItems(apartment?.imageUrls || []),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const form = useForm<FormSchema, unknown, FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: apartment?.title || "",
      sourceCode: apartment?.sourceCode || "",
      roomType: apartment?.roomType || "studio",
      district: apartment?.district || "",
      area: apartment?.area || 0,
      price: apartment?.price || 0,
      commission:
        apartment?.commission !== undefined ? String(apartment.commission) : "",
      details: apartment?.details || "",
      listingSummary: apartment?.listingSummary || "",
      address: apartment?.address || "",
      landlordPhoneNumber: apartment?.landlordPhoneNumber || "",
      imageUrls: apartment?.imageUrls || [],
    },
  });

  const updatePreviewItems = useCallback(
    (
      updater:
        | PreviewItem[]
        | ((currentPreviewItems: PreviewItem[]) => PreviewItem[]),
    ) => {
      setPreviewItems(updater);
    },
    [],
  );

  useEffect(() => {
    // Luôn báo cho react-hook-form biết có ảnh (dù là URL ảo hay URL thật) để vượt qua validation
    form.setValue("imageUrls", getPreviewSources(previewItems), {
      shouldValidate: true,
    });
  }, [previewItems, form]);

  const removeImage = useCallback(
    (idToRemove: string) => {
      updatePreviewItems((currentPreviewItems) => {
        const itemToRemove = currentPreviewItems.find(
          (i) => i.id === idToRemove,
        );
        // Thu hồi bộ nhớ nếu là ảnh URL ảo
        if (itemToRemove?.blob) URL.revokeObjectURL(itemToRemove.src);
        return currentPreviewItems.filter((item) => item.id !== idToRemove);
      });
    },
    [updatePreviewItems],
  );

  const sortableIds = useMemo(
    () => previewItems.map((item) => item.id),
    [previewItems],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const currentImageCount = previewItems.length;
      if (currentImageCount + files.length > MAX_APARTMENT_IMAGES) {
        toast({
          variant: "destructive",
          title: "Quá nhiều ảnh",
          description: `Bạn chỉ có thể tải lên tối đa ${MAX_APARTMENT_IMAGES} ảnh.`,
        });
        return;
      }

      const filePromises = files.map((file) => {
        return new Promise<{ src: string; blob: Blob }>((resolve, reject) => {
          if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return reject(`Định dạng file không được hỗ trợ: ${file.name}`);
          }
          compressImage(file).then(resolve).catch(reject);
        });
      });

      Promise.all(filePromises)
        .then((newImages) => {
          updatePreviewItems((currentPreviewItems) => {
            const nextItems = [
              ...currentPreviewItems,
              ...newImages.map((img) => ({
                id: createPreviewId(),
                src: img.src,
                blob: img.blob, // Lưu trữ nguyên file nhị phân
              })),
            ];
            return nextItems;
          });
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Lỗi xử lý ảnh",
            description:
              typeof error === "string"
                ? error
                : "Đã xảy ra lỗi không mong muốn.",
          });
        });
    },
    [previewItems.length, toast, updatePreviewItems],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(Array.from(event.target.files || []));
      event.target.value = "";
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Chỉ kích hoạt hiệu ứng kéo/thả nếu thứ đang được kéo là File (ảnh).
    // Nếu là văn bản (do người dùng kéo chữ từ Textarea), bỏ qua ngay lập tức.
    if (!e.dataTransfer.types.includes("Files")) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      updatePreviewItems((currentPreviewItems) => {
        const oldIndex = currentPreviewItems.findIndex(
          (item) => item.id === String(active.id),
        );
        const newIndex = currentPreviewItems.findIndex(
          (item) => item.id === String(over.id),
        );
        if (oldIndex === -1 || newIndex === -1) return currentPreviewItems;
        return arrayMove(currentPreviewItems, oldIndex, newIndex);
      });
    },
    [updatePreviewItems],
  );

  // 🛠️ TỐI ƯU HÓA: Tách luồng upload ảnh lên Firebase Storage ra khỏi Server Action
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (previewItems.length === 0) {
      form.setError("imageUrls", {
        type: "manual",
        message: "Vui lòng tải lên ít nhất 1 ảnh.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const finalImageUrls: string[] = [];

      // Dùng Promise.all để bắn tất cả ảnh mới lên Storage CÙNG MỘT LÚC
      const uploadPromises = previewItems.map(async (item) => {
        if (item.blob) {
          // Là ảnh mới (chứa file nhị phân)
          const fileName = `apartments/${Date.now()}-${item.id}.webp`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, item.blob);
          const downloadUrl = await getDownloadURL(storageRef);
          return downloadUrl;
        } else {
          // Đã là ảnh cũ (có sẵn URL từ Firebase)
          return item.src;
        }
      });

      // Đợi quá trình upload hoàn tất để lấy mảng link chuẩn (không còn link ảo blob:// nữa)
      const uploadedUrls = await Promise.all(uploadPromises);

      // Chỉ gửi nội dung Text và các đường link URL cực nhẹ qua Server Action
      const result = await createOrUpdateApartmentAction(apartment?.id, {
        title: values.title,
        sourceCode: values.sourceCode,
        roomType: values.roomType,
        district: values.district,
        area: values.area,
        price: values.price,
        commission: values.commission,
        details: values.details,
        listingSummary: values.listingSummary,
        address: values.address,
        landlordPhoneNumber: values.landlordPhoneNumber,
        imageUrlsJson: JSON.stringify(uploadedUrls), // Mảng string URL chuẩn, dung lượng tí hon
      });

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Thành công",
        description: apartment ? "Đã cập nhật căn hộ." : "Đã thêm căn hộ mới.",
        duration: 1000,
      });
      router.push(`/${ADMIN_PATH}/apartments`);
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      toast({
        variant: "destructive",
        title: "Lỗi Upload",
        description: "Không thể tải ảnh lên máy chủ. Vui lòng kiểm tra mạng.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
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
                      <FormLabel>Mô tả căn hộ</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập thông tin chi tiết về căn hộ..."
                          /* Đã tăng min-h lên 250px cho mobile và 350px cho desktop. 
                             Thêm text-base để fix lỗi của iOS */
                          className="min-h-[250px] md:min-h-[350px] text-base md:text-sm"
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
                <CardTitle>Hình ảnh</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="imageUrls"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div
                          className={cn(
                            "relative flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-4 text-center transition-colors",
                            isDragging && "border-primary bg-accent",
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
                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Tải lên tối đa {MAX_APARTMENT_IMAGES} ảnh (JPG, PNG,
                        WebP). Ảnh được hiển thị theo thứ tự, ảnh đầu tiên làm
                        ảnh bìa.
                      </FormDescription>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={sortableIds}
                          strategy={rectSortingStrategy}
                        >
                          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 touch-none select-none">
                            {previewItems.map((item, index) => (
                              <SortableImage
                                key={item.id}
                                id={item.id}
                                src={item.src}
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
                <CardTitle>Thông tin căn hộ</CardTitle>
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
                      </FormControl>{" "}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hoa hồng</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="VD. 50%/12th"
                          {...field}
                        />
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
                            <SelectValue placeholder="Chọn Quận" />
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
                <CardTitle>Admin Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sourceCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input placeholder="VD. TH0012" {...field} />
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
                        <Textarea placeholder="" {...field} />
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {apartment ? "Update" : "Create"} Apartment
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${ADMIN_PATH}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
