"use client";

import { useState } from "react";
import { Phone, X, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ADMIN_PATH } from "@/lib/constants";
import { isAdmin, isCollaborator } from "@/lib/rbac";

/* SVG FACEBOOK */
const FacebookSvgIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 48 48"
  >
    <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path>
    <path
      fill="#fff"
      d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"
    ></path>
  </svg>
);

/* SVG ZALO */
const ZaloSvgIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 48 48"
  >
    <path
      fill="#2962ff"
      d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10	c4.722,0,8.883-2.348,11.417-5.931V36H15z"
    ></path>
    <path
      fill="#eee"
      d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19	c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742	c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083	C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"
    ></path>
    <path
      fill="#2962ff"
      d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75	S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"
    ></path>
    <path
      fill="#2962ff"
      d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z"
    ></path>
    <path
      fill="#2962ff"
      d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75	S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5	c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"
    ></path>
    <path
      fill="#2962ff"
      d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5	c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"
    ></path>
  </svg>
);

export default function MultiContact() {
  const pathname = usePathname();
  const { user, userData, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isStaffUi =
    isAdmin(userData?.role) || isCollaborator(userData?.role);

  if (pathname.startsWith(`/${ADMIN_PATH}`)) return null;
  if (pathname.startsWith("/huong-dan-cong-viec")) return null;
  if (/^\/apartments\/[^/]+/.test(pathname)) return null;
  if (isStaffUi) return null;
  if (loading && user) return null;

  return (
    <>
      <div className="fixed z-30 bottom-[calc(5rem+var(--safe-bottom))] right-4 md:bottom-8 md:right-8 flex flex-col items-end gap-3 pointer-events-none">
        {/* KHUNG POP-UP LIÊN HỆ */}
        <div
          className={cn(
            "flex flex-col gap-2 p-2.5 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto transition-all duration-300 transform origin-bottom-right w-max",
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none h-0 p-0 overflow-hidden border-0",
          )}
        >
          {/* 1. Messenger */}
          <a
            href="https://www.facebook.com/hanoiiresidence/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Truy cập trang Facebook của chúng tôi"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <FacebookSvgIcon />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#039be5] whitespace-nowrap pr-2">
              Facebook
            </span>
          </a>

          {/* 2. Zalo Chat */}
          <a
            href="https://zalo.me/0812442111"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <ZaloSvgIcon />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#2962ff] whitespace-nowrap pr-2">
              Zalo
            </span>
          </a>

          {/* 3. Gọi điện thoại */}
          <a
            href="tel:+84812442111"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-yellow-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Phone size={14} className="animate-tada-hard" />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-yellow-600 whitespace-nowrap pr-2">
              081 2442 111
            </span>
          </a>
        </div>

        {/* NÚT BẤM CHÍNH ĐÃ ĐƯỢC CỐ ĐỊNH TRÒN ĐẦY ĐỦ (w-16 h-16) */}
        <div className="relative pointer-events-auto mt-1">
          <div className="absolute inset-[-4px] rounded-full bg-[#cda533]/40 animate-pulse-hard-ring"></div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "relative flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer",
              "bg-gradient-to-r from-[#cda533] to-[#b88e22] hover:from-[#e3b944] hover:to-[#cda533]",
              "text-white shadow-[0_10px_25px_rgba(205,165,51,0.4)]",
              "transition-all duration-300 hover:scale-105 active:scale-95",
            )}
            title="Liên hệ nhanh"
          >
            {isOpen ? (
              <X size={24} className="transition-transform duration-300" />
            ) : (
              <>
                <MessageSquareText
                  size={20}
                  className="animate-tada-hard mb-0.5"
                />
                <span className="text-[10px] font-extrabold tracking-wider leading-none uppercase antialiased drop-shadow-sm">
                  Contact
                </span>
              </>
            )}
          </button>
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
      `}</style>
    </>
  );
}
