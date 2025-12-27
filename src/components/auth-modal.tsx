"use client";
import { LogIn, X } from "lucide-react";

export default function AuthModal({ isOpen, onClose, onConfirm }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm overflow-hidden rounded-[3rem] bg-white p-10 shadow-2xl transition-all scale-100 border border-gray-100">
        <div className="flex justify-end -mt-4 -mr-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <LogIn size={28} />
          </div>
          <h3 className="text-xl font-black uppercase text-gray-900 tracking-tighter">
            Yêu cầu đăng nhập
          </h3>
          <p className="mt-4 text-sm font-medium text-gray-500 leading-relaxed px-2">
            Vui lòng đăng nhập tài khoản để lưu lại những căn hộ yêu thích của
            bạn.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full rounded-2xl bg-gray-900 py-4 text-xs font-black text-white hover:bg-orange-600 transition-all uppercase tracking-widest shadow-lg"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={onClose}
              className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-gray-500 py-2 transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
