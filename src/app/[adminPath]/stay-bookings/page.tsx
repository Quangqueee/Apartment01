"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  BedDouble,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { db } from "@/firebase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { STAY_BOOKING_STATUS_LABELS } from "@/lib/constants";
import {
  approveStayBookingClient,
  deleteStayBookingClient,
  rejectStayBookingClient,
  updateStayBookingStatusClient,
} from "@/lib/stay-bookings-admin-client";
import type { StayBooking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { normalizeSearchText } from "@/lib/utils";

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-red-50 text-red-600",
};

function formatVnDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function AdminStayBookingsPage() {
  const { userData, loading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<StayBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<StayBooking | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<StayBooking | null>(null);

  useEffect(() => {
    if (loading || userData?.role !== "admin") return;
    const q = query(collection(db, "stay_bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setBookings(
          snap.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as StayBooking,
          ),
        );
        setIsLoading(false);
      },
      (error) => {
        console.error("AdminStayBookingsPage snapshot:", error);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [loading, userData?.role]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const isPendingLike =
        booking.status === "pending" || booking.status === "awaiting_payment";
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (!isPendingLike) return false;
        } else if (booking.status !== statusFilter) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const needle = normalizeSearchText(searchTerm);
        return (
          normalizeSearchText(booking.guestName || "").includes(needle) ||
          (booking.guestPhone || "").includes(searchTerm.trim()) ||
          normalizeSearchText(booking.apartmentTitle || "").includes(needle) ||
          normalizeSearchText(booking.apartmentCode || "").includes(needle)
        );
      }
      return true;
    });
  }, [bookings, statusFilter, searchTerm]);

  const pendingCount = bookings.filter(
    (b) => b.status === "pending" || b.status === "awaiting_payment",
  ).length;

  const handleApprove = async (booking: StayBooking) => {
    setActingId(booking.id);
    const res = await approveStayBookingClient(booking);
    setActingId(null);
    if (res.error) {
      toast({
        variant: "destructive",
        title: "Không thể duyệt đơn",
        description: res.error,
      });
    } else {
      toast({
        title: "Đã xác nhận đặt phòng.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActingId(rejectTarget.id);
    const res = await rejectStayBookingClient(rejectTarget, rejectNotes.trim());
    setActingId(null);
    if (res.error) {
      toast({ variant: "destructive", title: "Lỗi", description: res.error });
    } else {
      toast({
        title: "Đã từ chối đơn.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setRejectTarget(null);
      setRejectNotes("");
    }
  };

  const handleStatusChange = async (booking: StayBooking, status: string) => {
    setActingId(booking.id);
    const res = await updateStayBookingStatusClient(booking.id, status);
    setActingId(null);
    if (res.error) {
      toast({ variant: "destructive", title: "Lỗi", description: res.error });
    } else {
      toast({
        title: "Đã cập nhật trạng thái.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActingId(deleteTarget.id);
    const res = await deleteStayBookingClient(deleteTarget.id);
    setActingId(null);
    if (res.error) {
      toast({ variant: "destructive", title: "Lỗi", description: res.error });
    } else {
      toast({
        title: "Đã xóa đơn.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
    }
    setDeleteTarget(null);
  };

  if (loading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-gray-900">
            Đặt phòng ngắn hạn
          </h2>
          <p className="text-gray-500">
            Quản lý yêu cầu đặt phòng theo đêm ({bookings.length} đơn,{" "}
            {pendingCount} chờ duyệt).
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/can-ho-ngan-han" target="_blank">
            <BedDouble className="h-4 w-4 mr-1.5" /> Xem trang khách
          </Link>
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo khách, SĐT, căn hộ..."
              className="pl-9 text-base"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-56 text-base">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STAY_BOOKING_STATUS_LABELS)
                .filter(
                  ([value]) =>
                    value !== "awaiting_payment" && value !== "expired",
                )
                .map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Khách</TableHead>
                <TableHead>Căn hộ</TableHead>
                <TableHead>Nhận → Trả</TableHead>
                <TableHead>Đêm/Khách</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-gray-500"
                  >
                    <BedDouble className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="font-medium">Không có đơn đặt phòng nào.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((booking) => {
                  const isActing = actingId === booking.id;
                  const canReview =
                    booking.status === "pending" ||
                    booking.status === "awaiting_payment";
                  return (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell>
                        <p className="font-bold text-gray-900">
                          {booking.guestName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.guestPhone}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="font-semibold text-gray-900 truncate">
                          {booking.apartmentTitle || booking.apartmentId}
                        </p>
                        {booking.apartmentCode && (
                          <p className="text-xs text-gray-400 font-mono">
                            {booking.apartmentCode}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">
                        {formatVnDate(booking.checkIn)} →{" "}
                        {formatVnDate(booking.checkOut)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {booking.nights} đêm · {booking.guestsCount} khách
                      </TableCell>
                      <TableCell className="font-bold text-green-600 whitespace-nowrap">
                        {(booking.totalAmount || 0).toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUS_BADGES[booking.status] || STATUS_BADGES.pending
                          }
                        >
                          {STAY_BOOKING_STATUS_LABELS[booking.status] ||
                            booking.status}
                        </Badge>
                        {booking.notes && (
                          <p
                            className="text-[11px] text-gray-400 mt-1 max-w-[160px] truncate"
                            title={booking.notes}
                          >
                            {booking.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        {isActing ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {canReview && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(booking)}
                                  className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectTarget(booking);
                                    setRejectNotes("");
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Từ
                                  chối
                                </Button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(booking, "completed")
                                }
                                className="h-8 text-xs"
                              >
                                Hoàn tất
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(booking)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal từ chối */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="bg-white sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Từ chối đơn đặt phòng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Khách {rejectTarget?.guestName} ·{" "}
            {formatVnDate(rejectTarget?.checkIn)} →{" "}
            {formatVnDate(rejectTarget?.checkOut)}
          </p>
          <Textarea
            placeholder="Lý do từ chối (khách sẽ nhìn thấy)..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="text-base"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={actingId === rejectTarget?.id}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm xóa */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đơn đặt phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn của khách {deleteTarget?.guestName} sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
