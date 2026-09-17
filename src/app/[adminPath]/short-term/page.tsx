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
  Building,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { db } from "@/firebase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_PATH } from "@/lib/constants";
import { toShortTermApartment } from "@/lib/short-term-mapper";
import { deleteShortTermApartmentClient } from "@/lib/short-term-write-client";
import type { ShortTermApartment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const SUBMISSION_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  published: { label: "Đang đăng", className: "bg-green-100 text-green-800" },
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  rejected: { label: "Từ chối", className: "bg-red-100 text-red-700" },
};

export default function AdminShortTermPage() {
  const { userData, loading } = useAuth();
  const { toast } = useToast();
  const [apartments, setApartments] = useState<ShortTermApartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ShortTermApartment | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (loading || userData?.role !== "admin") return;
    const q = query(
      collection(db, "short_term_apartments"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setApartments(snap.docs.map(toShortTermApartment));
        setIsLoading(false);
      },
      (error) => {
        console.error("AdminShortTermPage snapshot:", error);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Lỗi tải danh sách",
          description: "Vui lòng thử lại.",
        });
      },
    );
    return () => unsubscribe();
  }, [loading, userData?.role, toast]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return apartments;
    const needle = normalizeSearchText(searchTerm);
    return apartments.filter(
      (apt) =>
        normalizeSearchText(apt.title).includes(needle) ||
        normalizeSearchText(apt.sourceCode || "").includes(needle) ||
        normalizeSearchText(apt.district || "").includes(needle),
    );
  }, [apartments, searchTerm]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteShortTermApartmentClient(
        deleteTarget.id,
        deleteTarget.imageUrls,
      );
      toast({
        title: "Đã xóa căn ngắn hạn",
        className: "bg-green-50 text-green-900 border-green-200",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa căn hộ. Vui lòng thử lại.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
            Căn hộ ngắn hạn
          </h2>
          <p className="text-gray-500">
            Quản lý các căn hộ cho thuê theo đêm ({apartments.length}).
          </p>
        </div>
        <Button
          asChild
          className="bg-[#cda533] hover:bg-[#b88e22] text-white font-bold rounded-xl"
        >
          <Link href={`/${ADMIN_PATH}/short-term/new`}>
            <PlusCircle className="h-4 w-4 mr-1.5" /> Thêm căn ngắn hạn
          </Link>
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, mã căn, quận..."
            className="pl-9 text-base"
          />
        </div>

        <div className="rounded-xl border border-gray-100 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Căn hộ</TableHead>
                <TableHead>Mã căn</TableHead>
                <TableHead>Quận</TableHead>
                <TableHead>Giá/đêm</TableHead>
                <TableHead>Tin đăng</TableHead>
                <TableHead>Phòng</TableHead>
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
                    <Building className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="font-medium">Chưa có căn hộ ngắn hạn nào.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((apt) => {
                  const badge =
                    SUBMISSION_BADGES[apt.submissionStatus || "published"] ||
                    SUBMISSION_BADGES.published;
                  return (
                    <TableRow key={apt.id} className="hover:bg-gray-50">
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-3">
                          {apt.imageUrls?.[0] && (
                            <img
                              src={apt.imageUrls[0]}
                              alt={apt.title}
                              className="h-10 w-14 rounded-md object-cover shrink-0"
                            />
                          )}
                          <span className="font-bold text-gray-900 truncate">
                            {apt.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{apt.sourceCode || "—"}</TableCell>
                      <TableCell>{apt.district}</TableCell>
                      <TableCell className="font-bold text-green-600 whitespace-nowrap">
                        {(apt.nightlyPrice || 0).toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {apt.status === "rented" ? (
                          <span className="text-gray-500 text-sm">
                            Tạm ngưng
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm font-semibold">
                            Nhận khách
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="mr-2"
                        >
                          <Link
                            href={`/${ADMIN_PATH}/short-term/${apt.id}/edit`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(apt)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa căn hộ ngắn hạn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn tin &quot;{deleteTarget?.title}
              &quot; cùng toàn bộ hình ảnh. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Xóa vĩnh viễn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
