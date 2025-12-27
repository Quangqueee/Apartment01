"use client";

import { Phone, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ADMIN_PATH } from "@/lib/constants";

/* ZALO SVG ICON */
const ZaloIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 512 512"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 32C132.3 32 32 120.6 32 230.6c0 63.1 33.4 118.8 85.6 155.5-3.6 27.5-13 66.2-13.3 67.5 0 0-.3 2.6 1.4 3.6 1.7 1 3.7.2 3.7.2 4.9-.7 57.4-33.7 79.8-47.8 21.6 6 44.8 9.3 69.1 9.3 123.7 0 224-88.6 224-198.6S379.7 32 256 32z" />
  </svg>
);

export default function MultiContact() {
  const pathname = usePathname();

  // FIX: Nếu đường dẫn chứa admin path, ẩn component này
  if (pathname.startsWith(`/${ADMIN_PATH}`)) return null;

  const contacts = [
    {
      name: "Messenger",
      icon: <Send size={20} strokeWidth={2.5} className="-ml-0.5 mt-0.5" />,
      color: "bg-[#0084FF] hover:bg-[#0078e7]",
      href: "https://m.me/hanoiiresidence",
    },
    {
      name: "Zalo",
      icon: <ZaloIcon />,
      color: "bg-[#0068FF] hover:bg-[#0054cc]",
      href: "https://zalo.me/0355885851",
    },
  ];

  return (
    <>
      <div className="fixed z-[150] bottom-24 right-4 md:bottom-8 md:right-8 flex flex-col items-end gap-3 pointer-events-none">
        {/* CÁC NÚT PHỤ */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto mr-1">
          {contacts.map((item, index) => (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "h-11 w-11 rounded-full flex items-center justify-center",
                "text-white shadow-md transition-all duration-300",
                "hover:scale-110 hover:shadow-xl active:scale-95",
                item.color
              )}
              title={item.name}
            >
              {item.icon}
            </a>
          ))}
        </div>

        {/* NÚT GỌI */}
        <div className="relative pointer-events-auto mt-2">
          <div className="absolute inset-[-4px] rounded-full bg-[#cda533]/50 animate-pulse-hard-ring"></div>

          <a
            href="tel:+84355885851"
            className={cn(
              "relative flex items-center gap-3 px-5 py-3.5 rounded-full",
              "bg-gradient-to-r from-[#cda533] to-[#b88e22] hover:from-[#e3b944] hover:to-[#cda533]",
              "text-white font-bold tracking-wide",
              "animate-intense-glow transition-all duration-300",
              "hover:scale-110 active:scale-95"
            )}
          >
            <Phone size={22} className="animate-tada-hard" />
            <span className="text-base font-black">0355 885 851</span>
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes tada-hard {
          0% {
            transform: scale(1);
          }
          10%,
          20% {
            transform: scale(0.9) rotate(-15deg);
          }
          30%,
          50%,
          70%,
          90% {
            transform: scale(1.2) rotate(15deg);
          }
          40%,
          60%,
          80% {
            transform: scale(1.2) rotate(-15deg);
          }
          100% {
            transform: scale(1) rotate(0);
          }
        }
        .animate-tada-hard {
          animation: tada-hard 2s ease-in-out infinite;
        }
        @keyframes pulse-hard-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .animate-pulse-hard-ring {
          animation: pulse-hard-ring 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)
            infinite;
        }
        @keyframes intense-glow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(205, 165, 51, 0);
          }
          50% {
            box-shadow: 0 0 30px 10px rgba(205, 165, 51, 0.7);
          }
        }
        .animate-intense-glow {
          animation: intense-glow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
