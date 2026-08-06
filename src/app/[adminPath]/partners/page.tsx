"use client";

import Link from "next/link";
import { ADMIN_PATH } from "@/lib/constants";
import { useState, useEffect, useTransition, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  getPartnersAction,
  approveLandlord,
  rejectLandlord,
  getLandlordApartmentStats,
} from "@/app/landlord-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  Eye,
  Building2,
  BarChart2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminPartnersPage() {
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  // Modal States
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [partnerStats, setPartnerStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchPartners = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const res = await getPartnersAction(user.uid);
    if (res.error) {
      toast({ variant: "destructive", title: "Lỗi", description: res.error });
    } else {
      setPartners(res.partners);
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!loading && user && userData?.role === "admin") {
      fetchPartners();
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [user, userData, loading, fetchPartners]);

  const handleOpenDetails = async (partner: any) => {
    setSelectedPartner(partner);
    setRejectReason("");
    setPartnerStats(null);
    setDetailsModalOpen(true);

    // Fetch stats
    setIsLoadingStats(true);
    const res = await getLandlordApartmentStats(user!.uid, partner.id);
    if (res.stats) {
      setPartnerStats(res.stats);
    }
    setIsLoadingStats(false);
  };

  const handleApprove = () => {
    if (!user || !selectedPartner) return;
    startTransition(async () => {
      const res = await approveLandlord(user.uid, selectedPartner.id);
      if (res?.error) {
        toast({ variant: "destructive", title: "Lỗi", description: res.error });
      } else {
        toast({
          title: "Thành công",
          description: "Đã cấp quyền Chủ nhà cho đối tác.",
        });
        setDetailsModalOpen(false);
        fetchPartners();
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!user || !selectedPartner) return;
    startTransition(async () => {
      const res = await rejectLandlord(
        user.uid,
        selectedPartner.id,
        rejectReason.trim(),
      );
      if (res?.error) {
        toast({ variant: "destructive", title: "Lỗi", description: res.error });
      } else {
        toast({ title: "Đã từ chối", description: "Yêu cầu đã bị từ chối." });
        setDetailsModalOpen(false);
        fetchPartners();
      }
    });
  };

  const filteredPartners = partners.filter((p) => p.status === activeTab);

  if (loading || isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#cda533]" />
      </div>
    );
  if (userData?.role !== "admin")
    return (
      <div className="text-center py-20 text-red-600 font-bold">
        Truy cập bị từ chối
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-gray-900">
            Quản lý Đối tác
          </h2>
          <p className="text-gray-500">
            Xem thông tin chi tiết và thống kê phòng của Chủ nhà.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "pending" ? "border-b-2 border-[#cda533] text-[#cda533]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Yêu cầu chờ duyệt (
          {partners.filter((p) => p.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "approved" ? "border-b-2 border-[#cda533] text-[#cda533]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Đối tác đang hoạt động (
          {partners.filter((p) => p.status === "approved").length})
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Họ tên</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Khu vực</TableHead>
              <TableHead>Ngày hợp tác</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-gray-500"
                >
                  <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  Không có dữ liệu trong mục này.
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((p) => (
                <TableRow
                  key={p.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenDetails(p)}
                >
                  <TableCell className="font-bold">{p.displayName}</TableCell>
                  <TableCell>{p.phoneNumber}</TableCell>
                  <TableCell>{p.district}</TableCell>
                  <TableCell>{formatDate(p.submittedAt)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Chi tiết & Thống kê */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-[#cda533]" />
              Hồ sơ Đối tác: {selectedPartner?.displayName}
            </DialogTitle>
          </DialogHeader>

          {selectedPartner && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              {/* Cột 1: Thông tin cá nhân */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-sm">
                  <h3 className="font-bold text-gray-900 uppercase text-xs mb-3">
                    Thông tin đăng ký
                  </h3>
                  <p>
                    <strong className="text-gray-600">Email:</strong>{" "}
                    {selectedPartner.email}
                  </p>
                  <p>
                    <strong className="text-gray-600">Điện thoại:</strong>{" "}
                    {selectedPartner.phoneNumber}
                  </p>
                  <p>
                    <strong className="text-gray-600">Khu vực:</strong>{" "}
                    {selectedPartner.district}
                  </p>
                  <p>
                    <strong className="text-gray-600">Ngày gửi:</strong>{" "}
                    {formatDate(selectedPartner.submittedAt)}
                  </p>
                  <div className="pt-2 border-t mt-2">
                    <strong className="text-gray-600 block mb-1">
                      Lời nhắn:
                    </strong>
                    <p className="text-gray-800 italic">
                      {selectedPartner.message || "Không có lời nhắn"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cột 2: Thống kê phòng */}
              <div className="space-y-4">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 h-full">
                  <h3 className="font-bold text-blue-900 uppercase text-xs flex items-center gap-1.5 mb-3">
                    <BarChart2 className="h-4 w-4" /> Thống kê căn hộ
                  </h3>

                  {isLoadingStats ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    </div>
                  ) : partnerStats ? (
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white p-3 rounded-lg border shadow-sm">
                        <span className="block text-2xl font-black text-gray-900">
                          {partnerStats.total}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Tổng phòng
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border shadow-sm">
                        <span className="block text-2xl font-black text-green-600">
                          {partnerStats.published}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Đã xuất bản
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border shadow-sm">
                        <span className="block text-2xl font-black text-amber-500">
                          {partnerStats.pending}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Chờ duyệt
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border shadow-sm">
                        <span className="block text-2xl font-black text-red-500">
                          {partnerStats.rejected}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Bị từ chối
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Không có dữ liệu.</p>
                  )}
                </div>
              </div>
              {/* BỔ SUNG: Nút truy cập trang chi tiết Căn hộ */}
              <div className="col-span-1 md:col-span-2 pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-[#cda533] border-[#cda533] hover:bg-[#cda533]/10 h-11 font-bold"
                >
                  <Link href={`/${ADMIN_PATH}/partners/${selectedPartner.id}`}>
                    <Building2 className="mr-2 h-5 w-5" />
                    Xem danh sách chi tiết toàn bộ căn hộ của{" "}
                    {selectedPartner.displayName}
                  </Link>
                </Button>
              </div>
              {/* Phần xử lý (Chỉ hiện nếu đang chờ duyệt) */}
              {selectedPartner.status === "pending" && (
                <div className="col-span-1 md:col-span-2 pt-4 border-t space-y-3">
                  <label className="text-sm font-bold text-gray-700">
                    Lý do từ chối (Chỉ điền khi muốn từ chối)
                  </label>
                  <Textarea
                    placeholder="Nhập lý do nếu bạn muốn từ chối đối tác này..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="bg-gray-50"
                  />
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="destructive"
                      onClick={handleRejectConfirm}
                      disabled={isPending || !rejectReason.trim()}
                      className="bg-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Từ chối yêu cầu
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Duyệt Đối tác
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
