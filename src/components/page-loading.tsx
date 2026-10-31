import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageLoading({
  label = "Đang tải...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[50dvh] w-full flex-col items-center justify-center overflow-x-hidden px-6 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="h-11 w-11 animate-spin text-[#cda533]"
        aria-hidden
      />
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
        {label}
      </p>
    </div>
  );
}
