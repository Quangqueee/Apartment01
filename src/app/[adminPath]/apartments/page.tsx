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
import { Checkbox } from "@/components/ui/checkbox";
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
  X,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import {
  revalidateApartmentCacheAction,
  generateSummaryAction,
} from "../../actions";
import {
  deleteApartmentClient,
  pushApartmentClient,
  pushApartmentsBatchClient,
  approveAndResolvePushClient,
  approveAndResolvePushBatchClient,
  backfillSubmissionStatusClient,
  listUnmigratedAiApartmentsClient,
  applyAiMigrationClient,
} from "@/lib/apartments-write-client";
import {
  ADMIN_APARTMENTS_PAGE_SIZE,
  getAdminApartmentCounts,
  listAdminApartmentsPage,
} from "@/lib/admin-apartments-client";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useState,
  useEffect,
  useTransition,
  FormEvent,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ADMIN_PATH } from "@/lib/constants";
import { useAuth as useAuthContext } from "@/context/auth-context";
import { db } from "@/firebase";
import { consumeApartmentDeleteQuota } from "@/lib/apartment-delete-quota";

export default function ApartmentsPage() {
  const { user: authUser } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [queryVal, setQueryVal] = useState(searchParams.get("q") || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apartmentToDelete, setApartmentToDelete] = useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [listTotal, setListTotal] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pushRequestCount, setPushRequestCount] = useState(0);

  // Quản lý Tab hiển thị ("all" hoặc "push_requests")
  const [activeTab, setActiveTab] = useState<"all" | "push_requests">("all");

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );
  const itemsPerPage = ADMIN_APARTMENTS_PAGE_SIZE;
  const appliedQuery = (searchParams.get("q") || "").trim();
  const cursorByPageRef = useRef<Record<number, string | null | undefined>>({
    1: null,
  });
  const lastFocusFetchRef = useRef(0);
  const requestSeqRef = useRef(0);
  const searchParamsRef = useRef(searchParams);
  const hasRowsRef = useRef(false);
  searchParamsRef.current = searchParams;

  const totalPages = Math.max(1, Math.ceil(listTotal / itemsPerPage));
  const effectivePage = currentPage;
  const startIndex = (effectivePage - 1) * itemsPerPage;
  const currentApartments = apartments;

  const pageIds = useMemo(
    () => currentApartments.map((apt: any) => apt.id as string),
    [currentApartments],
  );
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected =
    pageIds.length > 0 && selectedOnPage === pageIds.length;
  const somePageSelected = selectedOnPage > 0 && !allPageSelected;
  const selectedCount = selectedIds.size;

  const loadCounts = useCallback(async () => {
    const counts = await getAdminApartmentCounts();
    if (counts.error) {
      toast({
        variant: "destructive",
        title: "Không lấy được số liệu",
        description: counts.error,
      });
      return;
    }
    setAllCount(counts.total);
    setPublishedCount(counts.published);
    setPushRequestCount(counts.pushRequested);
  }, [toast]);

  const loadPage = useCallback(
    async (page: number, opts?: { silent?: boolean }) => {
      const seq = ++requestSeqRef.current;
      if (page > 1 && !(page in cursorByPageRef.current)) {
        const params = new URLSearchParams(searchParamsRef.current.toString());
        params.set("page", "1");
        cursorByPageRef.current = { 1: null };
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }

      if (!opts?.silent && !hasRowsRef.current) setLoading(true);
      else setIsRefreshing(true);

      try {
        const result = await listAdminApartmentsPage({
          pageSize: ADMIN_APARTMENTS_PAGE_SIZE,
          cursorId: page === 1 ? null : cursorByPageRef.current[page] ?? null,
          searchQuery: appliedQuery,
          pushRequestedOnly: activeTab === "push_requests",
        });
        if (seq !== requestSeqRef.current) return;
        if (result.error) {
          toast({
            variant: "destructive",
            title: "Không tải được danh sách",
            description: result.error,
          });
          return;
        }
        setApartments(result.apartments);
        hasRowsRef.current = true;
        if (page === 1) setListTotal(result.total);
        cursorByPageRef.current[page + 1] = result.nextCursorId;
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeTab, appliedQuery, pathname, router, toast],
  );

  const refetchCurrent = useCallback(async () => {
    await Promise.all([
      loadCounts(),
      loadPage(effectivePage, { silent: true }),
    ]);
  }, [effectivePage, loadCounts, loadPage]);

  useEffect(() => {
    cursorByPageRef.current = { 1: null };
    hasRowsRef.current = false;
  }, [appliedQuery, activeTab]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    void loadPage(effectivePage);
  }, [effectivePage, appliedQuery, activeTab, loadPage]);

  useEffect(() => {
    const maybeReload = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastFocusFetchRef.current < 15000) return;
      lastFocusFetchRef.current = now;
      void loadCounts();
      if (effectivePage <= 1) {
        cursorByPageRef.current = { 1: null };
        void loadPage(1, { silent: true });
      }
    };
    document.addEventListener("visibilitychange", maybeReload);
    window.addEventListener("focus", maybeReload);
    return () => {
      document.removeEventListener("visibilitychange", maybeReload);
      window.removeEventListener("focus", maybeReload);
    };
  }, [effectivePage, loadCounts, loadPage]);

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
    setSelectedIds(new Set());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTabChange = (tab: "all" | "push_requests") => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const orderedSelectedIds = () => {
    const onPage = currentApartments
      .filter((apt: any) => selectedIds.has(apt.id))
      .map((apt: any) => apt.id as string);
    const rest = [...selectedIds].filter((id) => !onPage.includes(id));
    return [...onPage, ...rest];
  };

  const handleDeleteClick = (id: string) => {
    setApartmentToDelete(id);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!apartmentToDelete) return;
    startTransition(async () => {
      try {
        const quota = await consumeApartmentDeleteQuota(db, authUser?.uid);
        if (!quota.ok) {
          toast({
            variant: "destructive",
            title: "Không thể xóa",
            description: quota.error,
          });
          return;
        }

        const target = apartments.find((item) => item.id === apartmentToDelete);
        await deleteApartmentClient(apartmentToDelete, target?.imageUrls);
        await revalidateApartmentCacheAction(apartmentToDelete);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(apartmentToDelete);
          return next;
        });
        await refetchCurrent();
        toast({
          title: "Thành công!",
          description: `Đã xóa căn hộ. Còn ${quota.remaining} lượt xóa trong giờ này.`,
        });
      } catch (error) {
        console.error("Lỗi xóa căn hộ:", error);
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: "Không thể xóa căn hộ.",
        });
      } finally {
        setDialogOpen(false);
        setApartmentToDelete(null);
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép!", description: "Đã lưu vào bộ nhớ tạm." });
  };

  // Nút Push thủ công chuẩn của Admin
  const handlePushClick = async (id: string) => {
    startTransition(async () => {
      const result = await pushApartmentClient(id);
      if (!result.error) {
        await revalidateApartmentCacheAction(id);
        await refetchCurrent();
      }
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
      const result = await approveAndResolvePushClient(id);
      if (!result.error) {
        await revalidateApartmentCacheAction(id);
        await refetchCurrent();
      }
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

  const handleBulkConfirm = async () => {
    const ids = orderedSelectedIds();
    if (ids.length === 0) return;

    startTransition(async () => {
      if (activeTab === "push_requests") {
        if (!authUser) return;
        const result = await approveAndResolvePushBatchClient(ids);
        if (!result.error) {
          await revalidateApartmentCacheAction();
          await refetchCurrent();
        }
        if (result?.error) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: result.error,
          });
        } else {
          toast({
            title: "Đã duyệt và đẩy top! 🚀",
            description: `Đã chấp nhận đẩy ${result.pushedCount || ids.length} căn hộ lên đầu.`,
          });
          clearSelection();
        }
      } else {
        const result = await pushApartmentsBatchClient(ids);
        if (!result.error) {
          await revalidateApartmentCacheAction();
          await refetchCurrent();
        }
        if (result?.error) {
          toast({
            variant: "destructive",
            title: "Lỗi!",
            description: result.error,
          });
        } else {
          toast({
            title: "Đẩy nhanh thành công!",
            description: `Đã đẩy ${result.pushedCount || ids.length} căn hộ lên đầu trang.`,
          });
          clearSelection();
        }
      }
      setBulkDialogOpen(false);
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
    const res = await backfillSubmissionStatusClient();
    if (!res.error) {
      await revalidateApartmentCacheAction();
      await refetchCurrent();
    }

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

  const handleRefreshPublicCache = () => {
    startTransition(async () => {
      try {
        await revalidateApartmentCacheAction();
        toast({
          title: "Đã làm mới cache website",
          description:
            "Trang chủ, tìm kiếm và trang quận sẽ lấy số liệu mới từ Firestore.",
        });
      } catch (error) {
        console.error("Làm mới cache:", error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể làm mới cache website.",
        });
      }
    });
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
    const res = await listUnmigratedAiApartmentsClient();

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
      for (const item of batch) {
        const data = item.aptData;
        const hasLegacyRootData =
          !!data.listingSummary || !!data.seoTitle || !!data.seoDescription;
        if (hasLegacyRootData) {
          const parsedHighlights: string[] = Array.isArray(data.highlights)
            ? data.highlights
            : typeof data.highlights === "string"
              ? data.highlights.split("\n").filter((h: string) => h.trim())
              : [];
          const writeRes = await applyAiMigrationClient(
            item.id,
            {
              seoTitle: data.seoTitle || data.title || "",
              seoDescription: data.seoDescription || "",
              description: data.listingSummary || "",
              highlights: parsedHighlights,
            },
            true,
          );
          if (writeRes.error) {
            update({
              id,
              variant: "destructive",
              title: "Lỗi",
              description: "Tiến trình AI bị gián đoạn.",
            });
            return;
          }
          continue;
        }

        const ai = await generateSummaryAction({
          title: data.title,
          roomType: data.roomType,
          district: data.district,
          address: data.address,
          price: Number(data.price) || 0,
          area: Number(data.area) || 0,
          detailedInformation: data.detailedInformation,
        });
        if ("error" in ai && ai.error) {
          update({
            id,
            variant: "destructive",
            title: "Lỗi",
            description: "Tiến trình AI bị gián đoạn.",
          });
          return;
        }
        const writeRes = await applyAiMigrationClient(item.id, {
          seoTitle: ai.seoTitle,
          seoDescription: ai.seoDescription,
          description: ai.description,
          highlights: ai.highlights,
        });
        if (writeRes.error) {
          update({
            id,
            variant: "destructive",
            title: "Lỗi",
            description: "Tiến trình AI bị gián đoạn.",
          });
          return;
        }
      }
      processedAi += batch.length;
      updateAiProgressToast(processedAi);
    }

    await revalidateApartmentCacheAction();
    await refetchCurrent();

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
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Quản lý Căn hộ
          </h2>
          <p className="text-gray-500">
            Danh sách tất cả các căn hộ ({allCount}). Public:{" "}
            {publishedCount}.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRefreshPublicCache}
            variant="outline"
            disabled={isPending}
            className="text-emerald-700 border-emerald-600 hover:bg-emerald-50"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Làm mới cache website
          </Button>
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
          onClick={() => handleTabChange("all")}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === "all"
              ? "border-[#cda533] text-[#cda533]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Tất cả căn hộ ({allCount})
        </button>
        <button
          onClick={() => handleTabChange("push_requests")}
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

      <div
        className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${
          isRefreshing ? "opacity-70" : ""
        }`}
      >
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:max-w-xl">
            <form
              onSubmit={handleSearch}
              className="relative w-full md:max-w-sm"
            >
              <Input
                placeholder="Tìm địa chỉ, Mã ID hoặc SĐT..."
                value={queryVal}
                onChange={(e) => setQueryVal(e.target.value)}
                className="pr-10 bg-gray-50 border-gray-200 text-base"
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                lastFocusFetchRef.current = 0;
                void refetchCurrent();
              }}
              disabled={isRefreshing || isPending}
              className="shrink-0"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Tải lại danh sách
            </Button>
          </div>

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">
                Đã chọn{" "}
                <span className="font-bold text-gray-800">{selectedCount}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isPending}
              >
                <X className="mr-1 h-4 w-4" /> Bỏ chọn
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setBulkDialogOpen(true)}
                disabled={isPending}
                className={
                  activeTab === "push_requests"
                    ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                    : "bg-blue-600 hover:bg-blue-700 text-white font-bold"
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : activeTab === "push_requests" ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                )}
                {activeTab === "push_requests" ? "Duyệt & Đẩy" : "Đẩy nhanh"}
              </Button>
            </div>
          )}
        </div>

        {/* BẢNG DESKTOP */}
        <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-10 px-2">
                    <Checkbox
                      checked={
                        allPageSelected
                          ? true
                          : somePageSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleSelectPage}
                      aria-label="Chọn trang này"
                      className="translate-y-[1px]"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center px-2">TT</TableHead>
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
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      {activeTab === "push_requests"
                        ? "Không có yêu cầu nào đang chờ."
                        : "Không tìm thấy căn hộ nào."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentApartments.map((apt: any, index: number) => (
                    <TableRow
                      key={apt.id}
                      className="hover:bg-gray-50"
                      data-state={selectedIds.has(apt.id) ? "selected" : undefined}
                    >
                      <TableCell className="px-2">
                        <Checkbox
                          checked={selectedIds.has(apt.id)}
                          onCheckedChange={() => toggleSelect(apt.id)}
                          aria-label={`Chọn căn hộ ${apt.sourceCode || apt.address}`}
                        />
                      </TableCell>
                      <TableCell className="text-center px-2 text-gray-500 font-medium tabular-nums">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
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
                                      target="_blank"
                                      rel="noopener noreferrer"
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
            currentApartments.map((apt: any, index: number) => (
              <Card
                key={apt.id}
                className="relative bg-white border border-gray-200 overflow-x-hidden"
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 mb-1 pr-10">
                    <Checkbox
                      checked={selectedIds.has(apt.id)}
                      onCheckedChange={() => toggleSelect(apt.id)}
                      aria-label={`Chọn căn hộ ${apt.sourceCode || apt.address}`}
                    />
                    <span className="text-xs font-bold text-gray-400 tabular-nums">
                      TT {startIndex + index + 1}
                    </span>
                  </div>
                  {apt.isPushRequested && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse border border-amber-300 mb-1">
                      🔥 Chủ nhà xin đẩy top
                    </span>
                  )}
                  <Link
                    href={`/${ADMIN_PATH}/apartments/${apt.id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
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
                                target="_blank"
                                rel="noopener noreferrer"
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
            Hiển thị {listTotal === 0 ? 0 : startIndex + 1} -{" "}
            {Math.min(startIndex + currentApartments.length, listTotal)} /{" "}
            {listTotal}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(effectivePage - 1)}
              disabled={effectivePage <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(effectivePage + 1)}
              disabled={effectivePage >= totalPages || isPending}
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
              Hành động này không thể hoàn tác. Mỗi tài khoản chỉ được xóa tối đa
              10 căn hộ trong 1 giờ.
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

      <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <AlertDialogContent className="bg-white z-[100] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeTab === "push_requests"
                ? `Duyệt và đẩy ${selectedCount} căn hộ?`
                : `Đẩy nhanh ${selectedCount} căn hộ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeTab === "push_requests"
                ? "Các căn đã chọn sẽ được chấp nhận và đẩy lên đầu trang chủ theo thứ tự hiện tại."
                : "Các căn đã chọn sẽ được đẩy lên đầu trang chủ theo thứ tự hiện tại trên bảng."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkConfirm}
              disabled={isPending}
              className={
                activeTab === "push_requests"
                  ? "bg-green-600 hover:bg-green-700 text-white border-none"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-none"
              }
            >
              {isPending
                ? "Đang xử lý..."
                : activeTab === "push_requests"
                  ? "Chấp nhận & Đẩy"
                  : "Đẩy nhanh"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
