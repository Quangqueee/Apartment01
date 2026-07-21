"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { requestCollaboratorAction } from "@/app/actions";
import { Loader2, Clock, CheckCircle2, Handshake, ChevronRight } from "lucide-react";

/**
 * Khối đăng ký làm Cộng tác viên (CTV).
 * - Ẩn hoàn toàn nếu user đã là collaborator hoặc admin.
 * - Hiển thị trạng thái "Đang chờ duyệt" nếu đã gửi yêu cầu.
 * - Hiển thị nút đăng ký nếu chưa gửi yêu cầu.
 */
export default function CollaboratorSection() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localPending, setLocalPending] = useState(false);
  const [error, setError] = useState("");

  const role = userData?.role as string | undefined;
  const collaboratorStatus = userData?.collaboratorStatus as string | undefined;

  // Ẩn hoàn toàn nếu đã là CTV hoặc Admin
  if (role === "collaborator" || role === "admin") return null;

  const isPending = collaboratorStatus === "pending" || localPending;

  const handleRequest = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    const result = await requestCollaboratorAction(user.uid);
    setLoading(false);
    if (result?.success) {
      setLocalPending(true);
    } else {
      setError(result?.error || "Có lỗi xảy ra.");
    }
  };

  // Trạng thái đang chờ duyệt
  if (isPending) {
    return (
      <div className="mt-8 rounded-[2rem] bg-amber-50 border border-amber-200 p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="p-4 bg-amber-100 rounded-2xl shrink-0">
          <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-black text-amber-800 tracking-tight mb-1">
            Yêu cầu đang chờ duyệt
          </h3>
          <p className="text-sm text-amber-600 leading-relaxed">
            Admin sẽ xem xét và phê duyệt trong thời gian sớm nhất.
            Bạn sẽ nhận được quyền truy cập tài liệu và quy trình làm việc ngay sau khi được duyệt.
          </p>
        </div>
      </div>
    );
  }

  // Trạng thái chưa đăng ký — khối đăng ký CTV
  return (
    <div className="mt-8 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-10 shadow-2xl">
      {/* Hiệu ứng ánh sáng nền */}
      <div className="absolute top-0 right-0 h-48 w-48 bg-[#cda533] rounded-full blur-[100px] opacity-15 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="p-3 bg-[#cda533]/20 rounded-2xl shrink-0">
            <Handshake className="h-7 w-7 text-[#cda533]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight mb-1">
              Trở thành Cộng tác viên
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Tham gia đội ngũ Hanoi Residences để tiếp cận tài liệu quy trình,
              danh sách căn hộ nội bộ và mức hoa hồng hấp dẫn.
            </p>
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Nút chữ nhật bo góc — tối ưu cho mobile */}
        <button
          onClick={handleRequest}
          disabled={loading}
          className="flex items-center gap-3 bg-[#cda533] hover:bg-[#b88e22] text-white font-bold text-sm uppercase tracking-wider px-7 py-3.5 rounded-xl shadow-lg transition-all active:scale-95 shrink-0 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Gửi yêu cầu
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
