"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { useAuth, useUser } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserNav() {
  const { user } = useUser();
  // Lấy thêm userData từ Firestore để đảm bảo ảnh mới nhất được hiện
  const userData = (useUser() as any).userData;
  const auth = useAuth();
  const router = useRouter();

  if (!user) return null;

  // Ưu tiên ảnh từ Firestore -> Auth -> Null
  const displayAvatar = userData?.photoURL || user.photoURL;

  // Lấy chữ cái đầu để làm Fallback
  const initials = (userData?.displayName || user.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-border/50 shadow-sm transition-transform active:scale-95"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={displayAvatar || ""}
              alt="User Avatar"
              className="object-cover"
            />
            {/* Fallback: Hiện chữ cái đầu trên nền xám */}
            <AvatarFallback className="font-black bg-gray-100 text-gray-600">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-none bg-white opacity-100 z-[200]"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-black uppercase tracking-tight text-gray-900">
              Khách hàng
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-50" />
        <DropdownMenuItem
          asChild
          className="rounded-2xl py-4 cursor-pointer focus:bg-gray-50 font-body"
        >
          <Link href="/profile" className="flex items-center">
            <User className="mr-3 h-4 w-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Tài khoản
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-50" />
        <DropdownMenuItem
          onClick={() => signOut(auth).then(() => router.push("/"))}
          className="rounded-2xl py-4 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 font-body"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-[11px] font-black uppercase tracking-widest">
            Đăng xuất
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
