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
  ArrowUpCircle, // BỔ SUNG: Import icon cho nút Push
} from "lucide-react";
import { getApartments } from "@/lib/data-client";
import Link from "next/link";
import {
  deleteApartmentAction,
  getUnmigratedApartmentsAction,
  migrateApartmentsBatchAction,
  getUnmigratedAiApartmentsAction,
  migrateAiApartmentsBatchAction,
  pushApartmentAction, // BỔ SUNG: Import action Push bạn vừa tạo ở Bước 1
} from "../../actions";
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
import { ADMIN_PATH } from "@/lib/constants";

export default function ApartmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

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
    startTransition(async () => {
      const result = await getApartments({
        query: searchParams.get("q") || undefined,
        page: currentPage,
        limit: 10,
        searchBy: "sourceCodeOrAddress",
      });
      setApartments(result.apartments);
      setTotalApartments(result.totalResults);
    });
  }, [searchParams, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

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

  // BỔ SUNG: Hàm xử lý khi bấm nút Push Căn hộ
  const handlePushClick = async (id: string) => {
    startTransition(async () => {
      const result = await pushApartmentAction(id);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: result.error,
        });
      } else {
        toast({
          title: "Thành công!",
          description: "Căn hộ đã được đẩy lên đầu trang.",
        });
        fetchApartments(); // Tải lại danh sách để thấy căn hộ nhảy lên đầu
      }
    });
  };

  const handleMigrate = async () => {
    const confirm = window.confirm(
      "Đồng bộ từ khóa cho tất cả căn hộ cũ? Quá trình này sẽ mất vài giây.",
    );
    if (!confirm) return;

    const { id, update } = toast({
      title: "Đang quét dữ liệu...",
      description: "Đang kiểm tra các căn hộ cần đồng bộ.",
      duration: 100000,
    });

    const res = await getUnmigratedApartmentsAction();

    if (res?.error || !res.data) {
      update({
        id,
        variant: "destructive",
        title: "Lỗi",
        description: res.error,
      });
      return;
    }

    const unmigrated = res.data;
    const total = unmigrated.length;

    if (total === 0) {
      update({
        id,
        title: "Hoàn tất!",
        description:
          "Tất cả căn hộ của bạn đã được chuẩn hóa, không cần đồng bộ thêm.",
        duration: 3000,
      });
      return;
    }

    const BATCH_SIZE = 20;
    let processed = 0;

    const updateProgressToast = (current: number) => {
      const percentage = Math.round((current / total) * 100);
      update({
        id,
        title: "Đang đồng bộ dữ liệu...",
        description: (
          <div className="space-y-2 mt-2 w-full pr-4">
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>
                {current} / {total} căn
              </span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        ),
        duration: 100000,
      });
    };

    updateProgressToast(0);

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = unmigrated.slice(i, i + BATCH_SIZE);
      const batchRes = await migrateApartmentsBatchAction(batch);

      if (batchRes?.error) {
        update({
          id,
          variant: "destructive",
          title: "Lỗi",
          description: "Tiến trình bị gián đoạn.",
        });
        return;
      }

      processed += batch.length;
      updateProgressToast(processed);
    }

    setTimeout(() => {
      update({
        id,
        title: "Đồng bộ hoàn tất! 🎉",
        description: `Đã đồng bộ ${total} căn hộ. `,
        duration: 4000,
      });
      fetchApartments();
    }, 500);
  };

  const handleAiMigrate = async () => {
    const confirmwindow = window.confirm(
      "Tự động viết lại nội dung chuẩn SEO cho tất cả căn hộ cũ bằng AI? Quá trình này sẽ gọi AI và mất chút thời gian.",
    );
    if (!confirmwindow) return;

    const { id, update } = toast({
      title: "Đang quét căn hộ thiếu AI...",
      description: "Đang kiểm tra dữ liệu cũ.",
      duration: 100000,
    });

    const res = await getUnmigratedAiApartmentsAction();

    if (res?.error || !res.data) {
      update({
        id,
        variant: "destructive",
        title: "Lỗi",
        description: res.error,
      });
      return;
    }

    const unmigratedAi = res.data;
    const totalAi = unmigratedAi.length;

    if (totalAi === 0) {
      update({
        id,
        title: "Hoàn tất!",
        description: "Tất cả căn hộ đã có nội dung chuẩn SEO từ AI.",
        duration: 3000,
      });
      return;
    }

    const BATCH_SIZE_AI = 5;
    let processedAi = 0;

    const updateAiProgressToast = (current: number) => {
      const percentage = Math.round((current / totalAi) * 100);
      update({
        id,
        title: "AI đang tối ưu hóa nội dung SEO...",
        description: (
          <div className="space-y-2 mt-2 w-full pr-4">
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>
                Đã xử lý: {current} / {totalAi} căn
              </span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        ),
        duration: 100000,
      });
    };

    updateAiProgressToast(0);

    for (let i = 0; i < totalAi; i += BATCH_SIZE_AI) {
      const batch = unmigratedAi.slice(i, i + BATCH_SIZE_AI);
      const batchRes = await migrateAiApartmentsBatchAction(batch);

      if (batchRes?.error) {
        update({
          id,
          variant: "destructive",
          title: "Lỗi",
          description: "Tiến trình AI bị gián đoạn.",
        });
        return;
      }

      processedAi += batch.length;
      updateAiProgressToast(processedAi);
    }

    setTimeout(() => {
      update({
        id,
        title: "Tối ưu AI hoàn tất! 🎉",
        description: `Đã tạo nội dung chuẩn SEO cho ${totalAi} căn hộ.`,
        duration: 4000,
      });
      fetchApartments();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Quản lý Căn hộ
          </h2>
          <p className="text-gray-500">
            Danh sách tất cả các căn hộ ({totalApartments}).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleMigrate}
            variant="outline"
            className="text-blue-600 border-blue-600"
          >
            Đồng bộ Từ khóa Cũ
          </Button>

          <Button
            onClick={handleAiMigrate}
            variant="outline"
            className="text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            ✨ Tối ưu SEO AI hàng loạt
          </Button>

          <Button
            asChild
            className="bg-[#1a1a1a] text-white hover:bg-[#cda533]"
          >
            <Link href={`/${ADMIN_PATH}/apartments/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm mới
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <form
          onSubmit={handleSearch}
          className="relative w-full md:max-w-sm mb-4"
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

        <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Mã ID</TableHead>
                  <TableHead>SĐT Chủ nhà</TableHead>
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
                      className="text-center py-8 text-gray-500"
                    >
                      Không tìm thấy căn hộ nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  apartments.map((apt) => (
                    <TableRow key={apt.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                          className="text-primary hover:underline font-bold"
                        >
                          {apt.address}
                        </Link>
                      </TableCell>
                      <TableCell>{apt.sourceCode}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{apt.landlordPhoneNumber}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(apt.landlordPhoneNumber)}
                          >
                            <ClipboardCopy className="h-3 w-3" />
                          </Button>
                        </div>
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
                          {/* BỔ SUNG: Nút Push */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePushClick(apt.id)}
                                disabled={isPending}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white z-[100] border shadow-md">
                              <p>Đẩy lên đầu</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white z-[100] border shadow-md">
                              <p>Sửa</p>
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
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              Không tìm thấy căn hộ nào.
            </div>
          ) : (
            apartments.map((apt) => (
              <Card
                key={apt.id}
                className="relative bg-white border border-gray-200"
              >
                <CardContent className="space-y-2 p-4">
                  <Link
                    href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                    className="pr-10 font-bold text-primary hover:underline line-clamp-2 text-base"
                  >
                    {apt.address}
                  </Link>
                  <div className="absolute right-2 top-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white z-[100] shadow-xl border-gray-200"
                      >
                        {/* BỔ SUNG: Nút Push trên Mobile */}
                        <DropdownMenuItem
                          onClick={() => handlePushClick(apt.id)}
                          disabled={isPending}
                          className="text-blue-600 focus:text-blue-700"
                        >
                          <ArrowUpCircle className="mr-2 h-4 w-4" /> Đẩy lên đầu
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Sửa
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(apt.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 mb-2">
                    <span>
                      ID:{" "}
                      <span className="font-mono font-bold">
                        {apt.sourceCode}
                      </span>
                    </span>
                    <span className="text-green-600 font-bold text-base">
                      {apt.price} tr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-500">Chủ nhà:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">
                        {apt.landlordPhoneNumber}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleCopy(apt.landlordPhoneNumber)}
                      >
                        <ClipboardCopy className="h-4 w-4 text-blue-500" />
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
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white z-[100] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác.
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
