"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  RefreshCw,
  Info,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  useNotifications,
  type AppNotification,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS: Record<AppNotification["type"], LucideIcon> = {
  new_booking: CalendarDays,
  status_update: RefreshCw,
  system: Info,
};

const formatNotificationTime = (createdAt: any) => {
  if (!createdAt || typeof createdAt.toDate !== "function") return "";
  try {
    return formatDistanceToNow(createdAt.toDate(), {
      addSuffix: true,
      locale: vi,
    });
  } catch (error) {
    console.error("Lỗi parse thời gian:", error);
    return "";
  }
};

export default function NotificationBell({
  userId,
}: {
  userId?: string | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(userId);

  if (!userId) return null;

  const handleClickNotification = async (notification: AppNotification) => {
    setIsOpen(false);

    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      if (notification.link) {
        router.push(notification.link);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý thông báo:", error);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 text-gray-500 hover:text-[#cda533] hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* 
        Bao bọc PopoverContent: Đảm bảo nó có flex-col và overflow-hidden 
        để phần cuộn bên trong (thẻ div) hoạt động tốt nhất.
      */}
      <PopoverContent
        align="end"
        className="z-[100] w-[340px] p-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg dark:bg-zinc-900 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 gap-2 shrink-0">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Thông báo
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#cda533] hover:text-[#b88e22] transition-colors shrink-0"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu tất cả là đã đọc
            </button>
          )}
        </div>

        {/* 
          VÙNG CUỘN ĐÃ ĐƯỢC FIX:
          Thay thế ScrollArea bằng div tiêu chuẩn.
          - overflow-y-auto: Tự động cuộn dọc khi danh sách dài.
          - max-h-[400px]: Giới hạn chiều cao hộp là 400px.
          - overscroll-contain: Tránh lỗi cuộn lan ra cả trang web.
        */}
        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Không có thông báo nào.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Info;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors",
                      !notification.isRead &&
                        "bg-[#cda533]/5 dark:bg-[#cda533]/10",
                    )}
                  >
                    <div className="h-9 w-9 shrink-0 rounded-full bg-[#cda533]/10 flex items-center justify-center text-[#cda533]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
