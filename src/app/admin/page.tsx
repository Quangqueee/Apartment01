
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, Search, ClipboardCopy } from "lucide-react";
import { getApartments } from "@/lib/data";
import Link from "next/link";
import { deleteApartmentAction } from "../actions";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition, FormEvent } from "react";
import { Apartment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    startTransition(async () => {
      const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
      const result = await getApartments({
        query: searchParams.get("q") || undefined,
        district: searchParams.get("district") || undefined,
        priceRange: searchParams.get("price") || undefined,
        roomType: searchParams.get("roomType") || undefined,
        page,
        limit: 1000,
        searchBy: "sourceCodeOrAddress",
      });
      setApartments(result.apartments);
    });
  }, [searchParams]);
  
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.set("page", "1"); // Reset to first page on new search
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleCopy = (text: string) => {
    // Fallback for insecure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make the textarea out of sight
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand("copy");
      toast({
        title: "Đã sao chép!",
        description: "Số điện thoại đã được sao chép vào bộ nhớ tạm.",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        variant: "destructive",
        title: "Lỗi!",
        description: "Không thể sao chép số điện thoại.",
      });
    }

    document.body.removeChild(textArea);
  };


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Apartment Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/admin/apartments/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New
            </Link>
          </Button>
        </div>
      </div>
      <div className="pb-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Input 
              placeholder="Tìm theo mã nội bộ hoặc địa chỉ..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Tìm kiếm</span>
            </Button>
          </form>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Mã nguồn</TableHead>
                  <TableHead>SĐT Chủ nhà</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apartments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-medium">
                       <Link href={`/admin/apartments/${apt.id}/edit`} className="text-primary hover:underline">
                          {apt.address}
                       </Link>
                    </TableCell>
                    <TableCell>{apt.sourceCode}</TableCell>
                    <TableCell>{apt.landlordPhoneNumber}</TableCell>
                    <TableCell>
                      {apt.price} tr
                    </TableCell>
                    <TableCell>{formatDate(apt.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/apartments/${apt.id}/edit`}>
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/apartments/${apt.slug}`} target="_blank">
                              View
                            </Link>
                          </DropdownMenuItem>
                          <form action={deleteApartmentAction} className="w-full">
                            <input type="hidden" name="id" value={apt.id} />
                            <button
                              type="submit"
                              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            >
                              Delete
                            </button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="space-y-4 md:hidden">
            {apartments.map((apt) => (
              <Card key={apt.id} className="relative">
                <CardContent className="space-y-2 p-4">
                  <Link href={`/admin/apartments/${apt.id}/edit`} className="pr-10 font-bold text-primary hover:underline">
                    {apt.address}
                  </Link>
                   <div className="absolute right-2 top-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/apartments/${apt.id}/edit`}>
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/apartments/${apt.slug}`} target="_blank">
                              View
                            </Link>
                          </DropdownMenuItem>
                          <form action={deleteApartmentAction} className="w-full">
                            <input type="hidden" name="id" value={apt.id} />
                            <button
                              type="submit"
                              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            >
                              Delete
                            </button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  <p className="text-sm"><span className="font-medium text-muted-foreground">Mã nguồn:</span> {apt.sourceCode}</p>
                  <p className="text-sm"><span className="font-medium text-muted-foreground">Giá:</span> {apt.price} tr</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">SĐT Chủ nhà:</span>
                    <span>{apt.landlordPhoneNumber}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => handleCopy(apt.landlordPhoneNumber)}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      <span className="sr-only">Sao chép</span>
                    </Button>
                  </div>
                   <div className="flex items-baseline justify-between text-sm">
                    <p><span className="font-medium text-muted-foreground">Ngày cập nhật:</span> {formatDate(apt.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
