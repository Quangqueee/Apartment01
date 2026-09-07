"use client";
import { useEffect, useState, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { setApartmentFavorite } from "@/lib/favorites-client";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "./auth-modal";
import Link from "next/link";
import { Apartment } from "@/lib/types";
import Image from "next/image";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  Tag,
  Star,
  Sparkles,
  CheckCircle2,
  Dog,
  Waves,
} from "lucide-react";
import { formatRelativeTime, formatPrice, cn, timestampSeconds } from "@/lib/utils";
import { getDisplaySourceCode } from "@/lib/source-code";
import { useIsMobile } from "@/hooks/use-mobile";

export default memo(function ApartmentCard({
  apartment,
  onFavoriteToggle,
  isCompact = false,
  imagePriority = false,
}: {
  apartment: Apartment;
  onFavoriteToggle?: (apartmentId: string, isFavorited: boolean) => void;
  isCompact?: boolean;
  /** Only the first visible card(s) should set this to protect LCP. */
  imagePriority?: boolean;
}) {
  const { user, userData, favoriteIds } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const imageUrls = Array.isArray(apartment.imageUrls)
    ? apartment.imageUrls
    : [];
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
  /** Desktop (md+): open details in a new tab; mobile stays same-tab. */
  const detailsLinkTarget = isMobile
    ? undefined
    : ({ target: "_blank", rel: "noopener noreferrer" } as const);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const hasDraggedRef = useRef(false);
  const dragRef = useRef({
    pointer: "none" as "none" | "mouse" | "touch",
    x: 0,
    y: 0,
    startTranslate: 0,
    startIndex: 0,
    axis: null as null | "x" | "y",
    lastX: 0,
    lastT: 0,
    vx: 0,
  });

  const markDragged = (next: boolean) => {
    hasDraggedRef.current = next;
    setHasDragged(next);
  };

  const getViewportWidth = () => viewportRef.current?.clientWidth ?? 0;

  const readTrackX = () => {
    const track = trackRef.current;
    if (!track) return 0;
    const raw = getComputedStyle(track).transform;
    if (!raw || raw === "none") return 0;
    return new DOMMatrix(raw).m41;
  };

  const applyTrackX = (x: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animate
      ? "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)"
      : "none";
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const rubberBandX = (x: number, width: number, length: number) => {
    if (length <= 1 || !width) return 0;
    const minX = -width * (length - 1);
    if (x > 0) return x * 0.28;
    if (x < minX) return minX + (x - minX) * 0.28;
    return x;
  };

  const goToImageIndex = (index: number, animate = true) => {
    const width = getViewportWidth();
    const last = Math.max(0, imageUrls.length - 1);
    const nextIndex = Math.max(0, Math.min(last, index));
    indexRef.current = nextIndex;
    setCurrentImageIndex(nextIndex);
    applyTrackX(-nextIndex * width, animate);
  };

  const settleSlider = (velocityX: number) => {
    const width = getViewportWidth();
    const length = imageUrls.length;
    if (!width || length <= 0) return;
    const dx = readTrackX() - dragRef.current.startTranslate;
    const startIndex = dragRef.current.startIndex;
    const commitDistance = width * 0.1;
    const flick = 0.2;
    let nextIndex = startIndex;
    if (dx < -commitDistance || velocityX < -flick) {
      nextIndex = Math.min(length - 1, startIndex + 1);
    } else if (dx > commitDistance || velocityX > flick) {
      nextIndex = Math.max(0, startIndex - 1);
    }
    goToImageIndex(nextIndex, true);
  };

  const isCollaborator =
    userData?.role === "collaborator" || userData?.role === "admin";
  const canViewCommission = isCollaborator;

  const initialFavoriteState =
    typeof apartment.isFavorited === "boolean"
      ? apartment.isFavorited
      : favoriteIds.includes(apartment.id);
  const [isFavorite, setIsFavorite] = useState(initialFavoriteState);

  useEffect(() => {
    const nextFavoriteState =
      typeof apartment.isFavorited === "boolean"
        ? apartment.isFavorited
        : favoriteIds.includes(apartment.id);
    setIsFavorite(nextFavoriteState);
  }, [apartment.id, apartment.isFavorited, favoriteIds]);

  const formatCommission = (commissionValue: Apartment["commission"]) => {
    if (
      commissionValue === undefined ||
      commissionValue === null ||
      commissionValue === ""
    ) {
      return null;
    }
    if (typeof commissionValue === "number") {
      return commissionValue.toLocaleString("vi-VN");
    }
    return commissionValue;
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavoriteUpdating) return;
    if (!user) {
      setShowModal(true);
      return;
    }

    const nextIsFavorite = !isFavorite;
    setIsFavoriteUpdating(true);
    setIsFavorite(nextIsFavorite);
    onFavoriteToggle?.(apartment.id, nextIsFavorite);

    try {
      await setApartmentFavorite(user, apartment.id, nextIsFavorite);
    } catch (err) {
      setIsFavorite(!nextIsFavorite);
      onFavoriteToggle?.(apartment.id, !nextIsFavorite);
      toast({
        variant: "destructive",
        title: "Không thể lưu yêu thích",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setIsFavoriteUpdating(false);
    }
  };

  const beginDrag = (
    pointer: "mouse" | "touch",
    clientX: number,
    clientY: number,
  ) => {
    const width = getViewportWidth();
    const visualX = readTrackX();
    applyTrackX(visualX, false);
    const startIndex = width
      ? Math.round(-visualX / width)
      : indexRef.current;
    const now = performance.now();
    dragRef.current = {
      pointer,
      x: clientX,
      y: clientY,
      startTranslate: visualX,
      startIndex: Math.max(0, Math.min(imageUrls.length - 1, startIndex)),
      axis: pointer === "mouse" ? "x" : null,
      lastX: clientX,
      lastT: now,
      vx: 0,
    };
  };

  const dragByClientX = (clientX: number) => {
    const now = performance.now();
    const dt = now - dragRef.current.lastT;
    if (dt > 48) {
      dragRef.current.vx = 0;
    } else {
      dragRef.current.vx =
        (clientX - dragRef.current.lastX) / Math.max(8, dt);
    }
    dragRef.current.lastX = clientX;
    dragRef.current.lastT = now;
    const dx = clientX - dragRef.current.x;
    const width = getViewportWidth();
    applyTrackX(
      rubberBandX(
        dragRef.current.startTranslate + dx,
        width,
        imageUrls.length,
      ),
      false,
    );
  };

  const scrollToIndex = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    goToImageIndex(index, true);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    const nextIndex =
      currentImageIndex === imageUrls.length - 1
        ? 0
        : currentImageIndex + 1;
    scrollToIndex(nextIndex, e);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    const prevIndex =
      currentImageIndex === 0
        ? imageUrls.length - 1
        : currentImageIndex - 1;
    scrollToIndex(prevIndex, e);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (imageUrls.length <= 1) return;
    setIsMouseDragging(true);
    markDragged(false);
    beginDrag("mouse", e.clientX, e.clientY);
  };

  const stopDragging = () => {
    if (dragRef.current.pointer !== "mouse") return;
    const velocityX = dragRef.current.vx;
    dragRef.current.pointer = "none";
    setIsMouseDragging(false);
    settleSlider(velocityX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current.pointer !== "mouse") return;
    e.preventDefault();
    const walk = e.clientX - dragRef.current.x;
    if (Math.abs(walk) > 5) markDragged(true);
    dragByClientX(e.clientX);
  };

  const onSliderTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = e.touches[0];
    if (!firstTouch || imageUrls.length <= 1) return;
    markDragged(false);
    beginDrag("touch", firstTouch.clientX, firstTouch.clientY);
  };

  const onSliderTouchEnd = () => {
    if (dragRef.current.pointer !== "touch") return;
    const now = performance.now();
    if (now - dragRef.current.lastT > 48) {
      dragRef.current.vx = 0;
    }
    const axis = dragRef.current.axis;
    const velocityX = dragRef.current.vx;
    dragRef.current.pointer = "none";
    dragRef.current.axis = null;
    if (axis === "x") {
      settleSlider(velocityX);
    } else {
      goToImageIndex(dragRef.current.startIndex, true);
    }
  };

  const dragByClientXRef = useRef(dragByClientX);
  dragByClientXRef.current = dragByClientX;

  useEffect(() => {
    indexRef.current = 0;
    setCurrentImageIndex(0);
    applyTrackX(0, false);
  }, [apartment.id]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onTouchMove = (event: TouchEvent) => {
      if (dragRef.current.pointer !== "touch") return;
      const firstTouch = event.touches[0];
      if (!firstTouch) return;
      const dx = firstTouch.clientX - dragRef.current.x;
      const dy = firstTouch.clientY - dragRef.current.y;

      if (!dragRef.current.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        dragRef.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (dragRef.current.axis !== "x") return;
      event.preventDefault();
      hasDraggedRef.current = true;
      dragByClientXRef.current(firstTouch.clientX);
    };

    const syncTrackToWidth = () => {
      if (dragRef.current.pointer !== "none") return;
      const width = viewport.clientWidth;
      applyTrackX(-indexRef.current * width, false);
    };

    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    const resizeObserver = new ResizeObserver(syncTrackToWidth);
    resizeObserver.observe(viewport);
    return () => {
      viewport.removeEventListener("touchmove", onTouchMove);
      resizeObserver.disconnect();
    };
  }, []);

  const openDetails = () => {
    const href = `/apartments/${apartment.id}`;
    if (isMobile) {
      router.push(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current || hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleImageAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedRef.current || hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    openDetails();
  };

  const displayCommission = formatCommission(apartment.commission);
  const timeToDisplay = timestampSeconds(apartment.updatedAt)
    ? apartment.updatedAt
    : apartment.createdAt;

  let tagLabel = null;
  let tagBgClass = "";
  let TagIcon = null;

  const isRented = apartment.status === "rented";
  const dateInMs = timeToDisplay?.seconds
    ? timeToDisplay.seconds * 1000
    : Date.now();
  const daysPassed = Math.floor(
    (Date.now() - dateInMs) / (1000 * 60 * 60 * 24),
  );
  const isOldListing = daysPassed >= 10;

  if (isCollaborator) {
    if (isRented) {
      tagLabel = "Tạm hết";
      tagBgClass = "bg-gray-500";
    } else if (isOldListing) {
      tagLabel = "Liên hệ xác nhận";
      tagBgClass = "bg-amber-500";
    } else {
      tagLabel = "Còn trống";
      tagBgClass = "bg-[#5cb85c]";
    }
  } else {
    const hasPetFriendly = apartment.tags?.includes("pet_friendly");
    const hasLakeView = apartment.tags?.includes("lake_view");

    if (hasPetFriendly) {
      tagLabel = "Pet Friendly";
      tagBgClass = "bg-emerald-500";
      TagIcon = Dog;
    } else if (hasLakeView) {
      tagLabel = "Lake View";
      tagBgClass = "bg-sky-500";
      TagIcon = Waves;
    } else if (isRented || isOldListing) {
      const B2C_TAGS = [
        { label: "Hot Deal", bg: "bg-red-500", icon: Flame },
        { label: "Trending", bg: "bg-orange-500", icon: TrendingUp },
        { label: "Best Price", bg: "bg-blue-500", icon: Tag },
        { label: "Hot Listing", bg: "bg-rose-500", icon: Flame },
        { label: "Great Value", bg: "bg-indigo-500", icon: Star },
        { label: "Unique Property", bg: "bg-violet-500", icon: Sparkles },
      ];
      const tagIndex =
        apartment.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) % B2C_TAGS.length;
      tagLabel = B2C_TAGS[tagIndex].label;
      tagBgClass = B2C_TAGS[tagIndex].bg;
      TagIcon = B2C_TAGS[tagIndex].icon;
    } else {
      tagLabel = "Available";
      tagBgClass = "bg-green-500";
      TagIcon = CheckCircle2;
    }
  }

  // Loại bỏ hoàn toàn tiêu đề chuẩn SEO trên UI để trả lại sự tối giản, ngắn gọn
  const displayTitle = apartment.title;

  return (
    <>
      <div
        className={cn(
          "group/slider relative flex h-full flex-col overflow-hidden border border-gray-200 bg-white transition-shadow duration-300 ease-out",
          isCompact
            ? "rounded-xl md:hover:shadow-md"
            : "rounded-xl md:hover:-translate-y-1.5 md:hover:scale-[1.015] md:hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] sm:rounded-2xl",
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden overflow-clip bg-gray-100",
            isCompact ? "aspect-[3/2]" : "aspect-[4/3]",
          )}
        >
          <div
            className={cn(
              "absolute left-0 top-3 z-20 flex flex-col items-start gap-2 pointer-events-none",
              isCompact && "top-2 gap-1.5",
            )}
          >
            {canViewCommission && displayCommission && (
              <div
                className={cn(
                  "truncate rounded bg-[#5cb85c] font-bold text-white shadow-sm ml-3",
                  isCompact
                    ? "px-2 py-0.5 text-[10px]"
                    : "px-2.5 py-1 text-xs",
                )}
              >
                HH: {displayCommission}
              </div>
            )}

            {!isCollaborator && tagLabel && (
              <div
                className={cn(
                  tagBgClass,
                  "flex items-center gap-1.5 font-bold uppercase tracking-wide text-white drop-shadow-md",
                  isCompact
                    ? "py-1 pl-2.5 pr-3 text-[10px]"
                    : "py-1.5 pl-3 pr-4 text-[10px] sm:text-xs",
                )}
                style={{
                  clipPath:
                    "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)",
                }}
              >
                {TagIcon && <TagIcon className="w-3.5 h-3.5" />}
                {tagLabel}
              </div>
            )}
          </div>

          {isCollaborator && tagLabel && (
            <div className="absolute bottom-6 left-0 z-20 pointer-events-none">
              <div
                className={`${tagBgClass} text-white text-[10px] sm:text-xs font-bold pl-3 pr-2.5 py-1.5 rounded-r-md shadow-md uppercase tracking-wider backdrop-blur-sm bg-opacity-95 border-y border-r border-white/20`}
              >
                {tagLabel}
              </div>
            </div>
          )}

          <div
            className={cn(
              "absolute z-20 rounded bg-black/60 font-bold text-white shadow-sm pointer-events-none backdrop-blur-md",
              isCompact
                ? "right-2 top-2 px-1.5 py-0.5 text-[10px]"
                : "right-3 top-3 px-2 py-1 text-xs",
            )}
          >
            ID: {getDisplaySourceCode(apartment.sourceCode, userData?.role)}
          </div>

          <div
            role="link"
            tabIndex={0}
            aria-label={displayTitle}
            className="absolute inset-0 z-0 block select-none [-webkit-touch-callout:none]"
            onClick={handleImageAreaClick}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDetails();
              }
            }}
          >
            <div
              ref={viewportRef}
              onMouseDown={onMouseDown}
              onMouseLeave={stopDragging}
              onMouseUp={stopDragging}
              onMouseMove={onMouseMove}
              onTouchStart={onSliderTouchStart}
              onTouchEnd={onSliderTouchEnd}
              onTouchCancel={onSliderTouchEnd}
              className={`h-full w-full overflow-hidden [touch-action:pan-y] select-none [-webkit-touch-callout:none] ${
                isMouseDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <div
                ref={trackRef}
                className="flex h-full will-change-transform"
              >
                {imageUrls.map((url, idx) => {
                  const shouldLoadImage =
                    Math.abs(idx - currentImageIndex) <= 1;
                  return (
                    <div
                      key={idx}
                      className="relative h-full w-full shrink-0 grow-0 basis-full bg-gray-100"
                    >
                      {shouldLoadImage ? (
                        <Image
                          src={url}
                          alt={`${displayTitle} - ảnh ${idx + 1}`}
                          fill
                          sizes={
                            isCompact
                              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          }
                          quality={60}
                          priority={imagePriority && idx === 0}
                          loading={
                            imagePriority && idx === 0 ? "eager" : "lazy"
                          }
                          draggable={false}
                          className="object-cover pointer-events-none select-none [-webkit-touch-callout:none]"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {imageUrls.length > 1 && (
            <>
              <div
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 md:group-hover/slider:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </div>
              <div
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 md:group-hover/slider:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </div>
            </>
          )}

          {imageUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 drop-shadow-md pointer-events-none">
              {imageUrls.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentImageIndex === idx
                      ? "w-4 bg-white"
                      : "w-1.5 bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/apartments/${apartment.id}`}
          onClick={handleLinkClick}
          className={cn(
            "flex flex-1 flex-col",
            isCompact ? "p-3" : "p-4 sm:p-5",
          )}
          {...detailsLinkTarget}
        >
          <div className="relative w-full">
            {/* Sử dụng font-body không chân, nét đậm vừa (semibold) đảm bảo tính hiện đại */}
            <div
              role="heading"
              aria-level={3}
              className={cn(
                "font-body line-clamp-1 pr-8 font-semibold leading-snug tracking-tight text-[#222222]",
                isCompact
                  ? "text-sm"
                  : "text-[0.95rem] sm:text-base",
              )}
              title={displayTitle}
            >
              {displayTitle}
            </div>

            <div
              onClick={toggleFavorite}
              className="absolute right-0 top-0 cursor-pointer p-1 active:scale-90 transition-transform z-10"
            >
              <Heart
                className={cn(
                  "transition-colors duration-300",
                  isCompact ? "h-4 w-4" : "h-5 w-5",
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-gray-400 md:hover:text-red-400",
                )}
              />
            </div>
          </div>

          <p
            className={cn(
              "mt-1 line-clamp-1 tracking-tight text-gray-500",
              isCompact ? "text-xs" : "text-[0.85rem] sm:text-sm",
            )}
          >
            {apartment.district}
          </p>

          <div
            className={cn(
              "mt-1 flex items-center justify-between tracking-tight text-gray-500",
              isCompact ? "text-xs" : "text-[0.85rem] sm:text-sm",
            )}
          >
            <span className="truncate pr-2 font-medium">
              {apartment.roomType} • {apartment.area} m²
            </span>
            <span className="whitespace-nowrap text-gray-400 text-[0.75rem] sm:text-[0.8rem] italic tracking-normal">
              Cập nhật: {formatRelativeTime(timeToDisplay)}
            </span>
          </div>

          <div className={cn("mt-auto flex items-baseline", isCompact ? "pt-1.5" : "pt-2")}>
            <span
              className={cn(
                "font-body font-bold tracking-tighter text-[#cda533]",
                isCompact ? "text-base" : "text-[1.2rem] sm:text-[1.25rem]",
              )}
            >
              {typeof apartment.price === "number"
                ? `₫${(apartment.price * 1000000).toLocaleString("vi-VN")}`
                : formatPrice(apartment.price)}
            </span>
            <span className="ml-1 text-xs sm:text-[0.8rem] font-medium text-gray-500 tracking-tight">
              /tháng
            </span>
          </div>
        </Link>
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => router.push("/login")}
      />
    </>
  );
});
