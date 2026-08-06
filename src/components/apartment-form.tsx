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
import { Apartment, ApartmentStatus, FeatureTag } from "@/lib/types";
import {
  createOrUpdateApartmentAction,
  generateSummaryAction,
} from "@/app/actions";
import { submitApartmentByLandlord } from "@/app/landlord-actions";
import { useAuth as useAppAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  useState,
  useRef,
  DragEvent,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Loader2, Trash2, Upload, Dog, Waves } from "lucide-react";
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

import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MAX_IMAGE_WIDTH = 3840;
const IMAGE_QUALITY = 0.95;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const formSchema = z
  .object({
    formMode: z.enum(["admin", "landlord"]),
    title: z.string().min(5, "Title must be at least 5 characters."),
    roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
    district: z.string().min(1, "District is required."),
    area: z.coerce.number().min(1, "Area must be greater than 0."),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    commission: z.string().optional(),
    details: z
      .string()
      .min(20, "Detailed information must be at least 20 characters."),

    // CÁC TRƯỜNG DÀNH CHO SEO AI
    listingSummary: z.string().optional(), // Map với description của AI
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    highlights: z.string().optional(), // Nhận text area mỗi dòng 1 highlight

    imageUrls: z
      .array(z.string())
      .min(
        1,
        "Ảnh đầu tiên được chọn làm ảnh bìa, và các ảnh hiển thị theo thứ tự sắp xếp.",
      )
      .max(
        MAX_APARTMENT_IMAGES,
        `You can upload a maximum of ${MAX_APARTMENT_IMAGES} images.`,
      ),
    sourceCode: z.string().optional(),
    address: z.string().optional(),
    landlordPhoneNumber: z.string().optional(),
    status: z.enum(["available", "rented"]).optional(),
    tags: z.array(z.enum(["pet_friendly", "lake_view"])).optional(),
    serviceFees: z.string().optional(),
    contactPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.formMode === "admin") {
      if (!data.sourceCode || !data.sourceCode.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["sourceCode"],
          message: "Internal code is required.",
        });
      }
      if (!data.address || !data.address.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["address"],
          message: "Exact address is required.",
        });
      }
      if (!data.landlordPhoneNumber || !data.landlordPhoneNumber.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["landlordPhoneNumber"],
          message: "Landlord phone number is required.",
        });
      }
      if (!data.status) {
        ctx.addIssue({
          code: "custom",
          path: ["status"],
          message: "Status is required.",
        });
      }
    } else {
      if (!data.contactPhone || data.contactPhone.trim().length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["contactPhone"],
          message: "Số điện thoại không hợp lệ.",
        });
      }
    }
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
        className="absolute right-1 top-1 z-10 h-6 w-6 p-0 text-red-500 hover:bg-red-500/10"
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
  mode?: "admin" | "landlord";
};

type PreviewItem = {
  id: string;
  src: string;
  blob?: Blob;
};

const flattenImageSources = (value: unknown): string[] => {
  const flatImageSources: string[] = [];
  const visitValue = (currentValue: unknown) => {
    if (Array.isArray(currentValue)) {
      currentValue.forEach(visitValue);
      return;
    }
    if (typeof currentValue !== "string") return;
    const normalizedValue = currentValue.trim();
    if (normalizedValue.length > 0) flatImageSources.push(normalizedValue);
  };
  visitValue(value);
  return flatImageSources;
};

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

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Lỗi xử lý ảnh trên canvas."));
              return;
            }
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

