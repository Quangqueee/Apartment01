"use client";
import { Phone, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiContact() {
  // Thông tin các kênh liên hệ
  const contacts = [
    {
      name: "Zalo",
      // Bạn có thể thay bằng SVG logo Zalo chính thức nếu muốn
      icon: <MessageCircle size={24} strokeWidth={1.5} />,
      color: "bg-[#0068FF] hover:bg-[#0054cc]", // Màu xanh Zalo chuẩn
      href: "https://zalo.me/0355885851",
    },
    {
      name: "Gọi điện",
      icon: <Phone size={22} strokeWidth={1.5} />,
      color: "bg-green-500 hover:bg-green-600", // Màu xanh gọi điện
      href: "tel:+84355885851",
    },
    {
      name: "Messenger",
      // Bạn có thể thay bằng SVG logo Messenger chính thức
      icon: <Send size={22} strokeWidth={1.5} />,
      color: "bg-[#0084FF] hover:bg-[#0078e7]", // Màu xanh Messenger chuẩn
      href: "https://m.me/hanoiresidences", // Thay bằng link Messenger của Page bạn
    },
  ];

  return (
    <div className="fixed z-[150] bottom-24 right-6 md:bottom-10 md:right-10 flex flex-col items-center gap-4">
      {contacts.map((item, index) => (
        <a
          key={index}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95",
            item.color
          )}
          title={item.name} // Hiển thị tên kênh khi di chuột vào
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
