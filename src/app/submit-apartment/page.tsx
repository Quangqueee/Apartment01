"use client";

import { useAuth as useAppAuth } from "@/context/auth-context";
import { Loader2, Home, PhoneCall } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";
import ApartmentForm from "@/components/apartment-form";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getApartmentById } from "@/lib/data-client";
import { Apartment } from "@/lib/types";

// Tách Component con để sử dụng useSearchParams an toàn trong Suspense
function SubmitApartmentContent() {
  const { user, userData, loading } = useAppAuth();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); // Bắt tham số ?edit=... trên URL

  const [apartmentData, setApartmentData] = useState<Apartment | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // FETCH DỮ LIỆU CĂN HỘ NẾU LÀ CHẾ ĐỘ SỬA
  useEffect(() => {
    if (editId) {
      setIsFetching(true);
      getApartmentById(editId)
        .then((data) => {
          if (data) {
            // ĐỒNG BỘ DATA FLOW: Đảm bảo object AI SEO không bị lỗi undefined
            if (!data.aiContent) {
              data.aiContent = {
                seoTitle: "",
                seoDescription: "",
                description: "",
                highlights: [],
              };
            }
            setApartmentData(data as Apartment);
          }
        })
        .catch((error) => console.error("Lỗi lấy dữ liệu:", error))
        .finally(() => setIsFetching(false));
    }
  }, [editId]);

  if (loading || isFetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-20 max-w-3xl text-center flex flex-col items-center justify-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-orange-50 text-orange-600">
            <Home className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tighter mb-4">
            Đăng tin cho thuê căn hộ
          </h1>
          <p className="text-gray-500 mb-10 max-w-xl text-sm leading-relaxed">
            Vui lòng đăng nhập hoặc tạo tài khoản chủ nhà trước khi gửi tin đăng
            căn hộ.
          </p>
          <Link
            href="/login?redirect=/submit-apartment"
            className="rounded-2xl bg-gray-900 px-10 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg uppercase tracking-widest text-xs"
          >
            Đăng nhập / Đăng ký để tiếp tục
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (userData?.role !== "landlord") {
    const approvalStatus = userData?.landlordApprovalStatus;

    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-20 max-w-3xl text-center flex flex-col items-center justify-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-amber-50 text-amber-600">
            <Home className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tighter mb-4">
            Đăng tin cho thuê căn hộ
          </h1>
          {approvalStatus === "pending" ? (
            <p className="text-gray-500 mb-6 max-w-xl text-sm leading-relaxed">
              Yêu cầu trở thành chủ nhà của bạn đang được xét duyệt. Vui lòng
              quay lại sau khi được duyệt để đăng tin.
            </p>
          ) : approvalStatus === "rejected" ? (
            <p className="text-gray-500 mb-6 max-w-xl text-sm leading-relaxed">
              Yêu cầu trở thành chủ nhà của bạn chưa được duyệt. Vui lòng liên
              hệ đội ngũ quản lý để biết thêm chi tiết.
            </p>
          ) : (
            <p className="text-gray-500 mb-6 max-w-xl text-sm leading-relaxed">
              Chỉ chủ nhà đã được duyệt mới có thể đăng tin căn hộ. Vui lòng
              liên hệ đội ngũ quản lý để đăng ký trở thành chủ nhà.
            </p>
          )}
          <div className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 shadow-lg">
            <div className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
              <PhoneCall className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-300">
              Hỗ trợ nhanh:
            </span>
            <span className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-[13px] font-black tracking-wide text-white shadow-sm backdrop-blur-md">
              081.2442.111{" "}
              <span className="font-medium text-gray-300">(Quang)</span>
            </span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-12 lg:py-24">
        <h1 className="text-3xl font-black italic mb-2">
          {editId ? "Cập nhật tin đăng căn hộ" : "Đăng tin cho thuê căn hộ"}
        </h1>
        <p className="text-gray-500 mb-8">
          {editId
            ? "Chỉnh sửa thông tin căn hộ. Sau khi lưu, Admin sẽ cần xét duyệt lại."
            : "Điền thông tin căn hộ để gửi cho đội ngũ quản lý xét duyệt trước khi đăng công khai."}
        </p>

        {/* TRUYỀN DỮ LIỆU XUỐNG FORM ĐỂ HIỂN THỊ THÔNG TIN CŨ */}
        <ApartmentForm mode="landlord" apartment={apartmentData || undefined} />
      </main>
      <Footer />
    </div>
  );
}

// Bọc Suspense để tuân thủ chuẩn Client Component của Next.js khi dùng useSearchParams
export default function SubmitApartmentPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <SubmitApartmentContent />
    </Suspense>
  );
}