export default function ApartmentForm({
  apartment,
  mode = "admin",
}: ApartmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAppAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Trích xuất aiContent từ bản ghi cũ để set trạng thái hiển thị Form SEO
  const aiData = (apartment as any)?.aiContent || {};
  const hasOldSeo = !!apartment?.listingSummary || !!aiData?.description;
  const [isSeoEnabled, setIsSeoEnabled] = useState(hasOldSeo);

  const [previewItems, setPreviewItems] = useState<PreviewItem[]>(
    createInitialPreviewItems(apartment?.imageUrls || []),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
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
      formMode: mode,
      title: apartment?.title || "",
      sourceCode: apartment?.sourceCode || "",
      roomType: apartment?.roomType || "studio",
      district: apartment?.district || "",
      area: apartment?.area || 0,
      price: apartment?.price || 0,
      commission:
        apartment?.commission !== undefined ? String(apartment.commission) : "",
      details: apartment?.details || "",

      // Khôi phục dữ liệu SEO từ aiContent hoặc trường gốc
      listingSummary: apartment?.listingSummary || aiData?.description || "",
      seoTitle: aiData?.seoTitle || "",
      seoDescription: aiData?.seoDescription || "",
      highlights: aiData?.highlights
        ? Array.isArray(aiData.highlights)
          ? aiData.highlights.join("\n")
          : aiData.highlights
        : "",

      address: apartment?.address || "",
      landlordPhoneNumber: apartment?.landlordPhoneNumber || "",
      status: apartment?.status || "available",
      tags: apartment?.tags || [],
      imageUrls: apartment?.imageUrls || [],
      serviceFees: apartment?.serviceFees || "",
      contactPhone: apartment?.contactPhone || "",
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
    form.setValue("imageUrls", getPreviewSources(previewItems), {
      shouldValidate: true,
    });
  }, [previewItems, form]);

  useEffect(() => {
    if (apartment) {
      const currentAiData = (apartment as any)?.aiContent || {};
      form.reset({
        formMode: mode,
        title: apartment.title || "",
        sourceCode: apartment.sourceCode || "",
        roomType: apartment.roomType || "studio",
        district: apartment.district || "",
        area: apartment.area || 0,
        price: apartment.price || 0,
        commission:
          apartment.commission !== undefined
            ? String(apartment.commission)
            : "",
        details: apartment.details || "",

        listingSummary:
          apartment.listingSummary || currentAiData.description || "",
        seoTitle: currentAiData.seoTitle || "",
        seoDescription: currentAiData.seoDescription || "",
        highlights: currentAiData.highlights
          ? Array.isArray(currentAiData.highlights)
            ? currentAiData.highlights.join("\n")
            : currentAiData.highlights
          : "",

        address: apartment.address || "",
        landlordPhoneNumber: apartment.landlordPhoneNumber || "",
        status: apartment.status || "available",
        tags: apartment.tags || [],
        imageUrls: apartment.imageUrls || [],
        serviceFees: apartment.serviceFees || "",
        contactPhone: apartment.contactPhone || "",
      });

      if (apartment.imageUrls && apartment.imageUrls.length > 0) {
        setPreviewItems(createInitialPreviewItems(apartment.imageUrls));
      }
    }
  }, [apartment, mode, form]);

  const removeImage = useCallback(
    (idToRemove: string) => {
      updatePreviewItems((currentPreviewItems) => {
        const itemToRemove = currentPreviewItems.find(
          (i) => i.id === idToRemove,
        );
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
      if (previewItems.length + files.length > MAX_APARTMENT_IMAGES) {
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
          updatePreviewItems((currentPreviewItems) => [
            ...currentPreviewItems,
            ...newImages.map((img) => ({
              id: createPreviewId(),
              src: img.src,
              blob: img.blob,
            })),
          ]);
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

  // HÀM GỌI AI TẠO SEO CONTENT
  const handleGenerateAi = async () => {
    const title = form.getValues("title");
    const roomType = form.getValues("roomType");
    const district = form.getValues("district");
    const price = form.getValues("price");
    const details = form.getValues("details");

    if (!details || details.length < 10) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Thông tin chi tiết trước khi tạo AI.",
      });
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await generateSummaryAction({
        title: title || "Căn hộ cho thuê",
        roomType: roomType || "studio",
        district: district || "Hà Nội",
        price: Number(price) || 0,
        detailedInformation: details,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      // Xử lý mapping đúng các key từ file backend
      if (res.seoTitle) {
        form.setValue("seoTitle", res.seoTitle, { shouldValidate: true });
      }
      if (res.seoDescription) {
        form.setValue("seoDescription", res.seoDescription, {
          shouldValidate: true,
        });
      }
      // Tool bulk migration và backend trả về "description" thay vì "summary"
      const generatedContent = res.description || res.summary;
      if (generatedContent) {
        form.setValue("listingSummary", generatedContent, {
          shouldValidate: true,
        });
      }
      if (res.highlights) {
        const highlightsStr = Array.isArray(res.highlights)
          ? res.highlights.join("\n")
          : res.highlights;
        form.setValue("highlights", highlightsStr, { shouldValidate: true });
      }

      toast({
        title: "Thành công! ✨",
        description: "AI đã tạo tiêu đề, mô tả và điểm nổi bật chuẩn SEO.",
        className: "bg-purple-50 text-purple-900 border-purple-200",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi AI",
        description: error.message || "Không thể tạo nội dung từ AI.",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

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
      const uploadPromises = previewItems.map(async (item) => {
        if (item.blob) {
          const fileName = `apartments/${Date.now()}-${item.id}.webp`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, item.blob);
          return await getDownloadURL(storageRef);
        } else {
          return item.src;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Chuyển highlights từ chuỗi \n về mảng để lưu DB
      const parsedHighlights =
        isSeoEnabled && values.highlights
          ? values.highlights.split("\n").filter((h) => h.trim() !== "")
          : [];

      const result =
        mode === "landlord"
          ? await submitApartmentByLandlord(
              user?.uid || "",
              {
                title: values.title,
                roomType: values.roomType,
                district: values.district,
                area: values.area,
                price: values.price,
                details: values.details,
                commission: values.commission,
                contactPhone: values.contactPhone || "",
                status: values.status || "available",
                imageUrls: uploadedUrls,
              },
              apartment?.id,
            )
          : await createOrUpdateApartmentAction(apartment?.id, {
              title: values.title,
              sourceCode: values.sourceCode || "",
              roomType: values.roomType,
              district: values.district,
              area: values.area,
              price: values.price,
              commission: values.commission,
              details: values.details,

              // Gửi toàn bộ dữ liệu AI SEO
              listingSummary: isSeoEnabled ? values.listingSummary : "",
              seoTitle: isSeoEnabled ? values.seoTitle : "",
              seoDescription: isSeoEnabled ? values.seoDescription : "",
              highlights: parsedHighlights as any, // Truyền sang backend

              address: values.address || "",
              landlordPhoneNumber: values.landlordPhoneNumber || "",
              status: values.status || "available",
              tags: values.tags || [],
              imageUrlsJson: JSON.stringify(uploadedUrls),
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

      if (mode === "landlord") {
        toast({
          title: "Thành công",
          description: apartment
            ? "Đã cập nhật thông tin phòng thành công."
            : "Đã gửi tin đăng, vui lòng chờ admin xét duyệt.",
          duration: 2000,
        });
        router.refresh();
        setTimeout(() => {
          router.push(apartment ? "/profile/apartments" : "/");
        }, 100);
        return;
      }

      toast({
        title: "Thành công",
        description: apartment ? "Đã cập nhật căn hộ." : "Đã thêm căn hộ mới.",
        duration: 1000,
      });

      router.refresh();

      setTimeout(() => {
        router.push(`/${ADMIN_PATH}/apartments`);
      }, 100);
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
                      <FormLabel>Địa chỉ hiển thị</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: 123 Nguyễn Trãi, Thanh Xuân"
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
                      <FormLabel>Thông tin căn hộ</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập thông số điện nước, phí dịch vụ, giờ giấc, nội thất thô..."
                          className="min-h-[150px] text-base md:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NÚT BẬT TẮT VÀ GỌI AI SEO */}
                {mode === "admin" && (
                  <>
                    <div className="flex items-center gap-2 pt-2 border-t mt-6">
                      <input
                        type="checkbox"
                        id="toggleSeo"
                        checked={isSeoEnabled}
                        onChange={(e) => setIsSeoEnabled(e.target.checked)}
                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                      />
                      <label
                        htmlFor="toggleSeo"
                        className="text-sm font-semibold cursor-pointer select-none text-gray-700"
                      >
                        Bật cấu hình tạo SEO AI (Dành cho khách thuê)
                      </label>
                    </div>

                    {isSeoEnabled && (
                      <div className="p-4 border rounded-md bg-purple-50/50 transition-all mt-4 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateAi}
                            disabled={isGeneratingAi}
                            className="text-purple-600 border-purple-200 hover:bg-purple-100 gap-1.5 h-8 text-xs font-semibold cursor-pointer shadow-sm bg-white ml-auto"
                          >
                            {isGeneratingAi ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                                Đang xử lý...
                              </>
                            ) : (
                              <>✨ Tối ưu bằng AI</>
                            )}
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="seoTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-purple-700 font-semibold">
                                Tiêu đề bài đăng (B2C)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="VD: Căn hộ Studio view hồ cực chill, full nội thất..."
                                  className="bg-white font-medium"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="seoDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-purple-700 font-semibold">
                                Mô tả SEO (Meta Description)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Đoạn mô tả ngắn 2-3 câu..."
                                  className="bg-white min-h-[60px]"
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
                              <FormLabel className="text-purple-700 font-semibold">
                                Nội dung chi tiết (Mô tả dài)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Nội dung bài viết sẽ hiển thị ở đây. Bạn cũng có thể tự do chỉnh sửa..."
                                  className="min-h-[250px] md:min-h-[300px] text-base md:text-sm bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="highlights"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-purple-700 font-semibold">
                                Điểm nổi bật (Mỗi dòng 1 ý)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Điểm nổi bật 1&#10;Điểm nổi bật 2&#10;..."
                                  className="bg-white min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </>
                )}
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
                        WebP).
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
                <CardTitle>
                  {mode === "admin"
                    ? "Trạng thái & Đặc trưng"
                    : "Trạng thái phòng"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái phòng</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Còn trống</SelectItem>
                          <SelectItem value="rented">Tạm hết</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === "admin" && (
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag nổi bật</FormLabel>
                        <div className="flex flex-col gap-2 pt-1">
                          {[
                            {
                              id: "pet_friendly",
                              label: "Pet Friendly",
                              icon: Dog,
                            },
                            {
                              id: "lake_view",
                              label: "Lake View",
                              icon: Waves,
                            },
                          ].map((item) => {
                            const isChecked = field.value?.includes(
                              item.id as FeatureTag,
                            );
                            const IconComp = item.icon;
                            return (
                              <label
                                key={item.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all select-none",
                                  isChecked
                                    ? "border-primary bg-primary/5 text-primary font-medium"
                                    : "bg-transparent border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4" />
                                  <span className="text-sm">{item.label}</span>
                                </div>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentTags = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...currentTags, item.id]);
                                    } else {
                                      field.onChange(
                                        currentTags.filter(
                                          (t) => t !== item.id,
                                        ),
                                      );
                                    }
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

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
                      </FormControl>
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
                      <FormLabel>Dạng phòng</FormLabel>
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

            {mode === "admin" && (
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
            )}

            {mode === "landlord" && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại liên hệ</FormLabel>
                        <FormControl>
                          <Input placeholder="VD. 09xxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "landlord"
              ? "Gửi tin đăng"
              : `${apartment ? "Update" : "Create"} Apartment`}
          </Button>
          <Button variant="outline" asChild>
            <Link href={mode === "landlord" ? "/" : `/${ADMIN_PATH}`}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
