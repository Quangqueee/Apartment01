"use client";

import React, { useRef, useState, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ADMIN_PATH,
  HANOI_DISTRICTS,
  MAX_APARTMENT_IMAGES,
  ROOM_TYPES,
  STAY_AMENITIES,
} from "@/lib/constants";
import type { ShortTermApartment } from "@/lib/types";
import {
  saveAdminShortTermClient,
  saveLandlordShortTermClient,
} from "@/lib/short-term-write-client";
import { useAuth as useAppAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MAX_IMAGE_WIDTH = 1920;
const IMAGE_QUALITY = 0.82;
const UPLOAD_RETRY_COUNT = 3;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const formSchema = z
  .object({
    formMode: z.enum(["admin", "landlord"]),
    title: z.string().min(5, "Tiêu đề tối thiểu 5 ký tự."),
    roomType: z.enum([
      "studio",
      "1n1k",
      "2n1k",
      "3n1k",
      "4n1k",
      "duplex",
      "penthouse",
      "other",
    ]),
    district: z.string().min(1, "Vui lòng chọn quận."),
    area: z.coerce.number().min(1, "Diện tích phải lớn hơn 0."),
    nightlyPrice: z.coerce
      .number()
      .min(50000, "Giá mỗi đêm tối thiểu 50.000đ."),
    minNights: z.coerce.number().min(1, "Số đêm tối thiểu là 1."),
    maxGuests: z.coerce.number().min(1, "Số khách tối đa phải từ 1."),
    checkInTime: z.string().min(1, "Chọn giờ nhận phòng."),
    checkOutTime: z.string().min(1, "Chọn giờ trả phòng."),
    amenities: z.array(z.string()),
    details: z.string().min(20, "Mô tả chi tiết tối thiểu 20 ký tự."),
    imageUrls: z
      .array(z.string())
      .min(1, "Cần tối thiểu 1 ảnh. Ảnh đầu tiên là ảnh bìa.")
      .max(MAX_APARTMENT_IMAGES, `Tối đa ${MAX_APARTMENT_IMAGES} ảnh.`),
    sourceCode: z.string().optional(),
    address: z.string().optional(),
    landlordPhoneNumber: z.string().optional(),
    contactPhone: z.string().optional(),
    status: z.enum(["available", "rented"]),
  })
  .superRefine((data, ctx) => {
    if (data.formMode === "admin") {
      if (!data.sourceCode?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["sourceCode"],
          message: "Mã căn nội bộ là bắt buộc.",
        });
      }
      if (!data.address?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["address"],
          message: "Địa chỉ chính xác là bắt buộc.",
        });
      }
      if (!data.landlordPhoneNumber?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["landlordPhoneNumber"],
          message: "SĐT chủ nhà là bắt buộc.",
        });
      }
    } else if (!data.contactPhone || data.contactPhone.trim().length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "Số điện thoại không hợp lệ.",
      });
    }
  });

type FormSchema = z.infer<typeof formSchema>;

type PreviewItem = {
  id: string;
  src: string;
  blob?: Blob;
};

const isAcceptedImageFile = (file: File) =>
  !file.type || ACCEPTED_IMAGE_TYPES.includes(file.type);

const uploadBlobWithRetry = async (
  blob: Blob,
  path: string,
): Promise<string> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < UPLOAD_RETRY_COUNT; attempt++) {
    try {
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, blob, {
        contentType: blob.type || "image/jpeg",
      });
      return await getDownloadURL(fileRef);
    } catch (error) {
      lastError = error;
      if (attempt < UPLOAD_RETRY_COUNT - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Không thể tải ảnh lên máy chủ.");
};

const compressImage = (file: File): Promise<{ src: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const fail = (reason: unknown) => {
      reject(
        reason instanceof Error
          ? reason
          : new Error(`Không xử lý được ảnh: ${file.name}`),
      );
    };

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            fail(new Error("Trình duyệt không hỗ trợ xử lý ảnh."));
            return;
          }
          let { width, height } = img;
          if (width > MAX_IMAGE_WIDTH) {
            height = (height * MAX_IMAGE_WIDTH) / width;
            width = MAX_IMAGE_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                fail(new Error(`Lỗi xử lý ảnh: ${file.name}`));
                return;
              }
              resolve({ src: URL.createObjectURL(blob), blob });
            },
            "image/jpeg",
            IMAGE_QUALITY,
          );
        } catch (error) {
          fail(error);
        }
      };
      img.onerror = () => fail(new Error(`Không đọc được ảnh: ${file.name}`));
    };
    reader.onerror = () => fail(new Error(`Không đọc được file: ${file.name}`));
  });
};

