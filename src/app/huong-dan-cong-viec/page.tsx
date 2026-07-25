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
  FileSignature,
  Sofa,
  MapPin,
  Users2,
  Percent,
  UserPlus,
  LogIn,
  MonitorSmartphone,
  ArrowRight,
  Car,
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
    id: "module-1",
    title: "Module 1: Đọc Bảng Hàng",
    type: "folder",
    icon: LayoutList,
    children: [
      { id: "m1-bang-gia", title: "1.1 Bảng Giá Sàn", type: "doc" },
      { id: "m1-tu-khoa", title: "1.2 Cách Đọc Từ Khóa", type: "doc" },
      { id: "m1-hoa-hong", title: "1.3 Cơ Chế Hoa Hồng", type: "doc" },
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
    title: "Module 5: Tâm Lý & Lời Kết",
    type: "doc",
    icon: HeartHandshake,
  },
];

export default function SOPDocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string>("tam-nhin");
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({
    "module-1": false,
  });

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

  // Logic Accordion: Khi mở 1 folder mới, tự động đóng các folder cũ
  const handleNavClick = (node: DocNode, parentId: string | null = null) => {
    if (node.type === "folder") {
      setExpandedFolders((prev) => {
        const isCurrentlyExpanded = prev[node.id];
        // Đóng hết tất cả, chỉ mở folder vừa click (nếu nó đang đóng)
        return isCurrentlyExpanded ? {} : { [node.id]: true };
      });
      setActiveModule(node.id);
      setTimeout(() => scrollToSection(node.id), 100);
    } else if (parentId) {
      // Đảm bảo parent của mục con đang click luôn mở
      setExpandedFolders({ [parentId]: true });
      setActiveModule(parentId);
      setTimeout(() => scrollToSection(node.id), 100);
    } else {
      // Click vào mục độc lập -> Đóng hết tất cả folder
      setExpandedFolders({});
      setActiveModule(node.id);
      setTimeout(() => scrollToSection(node.id), 100);
    }
  };

  const ChatBubble = ({
    sender,
    text,
    isUser = false,
  }: {
    sender: string;
    text: string;
    isUser?: boolean;
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
            ? "bg-[#cda533] text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm",
        )}
      >
        <p className="text-sm font-bold opacity-80 mb-2">{sender}</p>
        <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );

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
                    tâm. Chúng ta không chỉ thiết lập chuẩn mực sống mới tại các
                    khu vực trọng điểm như Tây Hồ, Ba Đình... mà còn liên tục mở
                    rộng và đánh chiếm thị phần trên đa dạng các phân khúc căn
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
              {/* Bước 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white bg-blue-600 text-white font-bold text-xl shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  1
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-xl mb-2 flex items-center gap-2">
                    <LogIn size={20} className="text-blue-500" /> Tạo Tài Khoản
                  </h3>
                  <p className="text-gray-600 text-base">
                    Click vào nút{" "}
                    <strong className="text-gray-900">
                      Đăng Nhập / Đăng Ký
                    </strong>{" "}
                    ở góc phải màn hình. Bạn có thể sử dụng trực tiếp tài khoản
                    Google / Gmail của mình để tạo tài khoản trong 3 giây.
                  </p>
                </div>
              </div>

              {/* Bước 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white bg-[#cda533] text-white font-bold text-xl shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  2
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-xl mb-2 flex items-center gap-2">
                    <MonitorSmartphone size={20} className="text-[#cda533]" />{" "}
                    Truy Cập Trang Cá Nhân
                  </h3>
                  <p className="text-gray-600 text-base mb-3">
                    Sau khi đăng nhập thành công, hãy truy cập vào khu vực quản
                    lý cá nhân:
                  </p>
                  <ul className="space-y-3 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                    <li className="flex items-start gap-2">
                      <Smartphone
                        size={18}
                        className="text-gray-500 mt-0.5 flex-shrink-0"
                      />
                      <span>
                        <strong className="text-gray-900">
                          Trên Điện thoại:
                        </strong>{" "}
                        Nhìn xuống thanh công cụ nằm dưới cùng màn hình {`->`}{" "}
                        Chọn tab <strong>Tài Khoản</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MonitorSmartphone
                        size={18}
                        className="text-gray-500 mt-0.5 flex-shrink-0"
                      />
                      <span>
                        <strong className="text-gray-900">
                          Trên Máy tính:
                        </strong>{" "}
                        Click vào Avatar/Tên của bạn ở góc phải trên cùng {`->`}{" "}
                        Chọn <strong>Tài Khoản</strong>.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white bg-emerald-600 text-white font-bold text-xl shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  3
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-xl mb-2 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-500" /> Gửi
                    Yêu Cầu Chờ Duyệt
                  </h3>
                  <p className="text-gray-600 text-base">
                    Tại giao diện Tài khoản, kéo xuống và click vào nút{" "}
                    <strong className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      Đăng ký làm CTV
                    </strong>
                    .
                  </p>
                  <p className="text-gray-600 text-base mt-2">
                    Yêu cầu của bạn sẽ được gửi tới Ban Quản Trị. Ngay sau khi
                    được phê duyệt, hệ thống sẽ tự động mở khóa toàn bộ các tính
                    năng nội bộ cho tài khoản của bạn!
                  </p>
                </div>
              </div>
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
              {/* Thêm overflow-x-auto để cho phép vuốt ngang trên màn hình nhỏ */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-x-auto text-base md:text-lg custom-scrollbar">
                {/* Đặt min-w-[600px] để bảng không bao giờ bị ép nhỏ làm méo chữ */}
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
                        2 - 3 người (2 Người lớn, 1 Trẻ em)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                      <td className="px-5 py-5 md:px-6 md:py-6 font-bold text-gray-900 flex items-center gap-3 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></div>{" "}
                        1N1K (1 Ngủ 1 Khách)
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-700 font-medium whitespace-nowrap">
                        Từ 6 Triệu
                      </td>
                      <td className="px-5 py-5 md:px-6 md:py-6 text-gray-600 whitespace-nowrap">
                        2 - 3 người (2 Người lớn, 1 Trẻ em)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-5 md:px-6 md:py-6 font-bold text-gray-900 flex items-center gap-3 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0"></div>{" "}
                        2N1K (2 Ngủ 1 Khách)
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
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-5">
                    DV
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">
                    Dịch Vụ
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Nếu phòng ghi "Free DV" là không thu phí dịch vụ. Nếu chỉ
                    ghi phí DV mà không nhắc đến tiền nước, ngầm hiểu phí DV đã
                    bao gồm nước sinh hoạt.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Zap size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-xl">
                      Phương thức thanh toán
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                      Nếu không ghi phương thức (VD: cọc 1 thanh toán 3), hệ
                      thống sẽ mặc định là thanh toán 1 cọc 1.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="m1-hoa-hong">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Percent size={28} />
                </span>
                1.3 Đọc Hoa Hồng & Cơ Chế Thu Nhập
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
                      Nghĩa là khi khách ký hợp đồng 1 năm, doanh số tính cho
                      giao dịch là 50% tiền thuê 1 tháng.
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
                    * Lưu ý: Phần trăm trên tin đăng là "Doanh số của Deal",
                    KHÔNG PHẢI là số tiền thực nhận về tay bạn.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">
                    CƠ CHẾ HOA HỒNG THỰC NHẬN
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Smartphone className="text-amber-500" /> Hệ Cộng Tác
                        Viên (Online)
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
                            CTV (Chuyên viên), doanh số tích lũy &gt; 15 Triệu:
                          </span>
                          <span className="font-bold text-xl text-gray-900 bg-amber-100 text-amber-700 px-3 py-1 rounded-lg border border-amber-200 shadow-sm">
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

                  <div className="mt-6 text-center p-4 bg-gray-100 rounded-xl">
                    <p className="text-base text-gray-700 font-medium">
                      Công thức tính tiền về túi:{""}
                      <strong className="text-black px-2 py-1 rounded ml-1">
                        Tiền phòng x % Deal (Tin đăng) x Cơ chế
                      </strong>
                    </p>
                    
                  </div>
                  <div className="mt-6 text-center p-4 bg-gray-100 rounded-xl">
                    <p className="text-base text-gray-700 font-medium">
                      Ví dụ:{""}
                      <strong className="text-black px-2 py-1 rounded ml-1">
                        Tiền phòng 10tr x % Deal (50%) x Cơ chế (50%) = 2.5tr
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "module-2":
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
                  <strong>Lưu ý quan trọng:</strong> Với các bạn mới, nên ưu
                  tiên chọn phòng phân khúc 8-12 triệu vì phòng đẹp (sáng,
                  thoáng) luôn dễ hút khách hơn phòng rẻ mà xấu.
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
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-md">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2 text-xl">
                        {item.step}
                      </h3>
                      <p className="text-gray-600 text-base leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="m2-nuoi-nick">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                2.2 Nuôi Nick & Đăng Tin Facebook
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                Facebook mang lại 90% doanh số. Đăng bài đều đặn hàng ngày là
                bắt buộc để nuôi tương tác.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#cda533] transition-colors">
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                  <h3 className="font-bold text-gray-900 mb-4 text-xl">
                    Group Mục Tiêu
                  </h3>
                  <ul className="space-y-3 text-base text-gray-600 list-disc pl-5">
                    <li>Các nhóm thuê nhà có từ 40.000 thành viên trở lên.</li>
                    <li>
                      Đăng ít nhất 5 tin/ngày/tài khoản, mỗi tin rải vào hơn 20
                      group.
                    </li>
                    <li>Bận thì đăng lúc rảnh, rảnh là phải đăng.</li>
                  </ul>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#cda533] transition-colors">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                  <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                    <Clock size={22} className="text-amber-500" /> Khung Giờ
                    Vàng
                  </h3>
                  <ul className="space-y-3 text-base text-gray-600 list-disc pl-5">
                    <li>
                      <strong>Sáng:</strong> Từ 7h - 9h đổ đi.
                    </li>
                    <li>
                      <strong>Trưa:</strong> Từ 11h - 13h (giờ dân văn phòng
                      nghỉ).
                    </li>
                    <li>
                      <strong>Chiều/Tối:</strong> 17h - 19h và 20h - 22h.
                    </li>
                    <li>
                      <strong>Khuya:</strong> 23h - 24h.
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden md:col-span-2 group hover:border-red-500 transition-colors">
                  <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                  <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-2">
                    <AlertTriangle size={22} className="text-red-500" /> Mẹo
                    Hình Ảnh & Kỹ Năng
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-base text-gray-600">
                    <ul className="space-y-3 list-disc pl-5">
                      <li>
                        Chọn 4-5 ảnh đẹp nhất đăng lên đầu (phòng khách, view
                        thoáng, ban công).
                      </li>
                      <li>
                        <strong className="text-red-600">
                          TUYỆT ĐỐI không đăng ảnh WC
                        </strong>{" "}
                        lên đầu trừ khi quá thiếu ảnh.
                      </li>
                      <li>
                        Với phòng giá &gt;7 triệu, không public giá trực tiếp
                        lên bài.
                      </li>
                    </ul>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="font-bold text-gray-900 mb-2">
                        Kỹ năng mềm:
                      </p>
                      <p>
                        Đọc kỹ thông tin nhà trước khi đăng để khách gọi còn
                        biết đường trả lời. Quên thì báo khách:{" "}
                        <em>"Bạn check Zalo mình gửi chi tiết nhé."</em>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="m2-cong-thuc">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                2.3 Công Thức Viết Content Chuẩn
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                Một bài đăng hiệu quả luôn phải có 4 phần rõ ràng, xuống dòng
                thoáng mắt, sử dụng icon vừa đủ để nhấn mạnh.
              </p>
              <div className="space-y-5">
                {[
                  {
                    num: "1",
                    title: "Tiêu đề (Headline)",
                    desc: "Viết IN HOA, dùng icon nổi bật. Phải có 'Từ khóa mồi' (Gần trung tâm, View chill, Full đồ, Mới tinh, Ở luôn...). Tuyệt đối không đưa giá cụ thể nếu phòng trên 7 triệu để kích thích inbox.",
                  },
                  {
                    num: "2",
                    title: "Vị trí & Thông số",
                    desc: "Ghi chung chung (ví dụ: Đầu ngõ Đội Cấn, Cực gần Lotte, Ngay mặt phố Tô Ngọc Vân...).",
                  },
                  {
                    num: "3",
                    title: "Tiện ích nổi bật (Body)",
                    desc: "Chỉ liệt kê các 'điểm ăn tiền' (Ban công rộng, máy giặt sấy riêng, free phí dịch vụ, giờ giấc tự do).",
                  },
                  {
                    num: "4",
                    title: "Call to Action (CTA)",
                    desc: "Giục khách inbox/zalo ngay vì 'phòng đẹp bay nhanh'.",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-5 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-[#cda533]/10 text-[#cda533] rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-xl">
                      {step.num}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2 text-xl">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-base leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="m2-mau-content">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Smartphone size={28} />
                </span>
                2.4 Thư Viện Content Mẫu
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {/* Mẫu 1 */}
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg">
                      📌 Mẫu 1: Phân khúc Cơ bản (5 - 6 triệu)
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">
                      Studio / Gen Z
                    </span>
                  </div>
                  <div className="p-6 text-base text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                    <strong className="text-black text-lg">
                      🔥 TÌM ĐÂU RA STUDIO FULL ĐỒ, BAN CÔNG THOÁNG MÀ CHỈ NHỈNH
                      5X? 🔥
                    </strong>
                    {"\n"}
                    📍 Vị trí: Ngay trục chính Cầu Giấy / Đống Đa - Thuận tiện
                    di chuyển, ngõ nông dễ tìm.{"\n\n"}
                    🌿 Trống sẵn 1 căn Studio duy nhất vừa setup xong, mới tinh
                    tươm.{"\n"}
                    🌿 Full đồ đạc y hình: Điều hòa, nóng lạnh, giường tủ, tủ
                    lạnh, bệ bếp... Chỉ việc xách vali quần áo đến ở.{"\n"}
                    🌿 Thang máy, cửa khóa vân tay, không chung chủ, giờ giấc
                    thoải mái 24/7.{"\n"}
                    🌿 Máy giặt chung sân phơi siêu rộng, ngập tràn ánh nắng.
                    {"\n\n"}
                    💬 Phòng đẹp giá sinh viên thường bay trong "1 nốt nhạc".
                    Bác nào ưng bụng IB hoặc add Zalo em ngay để lấy video thực
                    tế nhé!{"\n"}
                    ☎️ Zalo/Call: [SĐT Của Bạn]
                  </div>
                </div>

                {/* Mẫu 2 */}
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg">
                      📌 Mẫu 2: Phân khúc Tầm Trung (8 - 12 triệu)
                    </span>
                    <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold">
                      1N1K / Người đi làm
                    </span>
                  </div>
                  <div className="p-6 text-base text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                    <strong className="text-black text-lg">
                      💎 CĂN HỘ 1 NGỦ 1 KHÁCH RỘNG RÃI TẠI BA ĐÌNH 💎
                    </strong>
                    {"\n"}
                    📍 Vị trí: Đội Cấn / Kim Mã - Đi làm trung tâm Ba Đình, Đống
                    Đa siêu tiện.{"\n\n"}✨ Không gian sống lý tưởng cho cặp đôi
                    hoặc người đi làm cần sự yên tĩnh, riêng tư:{"\n"}
                    ✔️ Thiết kế 1N1K tách biệt, phòng khách rộng rãi tha hồ tụ
                    tập bạn bè cuối tuần.{"\n"}
                    ✔️ Cửa sổ lớn, ban công đón nắng gió tự nhiên, view cực
                    thoáng.{"\n"}
                    ✔️ Nội thất cao cấp nhập khẩu: Smart TV, Tủ lạnh size lớn,
                    Máy giặt riêng trong phòng.{"\n"}
                    ✔️ Dịch vụ tận răng: Dọn dẹp vệ sinh hàng tuần, an ninh
                    camera 24/7.{"\n\n"}
                    🔑 Khu vực dân trí cao, ô tô đỗ tận cổng. Chủ nhà cực kỳ dễ
                    tính.{"\n"}
                    📩 Inbox hoặc alo em ngay để qua xem trực tiếp (Hỗ trợ xem
                    phòng miễn phí 24/7).{"\n"}
                    ☎️ Zalo/Call: [SĐT Của Bạn]
                  </div>
                </div>

                {/* Mẫu 3 */}
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg">
                      📌 Mẫu 3: Phân khúc Cao Cấp
                    </span>
                    <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold">
                      Tây Hồ / Chuyên gia
                    </span>
                  </div>
                  <div className="p-6 text-base text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                    <strong className="text-black text-lg">
                      ✨ CHUẨN MỰC SỐNG THƯỢNG LƯU: CĂN HỘ CAO CẤP VIEW HỒ TÂY
                      ✨
                    </strong>
                    {"\n"}
                    📍 Vị trí đắc địa: Nằm trên phố Nghi Tàm / Tô Ngọc Vân - Khu
                    vực an ninh, văn minh bậc nhất Tây Hồ.{"\n\n"}
                    Thức dậy với bầu không khí trong lành và ngắm trọn vẹn Hồ
                    Tây từ ban công nhà bạn. Căn hộ lý tưởng dành cho các chuyên
                    gia hoặc khách hàng yêu thích không gian sống đẳng cấp:
                    {"\n"}
                    ▫️ Diện tích 65m2, thiết kế tối giản, hiện đại và ngập tràn
                    ánh sáng.{"\n"}
                    ▫️ Không gian bếp mở cực chill, trang bị đầy đủ Lò vi sóng,
                    Hút mùi, Bếp từ âm chuẩn Âu.{"\n"}
                    ▫️ Khu vực yên tĩnh, xung quanh đầy đủ tiện ích: Nhà hàng
                    Âu, Quán cafe chill, Siêu thị đồ ngoại, Gym & Pool...{"\n"}
                    ▫️ Giá thuê đã bao gồm các dịch vụ chăm sóc cao cấp
                    (Internet tốc độ cao, Dọn phòng định kỳ).{"\n\n"}
                    🗝️ Căn hộ hiện đang trống và sẵn sàng đón khách.
                    {"\n"}
                    📲 Quý khách quan tâm vui lòng Inbox trực tiếp hoặc liên hệ
                    Hotline để được tư vấn và sắp xếp lịch xem nhà Private.
                    {"\n"}
                    ☎️ Zalo/Call: [SĐT Của Bạn]
                  </div>
                </div>
              </div>
            </div>

            <div id="m2-prompt-ai">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-4">
                <span className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Terminal size={28} />
                </span>
                2.5 Bộ Câu Lệnh Prompt AI
              </h2>
              <p className="text-gray-500 mb-8 text-lg italic">
                Copy đoạn lệnh dưới đây, dán vào ChatGPT/Gemini, thay đổi phần
                chữ trong ngoặc vuông [...] bằng thông tin thực tế để tạo bài
                viết tự động.
              </p>
              <div className="space-y-6">
                {[
                  {
                    title: "Lệnh 1: Phân khúc Căn bản (Sinh viên, Gen Z)",
                    prompt:
                      "Đóng vai một chuyên viên môi giới bất động sản trẻ trung, năng động. Hãy viết một bài đăng Facebook bán phòng trọ Studio cho tệp khách hàng Gen Z, sinh viên sinh năm 2000-2005.\nThông tin phòng: Khu vực [nhập vị trí, VD: ngõ Đội Cấn], nhập thiết kế [diện tích, dạng phòng], giá [nhập giá, VD: 5.5 triệu], tiện ích [nhập tiện ích, VD: full đồ, máy giặt chung, không chung chủ, giờ giấc tự do].\nYêu cầu: Văn phong hài hước, năng lượng, bắt trend mạng xã hội hiện tại, câu văn ngắn gọn, xuống dòng rõ ràng và có sử dụng emoji phù hợp. Tiêu đề viết hoa, giật tít. Kết bài có lời kêu gọi khách inbox/Zalo ngay để đi xem phòng. Tuyệt đối không để lộ địa chỉ số nhà cụ thể.",
                  },
                  {
                    title:
                      "Lệnh 2: Phân khúc Tầm trung (Người đi làm, Cặp đôi)",
                    prompt:
                      'Đóng vai một chuyên viên cho thuê căn hộ dịch vụ chuyên nghiệp của Hanoi Residences. Hãy viết một content đăng Facebook giới thiệu căn hộ [nhập loại phòng, VD: 1 Khách 1 Ngủ / 2 Ngủ 1 Khách] tại [nhập khu vực, VD: Lotte Liễu Giai, Ba Đình].\nKhách hàng mục tiêu là dân văn phòng, người đi làm có thu nhập ổn định cần không gian yên tĩnh, tiện nghi sau giờ làm.\nThông tin nhấn mạnh: [nhập các điểm nhấn, VD: phòng khách rộng tách biệt bếp, ban công nhiều ánh sáng tự nhiên, dọn dẹp vệ sinh tuần 1 lần, an ninh tốt].\nYêu cầu: Văn phong lịch sự, đáng tin cậy, làm nổi bật giá trị và "trải nghiệm sống". Dùng list (gạch đầu dòng) cho phần tiện ích để khách dễ đọc. Thêm Call to Action thúc đẩy khách đặt lịch đi xem sớm vì phòng đẹp nhanh hết.',
                  },
                  {
                    title: "Lệnh 3: Phân khúc Cao cấp (Khách Tây, Chuyên gia)",
                    prompt:
                      "Đóng vai một chuyên gia tư vấn bất động sản hạng sang. Hãy viết một bài quảng cáo căn hộ dịch vụ cao cấp tại [nhập khu vực, VD: Tô Ngọc Vân, Nghi Tàm - Tây Hồ].\nĐối tượng khách hàng là chuyên gia nước ngoài, quản lý cấp cao hoặc những người có mức sống cao.\nĐặc điểm căn hộ: [nhập tiện ích, VD: View nhìn thẳng ra Hồ Tây, không gian mở, nội thất nhập khẩu chuẩn Âu, bãi đỗ ô tô, an ninh 24/7].\nYêu cầu: Ngôn từ sang trọng, tinh tế, sử dụng các từ khóa như 'chuẩn mực sống thượng lưu', 'đẳng cấp', 'không gian tĩnh tại'. Không đưa giá tiền cụ thể vào bài để kích thích khách hàng nhắn tin riêng. Trình bày thoáng, chuyên nghiệp.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl overflow-hidden shadow-sm border border-gray-800"
                  >
                    <div className="bg-gray-900 px-5 py-3 flex items-center justify-between border-b border-gray-700">
                      <span className="text-gray-300 text-sm font-mono font-bold">
                        {item.title}
                      </span>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-6 text-gray-300 font-mono text-base whitespace-pre-wrap leading-relaxed">
                      {item.prompt}
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
              <p className="text-gray-500 mb-8 text-lg">
                Khi khách liên hệ, bạn cần xác định ngay 3 thông tin quan trọng:
                ngân sách, khu vực và số lượng người ở. Dựa vào đó, bạn sẽ lọc
                ra những căn phù hợp và tư vấn chính xác hơn.
              </p>

              <div className="grid gap-8">
                {/* Khách gọi điện */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Phone size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">
                      Khách gọi điện trực tiếp
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base mb-5">
                    Nếu bạn đang đi đường hoặc không nhớ chính xác thông tin
                    phòng khách hỏi, hãy xử lý khéo léo:
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                    <p className="text-blue-900 font-bold text-lg italic">
                      "Dạ anh/chị có đang sử dụng Zalo số này không ạ? Để em kết
                      bạn và gửi luôn thông tin, hình ảnh chi tiết qua Zalo cho
                      mình tiện xem nhé!"
                    </p>
                  </div>
                </div>

                {/* Khách comment */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                      <MessageSquare size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">
                      Khách comment trên bài viết
                    </h3>
                  </div>
                  <div className="space-y-4 text-base">
                    <div className="flex gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center font-black shadow-sm border border-gray-200 flex-shrink-0">
                        1
                      </div>
                      <div className="pt-2">
                        <p className="text-gray-800">
                          Chụp màn hình căn phòng đó lại (để sau này xem lại,
                          biết khách đang hỏi căn nào).
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center font-black shadow-sm border border-gray-200 flex-shrink-0">
                        2
                      </div>
                      <div className="pt-2">
                        <p className="text-gray-800">
                          Reply comment: "Bạn check inbox mình nhé."
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-5 p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm border-l-4 border-l-[#cda533]">
                      <div className="w-10 h-10 bg-[#cda533] text-white rounded-full flex items-center justify-center font-black flex-shrink-0">
                        3
                      </div>
                      <div className="pt-2">
                        <p className="text-amber-900 font-bold">
                          Gửi inbox: KHÔNG gửi giá ngay. Đợi khách rep rồi mới
                          rải thông tin.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="m3-th2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                TH1: Báo giá xong khách chê đắt hoặc im lặng
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                Mục đích: Lọc tài chính khách hàng ngay từ đầu để tránh mất thời
                gian.
              </p>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Căn này có cao với ngân sách của anh/chị không? (hoặc) Căn này có phù hợp nhu cầu mình không?"
                  isUser={true}
                />
                <ChatBubble
                  sender="Khách Hàng"
                  text="Cao quá em ạ / Anh tìm tầm 6-7 triệu thôi."
                />
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Dạ, vậy ngân sách tối đa của mình là bao nhiêu"
                  isUser={true}
                />
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Và anh có thể ở những khu vực nào ạ, em có quỹ căn từ trung - cao quanh khu vực Hà Nội"
                  isUser={true}
                />
                <div className="mt-8 flex items-start gap-3 text-base text-amber-800 bg-amber-100/50 p-5 rounded-xl border border-amber-200 font-medium">
                  <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Lưu ý:</strong> Nếu ngân sách khách đưa ra thấp hơn
                    giá sàn hệ thống -&gt; từ chối khéo léo, bỏ qua tìm khách
                    khác tránh mất thời gian.
                  </p>
                </div>
              </div>
            </div>

            <div id="m3-th3">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                TH2: Khách hẹn đi xem nhưng thời gian chuyển quá xa
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                VD: Hôm nay là đầu tháng, nhưng đến giữa tháng sau khách mới cần
                chuyển. (Thường chủ nhà chỉ giữ cọc 7-10 ngày, tối đa 15 ngày).
              </p>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Anh chị ơi, nếu cuối tháng mình mới chuyển thì giờ đi xem hơi sớm. Chủ nhà ưu tiên khách vào luôn hoặc giữ tầm 10 ngày thôi. Em xin phép lưu số, gần ngày em liên hệ gửi list căn trống lúc đó nhé!"
                  isUser={true}
                />
              </div>
            </div>

            <div id="m3-th4">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                TH3: Quy trình Hẹn Đi Xem (Chốt Lịch)
              </h2>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 mb-8">
                <h3 className="font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4 text-xl">
                  Kịch bản chốt lịch:
                </h3>
                <ChatBubble sender="Khách Hàng" text="Mai anh qua xem nhé." />
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Mai anh tiện qua lúc 9-10h sáng hay 3-4h chiều ạ? (Gợi ý thời gian cụ thể cho khách)"
                  isUser={true}
                />
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Hoặc tạo khan hiếm: Mấy giờ anh tan làm, qua xem luôn đi. Xem sớm nhiều lựa chọn, chứ để sát ngày hay lỡ phòng ưng ý lắm."
                  isUser={true}
                />
                <ChatBubble
                  sender="Sale (Bạn)"
                  text="Nếu khách không cho số: Anh/chị lưu số em nhé, trước khi qua 1-2 tiếng alo em mở cửa."
                  isUser={true}
                />
              </div>
              <div className="mt-8 mb-6 flex items-start gap-3 text-base text-amber-800 bg-amber-100/50 p-5 rounded-xl border border-amber-200 font-medium">
                <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Lưu ý:</strong> Nếu khách đưa ra thời gian chung chung
                  -&gt; gợi ý cụ thể để khách dễ chọn. Nếu gợi ý xin SĐT mà
                  khách <strong className="text-red-600">không cho.</strong>{" "}
                  -&gt; Hãy gửi số của mình hoặc của Leader và nhắn:{" "}
                  <span className="font-bold text-amber-900 italic">
                    "Anh/chị lưu số em nhé, gọi em trước khoảng 1 - 2 tiếng em
                    chuẩn bị. cửa."
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4 p-5 bg-red-50 text-red-700 rounded-2xl border border-red-200 font-bold text-lg">
                <CheckCircle2 size={24} />
                Quy tắc: BẮT BUỘC PHẢI XIN ĐƯỢC SĐT mới dẫn khách đi xem nhà.
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
          <div
            id="module-4"
            className="animate-in fade-in duration-300 space-y-16"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 flex items-center gap-4">
                <span className="p-3 bg-[#cda533]/20 text-[#cda533] rounded-2xl shadow-sm">
                  <HelpCircle size={32} />
                </span>
                Module 4: Các câu hỏi thường gặp (FAQ) khi tư vấn khách hàng
              </h2>
              <div className="space-y-12">
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
          </div>
        );
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
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 flex items-center gap-4">
              <span className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                <HeartHandshake size={32} />
              </span>
              5: Lời Kết
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
                  <MessageCircle size={22} className="text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Không ưng, nhắn tin không trả lời
                </h3>
                <p className="text-base text-gray-600">
                  Bỏ qua, tìm khách mới cho đỡ mệt mỏi.
                </p>
              </div>

              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                  <FileText size={22} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">
                  Không ưng, nhưng vẫn liên lạc
                </h3>
                <p className="text-base text-gray-600">
                  Đề nghị gửi thêm option khác.
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
                  Báo quản lý để xin chủ nhà hỗ trợ chốt deal.
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
                  Chúc mừng khách. Dặn dò nếu có bạn bè cần thuê thì giới thiệu.
                </p>
              </div>
            </div>

            {/* PHẦN LỜI KẾT TRUYỀN CẢM HỨNG */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-[#1a1a1a] text-white p-10 md:p-14 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#cda533] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full -ml-20 -mb-20 blur-3xl"></div>

              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-extrabold text-[#cda533] mb-8 leading-tight">
                  Lời Gửi Gắm Từ <br className="hidden md:block" /> Ban Quản Trị
                  Hanoi Residences
                </h3>

                <div className="space-y-6 text-gray-300 text-lg leading-relaxed mb-12">
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
                    <em>
                      "Mình đã đăng đủ số lượng tin yêu cầu mỗi ngày chưa? Hình
                      ảnh mình chọn đã nét chưa? Content có bị nhàm chán không?"
                    </em>
                  </p>

                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 mt-8 shadow-lg">
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

                <div className="border-t border-gray-700/80 pt-10 text-center">
                  <p className="font-medium text-xl md:text-2xl italic leading-relaxed text-gray-200">
                    "Đừng kỳ vọng quá nhiều để rồi tụt mood. Tỉ lệ là 10 người
                    hỏi -&gt; 1 người xem -&gt; 10 người xem -&gt; 1-2 người
                    chốt. Hãy tự đặt KPI doanh số tháng và nỗ lực đạt được."
                  </p>
                  <p className="mt-8 font-black text-[#cda533] uppercase tracking-[0.2em] text-2xl">
                    Chúc các bạn bùng nổ doanh số!
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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-96px)] bg-[#f8fafc] text-gray-800 font-sans">
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

      {/* SIDEBAR NAVIGATION - TREE VIEW (Responsive) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-white w-[75vw] sm:w-[280px] lg:w-[320px] z-[95] transform transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 lg:top-0 lg:h-screen lg:self-start shadow-[4px_0_24px_rgba(0,0,0,0.08)] flex flex-col border-r border-gray-200",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex p-5 lg:p-6 border-b border-gray-100 items-start justify-between bg-gray-50/50">
          <div>
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
              Tài liệu nội bộ
            </h2>
            <p className="font-black text-gray-900 text-lg">SOP Đào Tạo Sale</p>
          </div>
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
                    "flex items-center gap-2.5 w-full text-left px-3 py-3 rounded-xl text-[15px] font-bold transition-all group",
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
                  <span className="flex-1 whitespace-normal leading-snug">
                    {node.title}
                  </span>
                </button>

                {/* Children Nodes */}
                {isFolder && isExpanded && node.children && (
                  <div className="ml-8 mt-1.5 mb-2 space-y-1 border-l-2 border-gray-100 pl-3">
                    {node.children.map((child) => {
                      return (
                        <button
                          key={child.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavClick(child, node.id);
                          }}
                          className="flex items-start gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-all text-gray-500 hover:bg-gray-50 hover:text-[#cda533] font-semibold"
                        >
                          <FileText
                            size={15}
                            className="text-gray-300 flex-shrink-0 mt-0.5"
                          />
                          <span className="flex-1 whitespace-normal leading-snug">
                            {child.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-transparent p-5 md:p-8 lg:pt-8 lg:px-10">
        {/* Đã thêm mx-auto để nội dung luôn ra giữa */}
        <div className="max-w-5xl mx-auto pb-24">{renderContent()}</div>
      </main>
    </div>
  );
}
