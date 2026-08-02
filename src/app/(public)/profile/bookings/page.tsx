"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
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
  _collection?: string; // Nhãn ngầm để biết sửa vào bảng nào
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

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ĐÃ CẬP NHẬT: Tách dateTime thành bookingDate và bookingTime, thêm budget
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
          // Admin xem được cả Khách cá nhân tự tạo VÀ Khách CTV (nếu Admin đóng vai trò CTV)
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

    // Tách chuỗi dateTime
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
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            Chờ duyệt
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
            Đã duyệt
          </span>
        );
      case "contacted":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
            Đã dẫn khách
          </span>
        );
      case "failed":
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
            Không thành công
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">
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
        return `${d}/${m}/${y}`;
      }
    } catch (e) {
      return dtStr;
    }
  };

  const searchFilteredBookings = isCollaborator
    ? bookings.filter((b) => {
        const term = searchTerm.toLowerCase();
        const matchName =
          b.name?.toLowerCase().includes(term) ||
          b.clientName?.toLowerCase().includes(term);
        const matchPhone =
          b.phone?.includes(term) || b.clientPhone?.includes(term);
        const matchCode = b.apartmentCode?.toLowerCase().includes(term);
        return matchName || matchPhone || matchCode;
      })
    : bookings;

  const totalPages = Math.ceil(searchFilteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = searchFilteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (authLoading || loading) {
    return (
      <div className="flex h-screen flex-col bg-white font-body">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#cda533]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/30 font-body">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 lg:py-12 max-w-[1440px]">
        {/* ĐÃ CẬP NHẬT: Đổi text Quay lại Trang chủ */}
        <Link
          href="/"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#cda533] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại Trang chủ
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-2xl border border-gray-100 hidden md:block">
              <CalendarDays className="h-8 w-8 text-[#cda533]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 italic flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-[#cda533] md:hidden" />
                {isCollaborator
                  ? "Quản lý lịch dẫn khách"
                  : "Quản lý lịch xem phòng"}
              </h1>
              <p className="text-gray-500 font-medium mt-2">
                Theo dõi trạng thái, lịch trình và phản hồi từ ban quản trị hệ
                thống.
              </p>
            </div>
          </div>
        </div>

        {/* --- VIEW DESKTOP --- */}
        <div className="hidden md:flex flex-col bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left border-collapse min-w-[1100px]">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 font-black tracking-wider w-[130px]">
                    Mã căn
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider w-[220px]">
                    {isCollaborator ? "Thông tin Khách" : "Thông tin"}
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
                  <th className="px-6 py-5 font-black tracking-wider text-blue-700 bg-blue-50/50 border-l border-blue-100/50 w-[240px]">
                    Phản hồi từ BQT
                  </th>
                  <th className="px-6 py-5 font-black tracking-wider text-right w-[150px]">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <CalendarDays className="h-16 w-16 mb-4 opacity-20" />
                        <p className="font-bold text-lg text-gray-600">
                          Bạn chưa có lịch hẹn nào
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50/80 transition-colors group"
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
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900">
                            {booking._collection === "ctv_bookings"
                              ? booking.clientName
                              : booking.name || "Khách"}
                          </div>
                          <div className="font-medium text-gray-600">
                            {booking._collection === "ctv_bookings"
                              ? booking.clientPhone
                              : booking.phone}
                          </div>
                          {booking.budget && (
                            <div className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200/60 rounded-md text-[11px] font-bold text-emerald-800 whitespace-nowrap mt-1 mr-1">
                              Ngân sách: {booking.budget}
                            </div>
                          )}
                          {booking.consultationPrice && (
                            <div className="inline-block px-2 py-0.5 bg-amber-50 border border-amber-200/60 rounded-md text-[11px] font-bold text-amber-800 whitespace-nowrap mt-1">
                              Giá báo: {booking.consultationPrice}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="font-bold text-gray-900 whitespace-nowrap">
                          {formatBookingTime(booking.dateTime)}
                        </div>
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
                        <div className="flex items-start gap-2.5">
                          <MessageSquareText className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                          <span className="text-sm font-semibold text-blue-900 line-clamp-3">
                            {booking.adminNotes || (
                              <span className="text-blue-300 italic font-medium">
                                Chưa có phản hồi
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right align-middle">
                        <button
                          onClick={() => openDetailsModal(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-[#cda533] hover:text-[#cda533] hover:shadow-sm transition-all whitespace-nowrap"
                        >
                          <FileText className="h-3.5 w-3.5" /> Xem / Sửa Form
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                  className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 flex items-center justify-center text-sm font-bold rounded-lg border transition-colors shadow-sm ${currentPage === page ? "bg-[#cda533] text-white border-[#cda533]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- VIEW MOBILE --- */}
        <div className="md:hidden flex flex-col gap-4">
          {currentBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100">
              Bạn chưa có lịch hẹn nào.
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  {renderStatus(booking.status)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Mã Căn
                    </span>
                    <div className="font-black text-gray-900 text-sm">
                      {booking.apartmentCode || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {isCollaborator ? "Khách hàng" : "Thông tin"}
                    </span>
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {booking._collection === "ctv_bookings"
                        ? booking.clientName
                        : booking.name}
                    </div>
                    <div className="font-medium text-gray-600 text-[11px]">
                      {booking._collection === "ctv_bookings"
                        ? booking.clientPhone
                        : booking.phone}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                  <div className="text-sm font-bold text-gray-900">
                    {formatBookingTime(booking.dateTime)}
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-bold text-gray-500">Lưu ý:</span>{" "}
                    {booking.notes || "Không có"}
                  </div>
                </div>
                <button
                  onClick={() => openDetailsModal(booking)}
                  className="w-full h-10 px-4 text-xs font-bold text-[#cda533] bg-[#cda533]/10 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="h-4 w-4" /> Xem và Sửa thông tin
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* POPUP XEM & CHỈNH SỬA FORM */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="w-[90%] max-w-[500px] bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold border-b border-gray-100 pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#cda533]" /> Form Đặt Lịch
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <form onSubmit={handleSaveChanges} className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Mã căn
                  </span>
                  <div className="font-black text-gray-900 text-lg leading-none">
                    {selectedBooking.apartmentCode || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Trạng thái
                  </span>
                  <div className="mt-1">
                    {renderStatus(selectedBooking.status)}
                  </div>
                </div>
                {selectedBooking.adminNotes && (
                  <div className="col-span-2 mt-2 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <MessageSquareText className="h-3 w-3" /> Phản hồi từ BQT
                    </span>
                    <div className="text-sm font-semibold text-blue-900 whitespace-pre-wrap">
                      {selectedBooking.adminNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                  Thông tin Khách Hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">
                      Tên khách
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
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">
                      Số điện thoại
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
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-[#cda533]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">
                      Ngân sách yêu cầu
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
                      placeholder="VD: 5-7 triệu..."
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-[#cda533]"
                    />
                  </div>
                  {(isCollaborator || selectedBooking.consultationPrice) && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">
                        Giá báo khách
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
                        placeholder="Nhập giá đã báo..."
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-[#cda533]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                  Thời gian & Yêu cầu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">
                      Ngày hẹn xem <span className="text-red-500">*</span>
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
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-[#cda533]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                      Giờ hẹn{" "}
                      <span className="text-gray-400 text-[11px] font-normal">
                        (Có thể bỏ trống)
                      </span>
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
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-[#cda533]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">
                    Ghi chú thêm
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder="Tài chính, có pet, xe điện..."
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm resize-none outline-none focus:border-[#cda533]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors w-full sm:w-auto"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-3 rounded-xl bg-[#cda533] text-white font-bold text-sm hover:bg-[#b88e22] transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Lưu thông tin
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
