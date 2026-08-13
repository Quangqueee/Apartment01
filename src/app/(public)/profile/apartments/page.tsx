"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  Search,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  Building,
  Loader2,
  MessageSquareWarning,
} from "lucide-react";
import { getApartments } from "@/lib/data-client";
import Link from "next/link";
import { deleteApartmentAction } from "@/app/actions";
import { consumeApartmentDeleteQuota } from "@/lib/apartment-delete-quota";
import { db } from "@/firebase";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useState,
  useEffect,
  useTransition,
  FormEvent,
  useCallback,
  Suspense,
} from "react";
import { Apartment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  requestPushApartmentAction,
  updateLandlordApartmentStatusAction,
} from "@/app/landlord-actions";

// Hàm xử lý hiển thị thời gian tương đối
function formatRelativeTime(timestamp: any) {
  if (!timestamp) return "N/A";
  const timeSeconds = timestamp.seconds || timestamp._seconds;
  if (!timeSeconds) return "N/A";

  const date = new Date(timeSeconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins <= 0 ? "Vừa xong" : `${diffMins} phút trước`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)} giờ trước`;
  }
  if (diffHours < 24 * 7) {
    return `${Math.floor(diffHours / 24)} ngày trước`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function LandlordApartmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [totalApartments, setTotalApartments] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apartmentToDelete, setApartmentToDelete] = useState<string | null>(
    null,
  );

  const currentPage = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const totalPages = Math.ceil(totalApartments / 10);

  const fetchApartments = useCallback(() => {
    if (!user) return;
    startTransition(async () => {
      try {
        const result = await getApartments({
          query: searchParams.get("q") || undefined,
          page: currentPage,
          limit: 10,
          searchBy: "sourceCodeOrAddress",
        });
        const myApartments = result.apartments.filter(
          (apt: any) => apt.landlordId === user.uid,
        );
        setApartments(myApartments);
        setTotalApartments(myApartments.length);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lỗi tải dữ liệu",
          description: "Không thể lấy danh sách căn hộ.",
        });
      }
    });
  }, [searchParams, currentPage, user, toast]);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/profile/apartments");
    else fetchApartments();
  }, [user, loading, fetchApartments, router]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = async (
    apartmentId: string,
    newStatus: "available" | "rented",
  ) => {
    if (!user) return;
    setUpdatingStatusId(apartmentId);
    try {
      const result = await updateLandlordApartmentStatusAction(
        user.uid,
        apartmentId,
        newStatus,
      );
      if (result?.error) throw new Error(result.error);

      toast({
        title: "Cập nhật thành công!",
        description: `Trạng thái phòng đã chuyển thành: ${newStatus === "available" ? "Còn trống" : "Tạm hết"}.`,
      });
      fetchApartments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Thất bại",
        description: error.message || "Lỗi cập nhật trạng thái.",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setApartmentToDelete(id);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!apartmentToDelete) return;
    startTransition(async () => {
      try {
        const quota = await consumeApartmentDeleteQuota(db, user?.uid);
        if (!quota.ok) {
          toast({
            variant: "destructive",
            title: "Không thể xóa",
            description: quota.error,
          });
          return;
        }

        const result = await deleteApartmentAction(apartmentToDelete);
        if (result?.error) throw new Error(result.error);
        toast({
          title: "Thành công!",
          description: `Đã xóa căn hộ. Còn ${quota.remaining} lượt xóa trong giờ này.`,
        });
        fetchApartments();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: error.message || "Không thể xóa.",
        });
      } finally {
        setDialogOpen(false);
        setApartmentToDelete(null);
      }
    });
  };

  const handlePushClick = async (id: string) => {
    startTransition(async () => {
      try {
        const result = await requestPushApartmentAction(user!.uid, id);
        if (result?.error) throw new Error(result.error);
        toast({
          title: "Đã gửi yêu cầu!",
          description: "Yêu cầu đẩy tin đã gửi tới Admin.",
        });
        fetchApartments();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: error.message || "Không thể yêu cầu đẩy tin.",
        });
      }
    });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10 max-w-[1600px]">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-gray-900">
                Quản lý phòng trống của tôi
              </h2>
              <p className="pt-3 text-gray-500">
                Danh sách các căn hộ bạn đã đăng tải ({totalApartments}).
              </p>
            </div>
            <div>
              <Button
                asChild
                className="bg-[#1a1a1a] text-white hover:bg-[#cda533]"
              >
                <Link href="/submit-apartment">
                  <PlusCircle className="mr-2 h-4 w-4" /> Đăng tin mới
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <form
              onSubmit={handleSearch}
              className="relative w-full md:max-w-sm mb-6"
            >
              <Input
                placeholder="Tìm theo Mã ID hoặc Địa chỉ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10 bg-gray-50 border-gray-200"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              >
                <Search className="h-4 w-4 text-gray-400" />
              </Button>
            </form>

            <div className="hidden md:block rounded-xl border border-gray-100 overflow-x-auto">
              <TooltipProvider>
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-[320px]">Địa chỉ</TableHead>
                      <TableHead>Mã ID</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-[250px]">
                        Ghi chú từ Admin
                      </TableHead>
                      <TableHead>Tình trạng phòng</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Cập nhật</TableHead>
                      <TableHead className="text-center">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apartments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-gray-500"
                        >
                          <Building className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <p className="font-medium">
                            Bạn chưa đăng căn hộ nào.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      apartments.map((apt: any) => (
                        <TableRow key={apt.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <span
                              className="font-bold text-gray-900 line-clamp-2"
                              title={apt.address || apt.title}
                            >
                              {apt.address || apt.title}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {apt.sourceCode || "N/A"}
                          </TableCell>

                          <TableCell>
                            {apt.submissionStatus === "published" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Đã xuất bản
                              </span>
                            ) : apt.submissionStatus === "rejected" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Bị từ chối
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Đang chờ duyệt
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {apt.adminNotes ? (
                              <div className="flex items-start gap-1.5 text-xs text-red-600 font-medium">
                                <MessageSquareWarning className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span
                                  className="line-clamp-2"
                                  title={apt.adminNotes}
                                >
                                  {apt.adminNotes}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs italic">
                                Không có
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Select
                              defaultValue={apt.status || "available"}
                              onValueChange={(val) =>
                                handleStatusChange(
                                  apt.id,
                                  val as "available" | "rented",
                                )
                              }
                              disabled={updatingStatusId === apt.id}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-gray-200">
                                {updatingStatusId === apt.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                                ) : (
                                  <SelectValue placeholder="Trạng thái" />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">
                                  🟢 Còn trống
                                </SelectItem>
                                <SelectItem value="rented">
                                  🔴 Tạm hết
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="font-bold text-green-600 whitespace-nowrap">
                            {apt.price} tr
                          </TableCell>

                          <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                            {formatRelativeTime(
                              apt.updatedAt && apt.updatedAt.seconds > 0
                                ? apt.updatedAt
                                : apt.createdAt,
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePushClick(apt.id)}
                                    disabled={
                                      isPending ||
                                      apt.submissionStatus !== "published" ||
                                      apt.isPushRequested
                                    }
                                    className={
                                      apt.isPushRequested
                                        ? "text-amber-600 border-amber-300 bg-amber-50 h-8 text-xs font-bold cursor-not-allowed"
                                        : "text-blue-600 border-blue-200 h-8 text-xs hover:bg-blue-50"
                                    }
                                  >
                                    <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                                    {apt.isPushRequested
                                      ? "Đang chờ"
                                      : "Yêu cầu đẩy"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white border shadow-md">
                                  <p>Yêu cầu đẩy lên đầu</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link
                                      href={`/submit-apartment?edit=${apt.id}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white border shadow-md">
                                  <p>Sửa thông tin</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(apt.id)}
                                    className="text-destructive hover:text-destructive hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white border shadow-md">
                                  <p>Xóa</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>

            <div className="space-y-4 md:hidden">
              {apartments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border rounded-xl bg-gray-50">
                  <p>Bạn chưa đăng căn hộ nào.</p>
                </div>
              ) : (
                apartments.map((apt: any) => (
                  <Card
                    key={apt.id}
                    className="relative bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-base">
                          {apt.address || apt.title}
                        </h3>
                        <span className="text-green-600 font-bold text-base">
                          {apt.price} tr
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Mã: {apt.sourceCode || "N/A"}</span>
                        <span>
                          {apt.submissionStatus === "published"
                            ? "Đã xuất bản"
                            : apt.submissionStatus === "rejected"
                              ? "Bị từ chối"
                              : "Đang chờ duyệt"}
                        </span>
                      </div>

                      {apt.adminNotes && (
                        <div className="bg-red-50 p-2 rounded-md border border-red-100 flex items-start gap-1.5 mt-1">
                          <MessageSquareWarning className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-red-600 font-medium">
                            Ghi chú: {apt.adminNotes}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-600">
                          Tình trạng phòng:
                        </span>
                        <Select
                          defaultValue={apt.status || "available"}
                          onValueChange={(val) =>
                            handleStatusChange(
                              apt.id,
                              val as "available" | "rented",
                            )
                          }
                          disabled={updatingStatusId === apt.id}
                        >
                          <SelectTrigger className="w-[120px] h-7 text-xs bg-white border-gray-200">
                            <SelectValue placeholder="Trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">
                              🟢 Còn trống
                            </SelectItem>
                            <SelectItem value="rented">🔴 Tạm hết</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-xs text-gray-500 italic">
                          Cập nhật:{" "}
                          {formatRelativeTime(
                            apt.updatedAt && apt.updatedAt.seconds > 0
                              ? apt.updatedAt
                              : apt.createdAt,
                          )}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePushClick(apt.id)}
                            disabled={apt.submissionStatus !== "published"}
                            className="text-blue-600 border-blue-200 h-8 text-xs"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Đẩy
                            top
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs"
                          >
                            <Link href={`/submit-apartment?edit=${apt.id}`}>
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Sửa
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(apt.id)}
                            className="text-red-600 border-red-200 h-8 text-xs hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 pb-2 border-t border-gray-100 mt-4">
              <span className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isPending}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isPending}
                >
                  Sau <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white z-[100] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn căn hộ khỏi hệ thống. Mỗi tài khoản
              chỉ được xóa tối đa 10 căn hộ trong 1 giờ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? "Đang xóa..." : "Xóa ngay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LandlordApartmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#cda533]" />
        </div>
      }
    >
      <LandlordApartmentsContent />
    </Suspense>
  );
}
