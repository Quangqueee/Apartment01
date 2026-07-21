"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Phone,
  UserCheck,
  Home,
  FileCheck,
  DollarSign,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

// Các bước quy trình chính
const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Tiếp nhận khách hàng",
    icon: Phone,
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
    desc: "Khách hàng liên hệ qua Zalo, Facebook hoặc điện thoại. Ghi lại thông tin cơ bản: họ tên, SĐT, nhu cầu thuê (khu vực, giá, diện tích, số phòng ngủ).",
    tips: [
      "Hỏi rõ ngân sách: 'Anh/chị dự kiến thuê trong khoảng bao nhiêu triệu/tháng?'",
      "Xác định timeline: 'Anh/chị muốn chuyển vào khi nào?'",
      "Lưu SĐT vào danh bạ với format: [Tên] - Thuê nhà",
    ],
  },
  {
    step: "02",
    title: "Tư vấn & Chọn lọc căn hộ",
    icon: Home,
    color: "bg-[#cda533]",
    lightColor: "bg-amber-50",
    textColor: "text-amber-600",
    desc: "Dựa trên thông tin khách, lọc danh sách căn hộ phù hợp trên hệ thống nội bộ. Gửi tối đa 3-5 lựa chọn để không làm khách choáng ngợp.",
    tips: [
      "Ưu tiên căn hộ đang trống, sẵn sàng dọn vào ngay",
      "Gửi hình ảnh + video ngắn qua Zalo để khách hình dung",
      "Nêu rõ điểm nổi bật: vị trí, view, tiện ích gần đó",
    ],
  },
  {
    step: "03",
    title: "Sắp xếp lịch xem phòng",
    icon: UserCheck,
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
    desc: "Xác nhận lịch xem phòng với khách. Thông báo cho quản lý/chủ nhà trước tối thiểu 2 giờ. Hướng dẫn địa chỉ cụ thể và đón khách đúng giờ.",
    tips: [
      "Đến trước khách 10 phút để mở cửa, bật điện, mở điều hoà",
      "Dẫn khách xem từng phòng theo thứ tự logic",
      "Trả lời trung thực mọi câu hỏi, không che giấu nhược điểm nhỏ",
    ],
  },
  {
    step: "04",
    title: "Thương lượng & Chốt hợp đồng",
    icon: FileCheck,
    color: "bg-green-500",
    lightColor: "bg-green-50",
    textColor: "text-green-600",
    desc: "Hỗ trợ khách và chủ nhà đàm phán giá, điều khoản hợp đồng (thời hạn thuê, tiền cọc, ngày thanh toán). Đảm bảo hai bên đồng thuận trước khi ký.",
    tips: [
      "Tiền cọc thông thường: 1-2 tháng tiền thuê",
      "Kiểm tra kỹ điều khoản thanh lý hợp đồng trước hạn",
      "Chụp ảnh biên bản bàn giao tài sản đầy đủ",
    ],
  },
  {
    step: "05",
    title: "Báo cáo & Nhận hoa hồng",
    icon: DollarSign,
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
    textColor: "text-rose-600",
    desc: "Sau khi hợp đồng được ký kết, báo cáo kết quả về cho quản lý qua Zalo nhóm. Hoa hồng được thanh toán trong vòng 3-5 ngày làm việc.",
    tips: [
      "Thông tin báo cáo: Tên khách, SĐT, căn hộ, giá thuê, ngày ký",
      "Chụp ảnh/scan hợp đồng và gửi vào nhóm quản lý",
      "Hoa hồng = X% tháng tiền thuê đầu tiên (theo thoả thuận)",
    ],
  },
  {
    step: "06",
    title: "Chăm sóc sau hợp đồng",
    icon: MessageCircle,
    color: "bg-indigo-500",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    desc: "Liên hệ khách sau 1 tuần dọn vào để hỏi thăm. Khách hài lòng sẽ giới thiệu thêm khách mới — đây là nguồn khách chất lượng nhất.",
    tips: [
      "Nhắn tin Zalo hỏi thăm: 'Anh/chị đã dọn vào chưa? Có gì cần hỗ trợ không?'",
      "Giải quyết phàn nàn nhỏ nhanh chóng, đừng để chủ nhà phải xử lý một mình",
      "Mỗi khách hài lòng = 1-2 lượt giới thiệu tiềm năng",
    ],
  },
];

