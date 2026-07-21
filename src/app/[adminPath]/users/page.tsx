"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  ClipboardCopy,
  User,
  Calendar,
  FileText,
  Phone,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { approveCollaboratorAction } from "@/app/actions";

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  interests?: string;
  role?: string;
  collaboratorStatus?: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [query, setQuery] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      const q = query.toLowerCase();
      const filtered = q
        ? usersData.filter(
            (u) =>
              u.email?.toLowerCase().includes(q) ||
              u.displayName?.toLowerCase().includes(q) ||
              u.phoneNumber?.includes(q)
          )
        : usersData;
      setUsers(filtered);
    } catch (error) {
      console.error(error);
    }
  }, [query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép SĐT" });
  };

  // Xử lý duyệt CTV
  const handleApproveCtv = async (uid: string) => {
    setApprovingId(uid);
    const result = await approveCollaboratorAction(uid);
    setApprovingId(null);
    if (result?.success) {
      toast({ title: "Đã duyệt thành công!", description: "Tài khoản đã được cấp quyền Cộng tác viên." });
      fetchUsers(); // Tải lại danh sách
    } else {
      toast({ variant: "destructive", title: "Lỗi", description: result?.error });
    }
  };

  // Lọc riêng danh sách đang chờ duyệt CTV
  const pendingCtvUsers = users.filter((u) => u.collaboratorStatus === "pending");

  return (
    <div className="space-y-8">
      {/* PHẦN 1: DANH SÁCH CHỜ DUYỆT CTV */}
      {pendingCtvUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-amber-800 text-lg">
              Yêu cầu làm Cộng tác viên ({pendingCtvUsers.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingCtvUsers.map((u) => (
              <div
                key={u.uid}
                className="flex items-center justify-between bg-white rounded-xl p-4 border border-amber-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-amber-200">
                    <AvatarImage src={u.photoURL} />
                    <AvatarFallback className="bg-amber-50">
                      {u.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-gray-900">
                      {u.displayName || "Chưa đặt tên"}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    {u.phoneNumber && (
                      <p className="text-xs font-bold text-blue-600">{u.phoneNumber}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleApproveCtv(u.uid)}
                  disabled={approvingId === u.uid}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 font-bold shadow-sm"
                >
                  {approvingId === u.uid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Duyệt
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHẦN 2: DANH SÁCH TOÀN BỘ KHÁCH HÀNG */}
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Quản lý Khách hàng
        </h2>
        <p className="text-gray-500">Thông tin người dùng đã đăng ký.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:max-w-sm mb-4">
          <Input
            placeholder="Tìm tên, email, SĐT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10 bg-gray-50"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Khách hàng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Thông tin</TableHead>
                <TableHead>Phân quyền</TableHead>
                <TableHead>Nhu cầu / Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback>
                          {u.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">
                          {u.displayName || "Chưa đặt tên"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {u.uid.slice(0, 6)}...
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="text-gray-600 text-xs">{u.email}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">
                          {u.phoneNumber || "--"}
                        </span>
                        {u.phoneNumber && (
                          <ClipboardCopy
                            className="h-3 w-3 cursor-pointer text-gray-400"
                            onClick={() => handleCopy(u.phoneNumber!)}
                          />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-3 w-3" />{" "}
                        <span>
                          {u.dob
                            ? new Date(u.dob).toLocaleDateString("vi-VN")
                            : "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 capitalize">
                        <User className="h-3 w-3" />{" "}
                        <span>{u.gender || "--"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Hiển thị nhãn phân quyền */}
                    {u.role === "admin" && (
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Admin</span>
                    )}
                    {u.role === "collaborator" && (
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">CTV</span>
                    )}
                    {u.collaboratorStatus === "pending" && (
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Chờ duyệt CTV</span>
                    )}
                    {!u.role && u.collaboratorStatus !== "pending" && (
                      <span className="text-xs text-gray-400">User</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    {u.interests ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:bg-gray-100 p-1 rounded group">
                            <p className="line-clamp-2 text-xs group-hover:text-primary">
                              <FileText className="inline h-3 w-3 mr-1" />{" "}
                              {u.interests}
                            </p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-white z-[100] shadow-2xl">
                          <DialogHeader>
                            <DialogTitle>Nhu cầu chi tiết</DialogTitle>
                          </DialogHeader>
                          <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                            {u.interests}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-gray-300 text-xs italic">--</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4 md:hidden">
          {users.map((u) => (
            <Card
              key={u.uid}
              className="bg-white border border-gray-200 shadow-sm"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback>
                        {u.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">{u.displayName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  {u.phoneNumber && (
                    <a
                      href={`tel:${u.phoneNumber}`}
                      className="p-2 bg-green-50 text-green-600 rounded-full"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-50 py-2">
                  <div>
                    <span className="text-gray-400 block">SĐT</span>
                    <span className="font-bold">{u.phoneNumber || "--"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Ngày sinh</span>
                    <span>
                      {u.dob
                        ? new Date(u.dob).toLocaleDateString("vi-VN")
                        : "--"}
                    </span>
                  </div>
                </div>
                {/* Nút duyệt CTV trên mobile */}
                {u.collaboratorStatus === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveCtv(u.uid)}
                    disabled={approvingId === u.uid}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                  >
                    {approvingId === u.uid ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Duyệt làm CTV
                  </Button>
                )}
                <div>
                  <span className="text-xs text-gray-400 block mb-1">
                    Nhu cầu
                  </span>
                  <p className="text-xs bg-gray-50 p-2 rounded text-gray-700">
                    {u.interests || "..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  interests?: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [query, setQuery] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      const q = query.toLowerCase();
      const filtered = q
        ? usersData.filter(
            (u) =>
              u.email?.toLowerCase().includes(q) ||
              u.displayName?.toLowerCase().includes(q) ||
              u.phoneNumber?.includes(q)
          )
        : usersData;
      setUsers(filtered);
    } catch (error) {
      console.error(error);
    }
  }, [query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép SĐT" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Quản lý Khách hàng
        </h2>
        <p className="text-gray-500">Thông tin người dùng đã đăng ký.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:max-w-sm mb-4">
          <Input
            placeholder="Tìm tên, email, SĐT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10 bg-gray-50"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Khách hàng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Thông tin</TableHead>
                <TableHead>Nhu cầu / Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback>
                          {u.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">
                          {u.displayName || "Chưa đặt tên"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {u.uid.slice(0, 6)}...
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="text-gray-600 text-xs">{u.email}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">
                          {u.phoneNumber || "--"}
                        </span>
                        {u.phoneNumber && (
                          <ClipboardCopy
                            className="h-3 w-3 cursor-pointer text-gray-400"
                            onClick={() => handleCopy(u.phoneNumber!)}
                          />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-3 w-3" />{" "}
                        <span>
                          {u.dob
                            ? new Date(u.dob).toLocaleDateString("vi-VN")
                            : "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 capitalize">
                        <User className="h-3 w-3" />{" "}
                        <span>{u.gender || "--"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    {u.interests ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:bg-gray-100 p-1 rounded group">
                            <p className="line-clamp-2 text-xs group-hover:text-primary">
                              <FileText className="inline h-3 w-3 mr-1" />{" "}
                              {u.interests}
                            </p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-white z-[100] shadow-2xl">
                          <DialogHeader>
                            <DialogTitle>Nhu cầu chi tiết</DialogTitle>
                          </DialogHeader>
                          <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                            {u.interests}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-gray-300 text-xs italic">--</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4 md:hidden">
          {users.map((u) => (
            <Card
              key={u.uid}
              className="bg-white border border-gray-200 shadow-sm"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback>
                        {u.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">{u.displayName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  {u.phoneNumber && (
                    <a
                      href={`tel:${u.phoneNumber}`}
                      className="p-2 bg-green-50 text-green-600 rounded-full"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-50 py-2">
                  <div>
                    <span className="text-gray-400 block">SĐT</span>
                    <span className="font-bold">{u.phoneNumber || "--"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Ngày sinh</span>
                    <span>
                      {u.dob
                        ? new Date(u.dob).toLocaleDateString("vi-VN")
                        : "--"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">
                    Nhu cầu
                  </span>
                  <p className="text-xs bg-gray-50 p-2 rounded text-gray-700">
                    {u.interests || "..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
