"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLandlordRequest } from "@/app/landlord-actions";
import { useToast } from "@/hooks/use-toast";
import { HANOI_DISTRICTS } from "@/lib/constants";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Building,
  Clock,
  CheckCircle2,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";

// 4. Cập nhật schema:
// - Đổi tên field displayName thành operatorName (hoặc giữ tên tùy ý bạn)
// - District đổi từ string sang mảng string (string[]) để hỗ trợ chọn nhiều
// - Message chuyển thành bắt buộc (.min(1)

const formSchema = z.object({
  displayName: z.string().min(1, "Vui lòng nhập tên đơn vị vận hành."),
  phoneNumber: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại.")
    .min(8, "Số điện thoại không hợp lệ."),

  district: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất một khu vực có phòng."),

  message: z
    .string()
    .min(1, "Vui lòng nhập lời nhắn để chúng tôi hỗ trợ tốt nhất."),
});

export default function PartnerRegisterPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const defaultPhoneNumber =
    (userData as any)?.phoneNumber ||
    (userData as any)?.phone ||
    user?.phoneNumber ||
    "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "", // Đã sửa từ operatorName thành displayName
      phoneNumber: defaultPhoneNumber,
      district: [], // Đảm bảo là mảng rỗng
      message: "",
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  // 1. Chưa đăng nhập
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center py-20">
          <Building className="h-16 w-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            Trở thành Đối tác của Hanoi Residences
          </h1>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Vui lòng đăng nhập để gửi yêu cầu đăng ký làm Chủ nhà / Đối tác cho
            thuê.
          </p>
          <Button
            asChild
            className="bg-[#cda533] hover:bg-[#b5902b] text-white"
          >
            <Link href="/login?redirect=/partner-register">Đăng nhập ngay</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Đã là chủ nhà hoặc admin
  if (userData?.role === "landlord" || userData?.role === "admin") {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center py-20">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bạn đã là đối tác!</h1>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Tài khoản của bạn đã có quyền đăng tin căn hộ.
          </p>
          <Button asChild>
            <Link href="/profile/apartments">Vào trang Quản lý phòng</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Đang chờ duyệt
  if (userData?.landlordApprovalStatus === "pending") {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center py-20">
          <Clock className="h-16 w-16 text-amber-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Yêu cầu đang được xử lý</h1>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Chúng tôi đã nhận được thông tin của bạn. Ban quản trị sẽ liên hệ và
            xét duyệt trong thời gian sớm nhất.
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Form đăng ký
  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Chuyển mảng khu vực thành chuỗi ngăn cách bằng dấu phẩy để khớp với kiểu dữ liệu backend mong đợi
      const payload = {
        ...values,
        district: values.district.join(", "),
      };

      const res = await createLandlordRequest(user!.uid, payload);
      if (res.error) {
        toast({ variant: "destructive", title: "Lỗi", description: res.error });
      } else {
        toast({
          title: "Thành công!",
          description: "Đã gửi yêu cầu đăng ký. Vui lòng chờ admin xét duyệt.",
        });
        window.location.reload();
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-lg shadow-lg border-0">
          <CardHeader className="text-center space-y-2">
            <Building className="h-10 w-10 text-[#cda533] mx-auto mb-2" />
            <CardTitle className="text-2xl font-black uppercase">
              Đăng ký làm Chủ nhà
            </CardTitle>
            <CardDescription className="text-base">
              Điền thông tin để tham gia mạng lưới cho thuê của Hanoi Residences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(userData as any)?.landlordApprovalStatus === "rejected" && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
                <strong>Yêu cầu trước đó bị từ chối:</strong>{" "}
                {(userData as any)?.landlordRejectionReason ||
                  "Không đạt yêu cầu."}
                <br />
                Bạn có thể gửi lại yêu cầu mới ở bên dưới.
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Đổi nhãn hiển thị thành "Tên đơn vị vận hành" nhưng giữ nguyên name="displayName" */}
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đơn vị vận hành</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD. Hanoi Housing / Cty Bất Động Sản ABC"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Thêm items-start để cố định 2 cột luôn thẳng hàng phía trên */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* 2. Số điện thoại */}
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Số điện thoại liên hệ{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="VD. 0912345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 3. Khu vực có phòng (Đã bỏ flex flex-col ở FormItem) */}
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => {
                      const selectedDistricts = field.value || [];
                      const displayText =
                        selectedDistricts.length === 0
                          ? "Chọn quận..."
                          : selectedDistricts.length <= 2
                            ? selectedDistricts.join(", ")
                            : `${selectedDistricts.length} quận đã chọn`;

                      return (
                        <FormItem>
                          <FormLabel>
                            Khu vực có phòng{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <button
                                  type="button"
                                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-800 font-normal"
                                >
                                  <span className="truncate mr-2">
                                    {displayText}
                                  </span>
                                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                </button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[var(--radix-popover-trigger-width)] rounded-xl border bg-white shadow-xl z-[150] p-1.5 max-h-[200px] overflow-y-auto"
                              align="start"
                            >
                              <div className="flex flex-col gap-0.5">
                                {HANOI_DISTRICTS.map((districtName) => {
                                  const isChecked =
                                    selectedDistricts.includes(districtName);
                                  return (
                                    <div
                                      key={districtName}
                                      onClick={() => {
                                        let newArray = [...selectedDistricts];
                                        if (isChecked) {
                                          newArray = newArray.filter(
                                            (d) => d !== districtName,
                                          );
                                        } else {
                                          newArray.push(districtName);
                                        }
                                        field.onChange(newArray);
                                      }}
                                      className={`flex items-center gap-2.5 py-1.5 px-2.5 text-xs md:text-sm font-semibold cursor-pointer rounded-lg transition-all ${
                                        isChecked
                                          ? "bg-[#cda533]/10 text-[#cda533]"
                                          : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                                      }`}
                                    >
                                      <div
                                        className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center border transition-colors ${
                                          isChecked
                                            ? "bg-[#cda533] border-[#cda533] text-white"
                                            : "border-gray-300 bg-white"
                                        }`}
                                      >
                                        {isChecked && (
                                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                                        )}
                                      </div>
                                      <span className="truncate">
                                        {districtName}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* 4. Lời nhắn chuyển thành bắt buộc */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Lời nhắn <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả qua về số lượng phòng, phân khúc phòng bạn đang quản lý..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#1a1a1a] hover:bg-[#cda533] text-white h-12 text-base font-bold"
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Gửi Yêu Cầu Đăng Ký
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
