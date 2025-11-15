
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, Search, ClipboardCopy, Trash2, Pencil, ExternalLink } from "lucide-react";
import { getApartments } from "@/lib/data-client";
import Link from "next/link";
import { deleteApartmentAction } from "../actions";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition, FormEvent, useCallback } from "react";
import { Apartment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [totalApartments, setTotalApartments] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apartmentToDelete, setApartmentToDelete] = useState<string | null>(null);

  const fetchApartments = useCallback(() => {
     startTransition(async () => {
      const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
      // Note: Admin dashboard fetches from a client-side function that might have different logic
      // For now, we assume it fetches all.
      // If we want admin to have server-side filtering, we'd call an action.
      // Let's stick to a client-side fetch for simplicity for now.
      const result = await getApartments({
        query: searchParams.get("q") || undefined,
        district: searchParams.get("district") || undefined,
        priceRange: searchParams.get("price") || undefined,
        roomType: searchParams.get("roomType") || undefined,
        page,
        limit: 1000, // Fetch all for admin view
        searchBy: "sourceCodeOrAddress",
      });
      setApartments(result.apartments);
      setTotalApartments(result.totalResults);
    });
  }, [searchParams]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);
  
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

  const handleDeleteClick = (id: string) => {
    setApartmentToDelete(id);
    setDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!apartmentToDelete) return;

    startTransition(async () => {
      const result = await deleteApartmentAction(apartmentToDelete);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Lỗi!",
          description: result.error,
        });
      } else {
        toast({
          title: "Thành công!",
          description: "Đã xóa căn hộ.",
        });
        fetchApartments(); // Refetch after successful deletion
      }
      setDialogOpen(false);
      setApartmentToDelete(null);
    });
  };

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
    <>
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <Link href="/">
            <h2 className="font-headline text-3xl font-bold tracking-tight transition-colors hover:text-primary">
                Apartment Dashboard
            </h2>
        </Link>
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
              placeholder="Tìm theo mã nguồn hoặc địa chỉ..." 
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
           <CardTitle className="flex items-center justify-between">
            All Listings
            <span className="text-sm font-bold px-2 py-1 rounded-md">
                {totalApartments} kết quả
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Mã nguồn</TableHead>
                    <TableHead>SĐT Chủ nhà</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Ngày cập nhật</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
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
                      <TableCell>{formatDate(apt.updatedAt && apt.updatedAt.seconds > 0 ? apt.updatedAt : apt.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                           <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" asChild>
                                      <Link href={`/apartments/${apt.id}`} target="_blank">
                                          <ExternalLink className="h-4 w-4" />
                                      </Link>
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>View Listing</p>
                              </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/admin/apartments/${apt.id}/edit`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(apt.id)} className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Delete</p>
                              </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
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
                            <Link href={`/admin/apartments/${apt.id}/edit`} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/apartments/${apt.id}`} target="_blank" className="flex items-center">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem
                              onClick={() => handleDeleteClick(apt.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  <p className="text-sm"><span className="font-medium text-muted-foreground">Mã nguồn:</span> {apt.sourceCode}</p>
                  <p className="text-sm">Giá: {apt.price} tr</p>
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
                    <p><span className="font-medium text-muted-foreground">Ngày cập nhật:</span> {formatDate(apt.updatedAt && apt.updatedAt.seconds > 0 ? apt.updatedAt : apt.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                apartment and remove its data from our servers.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="bg-destructive hover:bg-destructive/90"
            >
                {isPending ? "Deleting..." : "Continue"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
