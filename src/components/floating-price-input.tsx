"use client";

import { cn } from "@/lib/utils";

type FloatingPriceInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function FloatingPriceInput({
  id,
  label,
  value,
  onChange,
}: FloatingPriceInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={0.5}
        placeholder=" "
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "peer h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base text-gray-800 outline-none transition-colors duration-200",
          "appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "placeholder:text-transparent focus:border-[#cda533] focus:ring-2 focus:ring-[#cda533]/20",
          "md:text-sm",
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 origin-left -translate-y-1/2 bg-white px-1 text-sm text-gray-400",
          "transition-all duration-200 ease-out",
          "peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#9a7b24]",
          "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider peer-[:not(:placeholder-shown)]:text-[#9a7b24]",
        )}
      >
        {label}
      </label>
    </div>
  );
}
