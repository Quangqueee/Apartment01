"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  getPartnerByIdAction,
  getLandlordApartmentsAction,
} from "@/app/landlord-actions";
import { ADMIN_PATH } from "@/lib/constants";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";

export default function PartnerDetailPage() {
  const { user, userData, loading } = useAuth();
  const { id: partnerId } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();

  const [partner, setPartner] = useState<any>(null);
  const [apartments, setApartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    // Gọi song song 2 API lấy thông tin chủ nhà & danh sách căn hộ
    const [partnerRes, aptsRes] = await Promise.all([
      getPartnerByIdAction(user.uid, partnerId),
      getLandlordApartmentsAction(user.uid, partnerId),
    ]);

    if (partnerRes.error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: partnerRes.error,
      });
      router.push(`/${ADMIN_PATH}/partners`);
      return;
    }

    setPartner(partnerRes.partner);
    setApartments(aptsRes.apartments || []);
    setIsLoading(false);
  }, [user, partnerId, toast, router]);

  useEffect(() => {
    if (!loading && user && userData?.role === "admin") {
      fetchData();
    }
  }, [user, userData, loading, fetchData]);

  if (loading || isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#cda533]" />
      </div>
    );
  if (!partner) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Điều hướng */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="h-10 w-10 shrink-0"
        >
          <Link href={`/${ADMIN_PATH}/partners`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Hồ sơ chi tiết: {partner.displayName}
          </h2>
          <p className="text-gray-500">
            Quản lý các thông tin và bài đăng của đối tác.
          </p>
        </div>
      </div>

      {/* Thẻ Thông tin Đối tác */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{partner.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{partner.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Khu vực: {partner.district}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border min-w-[200px] text-center">
          <span className="block text-sm text-gray-500 font-bold uppercase mb-1">
            Trạng thái tài khoản
          </span>
          {partner.status === "approved" ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Đang hoạt động
            </Badge>
          ) : partner.status === "pending" ? (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
              <Clock className="w-3 h-3 mr-1" /> Đang chờ duyệt
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
              <XCircle className="w-3 h-3 mr-1" /> Đã từ chối
            </Badge>
          )}
        </div>
      </div>

      {/* Bảng Danh sách Căn hộ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#cda533]" />
            Danh sách Căn hộ đã đăng ({apartments.length})
          </h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[30%]">Tiêu đề</TableHead>
              <TableHead>Mức giá</TableHead>
              <TableHead>Trạng thái phòng</TableHead>
              <TableHead>Kiểm duyệt</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apartments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-gray-500"
                >
                  Đối tác này chưa đăng tải căn hộ nào.
                </TableCell>
              </TableRow>
            ) : (
              apartments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium text-gray-900 line-clamp-2">
                    {apt.title}
                    <span className="block text-xs text-gray-500 font-normal mt-1">
                      {apt.district}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-[#cda533]">
                    {apt.price} triệu
                  </TableCell>
                  <TableCell>
                    {apt.status === "available" ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50"
                      >
                        Còn trống
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-500 border-gray-200 bg-gray-50"
                      >
                        Tạm hết
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {apt.submissionStatus === "published" ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Đã xuất bản
                      </Badge>
                    ) : apt.submissionStatus === "pending" ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600">
                        Chờ duyệt
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Bị từ chối</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(apt.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Link
                        href={`/${ADMIN_PATH}/${apt.submissionStatus === "pending" ? "submissions" : "apartments"}`}
                      >
                        Chi tiết <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
