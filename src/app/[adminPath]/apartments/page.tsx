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
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  deleteApartmentAction,
  pushApartmentAction,
  // getUnmigratedApartmentsAction,
  // migrateApartmentsBatchAction,
  getUnmigratedAiApartmentsAction,
  migrateAiApartmentsBatchAction,
  backfillSubmissionStatusAction, // <--- Thêm dòng này vào
} from "../../actions";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition, FormEvent, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ADMIN_PATH } from "@/lib/constants";
import { approveAndResolvePushAction } from "@/app/landlord-actions";
import { useAuth as useAuthContext } from "@/context/auth-context";
import { db } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function ApartmentsPage() {
  const { user: authUser } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [queryVal, setQueryVal] = useState(searchParams.get("q") || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apartmentToDelete, setApartmentToDelete] = useState<string | null>(
    null,
  );

  // Quản lý Tab hiển thị ("all" hoặc "push_requests")
  const [activeTab, setActiveTab] = useState<"all" | "push_requests">("all");

  const currentPage = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const itemsPerPage = 10;

  // LẮNG NGHE REALTIME FIRESTORE
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "apartments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApartments(data);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi realtime apartments:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Lọc danh sách theo Tab, Search
  const filteredApartments = useMemo(() => {
    return apartments.filter((apt: any) => {
      if (activeTab === "push_requests") {
        if (!apt.isPushRequested) return false;
      } else {
        if (apt.isPushRequested) return false;
      }

      const q = (searchParams.get("q") || "").toLowerCase().trim();
      if (!q) return true;

      const addressMatch = (apt.address || "").toLowerCase().includes(q);
      const codeMatch = (apt.sourceCode || "").toLowerCase().includes(q);
      return addressMatch || codeMatch;
    });
  }, [apartments, activeTab, searchParams]);

  const pushRequestCount = useMemo(() => {
    return apartments.filter((apt: any) => apt.isPushRequested === true).length;
  }, [apartments]);

  const totalPages = Math.ceil(filteredApartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApartments = filteredApartments.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (queryVal) params.set("q", queryVal);
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
      }
      setDialogOpen(false);
      setApartmentToDelete(null);
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép!", description: "Đã lưu vào bộ nhớ tạm." });
  };

  // Nút Push thủ công chuẩn của Admin
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
      }
    });
  };

  // Admin bấm chấp nhận yêu cầu push từ chủ nhà
  const handleAcceptPush = async (id: string) => {
    if (!authUser) return;
    startTransition(async () => {
      const result = await approveAndResolvePushAction(authUser.uid, id);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: result.error,
        });
      } else {
        toast({
          title: "Đã duyệt và đẩy top! 🚀",
          description: "Căn hộ đã được chấp nhận đẩy lên đầu.",
        });
      }
    });
  };

  const handleMigrate = async () => {
    const confirm = window.confirm(
      "Đồng bộ trạng thái Published cho tất cả căn hộ cũ? Quá trình này sẽ giúp các căn hộ cũ hiển thị công khai trên hệ thống.",
    );
    if (!confirm) return;

    const { id, update } = toast({
      title: "Đang kiểm tra căn hộ cũ...",
      description: "Đang quét các căn hộ thiếu trạng thái hiển thị.",
      duration: 100000,
    });

    // Gọi trực tiếp server action backfillSubmissionStatusAction có sẵn trong actions.ts
    const res = await backfillSubmissionStatusAction();

    if (res?.error) {
      update({
        id,
        variant: "destructive",
        title: "Lỗi",
        description: res.error,
      });
      return;
    }

    const updatedCount = res.updatedCount || 0;

    setTimeout(() => {
      update({
        id,
        title: "Đồng bộ trạng thái thành công! 🎉",
        description: `Đã cập nhật trạng thái Published cho ${updatedCount} căn hộ cũ.`,
        duration: 4000,
      });
      router.refresh();
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
    }, 500);
  };
  // -------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#cda533]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Quản lý Căn hộ
          </h2>
          <p className="text-gray-500">
            Danh sách tất cả các căn hộ ({apartments.length}).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleMigrate}
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Đồng bộ Trạng thái Published
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

      {/* THANH TAB CHUYỂN ĐỔI */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => {
            setActiveTab("all");
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === "all"
              ? "border-[#cda533] text-[#cda533]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Tất cả căn hộ ({apartments.filter((a) => !a.isPushRequested).length})
        </button>
        <button
          onClick={() => {
            setActiveTab("push_requests");
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "push_requests"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Yêu cầu chờ đẩy
          {pushRequestCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pushRequestCount}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <form
          onSubmit={handleSearch}
          className="relative w-full md:max-w-sm mb-4"
        >
          <Input
            placeholder="Tìm theo Mã ID hoặc Địa chỉ..."
            value={queryVal}
            onChange={(e) => setQueryVal(e.target.value)}
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

        {/* BẢNG DESKTOP */}
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
                {currentApartments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      {activeTab === "push_requests"
                        ? "Không có yêu cầu nào đang chờ."
                        : "Không tìm thấy căn hộ nào."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentApartments.map((apt: any) => (
                    <TableRow key={apt.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                          className="text-primary hover:underline font-bold"
                        >
                          {apt.address}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold">
                            {apt.sourceCode || "N/A"}
                          </span>
                          {apt.isPushRequested && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse border border-amber-300 w-fit">
                              🔥 Chủ nhà xin đẩy top
                            </span>
                          )}
                        </div>
                      </TableCell>
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
                          {activeTab === "push_requests" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptPush(apt.id)}
                                  disabled={isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 font-bold flex items-center gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" /> Chấp nhận
                                  & Đẩy top
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white z-[100] border shadow-md">
                                <p>Phê duyệt đẩy căn hộ</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
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
                                  <p>Đẩy lên đầu (Push thủ công)</p>
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
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>

        {/* GIAO DIỆN MOBILE (CARD) */}
        <div className="space-y-4 md:hidden">
          {currentApartments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              {activeTab === "push_requests"
                ? "Không có yêu cầu nào đang chờ."
                : "Không tìm thấy căn hộ nào."}
            </div>
          ) : (
            currentApartments.map((apt: any) => (
              <Card
                key={apt.id}
                className="relative bg-white border border-gray-200"
              >
                <CardContent className="space-y-2 p-4">
                  {apt.isPushRequested && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse border border-amber-300 mb-1">
                      🔥 Chủ nhà xin đẩy top
                    </span>
                  )}
                  <Link
                    href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                    className="pr-10 font-bold text-primary hover:underline line-clamp-2 text-base block"
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
                        {activeTab === "push_requests" ? (
                          <DropdownMenuItem
                            onClick={() => handleAcceptPush(apt.id)}
                            disabled={isPending}
                            className="text-green-600 font-bold"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Chấp nhận &
                            Đẩy top
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => handlePushClick(apt.id)}
                              disabled={isPending}
                              className="text-blue-600"
                            >
                              <ArrowUpCircle className="mr-2 h-4 w-4" /> Đẩy lên
                              đầu
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Sửa
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(apt.id)}
                          className="text-destructive"
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
            Hiển thị {startIndex + 1} -{" "}
            {Math.min(startIndex + itemsPerPage, filteredApartments.length)} /{" "}
            {filteredApartments.length}
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
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {isPending ? "Đang xóa..." : "Xóa ngay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
