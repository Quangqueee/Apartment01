"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Target,
  LayoutList,
  PenTool,
  MessageCircle,
  HelpCircle,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Smartphone,
  Terminal,
  BookOpen,
  Building2,
  Users,
  Phone,
  MessageSquare,
  Menu,
  X,
  DollarSign,
  Car,
  Brain,
  CameraOff,
  UserX,
  MapPin,
  Users2,
  Percent,
  UserPlus,
  LogIn,
  MonitorSmartphone,
  ArrowRight,
  Sofa,
  Copy,
  Check,
  ArrowUp,
  ListTodo,
  ShieldCheck,
  Sparkles,
  Star,
  Shield,
  CalendarCheck,
  Lightbulb,
  ShieldAlert,
  Headset,
  Camera,
  TrendingDown,
} from "lucide-react";

// --- CẤU TRÚC DỮ LIỆU CÂY THƯ MỤC ---
type DocNode = {
  id: string;
  title: string;
  type: "folder" | "doc";
  icon?: any;
  children?: DocNode[];
};

const docsTree: DocNode[] = [
  {
    id: "tam-nhin",
    title: "Tầm Nhìn & Tiêu Chuẩn",
    type: "doc",
    icon: Target,
  },
  {
    id: "huong-dan-dang-ky",
    title: "Hướng Dẫn Đăng Ký CTV",
    type: "doc",
    icon: UserPlus,
  },
  {
    id: "onboarding",
    title: "Tiến độ làm việc tuần đầu",
    type: "doc",
    icon: ListTodo,
  },
  {
    id: "co-che-hoa-hong",
    title: "Cơ Chế Hoa Hồng",
    type: "doc",
    icon: Percent,
  },
  {
    id: "module-1",
    title: "Module 1: Đọc Bảng Hàng",
    type: "folder",
    icon: LayoutList,
    children: [
      { id: "m1-bang-gia", title: "1.1 Bảng Giá Sàn", type: "doc" },
      { id: "m1-tu-khoa", title: "1.2 Cách Đọc Từ Khóa", type: "doc" },
      {
        id: "m1-phan-loai-khu-vuc",
        title: "1.3 Phân Loại Khu Vực",
        type: "doc",
      },
    ],
  },
  {
    id: "module-2",
    title: "Module 2: Nguồn & Content",
    type: "folder",
    icon: PenTool,
    children: [
      { id: "m2-chien-luoc", title: "2.1 Chiến Lược Chọn Phòng", type: "doc" },
      { id: "m2-nuoi-nick", title: "2.2 Nuôi Nick & Đăng Tin", type: "doc" },
      {
        id: "m2-cong-thuc-viet-content",
        title: "2.3 Công Thức Viết Content",
        type: "doc",
      },
      { id: "m2-mau-content", title: "2.4 Thư Viện Content Mẫu", type: "doc" },
      { id: "m2-prompt-ai", title: "2.5 Lệnh Prompt AI", type: "doc" },
    ],
  },
  {
    id: "module-3",
    title: "Module 3: Kịch Bản Tư Vấn",
    type: "folder",
    icon: MessageCircle,
    children: [
      { id: "m3-nguyen-tac", title: "Nguyên Tắc Cốt Lõi", type: "doc" },
      { id: "m3-tiep-nhan", title: "Tiếp Nhận Khách Mới", type: "doc" },
      { id: "m3-quy-trinh-tu-van", title: "Quy Trình Tư Vấn", type: "doc" },
      { id: "m3-chot-lich", title: "Hẹn Khách Xem Phòng", type: "doc" },
    ],
  },
  {
    id: "module-4",
    title: "Module 4: Các câu hỏi thường gặp",
    type: "folder",
    icon: HelpCircle,
    children: [
      { id: "m4-gia-thanh-toan", title: "4.1 Giá & Thanh Toán", type: "doc" },
      { id: "m4-vi-tri", title: "4.2 Vị Trí & Hẹn Xem", type: "doc" },
      { id: "m4-tien-ich", title: "4.3 Tiện Ích & Nội Thất", type: "doc" },
      { id: "m4-toa-nha", title: "4.4 Tòa Nhà & Gửi Xe", type: "doc" },
      { id: "m4-quy-dinh", title: "4.5 Khách Thuê & Quy Định", type: "doc" },
    ],
  },
  {
    id: "module-5",
    title: "Module 5: Chăm sóc khách sau khi xem nhà",
    type: "doc",
    icon: MessageSquare,
  },
  {
    id: "cheat-sheet",
    title: "Quy Tắc Khi Tư Vấn",
    type: "doc",
  },
  {
    id: "loi-gui-gam",
    title: "Lời Kết & Gửi Gắm",
    type: "doc",
    icon: HeartHandshake,
  },
];