const createPreviewId = () =>
  `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getFirstFormErrorMessage = (errors: FieldErrors<FormSchema>): string => {
  const visit = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as { message?: unknown };
    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message;
    }
    for (const [key, nested] of Object.entries(record)) {
      if (key === "ref" || key === "type" || key === "types") continue;
      const found = visit(nested);
      if (found) return found;
    }
    return null;
  };
  return (
    visit(errors) || "Vui lòng kiểm tra các trường còn thiếu hoặc chưa hợp lệ."
  );
};

type ShortTermFormProps = {
  apartment?: ShortTermApartment;
  mode?: "admin" | "landlord";
};

export default function ShortTermForm({
  apartment,
  mode = "admin",
}: ShortTermFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAppAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>(
    (apartment?.blockedDates || []).map((d) => parseISO(d)),
  );
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>(
    (apartment?.imageUrls || []).map((src, index) => ({
      id: `initial-${index}`,
      src,
    })),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formMode: mode,
      title: apartment?.title || "",
      roomType: apartment?.roomType || "studio",
      district: apartment?.district || "",
      area: apartment?.area || 0,
      nightlyPrice: apartment?.nightlyPrice || 0,
      minNights: apartment?.minNights || 1,
      maxGuests: apartment?.maxGuests || 2,
      checkInTime: apartment?.checkInTime || "14:00",
      checkOutTime: apartment?.checkOutTime || "12:00",
      amenities: apartment?.amenities || [],
      details: apartment?.details || "",
      imageUrls: apartment?.imageUrls || [],
      sourceCode: apartment?.sourceCode || "",
      address: apartment?.address || "",
      landlordPhoneNumber: apartment?.landlordPhoneNumber || "",
      contactPhone: apartment?.contactPhone || "",
      status: apartment?.status || "available",
    },
  });

  const syncFormImages = (items: PreviewItem[]) => {
    form.setValue(
      "imageUrls",
      items.map((item) => item.src),
      { shouldValidate: true },
    );
  };

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(isAcceptedImageFile);
    if (!list.length) return;
    if (previewItems.length + list.length > MAX_APARTMENT_IMAGES) {
      toast({
        variant: "destructive",
        title: `Tối đa ${MAX_APARTMENT_IMAGES} ảnh.`,
      });
      return;
    }
    setIsProcessingImages(true);
    try {
      const compressed = await Promise.all(list.map(compressImage));
      const newItems = [
        ...previewItems,
        ...compressed.map((item) => ({
          id: createPreviewId(),
          src: item.src,
          blob: item.blob,
        })),
      ];
      setPreviewItems(newItems);
      syncFormImages(newItems);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi xử lý ảnh",
        description: error?.message || "Vui lòng thử lại.",
      });
    } finally {
      setIsProcessingImages(false);
    }
  };

  const removeImage = (id: string) => {
    const newItems = previewItems.filter((item) => item.id !== id);
    setPreviewItems(newItems);
    syncFormImages(newItems);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const onSubmit = async (values: FormSchema) => {
    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập lại rồi thử gửi tin.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Path phải khớp storage.rules: apartments/{auth.uid}/{fileName}
      const uploadedUrls: string[] = [];
      for (const item of previewItems) {
        if (item.blob) {
          const url = await uploadBlobWithRetry(
            item.blob,
            `apartments/${user.uid}/${Date.now()}-${item.id}.jpg`,
          );
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(item.src);
        }
      }

      const blocked = blockedDates.map((d) => format(d, "yyyy-MM-dd")).sort();

      if (mode === "admin") {
        await saveAdminShortTermClient(
          {
            title: values.title,
            sourceCode: values.sourceCode || "",
            roomType: values.roomType,
            district: values.district,
            area: values.area,
            nightlyPrice: values.nightlyPrice,
            minNights: values.minNights,
            maxGuests: values.maxGuests,
            checkInTime: values.checkInTime,
            checkOutTime: values.checkOutTime,
            amenities: values.amenities,
            blockedDates: blocked,
            details: values.details,
            address: values.address || "",
            landlordPhoneNumber: values.landlordPhoneNumber || "",
            status: values.status,
            imageUrls: uploadedUrls,
          },
          apartment?.id,
        );
        toast({
          title: apartment?.id
            ? "Đã cập nhật căn ngắn hạn!"
            : "Đã tạo căn ngắn hạn!",
          className: "bg-green-50 text-green-900 border-green-200",
        });
        router.push(`/${ADMIN_PATH}/short-term`);
      } else {
        if (!user?.uid) throw new Error("Bạn cần đăng nhập.");
        await saveLandlordShortTermClient(
          user.uid,
          {
            title: values.title,
            roomType: values.roomType,
            district: values.district,
            area: values.area,
            nightlyPrice: values.nightlyPrice,
            minNights: values.minNights,
            maxGuests: values.maxGuests,
            checkInTime: values.checkInTime,
            checkOutTime: values.checkOutTime,
            amenities: values.amenities,
            blockedDates: blocked,
            details: values.details,
            contactPhone: values.contactPhone || "",
            status: values.status,
            imageUrls: uploadedUrls,
          },
          apartment?.id,
        );
        toast({
          title: "Đã gửi tin căn ngắn hạn!",
          description: "Admin sẽ xét duyệt tin của bạn sớm nhất.",
          className: "bg-green-50 text-green-900 border-green-200",
        });
        router.push("/profile/apartments");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Vui lòng thử lại.";
      console.error("ShortTermForm submit:", message);
      toast({
        variant: "destructive",
        title: "Lỗi lưu tin",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors: FieldErrors<FormSchema>) => {
    toast({
      variant: "destructive",
      title: "Thiếu thông tin",
      description: getFirstFormErrorMessage(errors),
    });
  };

  const isAdmin = mode === "admin";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6 overflow-x-hidden"
      >
        <Card>
          <CardHeader>
            <CardTitle>Thông tin căn hộ ngắn hạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề tin đăng *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Studio Tây Hồ view hồ, đủ đồ"
                      className="text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại phòng *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Chọn loại phòng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROOM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quận *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Chọn quận" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HANOI_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
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
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diện tích (m²) *</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="nightlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá mỗi đêm (VND) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="VD: 800000"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minNights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số đêm tối thiểu *</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số khách tối đa *</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ nhận phòng *</FormLabel>
                    <FormControl>
                      <Input type="time" className="text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ trả phòng *</FormLabel>
                    <FormControl>
                      <Input type="time" className="text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Nội thất, vị trí, quy định lưu trú..."
                      className="text-base"
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
            <CardTitle>Tiện nghi</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="amenities"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {STAY_AMENITIES.map((amenity) => {
                      const checked = field.value?.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors text-sm",
                            checked
                              ? "border-[#cda533] bg-[#cda533]/5"
                              : "border-gray-200 hover:border-gray-300",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              field.onChange(
                                value
                                  ? [...(field.value || []), amenity]
                                  : (field.value || []).filter(
                                      (item) => item !== amenity,
                                    ),
                              );
                            }}
                          />
                          {amenity}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chặn ngày (không cho đặt)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Calendar
              mode="multiple"
              selected={blockedDates}
              onSelect={(dates) => setBlockedDates(dates || [])}
              disabled={{ before: new Date() }}
              numberOfMonths={1}
              className="rounded-xl border"
            />
            <p className="text-xs text-gray-500 text-center">
              Chọn các ngày muốn khóa (bảo trì, đã có khách ngoài hệ thống...).
              Đã chọn: {blockedDates.length} ngày.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh ({previewItems.length}/{MAX_APARTMENT_IMAGES})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors",
                isDragging
                  ? "border-[#cda533] bg-[#cda533]/5"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              {isProcessingImages ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
              <p className="text-sm text-gray-500 text-center">
                Nhấn để chọn hoặc kéo thả ảnh vào đây. Ảnh đầu tiên là ảnh bìa.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {previewItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previewItems.map((item, index) => (
                  <div key={item.id} className="relative aspect-video">
                    <img
                      src={item.src}
                      alt={`Ảnh ${index + 1}`}
                      className="h-full w-full rounded-md object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Ảnh bìa
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => removeImage(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <FormField
              control={form.control}
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAdmin ? "Thông tin quản trị" : "Thông tin liên hệ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sourceCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã căn nội bộ *</FormLabel>
                        <FormControl>
                          <Input className="text-base" {...field} />
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
                        <FormLabel>SĐT chủ nhà *</FormLabel>
                        <FormControl>
                          <Input type="tel" className="text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ chính xác *</FormLabel>
                      <FormControl>
                        <Input className="text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SĐT liên hệ của bạn *</FormLabel>
                    <FormControl>
                      <Input type="tel" className="text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái phòng *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base sm:max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Đang nhận khách</SelectItem>
                      <SelectItem value="rented">Tạm ngưng nhận khách</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting || isProcessingImages}
          className="w-full sm:w-auto h-12 px-10 rounded-xl bg-[#cda533] hover:bg-[#b88e22] text-white font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : apartment?.id ? (
            "Lưu thay đổi"
          ) : isAdmin ? (
            "Tạo căn ngắn hạn"
          ) : (
            "Gửi tin chờ duyệt"
          )}
        </Button>
      </form>
    </Form>
  );
}
