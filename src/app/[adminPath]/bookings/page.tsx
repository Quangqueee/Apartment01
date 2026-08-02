"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
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
  Filter,
  Trash2,
} from "lucide-react";

// ĐÃ IMPORT CÁC COMPONENT ĐƯỢC TÁCH RA TỪ THƯ MỤC CHỨA MODAL
import { AddBookingModal } from "@/app/[adminPath]/bookings/add-bookings-modal";
import {
  CancelConfirmModal,
  DeleteConfirmModal,
  NoteModal,
  DetailsModal,
} from "@/app/[adminPath]/bookings/booking-modals";

const removeVietnameseTones = (str?: string) => {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

interface AdminBooking {
  id: string;
  type: "ctv" | "user" | "external" | "guest";
  apartmentCode?: string;
  apartmentLink?: string;
  clientName?: string;
  clientPhone?: string;
  consultationPrice?: string;
  ctvId?: string;
  ctvName?: string;
  ctvPhone?: string;
  name?: string;
  phone?: string;
  userId?: string;
  budget?: string;
  dateTime?: string;
  notes?: string;
  adminNotes?: string;
  status: string;
  isExternal?: boolean;
  createdByAdminId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function AdminBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [ctvBookings, setCtvBookings] = useState<AdminBooking[]>([]);
  const [userBookings, setUserBookings] = useState<AdminBooking[]>([]);
  const [guestBookings, setGuestBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "all" | "ctv" | "user" | "external" | "guest"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFilterType, setDateFilterType] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "contacted" | "failed"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // STATE QUẢN LÝ MODALS (Đã gọn gàng hơn rất nhiều)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null,
  );
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<{
    isOpen: boolean;
    booking: AdminBooking | null;
  }>({ isOpen: false, booking: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    booking: AdminBooking | null;
  }>({ isOpen: false, booking: null });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    let isCtvLoaded = false;
    let isUserLoaded = false;
    let isGuestLoaded = false;
    const checkLoading = () => {
      if (isCtvLoaded && isUserLoaded && isGuestLoaded) setLoading(false);
    };

    const unsubCTV = onSnapshot(
      query(
        collection(db, "ctv_bookings"),
        orderBy("createdAt", "desc"),
        limit(500),
      ),
      (snap) => {
        setCtvBookings(
          snap.docs.map(
            (doc) =>
              ({ id: doc.id, type: "ctv", ...doc.data() }) as AdminBooking,
          ),
        );
        isCtvLoaded = true;
        checkLoading();
      },
    );

    const unsubUser = onSnapshot(
      query(
        collection(db, "user_bookings"),
        orderBy("createdAt", "desc"),
        limit(500),
      ),
      (snap) => {
        setUserBookings(
          snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              type: d.isExternal ? "external" : "user",
              ...d,
            } as AdminBooking;
          }),
        );
        isUserLoaded = true;
        checkLoading();
      },
    );

    const unsubGuest = onSnapshot(
      query(
        collection(db, "guest_consultations"),
        orderBy("createdAt", "desc"),
        limit(500),
      ),
      (snap) => {
        setGuestBookings(
          snap.docs.map(
            (doc) =>
              ({ id: doc.id, type: "guest", ...doc.data() }) as AdminBooking,
          ),
        );
        isGuestLoaded = true;
        checkLoading();
      },
    );

    return () => {
      unsubCTV();
      unsubUser();
      unsubGuest();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    debouncedSearchTerm,
    dateFilterType,
    startDate,
    endDate,
    statusFilter,
  ]);

  const searchFilteredBookings = useMemo(() => {
    const combined = [...ctvBookings, ...userBookings, ...guestBookings].sort(
      (a, b) => {
        return (
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );
      },
    );

    return combined.filter((b) => {
      if (
        b.type === "external" &&
        b.createdByAdminId &&
        b.createdByAdminId !== user?.uid
      )
        return false;
      if (activeTab !== "all" && b.type !== activeTab) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;

      if (dateFilterType !== "all") {
        if (!b.dateTime) return false;
        const bDateStr = b.dateTime.split("T")[0];
        const bDate = new Date(bDateStr);
        const currentNow = new Date();

        if (dateFilterType === "today") {
          if (bDate.toDateString() !== currentNow.toDateString()) return false;
        } else if (dateFilterType === "week") {
          const startOfWeek = new Date(currentNow);
          startOfWeek.setDate(
            currentNow.getDate() -
              (currentNow.getDay() === 0 ? 6 : currentNow.getDay() - 1),
          );
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

      if (!debouncedSearchTerm) return true;
      const term = removeVietnameseTones(debouncedSearchTerm);
      const matchName =
        removeVietnameseTones(b.name).includes(term) ||
        removeVietnameseTones(b.clientName).includes(term);
      const matchPhone =
        (b.phone || "").includes(debouncedSearchTerm) ||
        (b.clientPhone || "").includes(debouncedSearchTerm);
      const matchCode = removeVietnameseTones(b.apartmentCode).includes(term);

      return matchName || matchPhone || matchCode;
    });
  }, [
    ctvBookings,
    userBookings,
    guestBookings,
    activeTab,
    debouncedSearchTerm,
    dateFilterType,
    startDate,
    endDate,
    statusFilter,
    user?.uid,
  ]);

  const totalPages = Math.ceil(searchFilteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = searchFilteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getCollectionNameByType = (type: string) => {
    if (type === "ctv") return "ctv_bookings";
    if (type === "guest") return "guest_consultations";
    return "user_bookings";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt";
      case "approved":
        return "Đã duyệt";
      case "contacted":
        return "Đã dẫn khách";
      case "failed":
        return "Hủy / Từ chối";
      default:
        return status;
    }
  };

  const getBookingRecipientId = (booking: AdminBooking) =>
    booking.type === "ctv" ? booking.ctvId : booking.userId;

  const notifyStatusChange = async (booking: AdminBooking, newStatus: string) => {
    const recipientId = getBookingRecipientId(booking);
    if (!recipientId) return;
    await createNotification({
      recipientId,
      title: "Cập nhật trạng thái lịch hẹn",
      message: `Lịch hẹn của bạn cho căn ${booking.apartmentCode || "N/A"} đã được chuyển sang trạng thái ${getStatusLabel(newStatus)}.`,
      type: "status_update",
      link: "/profile/bookings",
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
      await updateDoc(
        doc(db, getCollectionNameByType(booking.type), booking.id),
        { status: newStatus, updatedAt: serverTimestamp() },
      );
      await notifyStatusChange(booking, newStatus);
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
      await updateDoc(
        doc(
          db,
          getCollectionNameByType(cancelConfirm.booking.type),
          cancelConfirm.booking.id,
        ),
        { status: "failed", updatedAt: serverTimestamp() },
      );
      await notifyStatusChange(cancelConfirm.booking, "failed");
      toast({
        title: "Đã đổi trạng thái Hủy",
        className: "bg-red-50 text-red-900 border-red-200",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi hủy lịch hẹn" });
    } finally {
      setCancelConfirm({ isOpen: false, booking: null });
    }
  };

  const executeDeleteBooking = async () => {
    if (!deleteConfirm.booking) return;
    try {
      await deleteDoc(
        doc(
          db,
          getCollectionNameByType(deleteConfirm.booking.type),
          deleteConfirm.booking.id,
        ),
      );
      toast({
        title: "Đã xóa vĩnh viễn lịch hẹn",
        className: "bg-green-50 text-green-900 border-green-200",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi khi xóa lịch hẹn" });
    } finally {
      setDeleteConfirm({ isOpen: false, booking: null });
    }
  };

  const handleSaveNote = async (newNoteContent: string) => {
    if (!selectedBooking) return;
    setIsSavingNote(true);
    try {
      await updateDoc(
        doc(
          db,
          getCollectionNameByType(selectedBooking.type),
          selectedBooking.id,
        ),
        { adminNotes: newNoteContent, updatedAt: serverTimestamp() },
      );
      const recipientId = getBookingRecipientId(selectedBooking);
      if (recipientId && newNoteContent.trim()) {
        await createNotification({
          recipientId,
          title: "Ghi chú lịch hẹn được cập nhật",
          message: `Admin đã cập nhật ghi chú cho lịch hẹn căn ${selectedBooking.apartmentCode || "N/A"}: ${newNoteContent}`,
          type: "status_update",
          link: "/profile/bookings",
        });
      }
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
    if (type === "guest")
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
          <Contact className="h-3.5 w-3.5" /> Khách vãng lai
        </div>
      );
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
        <Contact className="h-3.5 w-3.5" /> Cá nhân
      </div>
    );
  };

  if (authLoading || loading) {
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
          <CalendarDays className="h-7 w-7 md:h-8 md:w-8 text-[#cda533]" /> Quản
          lý lịch hẹn
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
                onClick={() => setActiveTab("guest")}
                className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "guest" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <Contact className="h-3.5 w-3.5" /> Khách vãng lai
              </button>
              <button
                onClick={() => setActiveTab("external")}
                className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "external" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <Contact className="h-3.5 w-3.5" /> Khách cá nhân
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="whitespace-nowrap flex items-center justify-center gap-2 bg-[#cda533] text-white px-6 py-2.5 h-[42px] rounded-xl text-sm font-bold shadow-sm hover:bg-[#b88e22] transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Thêm lịch thủ công
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 whitespace-nowrap">
            <Filter className="h-4 w-4" /> Lọc theo lịch hẹn:
          </div>
          <div className="relative w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full md:w-auto h-[38px] pl-4 pr-9 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-600 shadow-sm outline-none cursor-pointer appearance-none hover:bg-gray-50 focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="contacted">Đã liên hệ/dẫn</option>
              <option value="failed">Đã hủy/thất bại</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center opacity-60">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateFilterType === btn.id ? "bg-gray-900 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                {btn.label}
              </button>
            ))}
            {dateFilterType === "custom" && (
              <div className="flex flex-col min-[450px]:flex-row items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm animate-in fade-in slide-in-from-left-4 w-full min-[450px]:w-auto mt-2 min-[450px]:mt-0">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-[450px]:w-auto text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer px-2 py-1"
                />
                <span className="hidden min-[450px]:inline text-gray-300 font-medium">
                  -
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-[450px]:w-auto text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer px-2 py-1"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-200 flex flex-col overflow-hidden">
        {/* VIEW DESKTOP */}
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
                <th className="px-5 py-4 font-bold text-right w-[150px]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-20 text-center text-gray-400 font-medium text-base"
                  >
                    {debouncedSearchTerm || dateFilterType !== "all" || statusFilter !== "all"
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
                      <div
                        className="text-xs text-gray-600 leading-relaxed line-clamp-2"
                        title={booking.notes}
                      >
                        {booking.notes || (
                          <span className="text-gray-400 italic">
                            Không có yêu cầu
                          </span>
                        )}
                      </div>
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
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsNoteModalOpen(true);
                          }}
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
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsNoteModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 w-[120px] h-9 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm mx-auto"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Viết ghi chú
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                          title="Xem / Sửa Form"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({ isOpen: true, booking })
                          }
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors shadow-sm"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VIEW MOBILE */}
        <div className="md:hidden flex flex-col gap-4">
          {currentBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              {debouncedSearchTerm || dateFilterType !== "all" || statusFilter !== "all"
                ? "Không tìm thấy kết quả."
                : "Chưa có dữ liệu."}
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    {renderSourceBadge(booking.type)}
                    <span className="text-[11px] text-gray-400 font-medium">
                      {formatCreationDate(booking.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, booking })}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-between items-start pt-1 gap-2">
                  <div className="flex flex-col">
                    <div className="font-bold text-gray-900 text-base leading-tight mb-0.5">
                      {booking.type === "ctv"
                        ? booking.clientName
                        : booking.name}
                    </div>
                    <div className="font-medium text-gray-500 text-sm">
                      {booking.type === "ctv"
                        ? booking.clientPhone
                        : booking.phone}
                    </div>
                    {booking.type === "ctv" && (
                      <div className="mt-1.5 w-max text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        CTV: {booking.ctvName || "Không rõ"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-right shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                      Mã Căn
                    </span>
                    <div className="font-black text-[#cda533] text-lg leading-none">
                      {booking.apartmentCode || "N/A"}
                    </div>
                    {booking.apartmentLink && (
                      <a
                        href={booking.apartmentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline font-semibold text-[11px] flex items-center gap-1 mt-1.5"
                      >
                        Chi tiết <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      {formatBookingTime(booking.dateTime)}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsDetailsModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#cda533] bg-white px-2.5 py-1.5 border border-gray-200 rounded-lg shadow-sm"
                    >
                      <FileText className="h-3 w-3 inline mr-1 mb-0.5" /> Xem
                      Form
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                  <div className="relative w-full">
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(booking, e.target.value)
                      }
                      className={`w-full h-10 text-center text-xs font-bold uppercase rounded-xl border border-transparent outline-none cursor-pointer appearance-none transition-all shadow-sm ${getStatusClasses(booking.status)}`}
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
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsNoteModalOpen(true);
                    }}
                    className="w-full h-10 px-2 text-[12px] font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Edit3 className="h-3.5 w-3.5" />{" "}
                    {booking.adminNotes ? "Sửa Note" : "Viết Note"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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

      {/* CÁC COMPONENT ĐƯỢC TÁCH RA */}
      <AddBookingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <CancelConfirmModal
        isOpen={cancelConfirm.isOpen}
        booking={cancelConfirm.booking}
        onClose={() => setCancelConfirm({ isOpen: false, booking: null })}
        onConfirm={executeCancelBooking}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        booking={deleteConfirm.booking}
        onClose={() => setDeleteConfirm({ isOpen: false, booking: null })}
        onConfirm={executeDeleteBooking}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        booking={selectedBooking}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        isSaving={isSavingNote}
      />

      <DetailsModal
        isOpen={isDetailsModalOpen}
        booking={selectedBooking}
        onClose={() => setIsDetailsModalOpen(false)}
        onSave={handleSaveNote}
        isSaving={isSavingNote}
      />
    </div>
  );
}