// Quy tắc quan trọng
const RULES = [
  {
    icon: CheckCircle2,
    color: "text-green-500",
    text: "Luôn trung thực với khách về tình trạng thực tế của căn hộ.",
  },
  {
    icon: CheckCircle2,
    color: "text-green-500",
    text: "Không hứa hẹn điều gì khi chưa xác nhận với quản lý.",
  },
  {
    icon: CheckCircle2,
    color: "text-green-500",
    text: "Mọi thông tin giá và điều khoản chỉ chốt sau khi hỏi ý kiến quản lý.",
  },
  {
    icon: AlertTriangle,
    color: "text-amber-500",
    text: "Không liên hệ trực tiếp chủ nhà nếu chưa được quản lý giới thiệu.",
  },
  {
    icon: AlertTriangle,
    color: "text-amber-500",
    text: "Không tự ý thay đổi giá niêm yết mà không có sự chấp thuận của quản lý.",
  },
  {
    icon: Zap,
    color: "text-blue-500",
    text: "Phản hồi tin nhắn khách trong vòng 15 phút trong giờ hành chính.",
  },
];

export default function WorkflowGuideClient() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const role = userData?.role as string | undefined;

  // Bảo vệ trang — chỉ cho CTV và Admin
  useEffect(() => {
    // Chờ userData load xong
    if (loading) return;
    if (role !== "collaborator" && role !== "admin") {
      router.replace("/");
    }
  }, [loading, role, router]);

  // Hiển thị loading trong khi kiểm tra quyền
  if (loading || (role !== "collaborator" && role !== "admin")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#cda533] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white font-sans">
      {/* HERO */}
      <div className="bg-[#1a1a1a] text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973')] bg-cover bg-center" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#cda533] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <span className="inline-block text-[#cda533] text-xs font-bold uppercase tracking-widest border border-[#cda533]/30 px-4 py-1.5 rounded-full mb-6">
            Tài liệu nội bộ · Dành cho Cộng tác viên
          </span>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-tight mb-6">
            Quy trình làm việc <br />
            <span className="text-[#cda533] italic">Cộng tác viên</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Hướng dẫn từng bước giúp bạn tự tin tiếp cận khách hàng, dẫn xem
            phòng và chốt hợp đồng thành công.
          </p>
        </div>
      </div>

      {/* CÁC BƯỚC QUY TRÌNH */}
      <div className="py-20 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            6 Bước quy trình chuẩn
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tuân thủ đúng quy trình giúp bạn tạo ấn tượng chuyên nghiệp và
            tăng tỷ lệ chốt hợp đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative bg-white rounded-[2rem] border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 p-8 group overflow-hidden"
            >
              {/* Số bước */}
              <div className="absolute top-6 right-6 text-6xl font-black text-gray-50 group-hover:text-gray-100 transition-colors select-none">
                {step.step}
              </div>

              {/* Icon */}
              <div
                className={`h-14 w-14 rounded-2xl ${step.lightColor} flex items-center justify-center mb-6`}
              >
                <step.icon
                  className={`h-7 w-7 ${step.textColor}`}
                  strokeWidth={2}
                />
              </div>

              {/* Nội dung */}
              <h3 className="font-bold text-xl text-gray-900 mb-3 leading-tight">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                {step.desc}
              </p>

              {/* Tips */}
              <div className={`rounded-xl ${step.lightColor} p-4 space-y-2`}>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${step.textColor} mb-2`}
                >
                  Lưu ý thực tế
                </p>
                {step.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight
                      className={`h-3.5 w-3.5 ${step.textColor} mt-0.5 shrink-0`}
                    />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUY TẮC QUAN TRỌNG */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl font-bold text-gray-900 mb-4">
              Nguyên tắc làm việc
            </h2>
            <p className="text-gray-500">
              Những nguyên tắc cốt lõi giúp duy trì uy tín cho toàn đội.
            </p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {RULES.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
              >
                <rule.icon
                  className={`h-5 w-5 ${rule.color} mt-0.5 shrink-0`}
                />
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {rule.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIÊN HỆ HỖ TRỢ */}
      <div className="py-16 text-center container mx-auto px-6">
        <h3 className="font-headline text-2xl font-bold text-gray-900 mb-4">
          Cần hỗ trợ thêm?
        </h3>
        <p className="text-gray-500 mb-8">
          Liên hệ quản lý qua Zalo để được giải đáp nhanh nhất.
        </p>
        <a
          href="https://zalo.me/0355885851"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#0068ff] hover:bg-[#0054cc] text-white font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <Phone className="h-5 w-5" />
          Nhắn Zalo quản lý
        </a>
      </div>
    </div>
  );
}
