"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ExternalLink,
  CalendarDays,
  Edit3,
  MessageSquareText,
  PlusCircle,
  User as UserIcon,
  ShieldCheck,
  Contact,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Filter,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminBooking {
  id: string;
  type: "ctv" | "user" | "external";
  apartmentCode?: string;
  apartmentLink?: string;
  clientName?: string;
  clientPhone?: string;
  consultationPrice?: string;
  ctvId?: string;
  name?: string;
  phone?: string;
  userId?: string;
  budget?: string;
  dateTime?: string;
  notes?: string;
  adminNotes?: string;
  status: string;
  isExternal?: boolean;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export default function AdminBookingsPage() {
  const [ctvBookings, setCtvBookings] = useState<AdminBooking[]>([]);
  const [userBookings, setUserBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "all" | "ctv" | "user" | "external"
  >("all");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // State Bộ lọc nâng cao (Date)
  const [dateFilterType, setDateFilterType] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null,
  );
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // State Quản lý popup xác nhận Hủy
  const [cancelConfirm, setCancelConfirm] = useState<{
    isOpen: boolean;
    booking: AdminBooking | null;
  }>({ isOpen: false, booking: null });

  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    apartmentCode: "",
    budget: "",
    consultationPrice: "",
    bookingDate: "",
    bookingTime: "",
    notes: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    let isCtvLoaded = false;
    let isUserLoaded = false;

    const checkLoading = () => {
      if (isCtvLoaded && isUserLoaded) setLoading(false);
    };

    const unsubCTV = onSnapshot(
      collection(db, "ctv_bookings"),
      (snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, type: "ctv", ...doc.data() }) as AdminBooking,
        );
        setCtvBookings(data);
        isCtvLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error("Error CTV:", error);
        toast({ variant: "destructive", title: "Lỗi tải CTV" });
      },
    );

    const unsubUser = onSnapshot(
      collection(db, "user_bookings"),
      (snap) => {
        const data = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.isExternal ? "external" : "user",
            ...d,
          } as AdminBooking;
        });
        setUserBookings(data);
        isUserLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error("Error User:", error);
        toast({ variant: "destructive", title: "Lỗi tải Web User" });
      },
    );

    return () => {
      unsubCTV();
      unsubUser();
    };
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearchTerm, dateFilterType, startDate, endDate]);

  const searchFilteredBookings = useMemo(() => {
    const combined = [...ctvBookings, ...userBookings].sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    return combined.filter((b) => {
      // 1. Lọc theo Tab
      if (activeTab !== "all" && b.type !== activeTab) return false;

      // 2. Lọc theo Khoảng thời gian
      if (dateFilterType !== "all") {
        if (!b.dateTime) return false;

        const bDateStr = b.dateTime.split("T")[0];
        const bDate = new Date(bDateStr);
        const currentNow = new Date();

        if (dateFilterType === "today") {
          if (bDate.toDateString() !== currentNow.toDateString()) return false;
        } else if (dateFilterType === "week") {
          const day = currentNow.getDay();
          const distanceToMonday = day === 0 ? 6 : day - 1;
          const startOfWeek = new Date(currentNow);
          startOfWeek.setDate(currentNow.getDate() - distanceToMonday);
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          if (bDate < startOfWeek || bDate > endOfWeek) return false;
        } else if (dateFilterType === "month") {
          if (
            bDate.getMonth() !== currentNow.getMonth() ||
            bDate.getFullYear() !== currentNow.getFullYear()
          )
            return false;
        } else if (dateFilterType === "custom") {
          if (startDate && new Date(bDateStr) < new Date(startDate))
            return false;
          if (endDate && new Date(bDateStr) > new Date(endDate)) return false;
        }
      }

      // 3. Lọc theo Text Search
      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      const matchName =
        b.name?.toLowerCase().includes(term) ||
        b.clientName?.toLowerCase().includes(term);
      const matchPhone =
        b.phone?.includes(term) || b.clientPhone?.includes(term);
      const matchCode = b.apartmentCode?.toLowerCase().includes(term);

      return matchName || matchPhone || matchCode;
    });
  }, [
    ctvBookings,
    userBookings,
    activeTab,
    debouncedSearchTerm,
    dateFilterType,
    startDate,
    endDate,
  ]);

  const totalPages = Math.ceil(searchFilteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = searchFilteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Hàm xử lý copy SĐT
  const handleCopyPhone = (phone?: string) => {
    if (!phone || phone === "N/A") return;
    navigator.clipboard.writeText(phone);
    toast({
      title: "Đã copy số điện thoại",
      className: "bg-green-50 text-green-900 border-green-200",
    });
  };

  const handleStatusChange = async (
    booking: AdminBooking,
    newStatus: string,
  ) => {
    if (newStatus === "failed") {
      setCancelConfirm({ isOpen: true, booking });
      return;
    }

    try {
      const collectionName =
        booking.type === "ctv" ? "ctv_bookings" : "user_bookings";
      await updateDoc(doc(db, collectionName, booking.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Đã cập nhật trạng thái",
        className: "bg-green-50 text-green-900 border-green-200",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi cập nhật trạng thái" });
    }
  };

  const executeCancelBooking = async () => {
    if (!cancelConfirm.booking) return;
    try {
      const booking = cancelConfirm.booking;
      const collectionName =
        booking.type === "ctv" ? "ctv_bookings" : "user_bookings";
      await updateDoc(doc(db, collectionName, booking.id), {
        status: "failed",
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Đã hủy lịch hẹn",
        className: "bg-red-50 text-red-900 border-red-200",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi hủy lịch hẹn" });
    } finally {
      setCancelConfirm({ isOpen: false, booking: null });
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSavingNote(true);
    try {
      const collectionName =
        selectedBooking.type === "ctv" ? "ctv_bookings" : "user_bookings";
      await updateDoc(doc(db, collectionName, selectedBooking.id), {
        adminNotes: noteContent,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Đã lưu ghi chú",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsNoteModalOpen(false);
      setIsDetailsModalOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi lưu ghi chú" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const finalDateTime = addForm.bookingTime
        ? `${addForm.bookingDate}T${addForm.bookingTime}`
        : addForm.bookingDate;
      const payload = {
        name: addForm.name,
        phone: addForm.phone,
        apartmentCode: addForm.apartmentCode,
        budget: addForm.budget,
        consultationPrice: addForm.consultationPrice,
        dateTime: finalDateTime,
        notes: addForm.notes,
        status: "approved",
        isExternal: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, "user_bookings"), payload);
      toast({
        title: "Đã thêm khách ngoài",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        phone: "",
        apartmentCode: "",
        budget: "",
        consultationPrice: "",
        bookingDate: "",
        bookingTime: "",
        notes: "",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi thêm" });
    } finally {
      setIsAdding(false);
    }
  };

  const openNoteModal = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setNoteContent(booking.adminNotes || "");
    setIsNoteModalOpen(true);
  };

  const openDetailsModal = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setNoteContent(booking.adminNotes || "");
    setIsDetailsModalOpen(true);
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 focus:ring-amber-200 hover:bg-amber-200/80";
      case "approved":
        return "bg-blue-100 text-blue-800 focus:ring-blue-200 hover:bg-blue-200/80";
      case "contacted":
        return "bg-green-100 text-green-800 focus:ring-green-200 hover:bg-green-200/80";
      case "failed":
        return "bg-red-100 text-red-800 focus:ring-red-200 hover:bg-red-200/80";
      default:
        return "bg-gray-100 text-gray-800 focus:ring-gray-200 hover:bg-gray-200/80";
    }
  };

  const formatCreationDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const renderSourceBadge = (type: string) => {
    if (type === "ctv")
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
          <ShieldCheck className="h-3.5 w-3.5" /> CTV
        </div>
      );
    if (type === "user")
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
          <UserIcon className="h-3.5 w-3.5" /> Web User
        </div>
      );
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
        <Contact className="h-3.5 w-3.5" /> Khách ngoài
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#cda533]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 max-w-[1440px] mx-auto">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <CalendarDays className="h-7 w-7 md:h-8 md:w-8 text-[#cda533]" />
          Quản lý lịch hẹn
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* HÀNG 1: SEARCH (Góc trái) --- TABS & THÊM THỦ CÔNG (Góc phải) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Ô Tìm Kiếm */}
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên, SĐT khách, mã căn hộ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm font-medium border border-gray-200 rounded-xl outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] shadow-sm transition-all bg-white"
            />
          </div>

          {/* Cụm Nút Phải: TẤT CẢ TABS ĐÃ ĐỒNG BỘ MÀU ĐEN - TRẮNG */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 overflow-x-auto no-scrollbar snap-x">
              <button
                onClick={() => setActiveTab("all")}
                className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "all" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setActiveTab("ctv")}
                className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "ctv" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> CTV
              </button>
              <button
                onClick={() => setActiveTab("user")}
                className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "user" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <UserIcon className="h-3.5 w-3.5" /> Web User
              </button>
              <button
                onClick={() => setActiveTab("external")}
                className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "external" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <Contact className="h-3.5 w-3.5" /> Khách ngoài
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="whitespace-nowrap flex items-center justify-center gap-2 bg-[#cda533] text-white px-6 py-2.5 h-[42px] rounded-xl text-sm font-bold shadow-sm hover:bg-[#b88e22] transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Thêm thủ công
            </button>
          </div>
        </div>

        {/* HÀNG 2: BỘ LỌC NGÀY CHUYÊN NGHIỆP - REsPONSIVE TỐT HƠN */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 whitespace-nowrap">
            <Filter className="h-4 w-4" /> Lọc theo lịch hẹn:
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "Tất cả" },
              { id: "today", label: "Hôm nay" },
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "custom", label: "Tùy chọn..." },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDateFilterType(btn.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dateFilterType === btn.id
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}

            {/* Ô nhập Từ ngày -> Đến ngày (Giao diện mobile tự rớt dòng) */}
            {dateFilterType === "custom" && (
              <div className="flex flex-col min-[450px]:flex-row items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm animate-in fade-in slide-in-from-left-4 w-full min-[450px]:w-auto mt-2 min-[450px]:mt-0">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-[450px]:w-auto text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer px-2 py-1"
                  title="Từ ngày"
                />
                <span className="hidden min-[450px]:inline text-gray-300 font-medium">
                  -
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-[450px]:w-auto text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer px-2 py-1"
                  title="Đến ngày"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE GIAO DIỆN */}
      <div className="bg-transparent md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-200 flex flex-col overflow-hidden">
        {/* VIEW DÀNH CHO DESKTOP */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left min-w-[1400px]">
            <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
              <tr>
                <th className="px-5 py-4 font-bold w-[120px]">Phân loại</th>
                <th className="px-5 py-4 font-bold w-[150px]">Mã Căn</th>
                <th className="px-5 py-4 font-bold w-[250px]">
                  Thông tin Khách
                </th>
                <th className="px-5 py-4 font-bold w-[180px]">
                  Ngày tạo yêu cầu
                </th>
                <th className="px-5 py-4 font-bold w-[280px]">
                  Lịch hẹn & Yêu cầu
                </th>
                <th className="px-5 py-4 font-bold text-center w-[160px]">
                  Trạng thái
                </th>
                <th className="px-5 py-4 font-bold text-center w-[150px]">
                  Ghi chú Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-gray-400 font-medium text-base"
                  >
                    {debouncedSearchTerm || dateFilterType !== "all"
                      ? "Không tìm thấy kết quả phù hợp với bộ lọc."
                      : "Chưa có dữ liệu lịch hẹn."}
                  </td>
                </tr>
              ) : (
                currentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-4 align-middle">
                      {renderSourceBadge(booking.type)}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-gray-900 text-base">
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

                    {/* CỘT THÔNG TIN KHÁCH */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-gray-900 text-sm">
                          {booking.type === "ctv"
                            ? booking.clientName || "Khách của CTV"
                            : booking.name || "Khách"}
                        </div>
                        <div className="text-gray-500 text-xs font-semibold tracking-wide">
                          {booking.type === "ctv"
                            ? booking.clientPhone
                            : booking.phone}
                        </div>

                        {booking.type === "ctv" && (
                          <div className="mt-1.5 flex items-center">
                            <div className="px-2 py-1 bg-gray-100 rounded-md border border-gray-200/60 flex items-center gap-1.5 w-max">
                              <UserIcon className="h-3 w-3 text-gray-500" />
                              <span className="text-[11px] font-bold text-gray-700">
                                CTV: {booking.ctvName || "Không rõ"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <div className="text-xs font-medium text-gray-500 whitespace-nowrap">
                        {formatCreationDate(booking.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-gray-900 mb-1.5 whitespace-nowrap text-sm">
                        {formatBookingTime(booking.dateTime)}
                      </div>
                      <button
                        onClick={() => openDetailsModal(booking)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg transition-colors whitespace-nowrap shadow-sm border border-gray-200/50"
                      >
                        <FileText className="h-3.5 w-3.5" /> Xem Form Yêu Cầu
                      </button>
                    </td>
                    <td className="px-5 py-4 align-middle text-center">
                      <div className="relative inline-block w-[130px]">
                        <select
                          value={booking.status}
                          onChange={(e) =>
                            handleStatusChange(booking, e.target.value)
                          }
                          className={`w-full h-9 px-3 text-[11px] text-center font-bold uppercase rounded-xl border border-transparent outline-none cursor-pointer appearance-none transition-all shadow-sm focus:ring-2 focus:ring-offset-1 ${getStatusClasses(booking.status)}`}
                        >
                          <option
                            value="pending"
                            className="bg-white text-gray-900 font-semibold"
                          >
                            Chờ duyệt
                          </option>
                          <option
                            value="approved"
                            className="bg-white text-gray-900 font-semibold"
                          >
                            Đã duyệt
                          </option>
                          <option
                            value="contacted"
                            className="bg-white text-gray-900 font-semibold"
                          >
                            Đã dẫn khách
                          </option>
                          <option
                            value="failed"
                            className="bg-white text-gray-900 font-semibold"
                          >
                            Hủy / Từ chối
                          </option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 opacity-60">
                          <svg
                            className="h-4 w-4 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle text-center">
                      {booking.adminNotes ? (
                        <div
                          onClick={() => openNoteModal(booking)}
                          className="group flex flex-col items-center justify-center min-h-[36px] p-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-transparent hover:border-blue-100 cursor-pointer w-[120px] mx-auto transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <MessageSquareText className="h-4 w-4 text-blue-500" />
                            <span className="text-[11px] font-bold text-blue-700">
                              Đã Note
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openNoteModal(booking)}
                          className="inline-flex items-center justify-center gap-1.5 w-[120px] h-9 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm mx-auto"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Viết ghi chú
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VIEW DÀNH CHO MOBILE - REsPONSIVE ĐÃ ĐƯỢC TỐI ƯU CỰC MẠNH */}
        <div className="md:hidden flex flex-col gap-4">
          {currentBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              {debouncedSearchTerm || dateFilterType !== "all"
                ? "Không tìm thấy kết quả."
                : "Chưa có dữ liệu."}
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4"
              >
                {/* Header Card */}
                <div className="flex flex-wrap items-center justify-between border-b border-gray-50 pb-3 gap-2">
                  {renderSourceBadge(booking.type)}
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />{" "}
                    {formatCreationDate(booking.createdAt)}
                  </span>
                </div>

                {/* Thông tin Căn & Khách (Responsive grid tự xuống dòng) */}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
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
                      Khách hàng
                    </span>
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {booking.type === "ctv"
                        ? booking.clientName
                        : booking.name}
                    </div>
                    <div className="font-medium text-gray-600 text-[11px]">
                      {booking.type === "ctv"
                        ? booking.clientPhone
                        : booking.phone}
                    </div>
                    {booking.type === "ctv" && (
                      <div className="text-[10px] font-bold text-gray-600 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1 border border-gray-200/50">
                        CTV: {booking.ctvName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lịch hẹn & Button Form (Tự rớt dòng nếu bé quá) */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col min-[350px]:flex-row justify-between items-start min-[350px]:items-center gap-2">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatBookingTime(booking.dateTime)}
                    </div>
                  </div>
                  <button
                    onClick={() => openDetailsModal(booking)}
                    className="text-[11px] font-bold text-[#cda533] flex items-center gap-1 bg-white px-2.5 py-1.5 border border-gray-200 rounded-lg shadow-sm"
                  >
                    <FileText className="h-3 w-3" /> Xem Form
                  </button>
                </div>

                {/* 2 Nút Hành động (Chia đều 50-50 để không bị lệch) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                  <div className="relative w-full">
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(booking, e.target.value)
                      }
                      className={`w-full h-9 text-center text-xs font-bold uppercase rounded-xl border border-transparent outline-none cursor-pointer appearance-none transition-all shadow-sm ${getStatusClasses(booking.status)}`}
                    >
                      <option
                        value="pending"
                        className="bg-white text-gray-900 font-semibold"
                      >
                        Chờ duyệt
                      </option>
                      <option
                        value="approved"
                        className="bg-white text-gray-900 font-semibold"
                      >
                        Đã duyệt
                      </option>
                      <option
                        value="contacted"
                        className="bg-white text-gray-900 font-semibold"
                      >
                        Đã dẫn khách
                      </option>
                      <option
                        value="failed"
                        className="bg-white text-gray-900 font-semibold"
                      >
                        Hủy / Từ chối
                      </option>
                    </select>
                  </div>
                  <button
                    onClick={() => openNoteModal(booking)}
                    className="w-full h-9 px-2 text-[11px] font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Edit3 className="h-3.5 w-3.5" />{" "}
                    {booking.adminNotes ? "Sửa Note" : "Viết Note"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 md:border-t md:border-gray-100 md:bg-gray-50/50 mt-4 md:mt-0 rounded-2xl md:rounded-none md:rounded-b-2xl bg-white shadow-sm md:shadow-none">
            <span className="text-sm text-gray-500 font-medium text-center sm:text-left">
              Đang xem{" "}
              <span className="font-bold text-gray-900">{startIndex + 1}</span>{" "}
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
              <div className="flex items-center gap-1 max-w-[150px] overflow-x-auto no-scrollbar">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`shrink-0 h-8 w-8 flex items-center justify-center text-sm font-bold rounded-lg border shadow-sm transition-colors ${currentPage === page ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
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

      {/* DIALOG XÁC NHẬN HỦY - GIAO DIỆN MỚI CHUYÊN NGHIỆP */}
      <Dialog
        open={cancelConfirm.isOpen}
        onOpenChange={(open) =>
          !open && setCancelConfirm({ isOpen: false, booking: null })
        }
      >
        <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border-0">
          <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
            <div className="w-16 h-16 bg-white text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100">
              <AlertCircle className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-red-900">
              Xác nhận Hủy Lịch
            </DialogTitle>
            <p className="text-red-600/80 text-sm mt-1.5 font-medium">
              Hành động này sẽ thay đổi trạng thái và không thể hoàn tác.
            </p>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 space-y-2">
              <div className="text-sm text-gray-500 flex justify-between items-center gap-2">
                <span className="whitespace-nowrap">Khách hàng:</span>
                <span className="font-bold text-gray-900 text-right">
                  {cancelConfirm.booking?.name ||
                    cancelConfirm.booking?.clientName ||
                    "N/A"}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex justify-between items-center gap-2">
                <span className="whitespace-nowrap">Mã căn hộ:</span>
                <span className="font-bold text-gray-900 text-right">
                  {cancelConfirm.booking?.apartmentCode || "N/A"}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setCancelConfirm({ isOpen: false, booking: null })
                }
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Thoát
              </button>
              <button
                onClick={executeCancelBooking}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Xác nhận Hủy
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP CHI TIẾT FORM */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="w-[90%] max-w-[450px] bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold border-b border-gray-100 pb-3">
              Thông tin chi tiết lịch hẹn{" "}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <form onSubmit={handleSaveNote} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Mã căn
                  </span>
                  <div className="font-bold text-gray-900 text-sm">
                    {selectedBooking.apartmentCode || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ngày tạo Form
                  </span>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatCreationDate(selectedBooking.createdAt)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Tên Khách
                  </span>
                  <div className="font-bold text-gray-900 text-sm">
                    {selectedBooking.type === "ctv"
                      ? selectedBooking.clientName
                      : selectedBooking.name || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    SĐT Khách
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Thẻ <a> bọc SĐT với thuộc tính href="tel:..." để click gọi luôn */}
                    <a
                      href={`tel:${selectedBooking.type === "ctv" ? selectedBooking.clientPhone : selectedBooking.phone}`}
                      className="font-bold text-blue-600 text-sm hover:underline hover:text-blue-800 transition-colors"
                    >
                      {selectedBooking.type === "ctv"
                        ? selectedBooking.clientPhone
                        : selectedBooking.phone || "N/A"}
                    </a>

                    {/* Nút Copy SĐT */}
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPhone(
                          selectedBooking.type === "ctv"
                            ? selectedBooking.clientPhone
                            : selectedBooking.phone,
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      title="Copy SĐT"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {selectedBooking.type === "ctv" ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Ngân sách
                      </span>
                      <div className="font-bold text-gray-900 text-sm">
                        {selectedBooking.budget || "Không ghi rõ"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Giá tư vấn
                      </span>
                      <div className="font-bold text-gray-900 text-base">
                        {selectedBooking.consultationPrice || "Chưa nhập"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Ngân sách
                      </span>
                      <div className="font-bold text-gray-900 text-xl">
                        {selectedBooking.budget || "Không ghi rõ"}
                      </div>
                    </div>
                    {selectedBooking.consultationPrice && (
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Giá tư vấn
                        </span>
                        <div className="font-bold text-gray-900 text-xl">
                          {selectedBooking.consultationPrice}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedBooking.type === "ctv" && (
                  <div className="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200/60 mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">
                      Cộng tác viên
                    </span>
                    <div className="font-bold text-gray-900 text-sm">
                      {selectedBooking.ctvName || "N/A"} —{" "}
                      <span className="font-bold text-gray-900 text-sm">
                        {selectedBooking.ctvPhone || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ngày Giờ Khách Xem
                  </span>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatBookingTime(selectedBooking.dateTime)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ghi chú
                  </span>
                  <div className="font-medium text-gray-700 text-sm whitespace-pre-wrap">
                    {selectedBooking.notes || "Không có yêu cầu đặc biệt."}
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquareText className="h-3.5 w-3.5" /> Ghi chú ADMIN
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Thêm ghi chú nội bộ, lý do hủy hoặc phản hồi cho khách..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-blue-50/20"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-bold text-sm w-full md:w-auto"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-[#cda533] transition-colors text-white font-bold text-sm w-full md:w-auto flex items-center justify-center gap-2"
                >
                  {isSavingNote ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL GHI CHÚ ADMIN */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="w-[90%] max-w-[450px] bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-[#cda533]" /> Ghi chú
              phản hồi
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNote} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                Ghi chú ADMIN{" "}
                <span className="text-[10px] font-normal px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  User/CTV sẽ thấy
                </span>
              </label>
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="VD: Đã check căn này chủ nhà đi vắng..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingNote}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2"
              >
                {isSavingNote ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Lưu ghi chú"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL THÊM KHÁCH NGOÀI */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[90%] max-w-[500px] bg-white rounded-3xl p-6 h-[90vh] md:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Thêm lịch khách ngoài
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualAdd} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Tên khách <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  SĐT khách <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) =>
                    setAddForm({ ...addForm, phone: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mã căn</label>
                <input
                  type="text"
                  value={addForm.apartmentCode}
                  onChange={(e) =>
                    setAddForm({ ...addForm, apartmentCode: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ngân sách</label>
                <input
                  type="text"
                  value={addForm.budget}
                  onChange={(e) =>
                    setAddForm({ ...addForm, budget: e.target.value })
                  }
                  placeholder="VD: 5-7tr"
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Ngày xem <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={addForm.bookingDate}
                  onChange={(e) =>
                    setAddForm({ ...addForm, bookingDate: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Giờ xem{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    (Có thể bỏ trống)
                  </span>
                </label>
                <input
                  type="time"
                  value={addForm.bookingTime}
                  onChange={(e) =>
                    setAddForm({ ...addForm, bookingTime: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Giá tư vấn</label>
              <input
                type="text"
                value={addForm.consultationPrice}
                onChange={(e) =>
                  setAddForm({ ...addForm, consultationPrice: e.target.value })
                }
                placeholder="Giá báo khách..."
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Lưu ý thêm</label>
              <textarea
                rows={2}
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm({ ...addForm, notes: e.target.value })
                }
                placeholder="Tài chính, xe điện, pet..."
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>

            <div className="pt-4 md:pt-2 flex flex-col md:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="order-2 md:order-1 px-5 py-3 md:py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="order-1 md:order-2 px-5 py-3 md:py-2.5 rounded-xl bg-[#cda533] hover:bg-[#b88e22] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Tạo lịch hẹn"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