export default function SOPDocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string>("tam-nhin");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State cho Máy Tính Hoa Hồng
  const [calcRent, setCalcRent] = useState<string | number>(10);
  const [calcDealType, setCalcDealType] = useState<string | number>(50);
  const [calcRolePercent, setCalcRolePercent] = useState<string | number>(30);

  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({
    "module-1": false,
  });

  // Xử lý scroll để hiện nút Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Vô hiệu hoá cuộn trang khi mở menu mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleNavClick = (node: DocNode, parentId: string | null = null) => {
    // Chỉ đóng menu trên mobile nếu click vào doc (bài cuối), KHÔNG đóng nếu click vào folder
    if (node.type === "doc") {
      setMobileMenuOpen(false);
    }

    if (node.type === "folder") {
      setExpandedFolders((prev) => {
        const isCurrentlyExpanded = prev[node.id];
        return isCurrentlyExpanded ? {} : { [node.id]: true };
      });
      setActiveModule(node.id);
      setTimeout(() => scrollToSection(node.id), 100);
    } else if (parentId) {
      setExpandedFolders({ [parentId]: true });
      setActiveModule(parentId);
      setTimeout(() => scrollToSection(node.id), 100);
    } else {
      setExpandedFolders({});
      setActiveModule(node.id);
      setTimeout(() => scrollToSection(node.id), 100);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ChatBubble = ({
    sender,
    text,
    isUser = false,
    isFail = false,
  }: {
    sender: string;
    text: string;
    isUser?: boolean;
    isFail?: boolean;
  }) => (
    <div
      className={cn(
        "flex w-full mb-5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-6 py-4 shadow-sm text-base",
          isUser
            ? isFail
              ? "bg-red-500 text-white rounded-tr-sm"
              : "bg-[#cda533] text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm",
        )}
      >
        <p className="text-sm font-bold opacity-80 mb-2">{sender}</p>
        <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // --- NỘI DUNG CHI TIẾT ---
  const renderContent = () => {
    switch (activeModule) {
      case "tam-nhin":
        return (
          <div id="tam-nhin" className="animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-[#1a1a1a] rounded-3xl p-8 md:p-14 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Target size={250} />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#cda533]/20 text-[#cda533] rounded-full text-sm font-black uppercase tracking-widest mb-6">
                  <Building2 size={16} /> Since 2020
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                  Tầm Nhìn & <br className="hidden md:block" /> Tiêu Chuẩn Phục
                  Vụ
                </h1>
                <div className="w-24 h-1.5 bg-[#cda533] rounded-full mb-8"></div>
                <div className="space-y-6 text-gray-200 text-lg md:text-xl leading-relaxed max-w-3xl">
                  <p>
                    Được sáng lập và điều hành bởi CEO Hoàng Tuấn Cường – một
                    chuyên gia dày dặn kinh nghiệm trong lĩnh vực bất động sản
                    cho thuê cao cấp,{" "}
                    <strong className="text-white">Hanoi Residences</strong> là
                    một nhánh chiến lược của{" "}
                    <strong className="text-white">Tam Phát Land</strong> tự hào
                    là một trong những hệ thống quản lý và vận hành căn hộ dịch
                    vụ uy tín hàng đầu Thủ đô.
                  </p>
                  <p>
                    Trải qua hành trình 6 năm phát triển bền vững, từ một đội
                    ngũ nhỏ với khát vọng lớn, chúng tôi đã vươn mình mạnh mẽ để
                    quy tụ hơn 60 chuyên viên tư vấn ưu tú, năng động và tận
                    tâm. Chúng tôi không chỉ thiết lập chuẩn mực sống mới tại
                    các khu vực trọng điểm như Tây Hồ, Ba Đình... mà còn liên
                    tục mở rộng thị phần trên đa dạng các phân khúc căn hộ.
                  </p>
                  <div className="grid md:grid-cols-2 gap-8 pt-8 mt-8 border-t border-gray-700/50">
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-2 mb-3 text-xl">
                        <Target size={22} className="text-[#cda533]" /> Sứ mệnh
                      </h3>
                      <p className="text-base text-gray-300">
                        Không chỉ đơn thuần là cho thuê phòng, mà là trao tặng
                        "không gian sống hoàn hảo", nơi khách hàng chỉ cần xách
                        vali vào và tận hưởng sự tiện nghi tuyệt đối.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-2 mb-3 text-xl">
                        <Users size={22} className="text-[#cda533]" /> Tiêu
                        chuẩn
                      </h3>
                      <p className="text-base text-gray-300">
                        Bất kể tư vấn cho sinh viên hay chuyên gia nước ngoài,
                        nguyên tắc cốt lõi của người sale Hanoi Residences luôn
                        là:{" "}
                        <strong className="text-white">
                          Minh bạch - Tận tâm - Chuyên nghiệp
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "huong-dan-dang-ky":
        const steps = [
          {
            icon: LogIn,
            color: "bg-blue-600",
            text: "text-blue-500",
            title: "Tạo Tài Khoản",
            desc: "Click vào nút Đăng Nhập / Đăng Ký ở góc phải màn hình. Bạn có thể sử dụng trực tiếp tài khoản Google / Gmail của mình để tạo tài khoản trong 3 giây.",
          },
          {
            icon: MonitorSmartphone,
            color: "bg-[#cda533]",
            text: "text-[#cda533]",
            title: "Truy Cập Trang Cá Nhân",
            desc: "Sau khi đăng nhập thành công, vào Tài Khoản. Trên điện thoại: tab dưới cùng. Trên Máy tính: Click Avatar góc phải trên.",
          },
          {
            icon: CheckCircle2,
            color: "bg-emerald-600",
            text: "text-emerald-500",
            title: "Gửi Yêu Cầu Chờ Duyệt",
            desc: 'Tại giao diện Tài khoản, kéo xuống và click vào nút "Đăng ký làm CTV". Quản trị viên sẽ phê duyệt mở khóa tính năng.',
          },
        ];

        return (
          <div
            id="huong-dan-dang-ky"
            className="animate-in fade-in duration-500"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-4">
              <span className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
                <UserPlus size={32} />
              </span>
              Hướng Dẫn Đăng Ký CTV
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 mb-10 text-blue-900 text-lg">
              <p className="mb-3 font-bold flex items-center gap-2">
                <Zap size={22} className="text-blue-600" /> Đặc quyền dành riêng
                cho Cộng Tác Viên:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base ml-2">
                <li>
                  Truy cập toàn bộ{" "}
                  <strong className="font-black">Bảng Hàng Kín</strong> của hệ
                  thống.
                </li>
                <li>Xem chính xác mức hoa hồng chiết khấu trên từng căn hộ.</li>
                <li>
                  Tải hình ảnh / Video Marketing chất lượng cao, không dính
                  Watermark để đăng bài.
                </li>
              </ul>
            </div>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative flex items-center justify-between md:justify-normal",
                    idx % 2 !== 0 ? "md:flex-row-reverse" : "",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-14 h-14 rounded-full border-4 border-white text-white font-bold text-xl shadow-md shrink-0 z-10",
                      step.color,
                      idx % 2 !== 0
                        ? "md:translate-x-1/2"
                        : "md:-translate-x-1/2",
                      idx % 2 !== 0 ? "md:order-1" : "",
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-xl mb-2 flex items-center gap-2">
                      <step.icon size={20} className={step.text} /> {step.title}
                    </h3>
                    <p className="text-gray-600 text-base">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-3 bg-[#1a1a1a] hover:bg-[#cda533] text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Đăng Nhập / Trở Thành CTV Ngay <ArrowRight size={22} />
              </Link>
            </div>
          </div>
        );

      case "onboarding":
        return (
          <div id="onboarding" className="animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-4">
              <span className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                <ListTodo size={32} />
              </span>
              Checklist Onboarding Tuần Đầu
            </h2>
            <p className="text-gray-500 mb-8 text-lg">
              Lộ trình 7 ngày đầu tiên để bạn không bị ngợp và nhanh chóng ra
              được số.
            </p>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-black text-lg">
                    Ngày 1 - 2
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl">
                    Làm quen hệ thống & Nguồn
                  </h3>
                </div>
                <ul className="space-y-3 text-base text-gray-600">
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Đọc kỹ toàn bộ tài liệu hướng dẫn.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Vào nhóm Zalo nhận thông báo nội bộ.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Lên hệ thống web, lọc ra 5 căn phòng ở mức giá 6-8 triệu khu
                    vực bạn quen thuộc nhất.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Tham gia ít nhất 20 hội nhóm cho thuê nhà trên Facebook
                    (Theo từ khoá: "Cho thuê + Quận định làm", "Chung cư cao
                    cấp", "Chung cư mini", ...) từ 30k thành viên trở lên.
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-black text-lg">
                    Ngày 3 - 5
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl">
                    Phủ sóng tin đăng
                  </h3>
                </div>
                <ul className="space-y-3 text-base text-gray-600">
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Viết 3 mẫu content khác nhau (có thể dùng AI, tham khảo các
                    prompt mẫu ở Module 2).
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Bắt đầu đăng tin rải đều vào các khung giờ vàng (Sáng 7h,
                    Trưa 11h-13h, Tối 19h-22h, Khuya 23h).
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Mục tiêu: Đạt được 5 tin đăng / ngày. Có ít nhất 3 khách
                    inbox hỏi phòng. (1 lần đăng dải hết các nhóm bạn tham gia
                    gọi là 1 tin đăng. Mỗi tin đăng nên cách nhau 1-2 tiếng để
                    tránh bị spam).
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#cda533]/20 text-[#cda533] px-3 py-1 rounded-lg font-black text-lg">
                    Ngày 6 - 7
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl">
                    Thực chiến & Tối ưu
                  </h3>
                </div>
                <ul className="space-y-3 text-base text-gray-600">
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Áp dụng kịch bản Module 3 để lọc khách và hẹn lịch xem.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Dẫn thành công ít nhất 1 khách đi xem phòng thực tế.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Báo cáo vướng mắc cho Quản lý để được gỡ rối.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "co-che-hoa-hong":
        const calculateIncome = () => {
          // Xử lý an toàn: Nếu ô bị xoá trắng ("") thì ép về 0 để không bị lỗi NaN
          const rent = Number(calcRent) || 0;
          const deal = Number(calcDealType) || 0;
          const role = Number(calcRolePercent) || 0;

          return rent * 1000000 * (deal / 100) * (role / 100);
        };

        return (
          <div id="co-che-hoa-hong" className="animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-4">
              <span className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                <Percent size={32} />
              </span>
              Cơ Chế Hoa Hồng & Thu Nhập
            </h2>
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                <h3 className="text-blue-900 font-bold text-xl mb-3">
                  Hiểu Về "Doanh Số Nhận Về" (Theo tin đăng)
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-800 text-base">
                  <li>
                    <strong className="text-blue-900 font-black">
                      50% / 12th:
                    </strong>{" "}
                    Nghĩa là khi khách ký hợp đồng 1 năm, doanh số tính cho giao
                    dịch là 50% tiền thuê 1 tháng.
                  </li>
                  <li>
                    <strong className="text-blue-900 font-black">
                      30% / 6th:
                    </strong>{" "}
                    Nghĩa là khi khách ký hợp đồng 6 tháng, doanh số tính cho
                    giao dịch là 30% tiền thuê 1 tháng.
                  </li>
                </ul>
                <p className="mt-4 italic text-sm opacity-80">
                  * Lưu ý: Phần trăm trên tin đăng là "Doanh số của Deal", KHÔNG
                  PHẢI là số tiền thực nhận về tay bạn.
                </p>
              </div>

              {/* Bảng Cơ Chế Hoa Hồng Gốc */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">
                  CƠ CHẾ HOA HỒNG THỰC NHẬN
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Smartphone className="text-amber-500" /> Hệ Cộng Tác Viên
                      (Online)
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          CTV (Tân binh):
                        </span>
                        <span className="font-bold text-xl text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                          30%
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          CTV (Chuyên viên), doanh số &gt; 15 Triệu:
                        </span>
                        <span className="font-bold text-xl text-gray-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 shadow-sm">
                          40%
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#cda533]"></div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="text-[#cda533]" /> Hệ Nhân Sự Trực
                      Tiếp (Offline)
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          Sale Mới (Tân binh):
                        </span>
                        <span className="font-bold text-xl text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                          50%
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          Chuyên viên:
                        </span>
                        <span className="font-bold text-xl text-white bg-[#cda533] px-3 py-1 rounded-lg shadow-sm">
                          60%
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cơ chế nguồn nhân sự đẩy về website */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm overflow-x-hidden">
                <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">
                  CƠ CHẾ NGUỒN NHÂN SỰ ĐẨY VỀ WEBSITE
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="text-emerald-600 flex-shrink-0" /> Nhân
                      sự chủ nguồn
                    </h4>
                    <p className="text-gray-700 text-base leading-relaxed">
                      Nhân sự đẩy nguồn hàng của mình về website sẽ nhận{" "}
                      <strong className="text-emerald-700 font-black">
                        20% tổng doanh số
                      </strong>{" "}
                      của căn được chốt.
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="text-amber-600 flex-shrink-0" />{" "}
                      CTV chốt nguồn nhân sự
                    </h4>
                    <p className="text-gray-700 text-base leading-relaxed">
                      Khi CTV chốt căn thuộc nguồn của nhân sự khác, cơ chế hoa
                      hồng phải{" "}
                      <strong className="text-amber-800 font-black">
                        cắt 10%
                      </strong>{" "}
                      cho chủ nguồn nhân sự đó, và công ty sẽ trả phần còn lại cho nhân sự đó.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 border-l-4 border-slate-500 p-5 rounded-r-2xl">
                  <h4 className="font-bold text-slate-900 text-base mb-2">
                    Cách nhận diện nguồn trên bảng hàng
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-slate-700 text-sm md:text-base">
                    <li>
                      Mã dạng viết tắt quận + số (VD: <strong>TH0083</strong>,{" "}
                      <strong>HK0089</strong>, ...) là{" "}
                      <strong className="text-slate-900">
                        nguồn của công ty
                      </strong>
                      .
                    </li>
                    <li>
                      Mã có tên riêng kèm số thứ tự (STT) là{" "}
                      <strong className="text-slate-900">
                        nguồn của nhân sự {" "}
                      </strong>
                      (VD: <strong>VIỆT HOÀNG -38, HUY CHUNG-42,...)</strong>,{" "}
                      .
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bảng tính hoa hồng tương tác */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">
                  BẢNG TÍNH HOA HỒNG DỰ KIẾN
                </h3>
                <p className="text-center text-gray-500 mb-8">
                  Nhập thông tin deal để tự động tính tiền thực nhận về túi.
                </p>

                <div className="grid md:grid-cols-3 gap-5 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tiền phòng (Triệu VNĐ)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={calcRent}
                      onChange={(e) => setCalcRent(e.target.value)}
                      placeholder="VD: 10.5"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      % Hoa hồng (Theo tin đăng)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={calcDealType}
                      onChange={(e) => setCalcDealType(e.target.value)}
                      placeholder="VD: 50"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Cơ chế của bạn (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={calcRolePercent}
                      onChange={(e) => setCalcRolePercent(e.target.value)}
                      placeholder="VD: 30"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <p className="text-gray-900 text-lg font-black uppercase mb-1">
                      Thu nhập thực nhận
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      Công thức: Tiền phòng × % Deal × Cấp bậc
                    </p>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-[#cda533]">
                    {formatCurrency(calculateIncome())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        return (
          <div id="co-che-hoa-hong" className="animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-4">
              <span className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                <Percent size={32} />
              </span>
              Cơ Chế Hoa Hồng & Thu Nhập
            </h2>
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                <h3 className="text-blue-900 font-bold text-xl mb-3">
                  Hiểu Về "Doanh Số Nhận Về" (Theo tin đăng)
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-800 text-base">
                  <li>
                    <strong className="text-blue-900 font-black">
                      50% / 12th:
                    </strong>{" "}
                    Nghĩa là khi khách ký hợp đồng 1 năm, doanh số tính cho giao
                    dịch là 50% tiền thuê 1 tháng.
                  </li>
                  <li>
                    <strong className="text-blue-900 font-black">
                      30% / 6th:
                    </strong>{" "}
                    Nghĩa là khi khách ký hợp đồng 6 tháng, doanh số tính cho
                    giao dịch là 30% tiền thuê 1 tháng.
                  </li>
                </ul>
                <p className="mt-4 italic text-sm opacity-80">
                  * Lưu ý: Phần trăm trên tin đăng là "Doanh số của Deal", KHÔNG
                  PHẢI là số tiền thực nhận về tay bạn.
                </p>
              </div>

              {/* Bảng Cơ Chế Hoa Hồng Gốc */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">
                  CƠ CHẾ HOA HỒNG THỰC NHẬN
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Smartphone className="text-amber-500" /> Hệ Cộng Tác Viên
                      (Online)
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          CTV (Tân binh):
                        </span>
                        <span className="font-bold text-xl text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                          30%
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          CTV (Chuyên viên), doanh số &gt; 15 Triệu:
                        </span>
                        <span className="font-bold text-xl text-gray-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 shadow-sm">
                          40%
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#cda533]"></div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="text-[#cda533]" /> Hệ Nhân Sự Trực
                      Tiếp (Offline)
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          Sale Mới (Tân binh):
                        </span>
                        <span className="font-bold text-xl text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                          50%
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-gray-600 text-base">
                          Chuyên viên:
                        </span>
                        <span className="font-bold text-xl text-white bg-[#cda533] px-3 py-1 rounded-lg shadow-sm">
                          60%
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bảng tính hoa hồng tương tác */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">
                  BẢNG TÍNH HOA HỒNG DỰ KIẾN
                </h3>
                <p className="text-center text-gray-500 mb-8">
                  Nhập thông tin deal để tự động tính tiền thực nhận về túi.
                </p>

                <div className="grid md:grid-cols-3 gap-5 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tiền phòng (Triệu VNĐ)
                    </label>
                    <input
                      type="number"
                      value={calcRent}
                      onChange={(e) => setCalcRent(Number(e.target.value))}
                      placeholder="VD: 10"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      % Deal (Tin đăng)
                    </label>
                    <input
                      type="number"
                      value={calcDealType}
                      onChange={(e) => setCalcDealType(Number(e.target.value))}
                      placeholder="VD: 50"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Cấp bậc của bạn (%)
                    </label>
                    <input
                      type="number"
                      value={calcRolePercent}
                      onChange={(e) =>
                        setCalcRolePercent(Number(e.target.value))
                      }
                      placeholder="VD: 30"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                </div>

                <div className="bg-gray-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">
                      Thu nhập thực nhận
                    </p>
                    <p className="text-xs text-gray-500">
                      Công thức: Tiền phòng × % Deal × Cấp bậc
                    </p>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-[#cda533]">
                    {formatCurrency(calculateIncome())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

        return (
          <div id="co-che-hoa-hong" className="animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-4">
              <span className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                <Percent size={32} />
              </span>
              Cơ Chế Hoa Hồng & Thu Nhập
            </h2>
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                <h3 className="text-blue-900 font-bold text-xl mb-3">
                  Hiểu Về "Doanh Số Nhận Về" (Theo tin đăng)
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-800 text-base">
                  <li>
                    <strong className="text-blue-900 font-black">
                      50% / 12th:
                    </strong>{" "}
                    Nghĩa là khi khách ký hợp đồng 1 năm, doanh số tính cho giao
                    dịch là 50% tiền thuê 1 tháng.
                  </li>
                  <li>
                    <strong className="text-blue-900 font-black">
                      30% / 6th:
                    </strong>{" "}
                    Nghĩa là khi khách ký hợp đồng 6 tháng, doanh số tính cho
                    giao dịch là 30% tiền thuê 1 tháng.
                  </li>
                </ul>
                <p className="mt-4 italic text-sm opacity-80">
                  * Lưu ý: Phần trăm trên tin đăng là "Doanh số của Deal", KHÔNG
                  PHẢI là số tiền thực nhận về tay bạn.
                </p>
              </div>

              {/* Bảng tính hoa hồng tương tác */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">
                  BẢNG TÍNH HOA HỒNG DỰ KIẾN
                </h3>
                <p className="text-center text-gray-500 mb-8">
                  Nhập thông tin deal để tự động tính tiền thực nhận về túi.
                </p>

                <div className="grid md:grid-cols-3 gap-5 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tiền phòng (Triệu VNĐ)
                    </label>
                    <input
                      type="number"
                      value={calcRent}
                      onChange={(e) => setCalcRent(Number(e.target.value))}
                      placeholder="VD: 10"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      % Deal (Tin đăng)
                    </label>
                    <input
                      type="number"
                      value={calcDealType}
                      onChange={(e) => setCalcDealType(Number(e.target.value))}
                      placeholder="VD: 50"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Cấp bậc của bạn (%)
                    </label>
                    <input
                      type="number"
                      value={calcRolePercent}
                      onChange={(e) =>
                        setCalcRolePercent(Number(e.target.value))
                      }
                      placeholder="VD: 30"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#cda533]"
                    />
                  </div>
                </div>

                <div className="bg-gray-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">
                      Thu nhập thực nhận
                    </p>
                    <p className="text-xs text-gray-500">
                      Công thức: Tiền phòng × % Deal × Cấp bậc
                    </p>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-[#cda533]">
                    {formatCurrency(calculateIncome())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "module-1":
        return (
          <div
            id="module-1"
            className="animate-in fade-in duration-300 space-y-16 overflow-x-hidden"
          >
            <div id="m1-bang-gia">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <LayoutList size={28} />
                </span>
                1.1 Bảng Giá Sàn (Tham khảo)
              </h2>
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-x-auto text-base md:text-lg custom-scrollbar">
                <table className="w-full min-w-[600px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 md:px-6 md:py-5 text-left font-bold text-gray-900 uppercase tracking-wider text-xs md:text-sm whitespace-nowrap">
                        Loại Phòng
                      </th>
                      <th className="px-5 py-4 md:px-6 md:py-5 text-left font-bold text-gray-900 uppercase tracking-wider text-xs md:text-sm whitespace-nowrap">
                        Giá Khởi Điểm
                      </th>
                      <th className="px-5 py-4 md:px-6 md:py-5 text-left font-bold text-gray-900 uppercase tracking-wider text-xs md:text-sm whitespace-nowrap">
                        Số Người Ở Tối Đa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-5 md:px-6 md:py-6 font-bold text-gray-900 flex items-center gap-3 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0"></div>{" "}
                        STUDIO
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-700 font-medium whitespace-nowrap">
                        Giá 5 Triệu
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-600 whitespace-nowrap">
                        2 người lớn (Có thể thêm 1 trẻ em)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                      <td className="px-5 py-5 md:px-6 md:py-6 font-bold text-gray-900 flex items-center gap-3 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></div>{" "}
                        1N1K
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-700 font-medium whitespace-nowrap">
                        Từ 6 Triệu
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-600 whitespace-nowrap">
                        2 người lớn (Có thể thêm 1 trẻ em)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-5 md:px-6 md:py-6 font-bold text-gray-900 flex items-center gap-3 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0"></div>{" "}
                        2N1K
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-700 font-medium whitespace-nowrap">
                        Từ 8 Triệu
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-600 whitespace-nowrap">
                        3 - 4 người lớn
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div id="m1-tu-khoa">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <BookOpen size={28} />
                </span>
                1.2 Cách Đọc Từ Khóa Bảng Hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-5">
                    TĐ
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">
                    Tiến Độ
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Nhận hoa hồng tiến độ theo từng tháng. Chia theo tỉ lệ % hoa
                    hồng trên tin đăng. Ví dụ: 100% / 12th nghĩa là khi khách ký
                    hợp đồng 1 năm, trung bình mỗi tháng khách ở bạn nhận 8.33%
                    hoa hồng. Với hợp đồng ngắn hạn, thì nhân với số tháng trên
                    hợp đồng
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-5">
                    DV
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">
                    Dịch Vụ
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Nếu không ghi phí dịch vụ thì sẽ ngầm hiểu là miễn phí dịch
                    vụ. VD: Trên nguồn chỉ ghi Điện 4k. Lúc này sẽ ngầm hiểu là
                    chỉ thu phí điện 4k/kWh, và miễn phí dịch vụ, nước sinh
                    hoạt.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center font-bold text-xl mb-5">
                    CT
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">
                    Nguồn công ty
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Mã dạng viết tắt quận + số (VD:{" "}
                    <strong className="text-gray-900">hbt0083</strong>,{" "}
                    <strong className="text-gray-900">hk0089</strong>, ...) là
                    nguồn của công ty.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold text-xl mb-5">
                    NS
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">
                    Nguồn nhân sự
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Mã có tên riêng kèm số thứ tự (STT) là nguồn của nhân sự. (VD: <strong className="text-gray-900">VIỆT HOÀNG -38, HUY CHUNG-42,...)</strong>,{" "}
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm md:col-span-2 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Zap size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-xl">
                      Phương thức thanh toán
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                      90% nguồn hàng hiện tại trên thị trường sẽ là thanh toán 1
                      cọc 1. Nếu có hình thức thanh toán cao hơn sẽ note ở phần
                      ghi chú. Nếu không ghi sẽ ngầm hiểu là thanh toán 1 cọc 1.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div id="m1-phan-loai-khu-vuc">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <MapPin size={28} />
                </span>
                1.3 Phân Loại Khu Vực Kinh Doanh
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* HẠNG S */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-white font-bold py-1 px-4 rounded-bl-2xl rounded-tr-3xl text-sm">
                    Tập trung khách cao cấp
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                      S
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">
                      Khu Vực Hạng S
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="px-3 py-1 bg-white text-amber-700 rounded-lg text-sm font-semibold border border-amber-100 shadow-sm">
                      Ba Đình
                    </span>
                    <span className="px-3 py-1 bg-white text-amber-700 rounded-lg text-sm font-semibold border border-amber-100 shadow-sm">
                      Tây Hồ
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      <strong className="text-gray-900">
                        Tại sao xếp hạng S?
                      </strong>{" "}
                      Đây là khu vực "mỏ vàng", tập trung phân khúc cao cấp, căn
                      hộ đẹp, căn hộ dành cho người nước ngoài và khách hàng có
                      tài chính mạnh.
                    </p>
                    <ul className="text-gray-700 text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">✦</span>
                        <span>
                          <strong>Điểm mạnh:</strong> Doanh thu trên mỗi hợp
                          đồng lớn. Chốt 1 khách hạng S có thể bằng chốt 3-4
                          khách bình thường.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">✦</span>
                        <span>
                          <strong>Đặc điểm khách:</strong> Ra được nhiều khách
                          nét, khách có tài chính mạnh, khách nước ngoài. .
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* HẠNG A */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white font-bold py-1 px-4 rounded-bl-2xl rounded-tr-3xl text-sm">
                    Dễ chốt - Nhu cầu cao
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                      A
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">
                      Khu Vực Hạng A
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="px-3 py-1 bg-white text-blue-700 rounded-lg text-sm font-semibold border border-blue-100 shadow-sm">
                      Cầu Giấy
                    </span>
                    <span className="px-3 py-1 bg-white text-blue-700 rounded-lg text-sm font-semibold border border-blue-100 shadow-sm">
                      Đống Đa
                    </span>
                    <span className="px-3 py-1 bg-white text-blue-700 rounded-lg text-sm font-semibold border border-blue-100 shadow-sm">
                      Hai Bà Trưng
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      <strong className="text-gray-900">
                        Tại sao xếp hạng A?
                      </strong>{" "}
                      Đây là "lõi trung tâm" của dân văn phòng và sinh viên các
                      trường đại học lớn. Nhu cầu thuê phòng ở đây là{" "}
                      <strong className="text-blue-700">
                        khổng lồ và liên tục
                      </strong>
                      .
                    </p>
                    <ul className="text-gray-700 text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">✦</span>
                        <span>
                          <strong>Điểm mạnh:</strong> Thanh khoản cực nhanh. Có
                          phòng trống đăng lên là có người hỏi. Nhịp độ làm việc
                          sôi động giúp sale mau lên tay.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">✦</span>
                        <span>
                          <strong>Lời khuyên:</strong> Phân khúc 5 - 10 triệu ở
                          đây chốt cực kỳ dễ. Hãy tập trung đánh mạnh mảng này
                          để có thu nhập đều đặn hàng tháng.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* HẠNG B */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-3xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold py-1 px-4 rounded-bl-2xl rounded-tr-3xl text-sm">
                    Vừa túi tiền - Đa dạng
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                      B
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">
                      Khu Vực Hạng B
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="px-3 py-1 bg-white text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-100 shadow-sm">
                      Thanh Xuân
                    </span>
                    <span className="px-3 py-1 bg-white text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-100 shadow-sm">
                      Hoàng Mai
                    </span>
                    <span className="px-3 py-1 bg-white text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-100 shadow-sm">
                      Hoàn Kiếm
                    </span>
                    <span className="px-3 py-1 bg-white text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-100 shadow-sm">
                      Từ Liêm
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      <strong className="text-gray-900">
                        Tại sao xếp hạng B?
                      </strong>{" "}
                      Là các khu vực đông đúc, nguồn hàng dồi dào, giá cả cực kỳ
                      dễ chịu và phù hợp với đại đa số người đi thuê (từ sinh
                      viên đến người đi làm).
                    </p>
                    <ul className="text-gray-700 text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✦</span>
                        <span>
                          <strong>Điểm mạnh:</strong> Rất dễ để chốt những hợp
                          đồng đầu tiên vì rào cản giá thấp. Phù hợp cho sale
                          mới "lấy cảm giác" chốt khách và xây dựng sự tự tin.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✦</span>
                        <span>
                          <strong>Đặc điểm:</strong> Lượng phòng trống (quỹ căn)
                          luôn sẵn nhiều. Cần chăm chỉ dẫn khách là chắc chắn có
                          thành quả.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "module-2":
        const templates = [
          {
            id: "tmp-1",
            title: "Mẫu 1: Cơ bản (5 - 6 triệu)",
            tags: "Studio / Gen Z",
            tagColor: "bg-blue-100 text-blue-700",
            content:
              '🔥 TÌM ĐÂU RA STUDIO FULL ĐỒ, BAN CÔNG THOÁNG MÀ CHỈ NHỈNH 5X? 🔥\n📍 Vị trí: Ngay trục chính Cầu Giấy / Đống Đa - Thuận tiện di chuyển, ngõ nông dễ tìm.\n🌿 Trống sẵn 1 căn Studio duy nhất vừa setup xong, mới tinh tươm.\n🌿 Full đồ đạc y hình: Điều hòa, nóng lạnh, giường tủ, tủ lạnh, bệ bếp... Chỉ việc xách vali quần áo đến ở.\n🌿 Thang máy, cửa khóa vân tay, không chung chủ, giờ giấc thoải mái 24/7.\n🌿 Máy giặt chung sân phơi siêu rộng, ngập tràn ánh nắng.\n💬 Phòng đẹp giá sinh viên thường bay trong "1 nốt nhạc". Bác nào ưng bụng IB hoặc add Zalo em ngay để lấy video thực tế nhé!\n☎️ Zalo/Call: [SĐT Của Bạn]',
          },
          {
            id: "tmp-2",
            title: "Mẫu 2: Tầm Trung (8 - 12 triệu)",
            tags: "1N1K / Đi làm",
            tagColor: "bg-amber-100 text-amber-700",
            content:
              "💎 CĂN HỘ 1 NGỦ 1 KHÁCH RỘNG RÃI TẠI BA ĐÌNH 💎\n📍 Vị trí: Đội Cấn / Kim Mã - Đi làm trung tâm Ba Đình, Đống Đa siêu tiện.\n✨ Không gian sống lý tưởng cho cặp đôi hoặc người đi làm cần sự yên tĩnh, riêng tư:\n✔️ Thiết kế 1N1K tách biệt, phòng khách rộng rãi tha hồ tụ tập bạn bè cuối tuần.\n✔️ Cửa sổ lớn, ban công đón nắng gió tự nhiên, view cực thoáng.\n✔️ Nội thất cao cấp nhập khẩu: Smart TV, Tủ lạnh size lớn, Máy giặt riêng trong phòng.\n✔️ Dịch vụ tận răng: Dọn dẹp vệ sinh hàng tuần, an ninh camera 24/7.\n🔑 Khu vực dân trí cao, ô tô đỗ tận cổng. Chủ nhà cực kỳ dễ tính.\n📩 Inbox hoặc alo em ngay để qua xem trực tiếp (Hỗ trợ xem phòng miễn phí 24/7).\n☎️ Zalo/Call: [SĐT Của Bạn]",
          },
        ];

        const prompts = [
          {
            id: "p-1",
            title: "Lệnh 1: Studio Gen Z",
            color: "bg-blue-500",
            text: "Đóng vai một chuyên viên môi giới bất động sản trẻ trung, năng động. Hãy viết một bài đăng Facebook bán phòng trọ Studio cho tệp khách hàng Gen Z, sinh viên sinh năm 2000-2005.\nThông tin phòng: Khu vực [nhập vị trí, VD: ngõ Đội Cấn], nhập thiết kế [diện tích, dạng phòng], giá [nhập giá, VD: 5.5 triệu], tiện ích [nhập tiện ích, VD: full đồ, máy giặt chung, không chung chủ, giờ giấc tự do].\nYêu cầu: Văn phong hài hước, năng lượng, bắt trend mạng xã hội hiện tại, câu văn ngắn gọn, xuống dòng rõ ràng và có sử dụng emoji phù hợp. Tiêu đề viết hoa, giật tít. Kết bài có lời kêu gọi khách inbox/Zalo ngay để đi xem phòng. Tuyệt đối không để lộ địa chỉ số nhà cụ thể.",
          },
          {
            id: "p-2",
            title: "Lệnh 2: Tầm trung (Người đi làm)",
            color: "bg-amber-500",
            text: 'Đóng vai một chuyên viên cho thuê căn hộ dịch vụ chuyên nghiệp của Hanoi Residences. Hãy viết một content đăng Facebook giới thiệu căn hộ [nhập loại phòng, VD: 1 Khách 1 Ngủ / 2 Ngủ 1 Khách] tại [nhập khu vực, VD: Lotte Liễu Giai, Ba Đình].\nKhách hàng mục tiêu là dân văn phòng, người đi làm có thu nhập ổn định cần không gian yên tĩnh, tiện nghi sau giờ làm.\nThông tin nhấn mạnh: [nhập các điểm nhấn, VD: phòng khách rộng tách biệt bếp, ban công nhiều ánh sáng tự nhiên, dọn dẹp vệ sinh tuần 1 lần, an ninh tốt].\nYêu cầu: Văn phong lịch sự, đáng tin cậy, làm nổi bật giá trị và "trải nghiệm sống". Dùng list (gạch đầu dòng) cho phần tiện ích để khách dễ đọc. Thêm Call to Action thúc đẩy khách đặt lịch đi xem sớm vì phòng đẹp nhanh hết.',
          },
        ];

        return (
          <div
            id="module-2"
            className="animate-in fade-in duration-300 space-y-16"
          >
            <div id="m2-chien-luoc">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Target size={28} />
                </span>
                2.1 Chiến Lược Chọn Phòng Sale
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-lg">
                <p className="text-amber-800">
                  <strong>Lưu ý quan trọng:</strong> Ưu tiên chọn phòng phân
                  khúc 8-12 triệu vì phòng đẹp luôn dễ hút khách hơn phòng rẻ mà
                  xấu.
                </p>
              </div>
              <div className="space-y-5">
                {[
                  {
                    step: "Bước 1: Khoanh vùng khu vực trọng điểm",
                    desc: "Đừng rải rác khắp nơi! Hãy chọn ra 2-3 quận có cùng phân khúc khách hàng mà bạn muốn nhắm tới (VD: Cầu Giấy - Đống Đa). Việc khoanh vùng giúp bạn mau thuộc đường, nắm rõ mức giá chung và nhanh chóng trở thành 'thổ địa' chuyên gia của khu vực đó.",
                  },
                  {
                    step: "Bước 2: Chọn lọc 'Hàng Tuyển' (5-10 căn đẹp nhất)",
                    desc: "Lướt bảng hàng thường xuyên và nhặt ra 5-10 căn 'hoa hậu' (phòng mới, ảnh sáng đẹp, giá tốt, hoa hồng cao). Lưu ngay vào chức năng 'Yêu Thích' trên web hoặc note vào điện thoại cá nhân. Mục tiêu là khi khách hỏi, bạn có thể nắm được nhu cầu khách và tư vấn thông tin trong vòng 3 giây!",
                  },
                  {
                    step: "Bước 3: Đánh phủ tập trung & Đo lường hiệu quả",
                    desc: "Dồn toàn lực đăng bài phủ sóng bằng danh sách này, tuyệt đối không đăng lan man. Bạn chỉ nên đổi nguồn phòng khác khi rơi vào 2 trường hợp: (1) Phòng đã được chốt hết, hoặc (2) Sau 2-3 ngày đăng bài liên tục nhưng hoàn toàn không có tương tác.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-5 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm"
                  >
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2 text-xl">
                        {item.step}
                      </h3>
                      <p className="text-gray-600 text-base">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="m2-nuoi-nick">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <ShieldCheck size={28} />
                </span>
                2.2 Nuôi Nick & Đăng Tin Facebook
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cột 1: Nuôi nick & Tham gia nhóm */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                  <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-2">
                    <UserPlus size={22} className="text-blue-500" /> Kỹ Năng
                    Nuôi Nick & Vào Nhóm
                  </h3>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <p className="text-sm md:text-base text-gray-700">
                        <strong>Tránh bị khóa nick (Checkpoint):</strong> Nick
                        mới mang về cần "ngâm" và tương tác nhẹ (lướt feed, like
                        dạo, xem video) như người dùng thật từ 1-2 ngày trước
                        khi hành động.
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <p className="text-sm md:text-base text-gray-700">
                        <strong>Giới hạn an toàn:</strong> Chỉ xin tham gia{" "}
                        <strong className="text-rose-600">
                          tối đa 20 nhóm/ngày
                        </strong>{" "}
                        để Facebook không đánh dấu spam. Tham gia đều đặn mỗi
                        ngày cho đến khi đủ tệp nhóm cần thiết.
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <p className="text-sm md:text-base text-gray-700">
                        <strong>
                          Mục tiêu tham gia (Ưu tiên nhóm &gt; 40k thành viên):
                        </strong>
                        <br />
                        1. Nhóm thuê nhà theo 2-3 quận mục tiêu của bạn.
                        <br />
                        2. Nhóm cho thuê chung cư / chung cư mini.
                        <br />
                        3. Nhóm khách nước ngoài (Expat in Hanoi/HCM...).
                      </p>
                    </li>
                  </ul>
                </div>

                {/* Cột 2: Đăng tin & Khung giờ */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                  <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-2">
                    <Clock size={22} className="text-amber-500" /> Kỷ Luật Đăng
                    Bài & Khung Giờ
                  </h3>

                  <div className="mb-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-sm md:text-base text-amber-900 leading-relaxed">
                      <strong>Chỉ tiêu:</strong> Ít nhất 5 tin/ngày/tài khoản.
                      Rải đều vào 20+ group khác nhau.
                      <br />
                      <span className="text-amber-700 text-sm mt-1 inline-block">
                        ⚠️ Tuyệt đối không đăng liên tục cùng 1 lúc để bảo vệ
                        tài khoản, hãy chia nhỏ theo các khung giờ vàng dưới
                        đây:
                      </span>
                    </p>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        🌅 Buổi sáng
                      </span>
                      <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md text-sm font-medium">
                        7h - 9h
                      </span>
                    </li>
                    <li className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        🕛 Buổi trưa
                      </span>
                      <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md text-sm font-medium">
                        11h - 13h
                      </span>
                    </li>
                    <li className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        🌙 Chiều / Tối
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-white bg-amber-500 px-3 py-1 rounded-md text-sm font-medium shadow-sm">
                          20h - 22h
                        </span>
                        <span className="text-gray-500 text-xs">
                          17h-19h & 23h-24h
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div id="m2-cong-thuc-viet-content" className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <PenTool size={28} />
                </span>
                2.3 Công Thức Content (Tham Khảo)
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cột 1: Công thức Premium */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-2">
                    <Sparkles size={22} className="text-amber-500" /> Bố Cục
                    Sang Trọng & Kích Thích Tương Tác
                  </h3>

                  <div className="space-y-5">
                    <div className="relative pl-6 border-l-2 border-slate-300">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-700 ring-4 ring-white"></div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">
                        1. Tiêu đề chuyên nghiệp
                      </h4>
                      <p className="text-sm md:text-base text-gray-600">
                        Sử dụng Tiếng Anh hoặc song ngữ (Premium Apartment,
                        Serviced Studio...) để định vị phân khúc ngay từ đầu.
                      </p>
                    </div>

                    <div className="relative pl-6 border-l-2 border-amber-300">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white shadow-sm"></div>
                      <h4 className="font-bold text-amber-600 text-base mb-1">
                        2. Nguyên tắc
                      </h4>
                      <p className="text-sm md:text-base text-gray-600">
                        <strong>KHÔNG ĐỂ GIÁ CỤ THỂ.</strong> Mục đích là tạo sự
                        tò mò để khách hàng phải chủ động nhắn tin/gọi điện. Khi
                        khách inbox, bạn sẽ có cơ hội tư vấn giá trị và lái sang
                        các quỹ căn khác nếu căn này không phù hợp.
                      </p>
                    </div>

                    <div className="relative pl-6 border-l-2 border-slate-300">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-400 ring-4 ring-white"></div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">
                        3. Bán "Trải nghiệm" & Sự an tâm
                      </h4>
                      <p className="text-sm md:text-base text-gray-600">
                        Liệt kê thông số (Diện tích, Layout) thật chuẩn xác.
                        Nhấn mạnh vào tiện ích sống: An ninh 24/7, khu dân trí
                        cao, ban công chill, nội thất nhập khẩu.
                        <br />
                        <span className="text-slate-500 text-sm mt-1 inline-block">
                          💡 Mẹo: Trong 5 ảnh đầu tiên khi đăng bài, nên có ảnh
                          phòng khách, phòng ngủ, phòng bếp, ban công và lưu ý
                          nên để phòng tắm cuối cùng.
                        </span>
                      </p>
                    </div>

                    <div className="relative pl-6 border-l-2 border-transparent">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white"></div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">
                        4. Thông tin liên hệ
                      </h4>
                      <p className="text-sm md:text-base text-gray-600">
                        Thông tin liên hệ của bạn, SĐT, Zalo, Whatsapp,...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Ví dụ thực chiến */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative">
                  <div className="absolute top-0 right-0 bg-slate-800 text-amber-400 font-bold py-1 px-4 rounded-bl-2xl rounded-tr-3xl text-sm shadow-sm flex items-center gap-1">
                    <Star size={14} fill="currentColor" /> Ví dụ thực chiến
                  </div>
                  <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-2">
                    <MessageCircle size={22} className="text-slate-600" /> Form
                    mẫu (Tham Khảo)
                  </h3>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-sm text-gray-700 leading-relaxed font-sans">
                    <p className="font-bold text-slate-900 text-base mb-4">
                      Premium Apartment For Rent in Ba Dinh District
                    </p>

                    <p className="mb-1">📌 Địa chỉ: 46 Linh Lang, Ba Đình</p>
                    <p className="mb-1">
                      🔘 Thiết kế: 1 phòng ngủ + 1 phòng khách
                    </p>
                    <p className="mb-4">🔘 Diện tích: 65m2</p>

                    <p className="font-bold text-slate-800 mb-2">💢 Lưu ý 💢</p>

                    <p className="mb-1">
                      👉 Full nội thất: Giường tủ, Sofa, Bàn trà, Bếp, Hút mùi,
                      Máy giặt sấy, Bồn tắm,…
                    </p>
                    <p className="mb-1">
                      👉 Phòng thoáng đãng, nhiều ánh sáng, ban công cực chill
                    </p>
                    <p className="mb-1">
                      👉 Trung tâm, ba bước ra đường ô tô, đi đâu cũng tiện
                    </p>
                    <p className="mb-4">
                      👉 Khu văn minh, yên tĩnh, toà có bảo vệ 24/7, PCCC đầy đủ
                    </p>

                    <p className="mb-4">
                      Bên em có quỹ căn hộ trung - cao cấp giá chỉ từ 5tr. Anh
                      chị có nhu cầu liên hệ em tư vấn !
                    </p>

                    <p className="mb-4 text-red-600 font-medium">
                      ❌❌ Xem thêm căn hộ cao cấp tại Website:{" "}
                      <a
                        href="https://hanoiresidence.site"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        https://hanoiresidence.site
                      </a>{" "}
                      (Update hàng ngày)
                    </p>

                    <p className="mb-1">Liên hệ xem phòng ☎️</p>
                    <p className="font-bold text-slate-900 text-base">
                      +84 355 885 851 (WhatsApp/Zalo/iMess)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div id="m2-mau-content">
              <div className="grid grid-cols-1 gap-8">
                {/* Khai báo mảng dữ liệu (bạn có thể đặt bên ngoài hoặc bên trong component đều được) */}
                {(() => {
                  const templates = [
                    {
                      id: "tpl-1",
                      title:
                        "Mẫu 1: Kể chuyện thực tế & Cam kết (Phân khúc Cao cấp)",
                      tags: "Storytelling / VIP",
                      tagColor: "bg-purple-100 text-purple-700",
                      content: `Khách cũ vừa hết hợp đồng, mình trống lại căn hộ cực đẹp, sẵn sàng đón khách mới xách vali vào ở ngay! Cam kết đúng chuẩn như ảnh chụp 100%.

CĂN HỘ CAO CẤP 1N1K FULL ĐỒ - VỊ TRÍ ĐẮC ĐỊA
📌 Mặt phố Quán Thánh, Ba Đình

🔘 Địa chỉ: 41 Quán Thánh, Ba Đình. Di chuyển thuận tiện ra khu Phố Cổ, đường Phan Đình Phùng, Quảng trường Ba Đình, Lăng Bác.
🔘 Diện tích: 45m2
🔘 Thiết kế: 1 Phòng ngủ + 1 Phòng khách riêng biệt. Không gian mở, tối ưu ánh sáng tự nhiên.

💢 Điểm nhấn căn hộ 💢
👉 Nội thất: Full đồ mới keeng, hiện đại đúng như ảnh (Tủ lạnh, Máy giặt sấy riêng, Bếp từ, Sofa, Tủ quần áo âm tường lớn...) chỉ việc xách vali vào ở luôn.
👉 Thanh toán linh hoạt. Ưu tiên khách thuê dài hạn.

Liên hệ xem phòng ☎️
081.2442.111 (Quang - Hỗ trợ xem phòng 24/7)`,
                    },
                    {
                      id: "tpl-2",
                      title: "Mẫu 2: Gần gũi & Tạo sự khan hiếm (Dạng tâm sự)",
                      tags: "Khuyến mãi / Ưu đãi",
                      tagColor: "bg-red-100 text-red-700",
                      content: `Sáng sớm bà chị chủ nhà đã nhắn: "Quang ơi căn 209 Đội Cấn khách vừa trả phòng. Em tìm bạn nào ở gọn gàng, hiền lành chốt giúp chị, vào nhanh chị fix giá thật sâu cho nhé!"

Thế là có ngay căn studio 45m2 siêu rộng cho anh em. Đồ đạc sắm sửa tinh tươm y hình, xách mỗi vali quần áo đến là ở thôi.

Ưng nhất là vị trí khu này, trung tâm, tiện ích đủ đầy. Gần hồ gần phố, chiều chiều đi lượn lờ cực chill. Thêm cái điểm cộng là ngõ rộng nên ô tô đỗ tận cửa, anh em gọi xe công nghệ hay taxi phút mốt là có mặt, đi sớm về khuya cực kỳ an tâm.

Thanh toán nhẹ nhàng 1 cọc 1, giá lại đang được chị chủ ưu đãi cực tốt.
📍 209 Đội Cấn, Ba Đình

Đừng ngại ngùng hỏi giá, inbox hoặc gọi em ngay:
☎️ 081.2442.111 (Quang)`,
                    },
                    {
                      id: "tpl-3",
                      title:
                        "Mẫu 3: Ngắn gọn, đánh nhanh (Dành cho Group lướt nhanh)",
                      tags: "Ngắn gọn / Trực diện",
                      tagColor: "bg-blue-100 text-blue-700",
                      content: `🏡 Cho thuê căn hộ tại 113 Đào Tấn, Ba Đình

🔘 Diện tích chuẩn 45m² – Cửa sổ thoáng mát
👉 Full nội thất cao cấp: Máy giặt, Tủ lạnh, Bếp, Tivi, Thang máy...
👉 Khu dân trí cao – Yên tĩnh – Riêng tư tuyệt đối
👉 Gần hồ, gần phố – Tiện nghi đủ đầy

☎️ Inbox ngay để xem phòng trực tiếp
+84 355 885 851 (WhatsApp/Zalo)`,
                    },
                    {
                      id: "tpl-4",
                      title: "Mẫu 4: Chuẩn form đơn giản",
                      tags: "Premium / Sang trọng",
                      tagColor: "bg-amber-100 text-amber-700",
                      content: `🏡 Cho thuê căn hộ cao cấp tại 39 Linh Lang - Ba Đình

🔘 Diện tích: 50m2
🔘 Thiết kế: 1PN rộng rãi, tối ưu công năng
👉 Full nội thất: Giường tủ, Sofa, bếp, máy giặt sấy riêng...
👉 Khu an ninh, yên tĩnh, hệ thống PCCC đầy đủ, đạt chuẩn an toàn

💸 Thanh toán linh hoạt, 1 cọc 1
Liên hệ 📲 081.2442.111 (hoặc inbox ngay cho em để nhận video thực tế)`,
                    },
                    {
                      id: "tpl-5",
                      title: "Mẫu 5: Liệt kê thông số",
                      tags: "Tiêu chuẩn / Đầy đủ",
                      tagColor: "bg-emerald-100 text-emerald-700",
                      content: `📌 Địa chỉ: 47 Nguyên Hồng, Đống Đa, Hà Nội

🔘 Thiết kế: 1 Khách + 1 Ngủ
🔘 Diện tích: 35m2
🔘 Nội thất: Giường tủ, Điều hòa, Nóng lạnh, Sofa, Kệ tủ bếp, Tủ lạnh, Bàn ghế, Máy giặt riêng,…

❌ Lưu ý:
👉 Không chung chủ, giờ giấc tự do 24/7, cổng vân tay an toàn.
👉 Thanh toán linh hoạt, đóng 1 cọc 1.

Liên hệ em 📲 081.2442.111 (Zalo/Call) hoặc inbox trực tiếp để qua xem phòng miễn phí.`,
                    },
                  ];

                  return (
                    <div id="m2-mau-content" className="mt-12">
                      <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                        <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                          <Smartphone size={28} />
                        </span>
                        2.4 Thư Viện Content Mẫu (Click để Copy)
                      </h2>
                      <div className="grid grid-cols-1 gap-8">
                        {templates.map((tmp) => (
                          <div
                            key={tmp.id}
                            className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm relative group hover:shadow-md transition-shadow"
                          >
                            {/* Header Box */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                              <span className="font-bold text-gray-800 text-lg">
                                {tmp.title}
                              </span>

                              <div className="flex gap-3 items-center w-full md:w-auto justify-between md:justify-end">
                                <span
                                  className={`text-sm px-3 py-1.5 rounded-full font-bold ${tmp.tagColor}`}
                                >
                                  {tmp.tags}
                                </span>

                                <button
                                  onClick={() =>
                                    handleCopy(tmp.content, tmp.id)
                                  }
                                  className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                                >
                                  {copiedId === tmp.id ? (
                                    <Check
                                      size={16}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                  {copiedId === tmp.id ? "Đã chép" : "Copy"}
                                </button>
                              </div>
                            </div>

                            {/* Content Box */}
                            <div className="p-6 text-base text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                              {tmp.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div id="m2-prompt-ai">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Terminal size={28} />
                </span>
                2.5 Bộ Câu Lệnh Prompt AI
              </h2>
              <div className="space-y-6">
                {prompts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl overflow-hidden shadow-sm border border-gray-800 relative"
                  >
                    <div className="bg-gray-900 px-5 py-3 flex items-center justify-between border-b border-gray-700">
                      <span className="text-gray-300 text-sm font-mono font-bold">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleCopy(item.text, item.id)}
                          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-xs font-mono font-bold transition-all"
                        >
                          {copiedId === item.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                          {copiedId === item.id ? "Copied" : "Copy"}
                        </button>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-6 text-gray-300 font-mono text-base whitespace-pre-wrap leading-relaxed">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "module-3":
        return (
          <div
            id="module-3"
            className="animate-in fade-in duration-300 space-y-12 md:space-y-16"
          >
            {/* PHẦN 1: NGUYÊN TẮC SỐNG CÒN */}
            <div id="m3-nguyen-tac">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-red-100 text-red-600 rounded-xl shadow-sm">
                  <AlertTriangle size={28} />
                </span>
                3.1 Nguyên Tắc Sống Còn Khi Tư Vấn
              </h2>

              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-6 md:p-8 rounded-r-2xl shadow-sm">
                <h3 className="font-bold text-red-900 text-xl mb-4 flex items-center gap-2">
                  <ShieldAlert size={24} /> Ghi nhớ nằm lòng trước khi rep
                  khách:
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-bold">1</span>
                    </div>
                    <p className="text-gray-800 text-base md:text-lg">
                      <strong>Cung cấp 1 thông tin - Hỏi lại 1 câu:</strong>{" "}
                      Không bao giờ tuôn một tràng dài. Khách hỏi giá, báo giá
                      xong phải kèm theo 1 câu hỏi khai thác (VD: Anh chị tính ở
                      mấy người ạ?). Cuộc trò chuyện phải giống như trận bóng
                      bàn.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-bold">2</span>
                    </div>
                    <p className="text-gray-800 text-base md:text-lg">
                      <strong>Quy tắc "Không Số Nhà":</strong>{" "}
                      <span className="text-red-600 font-bold uppercase">
                        Tuyệt đối không gửi địa chỉ nhà cụ thể
                      </span>{" "}
                      (VD: Số 15 ngách 2...). Khách sẽ tự mò đến gặp chủ nhà cắt
                      cầu, bạn mất trắng công sức và hoa hồng. Chỉ gửi tên
                      ngõ/đường, báo khách qua xem em sẽ đón từ đầu ngõ (VD: Ngõ
                      68 Đội Cấn).
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-bold">3</span>
                    </div>
                    <p className="text-gray-800 text-base md:text-lg">
                      <strong>Tối ưu Hoa Hồng:</strong> Khi khách hỏi thời hạn
                      hợp đồng, <strong>luôn báo tối thiểu 1 năm</strong> để
                      nhận full hoa hồng. Trừ những trường hợp phòng quá khó bán
                      hoặc khách cực nét mới linh động báo HĐ 6 tháng.
                    </p>
                  </li>
                </ul>
              </div>
            </div>

            {/* PHẦN 2: TIẾP NHẬN KHÁCH & KHAI THÁC */}
            <div id="m3-tiep-nhan">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                  <Headset size={28} />
                </span>
                3.2 Tiếp Nhận Ban Đầu & Khai Thác Nhu Cầu
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* TH1: Khách nhắn tin */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500" /> Khách
                    CMT / Inbox Facebook
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm md:text-base">
                    Các bạn nên trả lời khách một cách lịch sự và nhanh chóng,
                    đồng thời tư vấn họ theo kịch bản mẫu.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-blue-900 font-medium italic text-sm md:text-base">
                      Comment: "Anh/chị check inbox em nhé. Hoặc anh chị add
                      Zalo em <strong>[SĐT của bạn]</strong> em gửi full thông
                      tin và ảnh nét cho mình tiện xem ạ!"
                    </p>
                  </div>
                </div>

                {/* TH2: Khách gọi điện (Rất hay cuống) */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-500"></div>
                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Phone size={20} className="text-purple-500" /> Khách gọi
                    điện mà bạn không nhớ thông tin phòng
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm md:text-base">
                    Mới làm sẽ không thể nhớ hết giá và phòng. Đừng cuống đoán
                    bừa, hãy dùng "Văn mẫu hoãn binh" này:
                  </p>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-purple-900 font-medium italic text-sm md:text-base">
                      "Dạ em chào anh/chị. Em đang đi đường không tiện nghe máy.
                      Anh chị có sử dụng Zalo số này không ạ, để em gửi thông
                      tin cho anh/chị qua Zalo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bộ câu hỏi khai thác */}
              <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
                <h3 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-2">
                  <Target size={24} className="text-slate-600" /> 5 Câu Hỏi Bắt
                  Buộc Khai Thác
                </h3>
                <p className="text-slate-600 mb-5">
                  Đừng vội gửi phòng liên tục. Hãy hỏi để vẽ được chân dung
                  khách hàng:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      1
                    </div>
                    <span className="text-gray-800 font-medium">
                      Ngân sách tối đa của anh/chị?
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      2
                    </div>
                    <span className="text-gray-800 font-medium">
                      Khu vực ưu tiên thuê ở đâu?
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      3
                    </div>
                    <span className="text-gray-800 font-medium">
                      Mình ở mấy người? Mấy xe máy?
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      4
                    </div>
                    <span className="text-gray-800 font-medium">
                      Khoảng bao giờ anh/chị cần chuyển?
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm md:col-span-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      5
                    </div>
                    <span className="text-gray-800 font-medium">
                      Có yêu cầu đặc biệt không? (Anh chị có Nuôi pet không? Có
                      lưu ý gì về phòng không)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN 3: QUY TRÌNH TƯ VẤN & XỬ LÝ TÌNH HUỐNG */}
            <div id="m3-quy-trinh-tu-van">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl shadow-sm">
                  <MessageCircle size={28} />
                </span>
                3.3 Quy Trình Tư Vấn & Xử Lý Tình Huống Về Giá
              </h2>

              <div className="space-y-8">
                {/* BƯỚC 1: GIỚI THIỆU & CHÀO HỎI */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="font-bold text-gray-900 text-xl">
                      Bước 1: Tiếp cận & Chào hỏi (Không nóng vội)
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="text-gray-700 leading-relaxed">
                        Khi có khách comment hỏi phòng trên bài đăng, việc đầu
                        tiên bạn cần làm là{" "}
                        <strong>CHỤP MÀN HÌNH (Cap màn hình)</strong> bài đăng
                        đó lại, sau đó trả lời comment:{" "}
                        <em>"Dạ anh/chị check inbox em nhé!"</em>.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-900 flex gap-3">
                        <Camera
                          size={20}
                          className="shrink-0 mt-0.5 text-blue-600"
                        />
                        <span>
                          <strong>Tại sao phải cap màn hình?</strong> Vì 1 ngày
                          bạn đăng hàng chục nhóm, tiếp hàng chục khách. Nếu
                          không cap lại, đến lúc nhắn tin bạn sẽ không nhớ nổi
                          khách đang hỏi căn nào để tư vấn!
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                        Nguyên tắc nhắn tin đầu tiên:
                      </h4>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex gap-2 items-start">
                          <span className="text-rose-500 font-bold">❌</span>{" "}
                          <strong>KHÔNG</strong> gửi ngay 1 cục giá và thông tin
                          dài ngoằng.
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-emerald-500 font-bold">✅</span>{" "}
                          <strong>HÃY</strong> gửi ảnh cap màn hình + Lời chào:{" "}
                          <em>
                            "Dạ em chào anh/chị, anh chị đang quan tâm căn này
                            đúng không ạ?"
                          </em>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-amber-500 font-bold">⏳</span>{" "}
                          <strong>ĐỢI KHÁCH REP:</strong> Phân khúc cao cấp cần
                          sự điềm đạm, chuyên nghiệp. Khách "Dạ/Ừ em" xong mới
                          bắt đầu nhả thông tin.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* BƯỚC 2: TƯ VẤN & PHÂN LOẠI TÌNH HUỐNG (CHI TIẾT 2 CỘT) */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl md:text-2xl">
                        Bước 2: Báo giá & Kịch Bản Trực Chiến
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Cách dẫn dắt tâm lý khách hàng qua từng tin nhắn, rẽ
                        nhánh theo 2 tình huống thực tế.
                      </p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* ===== CỘT A: KHÁCH CHÊ / TÀI CHÍNH THẤP ===== */}
                    <div className="bg-rose-50/30 rounded-3xl p-5 md:p-6 border border-rose-100 relative shadow-sm">
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-3xl shadow-sm">
                        Kịch bản A: Khách với tài chính
                      </div>
                      <h4 className="font-bold text-rose-900 text-lg mb-2 flex items-center gap-2">
                        <TrendingDown size={22} className="text-rose-600" />{" "}
                        Khách chê đắt / Im lặng
                      </h4>
                      <p className="text-rose-700 text-sm mb-6 pb-4 border-b border-rose-100">
                        Dấu hiệu khách không đủ tài chính. Đừng đoán, hãy hỏi
                        thẳng để lọc tệp và áp dụng nghệ thuật "Down-sale" (Giảm
                        kỳ vọng).
                      </p>

                      {/* Chat Flow A */}
                      <div className="space-y-4 text-sm font-medium">
                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-sm">
                            Dạ căn 1N1K này giá 9tr/tháng ạ.
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm italic font-normal">
                            (Khách đã xem và im lặng / hoặc nhắn "Anh/chị cảm
                            ơn")
                          </div>
                        </div>

                        <div className="text-xs text-rose-500 text-center uppercase tracking-wider font-bold my-2">
                          👇 Khéo léo chuyển hướng
                        </div>

                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-sm">
                            Căn này có cao với ngân sách của anh/chị không?
                            (Hoặc căn này có phù hợp với nhu cầu của anh/chị
                            không), quanh đây em còn một số căn nữa giá tốt hơn,
                            để em tư vấn cho anh/chị nhé?
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm italic font-normal">
                            Cao quá em ạ.
                          </div>
                        </div>

                        <p className="text-rose-700 text-sm mb-6 pb-4 border-b border-rose-100">
                          Tiếp tục khai thác khách theo bộ câu hỏi 5 bước. Lược
                          bỏ một số câu hỏi nếu khách đã trả lời trước đó.
                        </p>
                      </div>

                      {/* Phân tích A */}
                      <div className="mt-6 bg-white p-4 rounded-xl border border-rose-200 text-rose-800 text-sm">
                        <strong className="flex items-center gap-2 mb-2">
                          <Target size={16} /> Phân tích nhịp đánh:
                        </strong>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 font-medium">
                          <li>
                            Nâng tầm căn cũ ("9tr là VIP rồi") để tôn trọng
                            khách, không nói "tiền nào của nấy".
                          </li>
                          <li>
                            Xác nhận lại ngân sách 7tr và lập tức đưa ra "Mồi"
                            mới (2 căn Studio).
                          </li>
                          <li>
                            Kết thúc bằng câu hỏi lựa chọn (ngõ to hay nhỏ) để
                            khách buộc phải tương tác tiếp.
                          </li>
                        </ul>
                      </div>

                      {/* Cảnh báo A */}
                      <div className="mt-4 bg-red-100 p-3 rounded-lg border border-red-200 flex gap-2 text-red-900 text-sm">
                        <AlertTriangle
                          size={18}
                          className="shrink-0 text-red-600"
                        />
                        <span className="font-medium">
                          <strong>Cảnh báo:</strong> Nếu khách báo ngân sách{" "}
                          <strong>THẤP HƠN GIÁ SÀN</strong> (VD: Ba Đình mà tìm
                          3tr) 👉 Từ chối khéo và bỏ qua ngay để không phí thời
                          gian!
                        </span>
                      </div>
                    </div>

                    {/* ===== CỘT B: KHÁCH ƯNG GIÁ / HAPPY PATH ===== */}
                    <div className="bg-emerald-50/30 rounded-3xl p-5 md:p-6 border border-emerald-100 relative shadow-sm">
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-3xl shadow-sm">
                        Kịch bản B: Khách phù hợp tài chính
                      </div>
                      <h4 className="font-bold text-emerald-900 text-lg mb-2 flex items-center gap-2">
                        <CheckCircle2 size={22} className="text-emerald-600" />{" "}
                        Khách OK giá / Hỏi chi tiết
                      </h4>
                      <p className="text-emerald-700 text-sm mb-6 pb-4 border-b border-emerald-100">
                        Khách thả tim hoặc hỏi thêm "Có máy giặt riêng không?".
                        Đây là lúc tung quy trình{" "}
                        <strong>"Khai thác & Chốt lịch 3 nhịp"</strong>.
                      </p>

                      {/* Chat Flow B */}
                      <div className="space-y-4 text-sm font-medium">
                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-sm">
                            Căn này ở mặt phố Giảng Võ, giá 9tr/tháng, diện tích
                            35m2, thiết kế 1N1K, full nội thất, có máy giặt
                            riêng. Phòng đang trống có thể vào luôn được ạ
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm">
                            Chị ở 1 mình thôi em, giá này có bớt được không?
                          </div>
                        </div>

                        <div className="text-xs text-emerald-600 text-center uppercase tracking-wider font-bold my-2">
                          👇 Đẩy giá trị & Tạo Khan Hiếm
                        </div>

                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-sm">
                            Dạ được chị ạ, nếu chị ưng phòng em sẽ hỗ trợ chị
                            hết mức có thể. Chị sắp xếp thời gian qua xem sớm.
                            Căn này đang hot nên có nhiều bạn đẩy nên em cũng
                            không care được.
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm">
                            Ừ, thế mai chị qua xem luôn.
                          </div>
                        </div>

                        <div className="text-xs text-emerald-600 text-center uppercase tracking-wider font-bold my-2">
                          👇 Chốt Lịch (Option A/B)
                        </div>

                        <div className="flex justify-end">
                          <div className="bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-sm">
                            Vâng, vậy sáng mai khoảng 9 - 10h hoặc chiều 3 - 4h
                            thì chị có qua được không ạ. Để em sắp xếp thời gian
                            dẫn chị qua xem phòng.
                          </div>
                        </div>
                      </div>

                      {/* Phân tích B */}
                      <div className="mt-6 bg-white p-4 rounded-xl border border-emerald-200 text-emerald-800 text-sm">
                        <strong className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={16} /> Bí quyết thành công:
                        </strong>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 font-medium">
                          <li>
                            <strong>Luôn kèm 1 câu hỏi khơi gợi:</strong> Báo
                            giá xong phải hỏi tiếp (VD: Ở mấy người?) để giữ
                            nhịp chat.
                          </li>

                          <li>
                            <strong>Chốt hẹn A/B:</strong> Không hỏi "Bao giờ
                            chị xem được?". Đưa ra 2 mốc (5h chiều hoặc 9h sáng)
                            để ép khách chọn 1 trong 2.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN 4: KỸ NĂNG CHỐT LỊCH ĐI XEM */}
            <div id="m3-chot-lich">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                  <CalendarCheck size={28} />
                </span>
                3.4 Kỹ Năng Hướng Khách Đi Xem
              </h2>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                  QUAN TRỌNG NHẤT
                </div>

                <p className="text-emerald-900 text-base md:text-lg mb-6 leading-relaxed">
                  <strong>
                    💡 Nguyên nhân 90% Sale mới làm chăm chỉ nhưng không có kết
                    quả:
                  </strong>{" "}
                  Là vì không hướng được khách ĐI XEM THỰC TẾ. Khách có đi xem
                  nhà thì mới có tỉ lệ chốt và đảm bảo được thu nhập của AE.
                  Đừng trở thành "người gửi ảnh dạo"!
                </p>

                <div className="space-y-6">
                  {/* Tình huống chốt lịch */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <CheckCircle2 size={20} /> Kỹ thuật Đưa Ra Sự Lựa Chọn
                      (Option A or B)
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Đừng bao giờ hỏi "Bao giờ anh/chị đi xem được?". Hãy đưa
                      ra khung giờ cụ thể để ép khách vào thế phải chọn.
                    </p>
                    <div className="pl-4 border-l-2 border-emerald-400 space-y-2">
                      <p className="text-gray-800">
                        <strong>Khách:</strong>{" "}
                        <em>"Ừ để mai anh rảnh anh qua xem nhé."</em> (Rất mông
                        lung)
                      </p>
                      <p className="text-emerald-700 font-medium">
                        <strong>Bạn đáp:</strong>{" "}
                        <em>
                          "Dạ vâng, vậy sáng mai tầm 9-10h hay chiều 3-4h anh
                          qua được ạ, để em chuẩn bị trước ạ?"
                        </em>
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        👉 Nếu họ không rảnh 2 giờ đó, họ sẽ tự bật ra thời gian
                        chính xác của họ (VD: Không em, 6h chiều đi làm về anh
                        mới qua được).
                      </p>
                    </div>
                  </div>

                  {/* Tình huống phòng thủ */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <Shield size={20} /> Xử lý khi khách không chịu cho Số
                      Điện Thoại
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Khách sợ bị sale làm phiền nên không cho số, chỉ xin địa
                      chỉ. Đừng gửi số nhà chi tiết, hãy gửi SĐT của bạn.
                    </p>
                    <div className="pl-4 border-l-2 border-emerald-400">
                      <p className="text-emerald-700 font-medium">
                        <strong>Bạn đáp:</strong>{" "}
                        <em>
                          "Dạ nhà ở ngõ 68 Đội Cấn. Anh chị lưu số em{" "}
                          <strong>[098x.xxx.xxx]</strong> nhé. Vì em hay chạy đi
                          dẫn khách qua các tòa khác nhau, nên lúc nào chuẩn bị
                          qua anh/chị cứ gọi hoặc nhắn trước cho em 1 tiếng để
                          em sắp xếp có mặt dẫn anh/chị xem nhà nhé ạ!"
                        </em>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "module-4":
        const faqs = [
          {
            id: "m4-gia-thanh-toan",
            category: "Về Giá & Thanh Toán",
            icon: DollarSign,
            color: "text-green-600 bg-green-50 border-green-100",
            items: [
              {
                q: "Giá đã bao gồm phí dịch vụ/quản lý chưa?",
                a: "Check kỹ tin đăng, không rõ thì hỏi quản lý trước khi báo khách, tránh báo sai rồi phải đính chính.",
              },
              {
                q: "Đặt cọc giữ nhà bao nhiêu?",
                a: "Xem tình hình khách cần giữ lâu không để cân đối. Có thể cọc từ 1-2 triệu, hoặc nửa tháng, 1 tháng tuỳ tình hình.",
              },
              {
                q: "Thanh toán theo tháng hay theo quý?",
                a: "Theo thỏa thuận với chủ nhà, không rõ thì hỏi lại quản lý, không tự đưa ra cam kết.",
              },
              {
                q: "Giá có fix không em?",
                a: "Bảo khách qua xem trực tiếp rồi thương lượng, mình sẽ hỗ trợ hết mức. Tuyệt đối không fix giá qua điện thoại.",
              },
            ],
          },
          {
            id: "m4-vi-tri",
            category: "Về Vị Trí & Hẹn Xem Phòng",
            icon: MapPin,
            color: "text-purple-600 bg-purple-50 border-purple-100",
            items: [
              {
                q: "Cho anh xin địa chỉ cụ thể?",
                a: "Báo địa chỉ CHUNG CHUNG (đường/phố). Tuyệt đối không đưa số nhà. 'Khi nào anh/chị đi xem đến đầu ngõ báo em ra dẫn vào nhé.'",
              },
              {
                q: "Phòng còn không? (Với nguồn đã đăng 3-4 tuần)",
                a: "Cứ báo LÀ CÒN. Tư vấn khai thác nhu cầu bình thường, sau đó hỏi Admin check xem còn không.",
              },
              {
                q: "Khu này có ồn không? Gần đường lớn không?",
                a: "Tư vấn khách qua xem trực tiếp để cảm nhận thực tế, tránh nhận định chủ quan.",
              },
              {
                q: "Gần trường học/bệnh viện/chợ không?",
                a: "Check Google Maps, không rõ báo lại quản lý.",
              },
            ],
          },
          {
            id: "m4-tien-ich",
            category: "Về Tiện Ích & Nội Thất",
            icon: Sofa,
            color: "text-amber-600 bg-amber-50 border-amber-100",
            items: [
              {
                q: "Phòng có đồ gì (Máy giặt riêng, hút mùi, TV...)?",
                a: "Tự check lại ảnh hoặc ghi chú. Không rõ thì hỏi quản lý.",
              },
              {
                q: "Phơi đồ ở đâu?",
                a: "Sân thượng hoặc ban công (nếu có).",
              },
              {
                q: "Có wifi/internet sẵn không hay khách tự lắp?",
                a: "Tự check ảnh hoặc ghi chú, không rõ thì hỏi quản lý.",
              },
              {
                q: "Nội thất có được thay đổi/mang thêm đồ vào không?",
                a: "Theo thỏa thuận với chủ nhà, không tự cam kết khi chưa hỏi.",
              },
            ],
          },
          {
            id: "m4-toa-nha",
            category: "Về Tòa Nhà & Gửi Xe",
            icon: Car,
            color: "text-blue-600 bg-blue-50 border-blue-100",
            items: [
              {
                q: "Có gần bãi ô tô không? Ngõ ô tô vào được không?",
                a: "Check Google Maps (chế độ đường ô tô/ảnh). Không rõ báo lại quản lý.",
              },
              {
                q: "Chỗ để xe có rộng không?",
                a: "Xem ảnh nhà xe, không có ảnh cứ báo 'để thoải mái'.",
              },
              {
                q: "Có thang máy không? Tầng mấy?",
                a: "Check ảnh/tin đăng, không rõ thì hỏi lại quản lý.",
              },
              {
                q: "Hàng xóm/dân cư khu này thế nào?",
                a: "Tránh nhận xét cá nhân, hướng khách đến trải nghiệm thực tế khi xem nhà.",
              },
            ],
          },
          {
            id: "m4-quy-dinh",
            category: "Về Khách Thuê & Quy Định",
            icon: Users2,
            color: "text-pink-600 bg-pink-50 border-pink-100",
            items: [
              {
                q: "Có cho nuôi thú cưng (Pet) không?",
                a: "Check thông tin nguồn, không có thì phải hỏi quản lý.",
              },
              {
                q: "Cho thuê theo nhóm/ở ghép được không?",
                a: "Check thông tin nguồn, không có thì hỏi quản lý.",
              },
              {
                q: "Có giới hạn giờ giấc ra vào không?",
                a: "Theo quy định tòa nhà/chủ nhà, không rõ thì hỏi lại.",
              },
              {
                q: "Khách nước ngoài thuê được không?",
                a: "Check thông tin nguồn trước khi trả lời khách.",
              },
              {
                q: "Hợp đồng thuê tối thiểu bao lâu?",
                a: "Báo đúng thời hạn tối thiểu, không tự ý linh động khi chưa được xác nhận.",
              },
              {
                q: "Có hỗ trợ đăng ký tạm trú không?",
                a: "Check thông tin nguồn, không rõ thì hỏi quản lý.",
              },
            ],
          },
        ];

        return (
          <div id="module-4" className="animate-in fade-in duration-300">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 flex items-center gap-4">
              <span className="p-3 bg-[#cda533]/20 text-[#cda533] rounded-2xl shadow-sm">
                <HelpCircle size={32} />
              </span>
              Module 4: Bộ FAQ Giải Đáp Khách Hàng
            </h2>
            <div className="space-y-10">
              {faqs.map((group, idx) => (
                <div
                  key={idx}
                  id={group.id}
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-24"
                >
                  <div
                    className={cn(
                      "px-6 py-4 flex items-center gap-3 border-b",
                      group.color,
                    )}
                  >
                    <group.icon size={22} className="opacity-80" />
                    <h3 className="text-xl font-bold">{group.category}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item, i) => (
                      <div
                        key={i}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-bold text-gray-900 mb-3 flex items-start gap-3 text-lg">
                          <span className="text-[#cda533] mt-0.5 font-black">
                            Q.
                          </span>
                          {item.q}
                        </h4>
                        <div className="flex items-start gap-3">
                          <span className="text-gray-300 font-bold text-lg mt-0.5">
                            A.
                          </span>
                          <p className="text-base text-gray-600 leading-relaxed font-medium">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "module-5":
        return (
          <div id="module-5" className="animate-in fade-in duration-300">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 flex items-center gap-4">
              <span className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                <MessageSquare size={32} />
              </span>
              Module 5: Kịch Bản Follow-up (Sau Khi Khách Xem)
            </h2>
            <p className="text-gray-500 mb-10 text-lg">
              Dưới đây là các tình huống thường gặp khi khách vừa xem phòng xong
              và cách xử lý khéo léo để tăng tỷ lệ chốt deal.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
                  <Brain size={22} className="text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Để anh/chị suy nghĩ thêm
                </h3>
                <p className="text-base text-gray-600">
                  Khéo léo hỏi thăm xem khách đang cấn ở điểm nào (giá, vị trí,
                  tiện ích) để tìm hướng giải quyết hoặc gửi thêm các option
                  khác.
                </p>
              </div>

              <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm hover:border-red-200 transition-colors">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-5">
                  <CameraOff size={22} className="text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Chê phòng thực tế nhỏ/cũ hơn ảnh
                </h3>
                <p className="text-base text-gray-600">
                  Đồng cảm với khách, xin lỗi vì góc chụp rộng. Ngay lập tức gợi
                  ý chuyển hướng xem 1-2 căn khác thực tế hơn ở gần đó.
                </p>
              </div>

              <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100 shadow-sm hover:border-purple-200 transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
                  <Users size={22} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Đợi người nhà/bạn ở ghép chốt
                </h3>
                <p className="text-base text-gray-600">
                  Gợi ý cọc thiện chí giữ phòng (nếu chủ nhà cho phép), hoặc
                  giục hẹn lịch fix cứng sớm nhất để đưa người thân qua xem
                  tránh mất phòng.
                </p>
              </div>

              <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 shadow-sm hover:border-amber-200 transition-colors">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                  <HelpCircle size={22} className="text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Ưng nhưng lăn tăn giá/dịch vụ
                </h3>
                <p className="text-base text-gray-600">
                  Báo quản lý để xin chủ nhà hỗ trợ chốt deal (giảm giá 1 chút,
                  free dịch vụ tháng đầu hoặc setup thêm đồ đạc...).
                </p>
              </div>

              <div className="bg-gray-100 p-8 rounded-3xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-5">
                  <UserX size={22} className="text-gray-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Không ưng, nhắn tin không trả lời
                </h3>
                <p className="text-base text-gray-600">
                  Bỏ qua, tìm khách mới cho đỡ mệt mỏi. Không nên cố chấp spam
                  tin nhắn làm phiền khách hàng.
                </p>
              </div>

              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm hover:border-emerald-200 transition-colors">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                  <HeartHandshake size={22} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Khách chốt cọc
                </h3>
                <p className="text-base text-gray-600">
                  Chúc mừng khách. Hỗ trợ thủ tục nhiệt tình và dặn dò nếu có
                  bạn bè cần thuê thì giới thiệu lại cho mình.
                </p>
              </div>
            </div>
          </div>
        );

    case "cheat-sheet":
        return (
          <div
            id="cheat-sheet"
            className="animate-in fade-in duration-500 mt-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-4">
              <span className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
                <Zap size={32} />
              </span>
              Quy tắc cốt lõi (Cheat-sheet)
            </h2>
            <p className="text-gray-600 mb-8 text-lg font-medium">
              📸 Sale mới bắt buộc chụp ảnh màn hình phần này để tra cứu nhanh
              khi đang chat với khách.
            </p>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-800">
              <h3 className="text-[#eab308] font-black text-2xl mb-8 uppercase tracking-widest text-center flex items-center justify-center gap-3">
                <ShieldAlert size={28} /> Lưu ý cần nhớ
              </h3>

              <div className="grid md:grid-cols-2 gap-10">
                {/* CỘT 3 KHÔNG */}
                <div className="space-y-6">
                  <div className="inline-block bg-red-500/20 border border-red-500/30 text-red-400 font-bold px-4 py-1.5 rounded-lg mb-2 text-sm uppercase tracking-wider">
                    ⛔ 3 Không (Vùng Cấm)
                  </div>
                  <ul className="space-y-6">
                    <li className="flex gap-4 items-start group">
                      <X className="text-red-500 mt-1 flex-shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="font-bold text-lg block mb-1">
                          KHÔNG gửi chính xác số nhà
                        </span>
                        <span className="text-gray-400 text-sm leading-relaxed">
                          Chỉ báo tên ngõ/đường (VD: Ngõ 41 Quán Thánh). Lộ số nhà = Khách tự tìm đến làm việc với chủ = Mất trắng hoa hồng.
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start group">
                      <X className="text-red-500 mt-1 flex-shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="font-bold text-lg block mb-1">
                          KHÔNG hỏi ồ ạt với khách (Áp dụng khách Việt)
                        </span>
                        <span className="text-gray-400 text-sm leading-relaxed">
                          Tuyệt đối không ném 1 cục câu hỏi dài ngoằng. Quy tắc: <strong>Gửi 1 thông tin 👉 Kèm 1 câu hỏi</strong> (VD: Gửi vài căn hộ xong hỏi luôn: "Mấy căn em gửi anh/chị có ưng không, nếu chưa cho em biết lưu ý của anh/chị để em gửi phòng phù hợp hơn nhé").
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start group">
                      <X className="text-red-500 mt-1 flex-shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="font-bold text-lg block mb-1">
                          KHÔNG fix giá qua Điện thoại
                        </span>
                        <span className="text-gray-400 text-sm leading-relaxed">
                         Nếu đã trao đổi nhưng khách vẫn muốn biết giá fix bao nhiêu. Bạn hãy nhắn: "Chủ bên này bình thường chỉ ra lộc khoảng 200- 300 thôi ạ, anh/chị cứ qua xem, nếu chủ ưng khách thì có thể cho anh chị giá ưu đãi hơn.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* CỘT 3 LUÔN */}
                <div className="space-y-6">
                  <div className="inline-block bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-4 py-1.5 rounded-lg mb-2 text-sm uppercase tracking-wider">
                    ✅ 3 Luôn (Kim Chỉ Nam)
                  </div>
                  <ul className="space-y-6">
                    <li className="flex gap-4 items-start group">
                      <Check className="text-emerald-500 mt-1 flex-shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="font-bold text-lg block mb-1">
                          LUÔN hỏi tài chính để lọc khách
                        </span>
                        <span className="text-gray-400 text-sm leading-relaxed">
                          Phải biết khách có tối đa bao nhiêu tiền. Ngân sách thấp hơn giá đáy của khu vực 👉 Từ chối khéo luôn để khỏi mất thời gian.
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start group">
                      <Check className="text-emerald-500 mt-1 flex-shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="font-bold text-lg block mb-1">
                          LUÔN chốt hẹn bằng ngày giờ cụ thể"
                        </span>
                        <span className="text-gray-400 text-sm leading-relaxed">
                          Cấm hỏi <em>"Bao giờ anh/chị rảnh?"</em>. Phải đưa vào thế chọn: <strong>"Chiều nay 3h hay 5h anh/chị qua xem được ạ?"</strong>
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start group">
                      <Check className="text-emerald-500 mt-1 flex-shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="font-bold text-lg block mb-1">
                          LUÔN xin SĐT khách
                        </span>
                        <span className="text-gray-400 text-sm leading-relaxed">
                          Nếu khách sợ phiền không cho SĐT, hãy mồi số của mình: <em>"Lúc nào qua anh/chị cứ gọi em số [SĐT] trước 30p để em qua mở cửa nhé".</em>
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-700/50 text-center text-gray-400 text-sm italic font-medium">
                * Lưu ý: Nếu có bất kỳ thông tin nào của tòa nhà chưa rõ, tuyệt đối
                không đoán mò, hãy hỏi ngay Quản lý/Admin!
              </div>
            </div>
          </div>
        );

      case "loi-gui-gam":
        return (
          <div id="loi-gui-gam" className="animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] text-white p-10 md:p-14 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#cda533] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-extrabold text-[#cda533] mb-8 leading-tight font-headline tracking-wide">
                  Lời Gửi Gắm Từ <br className="hidden md:block" /> Ban Quản Trị
                  Hanoi Residences
                </h3>

                <div className="space-y-6 text-gray-300 text-[17px] leading-[1.8] mb-12">
                  <p>
                    Thời gian đầu mới bắt tay vào làm, nếu thấy ít khách hỏi thì
                    các bạn{" "}
                    <strong className="text-white">
                      tuyệt đối đừng nản chí
                    </strong>
                    . Thuật toán của Facebook cần thời gian để "nhận diện", làm
                    ấm tài khoản và phân phối bài đăng của nick mới đến đúng tệp
                    khách hàng tiềm năng. Đây là giai đoạn thử thách sự kiên trì
                    của một người làm nghề thực thụ.
                  </p>
                  <p>
                    Thay vì hoang mang, hãy hành động quyết liệt hơn:{" "}
                    <strong className="text-white">
                      Đăng tin nhiều lên, rải đều và phủ kín khắp các hội nhóm
                      Facebook
                    </strong>
                    , tập trung vào các khung giờ vàng như sáng 7-9h, trưa
                    11-13h, chiều 17-19h, tối 20-22h, và khuya 23-24h. Nếu thấy
                    bài vẫn lẹt đẹt tương tác, hãy chậm lại một nhịp và tự đặt
                    câu hỏi:{" "}
                    <em className="text-gray-400">
                      "Mình đã đăng đủ số lượng tin yêu cầu mỗi ngày chưa? Hình
                      ảnh mình chọn đã nét chưa? Content có bị nhàm chán không?"
                    </em>
                  </p>
                  <div className="bg-white/[0.03] p-8 rounded-2xl border border-white/10 mt-8 shadow-inner">
                    <p className="text-white font-medium text-lg leading-relaxed">
                      Và điều quan trọng nhất: Các bạn không đi một mình! Nếu có
                      bất kỳ khó khăn, khúc mắc, hay thấy chán nản vì mãi chưa
                      chốt được khách,{" "}
                      <strong className="text-[#cda533] font-bold">
                        hãy chủ động nhắn tin trực tiếp trao đổi với tôi hoặc
                        các quản lý
                      </strong>
                      . Đừng ngại đặt câu hỏi, đừng giấu dốt. Chúng ta là một
                      tập thể, tôi luôn ở đây để đồng hành, chỉ việc và giúp các
                      bạn tháo gỡ mọi vấn đề.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-10 text-center">
                  <p className="font-medium text-xl md:text-2xl italic leading-relaxed text-gray-400">
                    "Đừng kỳ vọng quá nhiều để rồi thất vọng thật nhiều. Tỉ lệ
                    trung bình là 10 người hỏi -&gt; 1 người xem -&gt; 10 người
                    xem -&gt; 1 người chốt. Hãy tự đặt KPI doanh số cá nhân và
                    nỗ lực đạt được."
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Chọn một mục ở menu bên trái để xem nội dung.</div>;
    }
  };

  return (
    <div className="sop-guide flex flex-col lg:flex-row min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-96px)] bg-[#f8fafc] text-gray-800 font-sans relative">
      {/* MOBILE TOP BAR — luôn dính mép trên khi cuộn */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-md border-b border-gray-200 px-5 py-3.5 flex items-center justify-between shadow-sm">
        <div className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
          <BookOpen size={18} className="text-[#cda533]" /> Mục lục đào tạo
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 bg-gray-100 hover:bg-[#cda533] hover:text-white rounded-lg transition-all text-gray-700"
        >
          <Menu size={22} />
        </button>
      </div>
      <div className="lg:hidden h-[57px] shrink-0" aria-hidden />

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[50] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR: mobile = drawer cố định; desktop = sticky full viewport */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-white w-[75vw] sm:w-[280px] lg:w-[320px] z-[95] flex flex-col border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.08)]",
          "transform transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:self-start lg:shrink-0 lg:transform-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex p-5 lg:p-6 border-b border-gray-100 items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
              Tài liệu nội bộ
            </h2>
            <p className="font-black text-gray-900 text-lg">SOP Đào Tạo Sale</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 lg:p-5 space-y-1.5 custom-scrollbar">
          {docsTree.map((node) => {
            const isFolder = node.type === "folder";
            const isExpanded = expandedFolders[node.id];
            const Icon =
              node.icon ||
              (isFolder ? (isExpanded ? FolderOpen : Folder) : FileText);
            const isMainActive = activeModule === node.id;

            return (
              <div key={node.id} className="flex flex-col">
                <button
                  onClick={() => handleNavClick(node)}
                  className={cn(
                    "flex items-center gap-2.5 w-full text-left px-3 py-3 rounded-xl text-[15px] font-bold transition-all group relative",
                    isMainActive
                      ? "bg-amber-50 text-[#cda533] shadow-sm border border-amber-100/50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  {isFolder ? (
                    <span className="text-gray-400 transition-transform duration-200">
                      {isExpanded ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </span>
                  ) : (
                    <span className="w-4" />
                  )}

                  <Icon
                    size={20}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isMainActive
                        ? "text-[#cda533]"
                        : "text-gray-400 group-hover:text-gray-600",
                    )}
                  />
                  <span className="flex-1 whitespace-normal leading-snug pr-4">
                    {node.title}
                  </span>
                </button>

                {isFolder && isExpanded && node.children && (
                  <div className="ml-8 mt-1.5 mb-2 space-y-1 border-l-2 border-gray-100 pl-3">
                    {node.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavClick(child, node.id);
                        }}
                        className="flex items-start gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-all text-gray-500 hover:bg-gray-50 hover:text-[#cda533] font-semibold relative"
                      >
                        <FileText
                          size={15}
                          className="text-gray-300 flex-shrink-0 mt-0.5"
                        />
                        <span className="flex-1 whitespace-normal leading-snug pr-4">
                          {child.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-x-hidden bg-transparent p-5 md:p-8 lg:pt-8 lg:px-10 relative">
        <div className="max-w-5xl mx-auto pb-24">{renderContent()}</div>

        {/* Floating Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-gray-900 text-white p-3 rounded-full shadow-xl hover:bg-[#cda533] hover:-translate-y-1 transition-all z-50"
          >
            <ArrowUp size={24} />
          </button>
        )}
      </main>
    </div>
  );
}
