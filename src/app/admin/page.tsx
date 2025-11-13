
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { getApartments } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { deleteApartmentAction } from "../actions";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Apartment } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";


export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedQuery, router, pathname, searchParams]);


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
        searchBy: "sourceCode",
      });
      setApartments(result.apartments);
    });
  }, [searchParams]);

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
      <div className="pb-4 space-y-4">
        <Input 
          placeholder="Tìm theo mã nội bộ..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Mã nội bộ</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apartments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.title}</TableCell>
                  <TableCell>{apt.sourceCode}</TableCell>
                  <TableCell>{apt.district}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(apt.price)}
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
        </CardContent>
      </Card>
    </div>
  );
}

