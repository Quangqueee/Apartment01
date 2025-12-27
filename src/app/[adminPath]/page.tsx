"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  BedDouble,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_PATH } from "@/lib/constants";

export default function AdminDashboard() {
  const menus = [
    {
      title: "Quản lý Căn hộ",
      desc: "Xem danh sách, chỉnh sửa, xóa và thêm mới căn hộ.",
      icon: Building2,
      href: `/${ADMIN_PATH}/apartments`,
      color: "bg-blue-500",
      bg: "bg-blue-50",
      active: true,
    },
    {
      title: "Quản lý Khách hàng",
      desc: "Xem thông tin người dùng, số điện thoại và nhu cầu.",
      icon: Users,
      href: `/${ADMIN_PATH}/users`,
      color: "bg-green-500",
      bg: "bg-green-50",
      active: true,
    },
    {
      title: "Quản lý Phòng trống",
      desc: "Theo dõi tình trạng phòng, lịch check-in/out.",
      icon: BedDouble,
      href: "#",
      color: "bg-orange-500",
      bg: "bg-orange-50",
      active: false, // Chưa làm
    },
    {
      title: "Hiệu quả Kinh doanh",
      desc: "Biểu đồ doanh thu, báo cáo tài chính hàng tháng.",
      icon: BarChart3,
      href: "#",
      color: "bg-purple-500",
      bg: "bg-purple-50",
      active: false, // Chưa làm
    },
    {
      title: "Phân quyền Nhân viên",
      desc: "Quản lý tài khoản admin, sale và phân quyền.",
      icon: ShieldCheck,
      href: "#",
      color: "bg-gray-600",
      bg: "bg-gray-100",
      active: false, // Chưa làm
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold text-gray-900">
          Tổng quan
        </h2>
        <p className="text-gray-500">
          Chọn một mục để bắt đầu quản lý hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu, idx) => (
          <Link
            key={idx}
            href={menu.href}
            className={`group ${
              !menu.active
                ? "opacity-60 cursor-not-allowed pointer-events-none"
                : ""
            }`}
          >
            <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 h-full overflow-hidden bg-white">
              <div className={`h-1.5 w-full ${menu.color}`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-2xl ${menu.bg} ${menu.color.replace(
                      "bg-",
                      "text-"
                    )}`}
                  >
                    <menu.icon size={28} />
                  </div>
                  {menu.active ? (
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#cda533] group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-400 px-2 py-1 rounded">
                      Sắp ra mắt
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {menu.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {menu.desc}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
