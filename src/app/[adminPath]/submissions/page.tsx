"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getPendingSubmissionsAction, reviewApartmentSubmission } from "@/app/landlord-actions";
import { Apartment } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Eye, Building, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminSubmissionsPage() {
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State cho Modal duyệt bài
  const [selectedSubmission, setSelectedSubmission] = useState<Apartment | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sourceCode, setSourceCode] = useState("");
  const [address, setAddress] = useState("");
  const [landlordPhoneNumber, setLandlordPhoneNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const res = await getPendingSubmissionsAction(user.uid);
    if (res.error) {
      toast({ variant: "destructive", title: "Lỗi", description: res.error });
    } else {
      setSubmissions(res.apartments);
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!loading && user && userData?.role === "admin") {
      fetchSubmissions();
    } else if (!loading && (!user || userData?.role !== "admin")) {
      setIsLoading(false);
    }
  }, [user, userData, loading, fetchSubmissions]);

  const handleOpenReview = (apt: Apartment) => {
    setSelectedSubmission(apt);
    setSourceCode(apt.sourceCode || "");
    setAddress(apt.address || apt.district || "");
    setLandlordPhoneNumber(apt.landlordPhoneNumber || apt.contactPhone || "");
    setAdminNotes("");
    setReviewModalOpen(true);
  };

  const handleReviewAction = async (decision: "published" | "rejected") => {
    if (!selectedSubmission || !user) return;

    if (decision === "published") {
      if (!sourceCode.trim() || !address.trim() || !landlordPhoneNumber.trim()) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Vui lòng nhập Mã ID, Địa chỉ chính xác và SĐT chủ nhà trước khi xuất bản.",
        });
        return;
      }
    }

    startTransition(async () => {
      const res = await reviewApartmentSubmission(user.uid, selectedSubmission.id, decision, {
        sourceCode: sourceCode.trim(),
        address: address.trim(),
        landlordPhoneNumber: landlordPhoneNumber.trim(),
        adminNotes: adminNotes.trim(),
      });

      if (res?.error) {
        toast({ variant: "destructive", title: "Lỗi", description: res.error });
      } else {
        toast({
          title: "Thành công",
          description: decision === "published" ? "Đã duyệt và xuất bản căn hộ." : "Đã từ chối tin đăng.",
        });
        setReviewModalOpen(false);
        setSelectedSubmission(null);
        fetchSubmissions();
      }
    });
  };

  if (loading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (userData?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-600">Truy cập bị từ chối</h1>
        <p className="text-gray-500 mt-2">Bạn không có quyền truy cập trang quản trị này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-gray-900">
            Duyệt tin đăng căn hộ
          </h2>
          <p className="text-gray-500">
            Danh sách các tin đăng từ chủ nhà đang chờ xét duyệt ({submissions.length}).
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Tiêu đề / Địa chỉ hiển thị</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>SĐT liên hệ</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Building className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="font-medium">Không có tin đăng nào đang chờ duyệt.</p>
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((apt: any) => (
                  <TableRow key={apt.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold text-gray-900 max-w-xs truncate">
                      {apt.title}
                    </TableCell>
                    <TableCell>{apt.district}</TableCell>
                    <TableCell className="font-bold text-green-600">{apt.price} tr</TableCell>
                    <TableCell>{apt.contactPhone || apt.landlordPhoneNumber}</TableCell>
                    <TableCell>{formatDate(apt.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(apt)}
                        className="bg-gray-900 text-white hover:bg-[#cda533]"
                      >
                        <Eye className="h-4 w-4 mr-1.5" /> Xét duyệt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Xét duyệt */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Xét duyệt tin đăng căn hộ</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm border">
                <p><strong className="text-gray-700">Tiêu đề:</strong> {selectedSubmission.title}</p>
                <p><strong className="text-gray-700">Dạng phòng:</strong> {selectedSubmission.roomType} | <strong className="text-gray-700">Quận:</strong> {selectedSubmission.district} | <strong className="text-gray-700">Diện tích:</strong> {selectedSubmission.area} m²</p>
                <p><strong className="text-gray-700">Giá:</strong> {selectedSubmission.price} triệu/tháng | <strong className="text-gray-700">Hoa hồng:</strong> {selectedSubmission.commission || "N/A"}</p>
                <p><strong className="text-gray-700">Thông tin chi tiết:</strong> {selectedSubmission.details}</p>
                <div className="pt-2">
                  <p className="font-semibold text-gray-700 mb-1">Hình ảnh căn hộ:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedSubmission.imageUrls?.map((url, idx) => (
                      <img key={idx} src={url} alt="preview" className="h-20 w-full object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-bold font-airbnb text-gray-900 text-sm uppercase tracking-wider">Thông tin quản trị bổ sung </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-gray-600">Mã nguồn</label>
                    <Input
                      placeholder="VD. TH0123"
                      value={sourceCode}
                      onChange={(e) => setSourceCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-gray-600">SĐT Chủ nhà</label>
                    <Input
                      placeholder="VD. 0912345678"
                      value={landlordPhoneNumber}
                      onChange={(e) => setLandlordPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-gray-600">Địa chỉ chính xác (Bảo mật)</label>
                  <Input
                    placeholder="VD. Số 12 ngõ 34 phố Huế, Hàng Bài..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-gray-600">Ghi chú</label>
                  <Textarea
                    placeholder="Nhập ghi chú hoặc lý do từ chối..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => handleReviewAction("rejected")}
              disabled={isPending}
              className="gap-1.5 bg-gray-700 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 text-black hover:text-red-500" /> Từ chối
            </Button>
            <Button
              onClick={() => handleReviewAction("published")}
              disabled={isPending}
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Duyệt & Xuất bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}