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
import { BedDouble, Building2, Users, TrendingUp, Activity, CalendarClock, UserCheck } from "lucide-react";

const PENDING_BOOKING_COLLECTIONS = [
  "ctv_bookings",
  "user_bookings",
  "guest_consultations",
];

async function safeCount(
  label: string,
  run: () => ReturnType<typeof getCountFromServer>,
): Promise<number> {
  try {
    const snap = await run();
    return snap.data().count;
  } catch (error) {
    console.error(
      `Admin dashboard count (${label}):`,
      error instanceof Error ? error.message : error,
    );
    return 0;
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalApartments: 0,
    totalUsers: 0,
    pendingBookings: 0,
    pendingCtvRequests: 0,
    pendingStayBookings: 0,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      const aptCol = collection(db, "apartments");
      const usersCol = collection(db, "users");

      const [
        totalApartments,
        totalUsers,
        pendingCounts,
        pendingCtvRequests,
        pendingStayBookings,
      ] = await Promise.all([
        safeCount("apartments", () => getCountFromServer(aptCol)),
        safeCount("users", () => getCountFromServer(usersCol)),
        Promise.all(
          PENDING_BOOKING_COLLECTIONS.map((name) =>
            safeCount(name, () =>
              getCountFromServer(
                query(collection(db, name), where("status", "==", "pending")),
              ),
            ),
          ),
        ),
        safeCount("ctv-requests", () =>
          getCountFromServer(
            query(usersCol, where("requestStatus", "==", "pending")),
          ),
        ),
        safeCount("stay_bookings", () =>
          getCountFromServer(
            query(
              collection(db, "stay_bookings"),
              where("status", "==", "pending"),
            ),
          ),
        ),
      ]);

      if (cancelled) return;
      setStats({
        totalApartments,
        totalUsers,
        pendingBookings: pendingCounts.reduce((sum, c) => sum + c, 0),
        pendingCtvRequests,
        pendingStayBookings,
        isLoading: false,
      });
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
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

        {/* Thẻ Thống kê Đặt phòng ngắn hạn chờ duyệt */}
        <Card className="shadow-sm border-gray-100 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-gray-500">
              Đặt phòng ngắn hạn chờ duyệt
            </CardTitle>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <BedDouble className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">
              {stats.isLoading ? "..." : stats.pendingStayBookings}
            </div>
            <p className="text-xs text-rose-600 font-medium flex items-center mt-2">
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
