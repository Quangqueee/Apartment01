"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  Building,
  Loader2,
  MessageSquareWarning,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { toShortTermApartment } from "@/lib/short-term-mapper";
import { deleteShortTermApartmentClient } from "@/lib/short-term-write-client";
import type { ShortTermApartment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function submissionBadge(status?: string) {
  if (status === "published")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Đã xuất bản
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Bị từ chối
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Đang chờ duyệt
    </span>
  );
}

export default function LandlordShortTermList({ uid }: { uid: string }) {
  const { toast } = useToast();
  const [apartments, setApartments] = useState<ShortTermApartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ShortTermApartment | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "short_term_apartments"),
        where("landlordId", "==", uid),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      setApartments(snap.docs.map(toShortTermApartment));
    } catch (error) {
      console.error("LandlordShortTermList:", error);
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách căn ngắn hạn.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [uid, toast]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteShortTermApartmentClient(
        deleteTarget.id,
        deleteTarget.imageUrls,
      );
      toast({
        title: "Đã xóa tin căn ngắn hạn.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      fetchApartments();
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa. Vui lòng thử lại.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 overflow-x-hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Căn hộ cho thuê theo đêm bạn đã đăng ({apartments.length}).
        </p>
        <Button
          asChild
          size="sm"
          className="bg-[#1a1a1a] text-white hover:bg-[#cda533]"
        >
          <Link href="/submit-apartment?type=short">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Đăng căn ngắn hạn
          </Link>
        </Button>
      </div>

      {apartments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border rounded-xl bg-gray-50">
          <Building className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium">Bạn chưa đăng căn ngắn hạn nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apartments.map((apt) => (
            <Card
              key={apt.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex gap-3">
                  {apt.imageUrls?.[0] && (
                    <img
                      src={apt.imageUrls[0]}
                      alt={apt.title}
                      className="h-16 w-24 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                      {apt.title}
                    </h3>
                    <p className="text-green-600 font-bold text-sm mt-1">
                      {(apt.nightlyPrice || 0).toLocaleString("vi-VN")}đ/đêm
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {apt.district} · Tối đa {apt.maxGuests} khách
                  </span>
                  {submissionBadge(apt.submissionStatus)}
                </div>

                {apt.adminNotes && (
                  <div className="bg-red-50 p-2 rounded-md border border-red-100 flex items-start gap-1.5">
                    <MessageSquareWarning className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-600 font-medium">
                      Ghi chú: {apt.adminNotes}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 text-xs"
                  >
                    <Link href={`/submit-apartment?editShort=${apt.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Sửa
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(apt)}
                    className="text-red-600 border-red-200 h-8 text-xs hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white z-[100] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tin căn ngắn hạn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn tin &quot;{deleteTarget?.title}
              &quot; cùng toàn bộ hình ảnh.
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
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Đang xóa..." : "Xóa ngay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
