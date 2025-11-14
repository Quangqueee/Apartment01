
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
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { getApartments } from "@/lib/data";
import Link from "next/link";
import { deleteApartmentAction } from "../actions";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition, FormEvent } from "react";
import { Apartment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
                  <TableHead>Mã nội bộ</TableHead>
                  <TableHead>SĐT Chủ nhà</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{formatDate(apt.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      {apt.price} tr
                    </TableCell>
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
                            <Link href={`/apartments/${apt.id}`} target="_blank">
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
                <CardContent className="p-4 space-y-2">
                  <Link href={`/admin/apartments/${apt.id}/edit`} className="font-bold text-primary hover:underline pr-10">
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
                            <Link href={`/apartments/${apt.id}`} target="_blank">
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
                  <p className="text-sm"><span className="font-medium text-muted-foreground">Mã nội bộ:</span> {apt.sourceCode}</p>
                  <p className="text-sm"><span className="font-medium text-muted-foreground">SĐT Chủ nhà:</span> {apt.landlordPhoneNumber}</p>
                  <p className="text-sm"><span className="font-medium text-muted-foreground">Ngày cập nhật:</span> {formatDate(apt.updatedAt)}</p>
                  <p className="text-sm font-semibold text-right">{apt.price} tr</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
