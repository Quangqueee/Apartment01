"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  deleteDoc, // ĐÃ BỔ SUNG: Hàm xóa Document
  serverTimestamp,
  onSnapshot,
  getDocs,
  query,
  where,
  orderBy,
  limit,
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
  UserPlus,
  Users,
  X,
  Trash2, // ĐÃ BỔ SUNG: Icon thùng rác
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  [key: string]: any;
}

export default function AdminBookingsPage() {
  const { user, loading: authLoading } = useAuth();

  const [ctvBookings, setCtvBookings] = useState<AdminBooking[]>([]);
  const [userBookings, setUserBookings] = useState<AdminBooking[]>([]);
  const [guestBookings, setGuestBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [ctvList, setCtvList] = useState<any[]>([]);
  const [ctvSearchTerm, setCtvSearchTerm] = useState("");
  const [isCtvDropdownOpen, setIsCtvDropdownOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "all" | "ctv" | "user" | "external" | "guest"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
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

  const [cancelConfirm, setCancelConfirm] = useState<{
    isOpen: boolean;
    booking: AdminBooking | null;
  }>({ isOpen: false, booking: null });

  // ĐÃ BỔ SUNG: State quản lý việc Xóa lịch
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    booking: AdminBooking | null;
  }>({ isOpen: false, booking: null });

  const [addForm, setAddForm] = useState({
    bookingType: "external",
    ctvId: "",
    ctvName: "",
    ctvPhone: "",
    name: "",
    phone: "",
    apartmentCode: "",
    budget: "",
    consultationPrice: "",
    bookingDate: "",
    bookingTime: "",
    notes: "",
  });

  // Biến kiểm tra xem CTV có đang được chọn từ list hay không
  const isCtvSelectedFromList =
    !!(addForm.ctvId && addForm.ctvId !== "manual_entry");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchCTVs = async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "collaborator"),
      );
      const snap = await getDocs(q);
      const ctvs = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
      setCtvList(ctvs);
    };
    fetchCTVs();
  }, []);

  const normalizedCtvSearchTerm = removeVietnameseTones(ctvSearchTerm);
  const filteredCtvs = ctvList.filter(
    (c) =>
      removeVietnameseTones(c.displayName).includes(normalizedCtvSearchTerm) ||
      (c.phoneNumber || "").includes(ctvSearchTerm),
  );

  useEffect(() => {
    setLoading(true);
    let isCtvLoaded = false;
    let isUserLoaded = false;
    let isGuestLoaded = false;
    const checkLoading = () => {
      if (isCtvLoaded && isUserLoaded && isGuestLoaded) setLoading(false);
    };

    const ctvQuery = query(
      collection(db, "ctv_bookings"),
      orderBy("createdAt", "desc"),
      limit(500),
    );
    const unsubCTV = onSnapshot(ctvQuery, (snap) => {
      const data = snap.docs.map(
        (doc) => ({ id: doc.id, type: "ctv", ...doc.data() }) as AdminBooking,
      );
      setCtvBookings(data);
      isCtvLoaded = true;
      checkLoading();
    });

    const userQuery = query(
      collection(db, "user_bookings"),
      orderBy("createdAt", "desc"),
      limit(500),
    );
    const unsubUser = onSnapshot(userQuery, (snap) => {
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
    });

    const guestQuery = query(
      collection(db, "guest_consultations"),
      orderBy("createdAt", "desc"),
      limit(500),
    );
    const unsubGuest = onSnapshot(guestQuery, (snap) => {
      const data = snap.docs.map(
        (doc) => ({ id: doc.id, type: "guest", ...doc.data() }) as AdminBooking,
      );
      setGuestBookings(data);
      isGuestLoaded = true;
      checkLoading();
    });

    return () => {
      unsubCTV();
      unsubUser();
      unsubGuest();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearchTerm, dateFilterType, startDate, endDate]);

  const searchFilteredBookings = useMemo(() => {
    const combined = [...ctvBookings, ...userBookings, ...guestBookings].sort(
      (a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      },
    );

    return combined.filter((b) => {
      if (
        b.type === "external" &&
        b.createdByAdminId &&
        b.createdByAdminId !== user?.uid
      ) {
        return false;
      }
      if (activeTab !== "all" && b.type !== activeTab) return false;

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
      const collectionName = getCollectionNameByType(booking.type);
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
      const collectionName = getCollectionNameByType(
        cancelConfirm.booking.type,
      );
      await updateDoc(doc(db, collectionName, cancelConfirm.booking.id), {
        status: "failed",
        updatedAt: serverTimestamp(),
      });
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

  // ĐÃ BỔ SUNG: Hàm thực thi xóa dữ liệu khỏi Firestore
  const executeDeleteBooking = async () => {
    if (!deleteConfirm.booking) return;
    try {
      const collectionName = getCollectionNameByType(
        deleteConfirm.booking.type,
      );
      await deleteDoc(doc(db, collectionName, deleteConfirm.booking.id));
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

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSavingNote(true);
    try {
      const collectionName = getCollectionNameByType(selectedBooking.type);
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

  const handleAddFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectCtvForAdd = (ctv: any) => {
    setAddForm((prev) => ({
      ...prev,
      ctvId: ctv.uid,
      ctvName: ctv.displayName || "",
      ctvPhone: ctv.phoneNumber || "",
    }));
    setCtvSearchTerm(`${ctv.displayName} - ${ctv.phoneNumber}`);
    setIsCtvDropdownOpen(false);
  };

  const handleClearSelectedCtv = () => {
    setAddForm((prev) => ({ ...prev, ctvId: "", ctvName: "", ctvPhone: "" }));
    setCtvSearchTerm("");
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const finalDateTime = addForm.bookingTime
        ? `${addForm.bookingDate}T${addForm.bookingTime}`
        : addForm.bookingDate;

      let payload: any = {
        apartmentCode: addForm.apartmentCode,
        budget: addForm.budget,
        consultationPrice: addForm.consultationPrice,
        dateTime: finalDateTime,
        notes: addForm.notes,
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (addForm.bookingType === "ctv") {
        payload = {
          ...payload,
          ctvId: addForm.ctvId || "manual_entry",
          ctvName: addForm.ctvName || "Chưa rõ",
          ctvPhone: addForm.ctvPhone || "N/A",
          clientName: addForm.name,
          clientPhone: addForm.phone,
          createdByAdminId: user?.uid,
        };
        await addDoc(collection(db, "ctv_bookings"), payload);
      } else {
        payload = {
          ...payload,
          name: addForm.name,
          phone: addForm.phone,
          isExternal: true,
          createdByAdminId: user?.uid,
        };
        await addDoc(collection(db, "user_bookings"), payload);
      }

      toast({
        title: "Đã tạo lịch thành công",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsAddModalOpen(false);
      setCtvSearchTerm("");
      setAddForm({
        bookingType: "external",
        ctvId: "",
        ctvName: "",
        ctvPhone: "",
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
      toast({ variant: "destructive", title: "Lỗi tạo lịch" });
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
                </th>{" "}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
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
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(booking)}
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
              {debouncedSearchTerm || dateFilterType !== "all"
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
                  {/* ĐÃ BỔ SUNG: Nút xóa trên Mobile */}
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
                      onClick={() => openDetailsModal(booking)}
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
                    onClick={() => openNoteModal(booking)}
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

      {/* POPUP HỦY TRẠNG THÁI */}
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
              Đổi trạng thái thành Hủy?
            </DialogTitle>
            <p className="text-red-600/80 text-sm mt-1.5 font-medium">
              Lịch này sẽ bị đánh dấu Hủy nhưng vẫn lưu trong hệ thống.
            </p>
          </div>
          <div className="p-6">
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
                Đồng ý
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ĐÃ BỔ SUNG: POPUP XÁC NHẬN XÓA VĨNH VIỄN */}
      <Dialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ isOpen: false, booking: null })
        }
      >
        <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border-0">
          <div className="bg-red-600 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Xóa vĩnh viễn lịch hẹn?
            </DialogTitle>
            <p className="text-white/80 text-sm mt-1.5 font-medium px-4">
              Lịch hẹn này sẽ bị xóa hoàn toàn khỏi hệ thống và biến mất khỏi
              tài khoản của CTV/User. Không thể hoàn tác!
            </p>
          </div>
          <div className="p-6 bg-white">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6 space-y-2">
              <div className="text-sm text-red-800 flex justify-between items-center gap-2">
                <span className="whitespace-nowrap">Khách hàng:</span>
                <span className="font-bold text-right">
                  {deleteConfirm.booking?.name ||
                    deleteConfirm.booking?.clientName ||
                    "N/A"}
                </span>
              </div>
              <div className="text-sm text-red-800 flex justify-between items-center gap-2">
                <span className="whitespace-nowrap">Mã căn hộ:</span>
                <span className="font-bold text-right">
                  {deleteConfirm.booking?.apartmentCode || "N/A"}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, booking: null })
                }
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Thoát
              </button>
              <button
                onClick={executeDeleteBooking}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent
          className={
            "p-0 border-none shadow-2xl z-[100] gap-0 bg-gray-50 flex flex-col [&>button.absolute]:hidden sm:max-w-[650px] sm:max-h-[85vh] sm:rounded-2xl overflow-hidden max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full max-sm:duration-300 max-sm:ease-out"
          }
        >
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
                Form Yêu Cầu
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
              onSubmit={handleSaveNote}
              className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6 sm:py-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block">
                        Mã căn
                      </span>
                      <div className="font-black text-[#cda533] text-xl sm:text-2xl leading-none mt-1">
                        {selectedBooking.apartmentCode || "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block">
                        Ngày tạo
                      </span>
                      <div className="font-bold text-gray-700 text-xs sm:text-sm mt-1">
                        {formatCreationDate(selectedBooking.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-y-3 sm:gap-y-4 text-sm sm:text-base">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Tên khách:
                      </span>
                      <span className="font-bold text-gray-900">
                        {selectedBooking.type === "ctv"
                          ? selectedBooking.clientName
                          : selectedBooking.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        SĐT Khách:
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${selectedBooking.type === "ctv" ? selectedBooking.clientPhone : selectedBooking.phone}`}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          {selectedBooking.type === "ctv"
                            ? selectedBooking.clientPhone
                            : selectedBooking.phone || "N/A"}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPhone(
                              selectedBooking.type === "ctv"
                                ? selectedBooking.clientPhone
                                : selectedBooking.phone,
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Ngân sách:
                      </span>
                      <span className="font-bold text-gray-900">
                        {selectedBooking.budget || "Không rõ"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Giá tư vấn:
                      </span>
                      <span className="font-bold text-gray-900">
                        {selectedBooking.consultationPrice || "Chưa nhập"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBooking.type === "ctv" && (
                  <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest block mb-1">
                        Cộng tác viên
                      </span>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        {selectedBooking.ctvName || "Chưa rõ"}{" "}
                        <span className="mx-2 text-gray-300">|</span>{" "}
                        <a
                          href={`tel:${selectedBooking.ctvPhone}`}
                          className="text-blue-700 hover:underline"
                        >
                          {selectedBooking.ctvPhone || "N/A"}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(selectedBooking.ctvPhone)}
                      className="p-2.5 bg-white text-gray-500 hover:text-gray-900 rounded-lg shadow-sm border border-blue-100 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
                    <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        Lịch khách xem
                      </span>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        {formatBookingTime(selectedBooking.dateTime)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Ghi chú từ khách:
                    </span>
                    <div className="font-medium text-gray-700 text-sm sm:text-base whitespace-pre-wrap leading-snug">
                      {selectedBooking.notes || (
                        <span className="italic text-gray-400">
                          Không có yêu cầu.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 pb-2">
                  <label className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 ml-1">
                    <MessageSquareText className="h-4 w-4" /> Ghi chú ADMIN (Sửa
                    được)
                  </label>
                  <textarea
                    rows={2}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Nhập ghi chú nội bộ, lý do hủy..."
                    className="w-full border border-gray-200 rounded-xl p-3.5 text-sm sm:text-base resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-white shadow-sm transition-all"
                  />
                </div>
              </div>
              <div className="shrink-0 p-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-white z-20 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="w-full h-12 rounded-xl bg-gray-900 hover:bg-[#cda533] text-white font-bold text-[15px] sm:text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isSavingNote ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Lưu ghi chú Admin"
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                placeholder="VD: Khách ưng phòng, chăm thêm,..."
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

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setCtvSearchTerm("");
            setIsCtvDropdownOpen(false);
          }
        }}
      >
        <DialogContent className="w-[90%] max-w-[500px] bg-white rounded-3xl p-6 h-[90vh] md:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Thêm lịch thủ công
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualAdd} className="space-y-4 mt-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() =>
                  setAddForm({ ...addForm, bookingType: "external" })
                }
                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${addForm.bookingType === "external" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <UserPlus className="h-4 w-4" /> Khách cá nhân
              </button>
              <button
                type="button"
                onClick={() => setAddForm({ ...addForm, bookingType: "ctv" })}
                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${addForm.bookingType === "ctv" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Users className="h-4 w-4" /> Khách CTV
              </button>
            </div>

            {addForm.bookingType === "ctv" && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3 animate-in slide-in-from-top-2">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-blue-800">
                    Tìm & chọn CTV trong hệ thống
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <input
                      type="text"
                      placeholder="Gõ tên hoặc SĐT để tìm..."
                      value={ctvSearchTerm}
                      onChange={(e) => {
                        setCtvSearchTerm(e.target.value);
                        setIsCtvDropdownOpen(true);
                      }}
                      onFocus={() => setIsCtvDropdownOpen(true)}
                      className="w-full pl-9 pr-3 py-2.5 border border-blue-200 rounded-lg text-sm outline-none bg-white focus:border-blue-400 shadow-sm transition-all"
                    />
                    {isCtvDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsCtvDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-h-48 overflow-y-auto divide-y divide-gray-50">
                          {filteredCtvs.length > 0 ? (
                            filteredCtvs.map((c) => (
                              <div
                                key={c.uid}
                                onClick={() => handleSelectCtvForAdd(c)}
                                className="px-4 py-2.5 hover:bg-blue-50/80 cursor-pointer flex flex-col transition-colors"
                              >
                                <span className="font-bold text-gray-900 text-sm">
                                  {c.displayName}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {c.phoneNumber}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-sm text-gray-400 text-center italic">
                              Không tìm thấy CTV nào.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-blue-100/50 relative">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Tên CTV <span className="text-red-500">*</span>
                    </label>
                    <input
                      required={addForm.bookingType === "ctv"}
                      type="text"
                      name="ctvName"
                      value={addForm.ctvName}
                      onChange={handleAddFormChange}
                      readOnly={isCtvSelectedFromList}
                      className={`w-full border rounded-md p-2 text-sm outline-none ${isCtvSelectedFromList ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white/60 focus:border-blue-400"}`}
                      placeholder="Tên CTV..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      SĐT CTV
                    </label>
                    <input
                      type="text"
                      name="ctvPhone"
                      value={addForm.ctvPhone}
                      onChange={handleAddFormChange}
                      readOnly={isCtvSelectedFromList}
                      className={`w-full border rounded-md p-2 text-sm outline-none ${isCtvSelectedFromList ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white/60 focus:border-blue-400"}`}
                      placeholder="SĐT CTV..."
                    />
                  </div>
                  {/* ĐÃ BỔ SUNG: Nút Bỏ chọn CTV nếu đã chọn từ List */}
                  {isCtvSelectedFromList && (
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={handleClearSelectedCtv}
                        className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                      >
                        Huỷ chọn CTV này (Nhập tay)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Tên khách <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddFormChange}
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
                  name="phone"
                  value={addForm.phone}
                  onChange={handleAddFormChange}
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mã căn</label>
                <input
                  type="text"
                  name="apartmentCode"
                  value={addForm.apartmentCode}
                  onChange={handleAddFormChange}
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ngân sách</label>
                <input
                  type="text"
                  name="budget"
                  value={addForm.budget}
                  onChange={handleAddFormChange}
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
                  name="bookingDate"
                  value={addForm.bookingDate}
                  onChange={handleAddFormChange}
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
                  name="bookingTime"
                  value={addForm.bookingTime}
                  onChange={handleAddFormChange}
                  className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Giá tư vấn</label>
              <input
                type="text"
                name="consultationPrice"
                value={addForm.consultationPrice}
                onChange={handleAddFormChange}
                placeholder="Giá báo khách..."
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Lưu ý thêm</label>
              <textarea
                rows={2}
                name="notes"
                value={addForm.notes}
                onChange={handleAddFormChange}
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
