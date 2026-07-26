"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalApartments: 0,
    totalUsers: 0,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Đếm tổng số căn hộ nhanh bằng getCountFromServer (không tốn nhiều reads)
        const aptCol = collection(db, "apartments");
        const aptSnapshot = await getCountFromServer(aptCol);

        // Đếm tổng số người dùng
        const usersCol = collection(db, "users");
        const usersSnapshot = await getCountFromServer(usersCol);

        setStats({
          totalApartments: aptSnapshot.data().count,
          totalUsers: usersSnapshot.data().count,
          isLoading: false,
        });
      } catch (error) {
        console.error("Lỗi lấy dữ liệu thống kê:", error);
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Tổng quan
        </h2>
        <p className="text-gray-500 mt-2">
          Báo cáo nhanh về hoạt động của hệ thống Hanoi Residences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Thẻ Thống kê Căn hộ */}
        <Card className="shadow-sm border-gray-100 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-gray-500">
              Tổng số căn hộ
            </CardTitle>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">
              {stats.isLoading ? "..." : stats.totalApartments}
            </div>
            <p className="text-xs text-green-600 font-medium flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Đang hoạt động
            </p>
          </CardContent>
        </Card>

        {/* Thẻ Thống kê Khách hàng */}
        <Card className="shadow-sm border-gray-100 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-gray-500">
              Tổng khách hàng
            </CardTitle>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">
              {stats.isLoading ? "..." : stats.totalUsers}
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center mt-2">
              <Activity className="h-3 w-3 mr-1" />
              Đã đăng ký tài khoản
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
