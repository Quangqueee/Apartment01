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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  displayName: z.string().min(1, "Vui lòng nhập họ tên của bạn."),
  phoneNumber: z.string().min(8, "Số điện thoại không hợp lệ."),
  district: z.string().min(1, "Vui lòng chọn khu vực bạn có phòng."),
  message: z.string().optional(),
});

export default function PartnerRegisterPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      phoneNumber: "",
      district: "",
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

  // 4. Form đăng ký
  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const res = await createLandlordRequest(user!.uid, values);
      if (res.error) {
        toast({ variant: "destructive", title: "Lỗi", description: res.error });
      } else {
        toast({
          title: "Thành công!",
          description: "Đã gửi yêu cầu đăng ký. Vui lòng chờ admin xét duyệt.",
        });
        window.location.reload(); // Refresh để load lại trạng thái "pending"
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
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và Tên</FormLabel>
                      <FormControl>
                        <Input placeholder="VD. Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="VD. 0912345678" {...field} />
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
                        <FormLabel>Khu vực có phòng</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn quận..." />
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
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lời nhắn (Không bắt buộc)</FormLabel>
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
