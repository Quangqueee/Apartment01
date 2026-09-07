"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Loader2,
  ExternalLink,
  CalendarDays,
  ArrowLeft,
  MessageSquareText,
  FileText,
  Edit3,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import StayBookingsList from "@/components/stay-bookings-list";
import { cn } from "@/lib/utils";
import { SHORT_TERM_PUBLIC_ACCESS } from "@/lib/constants";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  _collection?: string;
  apartmentCode?: string;
  apartmentLink?: string;
  clientName?: string;
  clientPhone?: string;
  consultationPrice?: string;
  name?: string;
  phone?: string;
  budget?: string;
  dateTime?: string;
  notes?: string;
  adminNotes?: string;
  status: string;
  createdAt?: Timestamp;
  updatedAt?: any;
  [key: string]: any;
}

export default function BookingsManagementPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const role = userData?.role;
  const isCollaborator = role === "collaborator" || role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tab: lịch xem nhà (mặc định) / đặt phòng ngắn hạn (?tab=stay)
  const [viewTab, setViewTab] = useState<"viewing" | "stay">("viewing");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "stay" && SHORT_TERM_PUBLIC_ACCESS) setViewTab("stay");
  }, []);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    clientName: "",
    clientPhone: "",
    consultationPrice: "",
    name: "",
    phone: "",
    budget: "",
    bookingDate: "",
    bookingTime: "",
    notes: "",
  });

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchBookings = async () => {
      try {
        let fetchedData: Booking[] = [];

        if (role === "admin") {
          const q1 = query(
            collection(db, "user_bookings"),
            where("createdByAdminId", "==", user.uid),
          );
          const snap1 = await getDocs(q1);
          snap1.docs.forEach((doc) =>
            fetchedData.push({
              id: doc.id,
              _collection: "user_bookings",
              ...doc.data(),
            } as Booking),
          );

          const q2 = query(
            collection(db, "ctv_bookings"),
            where("ctvId", "==", user.uid),
          );
          const snap2 = await getDocs(q2);
          snap2.docs.forEach((doc) =>
            fetchedData.push({
              id: doc.id,
              _collection: "ctv_bookings",
              ...doc.data(),
            } as Booking),
          );
        } else if (role === "collaborator") {
          const q = query(
            collection(db, "ctv_bookings"),
            where("ctvId", "==", user.uid),
          );
          const snap = await getDocs(q);
          snap.docs.forEach((doc) =>
            fetchedData.push({
              id: doc.id,
              _collection: "ctv_bookings",
              ...doc.data(),
            } as Booking),
          );
        } else {
          const q = query(
            collection(db, "user_bookings"),
            where("userId", "==", user.uid),
          );
          const snap = await getDocs(q);
          snap.docs.forEach((doc) =>
            fetchedData.push({
              id: doc.id,
              _collection: "user_bookings",
              ...doc.data(),
            } as Booking),
          );
        }

        fetchedData.sort((a, b) => {
          const timeA =
            a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const timeB =
            b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setBookings(fetchedData);
      } catch (error) {
        console.error("Lỗi tải lịch hẹn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, authLoading, role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking);

    let dDate = "";
    let dTime = "";
    if (booking.dateTime) {
      if (booking.dateTime.includes("T")) {
        const parts = booking.dateTime.split("T");
        dDate = parts[0];
        dTime = parts[1];
      } else {
        dDate = booking.dateTime;
      }
    }

    setEditForm({
      clientName: booking.clientName || "",
      clientPhone: booking.clientPhone || "",
      consultationPrice: booking.consultationPrice || "",
      name: booking.name || "",
      phone: booking.phone || "",
      budget: booking.budget || "",
      bookingDate: dDate,
      bookingTime: dTime,
      notes: booking.notes || "",
    });
    setIsDetailsModalOpen(true);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !selectedBooking._collection) return;
    setIsSaving(true);

    try {
      const docRef = doc(db, selectedBooking._collection, selectedBooking.id);
      const finalDateTime = editForm.bookingTime
        ? `${editForm.bookingDate}T${editForm.bookingTime}`
        : editForm.bookingDate;

      let payload: any = {
        dateTime: finalDateTime,
        notes: editForm.notes,
        budget: editForm.budget,
        updatedAt: Timestamp.now(),
      };

      if (selectedBooking._collection === "ctv_bookings") {
        payload = {
          ...payload,
          clientName: editForm.clientName,
          clientPhone: editForm.clientPhone,
          consultationPrice: editForm.consultationPrice,
        };
      } else {
        payload = {
          ...payload,
          name: editForm.name,
          phone: editForm.phone,
          consultationPrice: editForm.consultationPrice,
        };
      }

      await updateDoc(docRef, payload);

      setBookings((prev) => {
        const updatedList = prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, ...payload } : b,
        );
        return updatedList.sort((a, b) => {
          const timeA =
            a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const timeB =
            b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });

      toast({
        title: "Cập nhật thành công!",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsDetailsModalOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi cập nhật" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            Chờ duyệt
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
            Đã duyệt
          </span>
        );
      case "contacted":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
            Đã dẫn khách
          </span>
        );
      case "failed":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
            Không thành công
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">
            Chờ xử lý
          </span>
        );
    }
  };

  const formatBookingTime = (dtStr?: string) => {
    if (!dtStr) return "Chưa xác định";
    try {
      if (dtStr.includes("T")) {
        const [datePart, timePart] = dtStr.split("T");
        const [y, m, d] = datePart.split("-");
        return `${timePart} ${d}/${m}/${y}`;
      } else {
        const [y, m, d] = dtStr.split("-");
        return `Cả ngày ${d}/${m}/${y}`;
      }
    } catch (e) {
      return dtStr;
    }
  };

  const searchFilteredBookings = useMemo(() => {
    if (!isCollaborator) return bookings;
    return bookings.filter((b) => {
      const term = searchTerm.toLowerCase();
      const matchName =
        b.name?.toLowerCase().includes(term) ||
        b.clientName?.toLowerCase().includes(term);
      const matchPhone =
        b.phone?.includes(term) || b.clientPhone?.includes(term);
      const matchCode = b.apartmentCode?.toLowerCase().includes(term);
      return matchName || matchPhone || matchCode;
    });
  }, [bookings, searchTerm, isCollaborator]);

  const totalPages = Math.ceil(searchFilteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = searchFilteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white font-body w-full">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#cda533]" />
        </div>
        <Footer />
      </div>
    );
  }

  // WRAPPER CHỐNG TRÀN VIỀN BẢO VỆ GIAO DIỆN
  return (
    <div className="w-full overflow-x-hidden bg-gray-50/40 min-h-[100dvh] font-body flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#cda533] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại Trang chủ
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white shadow-sm rounded-2xl border border-gray-100 hidden md:block">
            <CalendarDays className="h-7 w-7 text-[#cda533]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-[#cda533] md:hidden" />
              {isCollaborator
                ? "Quản lý lịch dẫn khách"
                : "Quản lý lịch xem phòng"}
            </h1>
            <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
              Theo dõi trạng thái, lịch trình và phản hồi từ ban quản trị.
            </p>
          </div>
        </div>

        {SHORT_TERM_PUBLIC_ACCESS ? (
          <div className="inline-flex bg-white border border-gray-200 p-1 rounded-xl mb-6 shadow-sm">
            <button
              type="button"
              onClick={() => setViewTab("viewing")}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                viewTab === "viewing"
                  ? "bg-[#cda533]/10 text-[#b88e22]"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {isCollaborator ? "Lịch dẫn khách" : "Lịch xem phòng"}
            </button>
            <button
              type="button"
              onClick={() => setViewTab("stay")}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                viewTab === "stay"
                  ? "bg-[#cda533]/10 text-[#b88e22]"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Đặt phòng ngắn hạn
            </button>
          </div>
        ) : null}

        {viewTab === "stay" && <StayBookingsList />}

        {/* --- VIEW DESKTOP --- */}
        <div
          className={cn(
            "hidden flex-col bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden w-full",
            viewTab === "viewing" && "md:flex",
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[1100px]">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 font-black tracking-wider w-[120px]">
                    Mã căn
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider w-[220px]">
                    {isCollaborator ? "Khách Hàng" : "Thông tin"}
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider w-[160px]">
                    Thời gian hẹn
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider w-[250px]">
                    Lưu ý
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider text-center w-[140px]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider text-blue-700 bg-blue-50/50 w-[240px]">
                    Phản hồi BQT
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider text-right w-[150px]">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <CalendarDays className="h-14 w-14 mb-3 opacity-20" />
                        <p className="font-bold text-base text-gray-500">
                          Bạn chưa có lịch hẹn nào
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 align-middle">
                        <div className="font-black text-gray-900 text-base">
                          {booking.apartmentCode || "N/A"}
                        </div>
                        {booking.apartmentLink && (
                          <a
                            href={booking.apartmentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-[11px] flex items-center gap-1 mt-1 font-semibold whitespace-nowrap"
                          >
                            Xem chi tiết <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="font-bold text-gray-900">
                          {booking._collection === "ctv_bookings"
                            ? booking.clientName
                            : booking.name || "Khách"}
                        </div>
                        <div className="font-medium text-gray-600 text-xs mt-0.5">
                          {booking._collection === "ctv_bookings"
                            ? booking.clientPhone
                            : booking.phone}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {booking.budget && (
                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-600">
                              Ngân sách: {booking.budget}
                            </span>
                          )}
                          {booking.consultationPrice && (
                            <span className="px-2 py-0.5 bg-[#cda533]/10 border border-[#cda533]/20 rounded text-[10px] font-bold text-[#cda533]">
                              Giá báo: {booking.consultationPrice}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle font-bold text-gray-900">
                        {formatBookingTime(booking.dateTime)}
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div
                          className="text-xs text-gray-600 leading-relaxed line-clamp-3"
                          title={booking.notes}
                        >
                          {booking.notes || (
                            <span className="text-gray-400 italic">
                              Không có
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        {renderStatus(booking.status)}
                      </td>
                      <td className="px-6 py-5 bg-blue-50/20 border-l border-blue-50 align-middle">
                        <div className="flex items-start gap-2 text-sm font-semibold text-blue-900 line-clamp-3">
                          <MessageSquareText className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                          {booking.adminNotes || (
                            <span className="text-blue-300 italic font-medium">
                              Chưa có phản hồi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right align-middle">
                        <button
                          onClick={() => openDetailsModal(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#cda533] bg-[#cda533]/10 rounded-xl hover:bg-[#cda533]/20 transition-all whitespace-nowrap"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang Desktop */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500 font-medium">
                Đang xem{" "}
                <span className="font-bold text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(
                    startIndex + itemsPerPage,
                    searchFilteredBookings.length,
                  )}
                </span>{" "}
                /{" "}
                <span className="font-bold text-gray-900">
                  {searchFilteredBookings.length}
                </span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 flex items-center justify-center text-sm font-bold rounded-lg border shadow-sm transition-colors ${currentPage === page ? "bg-[#cda533] text-white border-[#cda533]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- VIEW MOBILE THIẾT KẾ CARD --- */}
        <div
          className={cn(
            "md:hidden flex-col gap-4 w-full",
            viewTab === "viewing" ? "flex" : "hidden",
          )}
        >
          {currentBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              Bạn chưa có lịch hẹn nào.
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 w-full"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Mã căn
                    </span>
                    <span className="font-black text-[#cda533] text-base">
                      {booking.apartmentCode || "N/A"}
                    </span>
                  </div>
                  {renderStatus(booking.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
                      {isCollaborator ? "Khách hàng" : "Thông tin"}
                    </span>
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {booking._collection === "ctv_bookings"
                        ? booking.clientName
                        : booking.name}
                    </div>
                    <div className="font-medium text-gray-500 text-[12px] truncate mt-0.5">
                      {booking._collection === "ctv_bookings"
                        ? booking.clientPhone
                        : booking.phone}
                    </div>
                  </div>
                  <div className="text-right min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
                      Giờ xem
                    </span>
                    <div className="font-bold text-gray-900 text-[13px] truncate flex items-center justify-end gap-1.5 mt-0.5">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {formatBookingTime(booking.dateTime)}
                    </div>
                  </div>
                </div>

                {booking.adminNotes && (
                  <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50 flex items-start gap-2">
                    <MessageSquareText className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-blue-800 line-clamp-2">
                      {booking.adminNotes}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => openDetailsModal(booking)}
                  className="w-full h-10 px-4 text-xs font-bold text-[#cda533] bg-[#cda533]/10 hover:bg-[#cda533]/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors mt-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Xem chi tiết và Chỉnh sửa
                </button>
              </div>
            ))
          )}

          {/* Phân trang Mobile */}
          {totalPages > 1 && (
            <div className="pt-4 flex flex-col items-center gap-4 w-full">
              <span className="text-xs text-gray-500 font-medium text-center">
                Đang xem{" "}
                <span className="font-bold text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(
                    startIndex + itemsPerPage,
                    searchFilteredBookings.length,
                  )}
                </span>{" "}
                /{" "}
                <span className="font-bold text-gray-900">
                  {searchFilteredBookings.length}
                </span>
              </span>
              <div className="flex items-center justify-center gap-2 w-full">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center gap-1 max-w-[200px] overflow-x-auto no-scrollbar">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`shrink-0 h-9 w-9 flex items-center justify-center text-sm font-bold rounded-xl border shadow-sm transition-colors ${currentPage === page ? "bg-[#cda533] text-white border-[#cda533]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* POPUP FULL-SCREEN VIEW CỰC GỌN (COMPACT CARDS) */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent
          className={
            "p-0 border-none shadow-2xl z-[100] gap-0 bg-gray-100 flex flex-col [&>button.absolute]:hidden " +
            // --- XỬ LÝ DESKTOP ---
            "sm:max-w-[500px] sm:max-h-[90vh] sm:rounded-3xl overflow-hidden " +
            // --- XỬ LÝ MOBILE ---
            "max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 " +
            "max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out " +
            "max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full " +
            "max-sm:duration-300 max-sm:ease-out"
          }
        >
          {/* HEADER SIÊU GỌN */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-gray-200 flex flex-row items-center justify-between bg-white z-20 shrink-0 shadow-sm w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition-colors sm:hidden"
              >
                <ChevronLeft className="h-6 w-6 text-gray-900" />
              </button>
              <DialogTitle className="font-black text-lg sm:text-xl text-gray-900 m-0 !mt-0 flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#cda533]" />{" "}
                Cập nhật Lịch hẹn
              </DialogTitle>
            </div>
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="hidden sm:flex p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {selectedBooking && (
            <form
              onSubmit={handleSaveChanges}
              className="flex flex-col flex-1 h-full overflow-hidden w-full"
            >
              {/* BODY SCROLLABLE: Tách Card rõ ràng */}
              <div className="px-4 py-5 sm:px-6 sm:py-6 overflow-y-auto flex-1 space-y-4 no-scrollbar w-full">
                {/* THẺ 1: Status & Admin Note (Chỉ xem) */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm w-full">
                  <div className="flex justify-between items-center mb-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        Mã căn
                      </span>
                      <div className="font-black text-gray-900 text-xl truncate mt-0.5">
                        {selectedBooking.apartmentCode || "N/A"}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderStatus(selectedBooking.status)}
                    </div>
                  </div>
                  {selectedBooking.adminNotes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <MessageSquareText className="h-3.5 w-3.5" /> Phản hồi
                        từ Ban Quản Trị
                      </span>
                      <div className="text-sm font-semibold text-blue-900 whitespace-pre-wrap leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        {selectedBooking.adminNotes}
                      </div>
                    </div>
                  )}
                </div>

                {/* THẺ 2: Chỉnh sửa thông tin Khách & Tiền */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm w-full space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                    Thông tin Khách Hàng
                  </h3>
                  <div className="grid grid-cols-1 gap-4 w-full">
                    <div className="flex gap-4 w-full">
                      <div className="space-y-1.5 w-full min-w-0">
                        <label className="text-[13px] font-bold text-gray-700">
                          Tên khách <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={
                            selectedBooking._collection === "ctv_bookings"
                              ? editForm.clientName
                              : editForm.name
                          }
                          onChange={(e) =>
                            setEditForm((prev) =>
                              selectedBooking._collection === "ctv_bookings"
                                ? { ...prev, clientName: e.target.value }
                                : { ...prev, name: e.target.value },
                            )
                          }
                          className="w-full border border-gray-200 rounded-xl p-3 text-[16px] outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5 w-full min-w-0">
                        <label className="text-[13px] font-bold text-gray-700">
                          SĐT khách <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="tel"
                          value={
                            selectedBooking._collection === "ctv_bookings"
                              ? editForm.clientPhone
                              : editForm.phone
                          }
                          onChange={(e) =>
                            setEditForm((prev) =>
                              selectedBooking._collection === "ctv_bookings"
                                ? { ...prev, clientPhone: e.target.value }
                                : { ...prev, phone: e.target.value },
                            )
                          }
                          className="w-full border border-gray-200 rounded-xl p-3 text-[16px] outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 w-full">
                      <div className="space-y-1.5 w-full min-w-0">
                        <label className="text-[13px] font-bold text-gray-700">
                          Ngân sách
                        </label>
                        <input
                          type="text"
                          value={editForm.budget}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              budget: e.target.value,
                            }))
                          }
                          placeholder="VD: 5tr"
                          className="w-full border border-gray-200 rounded-xl p-3 text-[16px] outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                        />
                      </div>
                      {(isCollaborator ||
                        selectedBooking.consultationPrice) && (
                        <div className="space-y-1.5 w-full min-w-0">
                          <label className="text-[13px] font-bold text-gray-700">
                            Giá báo
                          </label>
                          <input
                            type="text"
                            value={editForm.consultationPrice}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                consultationPrice: e.target.value,
                              }))
                            }
                            placeholder="VD: 6tr"
                            className="w-full border border-gray-200 rounded-xl p-3 text-[16px] outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* THẺ 3: Chỉnh sửa Lịch & Note */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm w-full space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                    Thời gian & Yêu cầu
                  </h3>
                  <div className="flex gap-4 w-full">
                    <div className="space-y-1.5 w-full min-w-0">
                      <label className="text-[13px] font-bold text-gray-700">
                        Ngày xem <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={editForm.bookingDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bookingDate: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl p-3 text-[16px] outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 w-full min-w-0">
                      <label className="text-[13px] font-bold text-gray-700">
                        Giờ xem
                      </label>
                      <input
                        type="time"
                        value={editForm.bookingTime}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bookingTime: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl p-3 text-[16px] outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 w-full min-w-0 pb-1">
                    <label className="text-[13px] font-bold text-gray-700">
                      Ghi chú yêu cầu của khách
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      placeholder="VD: Nuôi pet, có xe điện..."
                      className="w-full border border-gray-200 rounded-xl p-3.5 text-[16px] resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-gray-50/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER CỐ ĐỊNH, NHỎ GỌN */}
              <div className="shrink-0 p-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-white sticky bottom-0 z-20 flex gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] w-full">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="hidden sm:block px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-[15px] hover:bg-gray-200 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:flex-1 h-12 sm:h-auto rounded-xl sm:rounded-xl bg-gray-900 hover:bg-[#cda533] text-white font-bold text-[16px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <Save className="h-5 w-5" /> Cập nhật Lịch Hẹn
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
