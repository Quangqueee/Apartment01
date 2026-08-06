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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  ClipboardCopy,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  Building,
} from "lucide-react";
import { getApartments } from "@/lib/data-client";
import Link from "next/link";
import { deleteApartmentAction, pushApartmentAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useState,
  useEffect,
  useTransition,
  FormEvent,
  useCallback,
} from "react";
import { Apartment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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
import { requestPushApartmentAction } from "@/app/landlord-actions";

export default function LandlordApartmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, userData, loading } = useAuth();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [totalApartments, setTotalApartments] = useState(0);
  const [isPending, startTransition] = useTransition();
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
      // Gọi getApartments và lọc theo landlordId của user hiện tại
      const result = await getApartments({
        query: searchParams.get("q") || undefined,
        page: currentPage,
        limit: 10,
        searchBy: "sourceCodeOrAddress",
      });

      // Lọc danh sách chỉ lấy căn hộ của chính landlord này đăng
      const myApartments = result.apartments.filter(
        (apt: any) => apt.landlordId === user.uid,
      );

      setApartments(myApartments);
      setTotalApartments(myApartments.length);
    });
  }, [searchParams, currentPage, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/profile/apartments");
    } else {
      fetchApartments();
    }
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

  const handleDeleteClick = (id: string) => {
    setApartmentToDelete(id);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!apartmentToDelete) return;
    startTransition(async () => {
      const result = await deleteApartmentAction(apartmentToDelete);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: result.error,
        });
      } else {
        toast({ title: "Thành công!", description: "Đã xóa căn hộ." });
        fetchApartments();
      }
      setDialogOpen(false);
      setApartmentToDelete(null);
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép!", description: "Đã lưu vào bộ nhớ tạm." });
  };

  const handlePushClick = async (id: string) => {
    startTransition(async () => {
      const result = await requestPushApartmentAction(user!.uid, id);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: result.error,
        });
      } else {
        toast({
          title: "Đã gửi yêu cầu!",
          description: "Yêu cầu đẩy tin đã được gửi đến Admin để xét duyệt.",
        });
        fetchApartments(); // Tải lại danh sách để cập nhật trạng thái nút
      }
    });
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10 max-w-6xl">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-gray-900">
                Quản lý phòng trống của tôi
              </h2>
              <p className="text-gray-500">
                Danh sách các căn hộ bạn đã đăng tải ({totalApartments}).
              </p>
            </div>
            <div>
              <Button
                asChild
                className="bg-[#1a1a1a] text-white hover:bg-[#cda533]"
              >
                <Link href="/submit-apartment">
                  <PlusCircle className="mr-2 h-4 w-4" /> Đăng tin căn hộ mới
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

            <div className="hidden md:block rounded-xl border border-gray-100 overflow-hidden">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Mã ID</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Cập nhật</TableHead>
                      <TableHead className="text-center">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apartments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
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
                            <span className="font-bold text-gray-900">
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
                          <TableCell className="font-bold text-green-600">
                            {apt.price} tr
                          </TableCell>
                          <TableCell>
                            {formatDate(
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
                                      ? "Đang chờ duyệt"
                                      : "Yêu cầu đẩy"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white z-[100] border shadow-md">
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
                                <TooltipContent className="bg-white z-[100] border shadow-md">
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
                                <TooltipContent className="bg-white z-[100] border shadow-md">
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
                    <CardContent className="space-y-2 p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-base">
                          {apt.address || apt.title}
                        </h3>
                        <span className="text-green-600 font-bold text-base">
                          {apt.price} tr
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                        <span>Mã: {apt.sourceCode || "N/A"}</span>
                        <span>
                          {apt.submissionStatus === "published"
                            ? "Đã xuất bản"
                            : apt.submissionStatus === "rejected"
                              ? "Bị từ chối"
                              : "Đang chờ duyệt"}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-50 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePushClick(apt.id)}
                          disabled={apt.submissionStatus !== "published"}
                          className="text-blue-600 border-blue-200 h-8 text-xs"
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Đẩy top
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
              Hành động này sẽ xóa vĩnh viễn căn hộ khỏi hệ thống và không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 border-none"
            >
              {isPending ? "Đang xóa..." : "Xóa ngay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
