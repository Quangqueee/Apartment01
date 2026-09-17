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
  CheckCircle2,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/firebase";
import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// IMPORT date-fns ĐỂ XỬ LÝ THỜI GIAN
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  interests?: string;
  ctvIntroduction?: string;
  role?: "user" | "collaborator" | "admin" | "landlord";
  requestStatus?: "pending" | string;
  createdAt?: any;
  lastActiveAt?: any; // THÊM TRƯỜNG lastActiveAt
}

type ManageableRole = "user" | "collaborator";

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // State cho bộ lọc
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    setIsLoadingUsers(true);
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (querySnapshot) => {
        const usersData: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ uid: doc.id, ...doc.data() } as UserData);
        });

        // SẮP XẾP MỚI NHẤT LÊN ĐẦU
        usersData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setUsers(usersData);
        setIsLoadingUsers(false);
      },
      (error) => {
        console.error("Lỗi tải danh sách người dùng:", error);
        toast({
          variant: "destructive",
          title: "Không thể tải danh sách người dùng",
          description: "Vui lòng thử lại sau.",
        });
        setIsLoadingUsers(false);
      },
    );

    return () => unsubscribe();
  }, [toast]);

  // Logic lọc danh sách user (Tìm kiếm + Bộ lọc vai trò)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q);

      const currentRole = u.role || "user";
      const matchesRole = roleFilter === "all" || currentRole === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  // Hàm xuất file CSV
  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      toast({ title: "Không có dữ liệu để xuất", variant: "destructive" });
      return;
    }

    const headers = ["Tên", "Email", "SĐT", "Vai trò", "Nhu cầu/Ghi chú"];
    const csvRows = filteredUsers.map((u) => {
      return [
        u.displayName || "Chưa đặt tên",
        u.email || "",
        u.phoneNumber || "",
        u.role || "user",
        (u.interests || u.ctvIntroduction || "").replace(/\n/g, " "),
      ].map((item) => `"${item}"`);
    });

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `danh_sach_khach_hang_${new Date().getTime()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Đã xuất file thành công!" });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép SĐT" });
  };

  const getRoleLabel = (role: UserData["role"]) => {
    if (role === "admin") return "Admin";
    if (role === "collaborator") return "CTV";
    if (role === "landlord") return "Chủ nhà";
    return "Người dùng";
  };

  const getRoleBadgeClass = (role: UserData["role"]) => {
    if (role === "admin") return "bg-red-50 text-red-700 border-red-200";
    if (role === "collaborator")
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (role === "landlord")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // HÀM RENDER TRẠNG THÁI HOẠT ĐỘNG
  const renderActiveStatus = (lastActiveAt?: any) => {
    if (!lastActiveAt || !lastActiveAt.seconds) {
      return (
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
          <span>Chưa rõ</span>
        </div>
      );
    }

    const lastActiveDate = new Date(lastActiveAt.seconds * 1000);
    const now = new Date();
    const diffInMinutes =
      (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);

    if (diffInMinutes < 20) {
      return (
        <div className="flex items-center gap-1 text-[10px] text-green-600 mt-1 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span>Online</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
        <span>
          {formatDistanceToNow(lastActiveDate, { addSuffix: true, locale: vi })}
        </span>
      </div>
    );
  };

  const updateUserRole = async (
    targetUser: UserData,
    nextRole: ManageableRole,
  ) => {
    if (processingUserId) return;
    if (nextRole !== "user" && nextRole !== "collaborator") {
      toast({
        variant: "destructive",
        title: "Vai trò không hợp lệ",
        description: "Chỉ được phép chọn user hoặc collaborator.",
      });
      return;
    }

    setProcessingUserId(targetUser.uid);
    try {
      await updateDoc(doc(db, "users", targetUser.uid), {
        role: nextRole,
        requestStatus: deleteField(),
      });
      toast({
        title: "Cập nhật vai trò thành công",
        description: `Đã chuyển vai trò sang ${nextRole}.`,
      });
    } catch (error) {
      console.error("Lỗi cập nhật vai trò:", error);
      toast({
        variant: "destructive",
        title: "Không thể cập nhật vai trò",
        description: "Vui lòng thử lại.",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const approveCollaboratorRequest = async (targetUser: UserData) => {
    if (processingUserId) return;
    setProcessingUserId(targetUser.uid);
    try {
      await updateDoc(doc(db, "users", targetUser.uid), {
        role: "collaborator",
        requestStatus: deleteField(),
      });
      toast({
        title: "Duyệt CTV thành công",
        description: "Người dùng đã được chuyển thành cộng tác viên.",
      });
    } catch (error) {
      console.error("Lỗi duyệt CTV:", error);
      toast({
        variant: "destructive",
        title: "Duyệt CTV thất bại",
        description: "Vui lòng thử lại.",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser: UserData) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa hồ sơ của ${targetUser.email}? Hành động này sẽ xóa dữ liệu hiển thị (không xóa tài khoản Auth).`,
    );
    if (!confirmDelete || processingUserId) return;

    setProcessingUserId(targetUser.uid);
    try {
      await deleteDoc(doc(db, "users", targetUser.uid));
      toast({
        title: "Đã xóa khách hàng",
        description: "Bản ghi đã được gỡ khỏi danh sách.",
      });
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);
      toast({
        variant: "destructive",
        title: "Xóa thất bại",
        description: "Có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const renderRoleControl = (u: UserData) => {
    if (u.role === "admin" || u.role === "landlord") {
      return (
        <div className="space-y-1">
          <Badge variant="outline" className={getRoleBadgeClass(u.role)}>
            {getRoleLabel(u.role)}
          </Badge>
          {u.role === "admin" ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
              Tài khoản quản trị
            </p>
          ) : (
            <p className="text-[10px] font-medium text-amber-600">
              Quản lý tại tab Đối tác
            </p>
          )}
        </div>
      );
    }

    const selectedRole: ManageableRole =
      u.role === "collaborator" ? "collaborator" : "user";

    return (
      <Select
        value={selectedRole}
        onValueChange={(value: ManageableRole) => updateUserRole(u, value)}
        disabled={processingUserId === u.uid}
      >
        <SelectTrigger className="h-9 w-[170px] bg-white transition-all hover:border-gray-400">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">Người dùng</SelectItem>
          <SelectItem value="collaborator">Cộng tác viên</SelectItem>
        </SelectContent>
      </Select>
    );
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
        {/* THANH CÔNG CỤ: TÌM KIẾM, LỌC VÀ XUẤT CSV */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
          <div className="relative w-full md:max-w-sm">
            <Input
              placeholder="Tìm tên, email, SĐT..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 bg-gray-50 focus-visible:ring-1 transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-white">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="user">Người dùng</SelectItem>
              <SelectItem value="collaborator">Cộng tác viên</SelectItem>
              <SelectItem value="landlord">Chủ nhà</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full md:w-auto md:ml-auto bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
          >
            <Download className="mr-2 h-4 w-4" /> Xuất CSV
          </Button>
        </div>

        {/* GIAO DIỆN BẢNG TRÊN DESKTOP */}
        <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Khách hàng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Thông tin</TableHead>
                <TableHead>Nhu cầu / Ghi chú</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && !isLoadingUsers ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 mb-2 text-gray-300" />
                      <p>Không tìm thấy người dùng nào phù hợp</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow
                    key={u.uid}
                    className="hover:bg-slate-50/80 transition-all duration-200 group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-gray-200 group-hover:ring-2 group-hover:ring-blue-100 transition-all">
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
                          {/* HIỂN THỊ TRẠNG THÁI HOẠT ĐỘNG DESKTOP */}
                          {renderActiveStatus(u.lastActiveAt)}
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
                              className="h-3 w-3 cursor-pointer text-gray-400 hover:text-blue-500 transition-colors"
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
                          <span>{u.dob ? u.dob : "--"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 capitalize">
                          <User className="h-3 w-3" />{" "}
                          <span>{u.gender || "--"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      {(() => {
                        const noteContent = u.interests || u.ctvIntroduction;
                        return noteContent ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors group/note">
                                <p className="line-clamp-2 text-xs group-hover/note:text-primary">
                                  <FileText className="inline h-3 w-3 mr-1" />{" "}
                                  {noteContent}
                                </p>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="bg-white z-[100] shadow-2xl">
                              <DialogHeader>
                                <DialogTitle>Thông tin chi tiết</DialogTitle>
                              </DialogHeader>
                              <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                                {noteContent}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-gray-300 text-xs italic">
                            --
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{renderRoleControl(u)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.requestStatus === "pending" && (
                          <Button
                            onClick={() => approveCollaboratorRequest(u)}
                            disabled={processingUserId === u.uid}
                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-transform active:scale-95"
                            size="sm"
                          >
                            {processingUserId === u.uid ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Đang duyệt
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Duyệt CTV
                              </>
                            )}
                          </Button>
                        )}

                        {u.role !== "admin" && (
                          <Button
                            onClick={() => handleDeleteUser(u)}
                            disabled={processingUserId === u.uid}
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-transform"
                            title="Xóa bản ghi này"
                          >
                            {processingUserId === u.uid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* GIAO DIỆN DANH SÁCH TRÊN MOBILE */}
        <div className="space-y-4 md:hidden">
          {filteredUsers.length === 0 && !isLoadingUsers && (
            <div className="py-8 text-center text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Không tìm thấy dữ liệu</p>
            </div>
          )}

          {filteredUsers.map((u) => (
            <Card
              key={u.uid}
              className="bg-white border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300"
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
                      {/* HIỂN THỊ TRẠNG THÁI HOẠT ĐỘNG MOBILE */}
                      {renderActiveStatus(u.lastActiveAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.phoneNumber && (
                      <a
                        href={`tel:${u.phoneNumber}`}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                    {u.role !== "admin" && (
                      <Button
                        onClick={() => handleDeleteUser(u)}
                        disabled={processingUserId === u.uid}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-50 py-2">
                  <div>
                    <span className="text-gray-400 block">SĐT</span>
                    <span className="font-bold">{u.phoneNumber || "--"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Năm sinh</span>
                    <span className="font-medium">{u.dob ? u.dob : "--"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">
                    Nhu cầu
                  </span>
                  <p className="text-xs bg-gray-50 p-2 rounded text-gray-700">
                    {u.interests || u.ctvIntroduction || "..."}
                  </p>
                </div>
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400 block">Vai trò</span>
                  {renderRoleControl(u)}
                </div>
                {u.requestStatus === "pending" && (
                  <Button
                    onClick={() => approveCollaboratorRequest(u)}
                    disabled={processingUserId === u.uid}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-2 active:scale-[0.98] transition-transform"
                    size="sm"
                  >
                    {processingUserId === u.uid ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Đang duyệt
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Phê Duyệt CTV
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* LOADING STATE */}
        {isLoadingUsers && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
