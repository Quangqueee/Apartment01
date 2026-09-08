"use client";

import { useId, useRef } from "react";
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
  const uid = useId();
  const inputId = `${id}-${uid}`;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="relative cursor-text pt-4"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="number"
        inputMode="decimal"
        step={0.5}
        placeholder=" "
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "peer h-8 w-full border-0 border-b border-gray-300 bg-transparent px-0 pb-1 text-base font-semibold text-gray-800 outline-none transition-colors duration-200",
          "appearance-none rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "placeholder:text-transparent focus:border-[#cda533]",
          "md:text-sm",
        )}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "pointer-events-none absolute left-0 top-[1.35rem] origin-left cursor-text text-sm text-gray-400",
          "transition-all duration-200 ease-out",
          "peer-focus:top-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#9a7b24]",
          "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-[#9a7b24]",
        )}
      >
        {label}
      </label>
    </div>
  );
}
