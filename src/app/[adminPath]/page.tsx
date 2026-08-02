"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Activity, CalendarClock, UserCheck } from "lucide-react";

const PENDING_BOOKING_COLLECTIONS = [
  "ctv_bookings",
  "user_bookings",
  "guest_consultations",
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalApartments: 0,
    totalUsers: 0,
    pendingBookings: 0,
    pendingCtvRequests: 0,
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

        // Đếm tổng số lịch hẹn đang chờ duyệt trên cả 3 collection
        const pendingCounts = await Promise.all(
          PENDING_BOOKING_COLLECTIONS.map(async (name) => {
            const snap = await getCountFromServer(
              query(collection(db, name), where("status", "==", "pending")),
            );
            return snap.data().count;
          }),
        );

        // Đếm số CTV đang chờ duyệt
        const ctvRequestSnapshot = await getCountFromServer(
          query(usersCol, where("requestStatus", "==", "pending")),
        );

        setStats({
          totalApartments: aptSnapshot.data().count,
          totalUsers: usersSnapshot.data().count,
          pendingBookings: pendingCounts.reduce((sum, c) => sum + c, 0),
          pendingCtvRequests: ctvRequestSnapshot.data().count,
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

        {/* Thẻ Thống kê Lịch hẹn chờ duyệt */}
        <Card className="shadow-sm border-gray-100 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-gray-500">
              Lịch hẹn đang chờ duyệt
            </CardTitle>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">
              {stats.isLoading ? "..." : stats.pendingBookings}
            </div>
            <p className="text-xs text-orange-600 font-medium flex items-center mt-2">
              <Activity className="h-3 w-3 mr-1" />
              Cần Admin xử lý
            </p>
          </CardContent>
        </Card>

        {/* Thẻ Thống kê CTV chờ duyệt */}
        <Card className="shadow-sm border-gray-100 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-gray-500">
              CTV đang chờ duyệt
            </CardTitle>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">
              {stats.isLoading ? "..." : stats.pendingCtvRequests}
            </div>
            <p className="text-xs text-purple-600 font-medium flex items-center mt-2">
              <Activity className="h-3 w-3 mr-1" />
              Yêu cầu cần xét duyệt
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
