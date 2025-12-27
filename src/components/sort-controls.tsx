"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";
import { Label } from "./ui/label";

export default function SortControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    router.push(pathname + "?" + params.toString());
  };

  return (
    <div className="flex items-center gap-2">
        <Label htmlFor="sort-by" className="text-sm">Sắp xếp theo:</Label>
        <Select
            value={currentSort}
            onValueChange={handleSortChange}
        >
            <SelectTrigger id="sort-by" className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent className="bg-white">
            {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
    </div>
  );
}
