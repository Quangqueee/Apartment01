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
      { id: "m2-cong-thuc", title: "2.3 Công Thức Viết Content", type: "doc" },
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
      { id: "m3-th1", title: "Tiếp Nhận Khách Mới", type: "doc" },
      { id: "m3-th2", title: "TH1: Lọc Tài Chính", type: "doc" },
      { id: "m3-th3", title: "TH2: Lịch Chuyển Quá Xa", type: "doc" },
      { id: "m3-th4", title: "TH3: Chốt Lịch Đi Xem", type: "doc" },
      { id: "m3-case-study", title: "Case Study Thực Chiến", type: "doc" },
    ],
  },
  {
    id: "module-4",
    title: "Module 4: FAQ Của Khách",
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
    title: "Module 5: Kịch Bản Follow-up",
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
                    tâm. Chúng tôi không chỉ thiết lập chuẩn mực sống mới tại các
                    khu vực trọng điểm như Tây Hồ, Ba Đình... mà còn liên tục mở
                    rộng thị phần trên đa dạng các phân khúc căn
                    hộ.
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
                    Tham gia ít nhất 20 hội nhóm cho thuê nhà trên Facebook (Theo từ khoá: "Cho thuê + Quận định làm", "Chung cư cao cấp", "Chung cư mini", ...) từ 30k thành viên trở lên.
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
                    Viết 3 mẫu content khác nhau (có thể dùng AI, tham khảo các prompt mẫu ở Module 2).
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Bắt đầu đăng tin rải đều vào các khung giờ vàng (Sáng 7h, Trưa 11h-13h, Tối 19h-22h, Khuya 23h).
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />{" "}
                    Mục tiêu: Đạt được 5 tin đăng / ngày. Có ít nhất 3 khách
                    inbox hỏi phòng. (1 lần đăng dải hết các nhóm bạn tham gia gọi là 1 tin đăng. Mỗi tin đăng nên cách nhau 1-2 tiếng để tránh bị spam).
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
            className="animate-in fade-in duration-300 space-y-16"
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
                        Từ 5 Triệu
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-600 whitespace-nowrap">
                        2 - 3 người (2 Lớn, 1 Trẻ)
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
                        2 - 3 người (2 Lớn, 1 Trẻ)
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
                        3 - 4 người (Người lớn)
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
                    Nhận hoa hồng theo tiến độ khách ở trong hợp đồng đến khi
                    khách chuyển đi.
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
                    Nếu ghi "Free DV" là không thu phí. Nếu chỉ ghi phí DV mà
                    không nhắc nước, ngầm hiểu đã gồm nước.
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
                      Nếu không ghi phương thức, hệ thống sẽ mặc định là thanh
                      toán 1 cọc 1.
                    </p>
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
              '🔥 TÌM ĐÂU RA STUDIO FULL ĐỒ, BAN CÔNG THOÁNG MÀ CHỈ NHỈNH 5X? 🔥\n📍 Vị trí: Ngay trục chính Cầu Giấy / Đống Đa - Thuận tiện di chuyển, ngõ nông dễ tìm.\n\n🌿 Trống sẵn 1 căn Studio duy nhất vừa setup xong, mới tinh tươm.\n🌿 Full đồ đạc y hình: Điều hòa, nóng lạnh, giường tủ, tủ lạnh, bệ bếp... Chỉ việc xách vali quần áo đến ở.\n🌿 Thang máy, cửa khóa vân tay, không chung chủ, giờ giấc thoải mái 24/7.\n🌿 Máy giặt chung sân phơi siêu rộng, ngập tràn ánh nắng.\n\n💬 Phòng đẹp giá sinh viên thường bay trong "1 nốt nhạc". Bác nào ưng bụng IB hoặc add Zalo em ngay để lấy video thực tế nhé!\n☎️ Zalo/Call: [SĐT Của Bạn]',
          },
          {
            id: "tmp-2",
            title: "Mẫu 2: Tầm Trung (8 - 12 triệu)",
            tags: "1N1K / Đi làm",
            tagColor: "bg-amber-100 text-amber-700",
            content:
              "💎 CĂN HỘ 1 NGỦ 1 KHÁCH RỘNG RÃI TẠI BA ĐÌNH 💎\n📍 Vị trí: Đội Cấn / Kim Mã - Đi làm trung tâm Ba Đình, Đống Đa siêu tiện.\n\n✨ Không gian sống lý tưởng cho cặp đôi hoặc người đi làm cần sự yên tĩnh, riêng tư:\n✔️ Thiết kế 1N1K tách biệt, phòng khách rộng rãi tha hồ tụ tập bạn bè cuối tuần.\n✔️ Cửa sổ lớn, ban công đón nắng gió tự nhiên, view cực thoáng.\n✔️ Nội thất cao cấp nhập khẩu: Smart TV, Tủ lạnh size lớn, Máy giặt riêng trong phòng.\n✔️ Dịch vụ tận răng: Dọn dẹp vệ sinh hàng tuần, an ninh camera 24/7.\n\n🔑 Khu vực dân trí cao, ô tô đỗ tận cổng. Chủ nhà cực kỳ dễ tính.\n📩 Inbox hoặc alo em ngay để qua xem trực tiếp (Hỗ trợ xem phòng miễn phí 24/7).\n☎️ Zalo/Call: [SĐT Của Bạn]",
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
                    step: "Bước 1",
                    desc: "Chọn phân khúc và 2-3 khu vực trọng điểm. Tránh làm lan man quá nhiều quận.",
                  },
                  {
                    step: "Bước 2",
                    desc: "Lọc ra 5-10 căn đẹp nhất, lưu thông tin qua chức năng Yêu Thích hoặc note trên máy cá nhân.",
                  },
                  {
                    step: "Bước 3",
                    desc: "Đăng tập trung các căn trong list này. Chỉ đổi nguồn khi phòng đã hết hoặc bài đăng không ra tương tác.",
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                2.2 Nuôi Nick & Đăng Tin Facebook
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                  <h3 className="font-bold text-gray-900 mb-4 text-xl">
                    Group Mục Tiêu
                  </h3>
                  <ul className="space-y-3 text-base text-gray-600 list-disc pl-5">
                    <li>Các nhóm thuê nhà có từ 40.000 thành viên trở lên.</li>
                    <li>
                      Đăng ít nhất 5 tin/ngày/tài khoản, rải vào hơn 20 group.
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                  <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                    <Clock size={22} className="text-amber-500" /> Khung Giờ
                    Vàng
                  </h3>
                  <ul className="space-y-3 text-base text-gray-600 list-disc pl-5">
                    <li>
                      <strong>Sáng:</strong> Từ 7h - 9h
                    </li>
                    <li>
                      <strong>Trưa:</strong> Từ 11h - 13h
                    </li>
                    <li>
                      <strong>Tối/Khuya:</strong> 17-19h, 20-22h, 23-24h
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="m2-mau-content">
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
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm relative group"
                  >
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-lg">
                        {tmp.title}
                      </span>
                      <div className="flex gap-3 items-center">
                        <span
                          className={cn(
                            "text-sm px-3 py-1.5 rounded-full font-bold",
                            tmp.tagColor,
                          )}
                        >
                          {tmp.tags}
                        </span>
                        <button
                          onClick={() => handleCopy(tmp.content, tmp.id)}
                          className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm"
                        >
                          {copiedId === tmp.id ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                          {copiedId === tmp.id ? "Đã chép" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 text-base text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                      {tmp.content}
                    </div>
                  </div>
                ))}
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
            className="animate-in fade-in duration-300 space-y-16"
          >
            <div id="m3-nguyen-tac">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <AlertTriangle size={28} />
                </span>
                Nguyên Tắc Cốt Lõi Khi Tư Vấn
              </h2>
              <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-r-2xl mb-6 text-red-900 shadow-sm text-lg">
                <h3 className="font-black text-xl mb-4">
                  Nguyên tắc sống còn:
                </h3>
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    Cung cấp 1 thông tin - Hỏi lại 1 câu để khai thác (Tài
                    chính, khu vực, thời gian chuyển, số người).
                  </li>
                  <li>Không tuôn 100% thông tin.</li>
                  <li>
                    <strong className="font-black">
                      TUYỆT ĐỐI KHÔNG gửi địa chỉ nhà cụ thể
                    </strong>{" "}
                    để tránh khách tự đi xem trực tiếp.
                  </li>
                </ul>
              </div>
            </div>

            <div id="m3-th1">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Tiếp Nhận Khách Hàng Ban Đầu
              </h2>
              <div className="grid gap-8">
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Phone size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">
                      Khách gọi điện trực tiếp
                    </h3>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                    <p className="text-blue-900 font-bold text-lg italic">
                      "Dạ anh/chị có đang sử dụng Zalo số này không ạ? Để em kết
                      bạn và gửi luôn thông tin, hình ảnh chi tiết qua Zalo cho
                      mình tiện xem nhé!"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="m3-th2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                TH1: Lọc tài chính khi khách chê đắt
              </h2>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Căn này có cao với ngân sách của anh/chị không?"
                  isUser={true}
                />
                <ChatBubble
                  sender="Khách Hàng"
                  text="Cao quá em ạ / Anh tìm tầm 6-7 triệu thôi."
                />
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Dạ, vậy ngân sách tối đa của mình là bao nhiêu và anh/chị ưu tiên ở những khu vực nào ạ để em lọc quỹ căn phù hợp gửi mình tham khảo nhé."
                  isUser={true}
                />
              </div>
            </div>

            <div id="m3-case-study">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <BookOpen size={28} />
                </span>
                Case Study Thực Chiến
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Thành công */}
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-100">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <h3 className="font-bold text-emerald-900 text-xl">
                      Ca chốt deal thành công
                    </h3>
                  </div>
                  <ChatBubble
                    sender="Khách"
                    text="Cho anh xin địa chỉ cụ thể qua xem"
                  />
                  <ChatBubble
                    sender="Sale"
                    text="Dạ nhà ở ngõ 68 Đội Cấn ạ. Mấy giờ anh rảnh qua xem để em nhắn quản lý qua mở cửa ạ?"
                    isUser={true}
                  />
                  <ChatBubble sender="Khách" text="Tầm 5h chiều nay anh qua" />
                  <ChatBubble
                    sender="Sale"
                    text="Dạ vâng, vậy anh lưu số em, khi nào đến đầu ngõ 68 anh alo em hướng dẫn vào nhé. SĐT em: 098x.xxx.xxx"
                    isUser={true}
                  />
                  <div className="mt-4 text-sm text-emerald-800 bg-emerald-100 p-4 rounded-xl">
                    <strong>Phân tích:</strong> Đưa địa chỉ ngõ chung chung,
                    không đưa số nhà. Cài cắm Call-to-action hẹn lịch và ép
                    khách phải lưu SĐT để liên lạc.
                  </div>
                </div>

                {/* Thất bại */}
                <div className="bg-red-50/50 p-6 rounded-3xl border border-red-200">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-100">
                    <AlertTriangle size={24} className="text-red-500" />
                    <h3 className="font-bold text-red-900 text-xl">
                      Ca mất khách đáng tiếc
                    </h3>
                  </div>
                  <ChatBubble sender="Khách" text="Căn này địa chỉ ở đâu em?" />
                  <ChatBubble
                    sender="Sale"
                    text="Dạ ở số nhà 15 ngách 2 ngõ 68 Đội Cấn anh nhé. Nhà cửa mở, anh cứ vào xem tầng 3 phòng 302 ạ."
                    isUser={true}
                    isFail={true}
                  />
                  <div className="mt-8 text-sm text-red-800 bg-red-100 p-4 rounded-xl">
                    <strong>Phân tích:</strong> Fail nặng. Gửi chi tiết cả số
                    nhà và số phòng. Khách sẽ tự đến xem, gặp chủ nhà trực tiếp
                    và ký hợp đồng lách qua Sale. Mất trắng hoa hồng.
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
          <div id="cheat-sheet" className="animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-4">
              <span className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
                <Zap size={32} />
              </span>
              Quy tắc khi tư vấn
            </h2>
            <p className="text-gray-500 mb-8 text-lg">
              Chụp ảnh màn hình phần này để tra cứu nhanh khi nhắn tin với
              khách.
            </p>

            <div className="bg-[#1a1a1a] text-white p-8 md:p-10 rounded-3xl shadow-xl">
              <h3 className="text-[#cda533] font-black text-2xl mb-6 uppercase tracking-widest text-center border-b border-gray-700 pb-4">
                Quy Tắc Sống Còn
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4 items-start">
                  <X className="text-red-500 mt-1 flex-shrink-0" />
                  <span className="font-bold">
                    KHÔNG gửi SỐ NHÀ cụ thể. Chỉ gửi tên đường/ngõ.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <X className="text-red-500 mt-1 flex-shrink-0" />
                  <span className="font-bold">
                    KHÔNG fix giá qua điện thoại/Zalo. Dẫn khách xem thực tế mới
                    ép giá.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <X className="text-red-500 mt-1 flex-shrink-0" />
                  <span className="font-bold">
                    KHÔNG dẫn đi xem nếu chưa có SĐT của khách.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <Check className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="font-bold">
                    LUÔN hỏi ngân sách & khu vực ngay từ đầu để lọc khách.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <Check className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="font-bold">
                    LUÔN hỏi Admin/Quản lý nếu không chắc chắn về thông tin
                    phòng.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );

      case "loi-gui-gam":
        return (
          <div id="loi-gui-gam" className="animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] text-white p-10 md:p-14 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#cda533] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-extrabold text-[#cda533] mb-8 leading-tight font-[Playfair display] tracking-wide">
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
                    "Đừng kỳ vọng quá nhiều để rồi thất vọng thật nhiều. Tỉ lệ trung bình là 10 người
                    hỏi -&gt; 1 người xem -&gt; 10 người xem -&gt; 1 người
                    chốt. Hãy tự đặt KPI doanh số cá nhân và nỗ lực đạt được."
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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-96px)] bg-[#f8fafc] text-gray-800 font-sans relative">
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden sticky top-0 z-[90] bg-white/95 backdrop-blur-md border-b border-gray-200 px-5 py-3.5 flex items-center justify-between shadow-sm">
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

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[50] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-white w-[75vw] sm:w-[280px] lg:w-[320px] z-[95] transform transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 lg:top-0 lg:h-screen lg:self-start shadow-[4px_0_24px_rgba(0,0,0,0.08)] flex flex-col border-r border-gray-200",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
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
      <main className="flex-1 overflow-y-auto bg-transparent p-5 md:p-8 lg:pt-8 lg:px-10 relative">
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
