"use client";
import Image from "next/image"; // 1. Import thẻ Image của Next.js
import FilterControls from "./filter-controls";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.webp"
          alt="Hanoi Residences Hero"
          fill // Tự động lấp đầy thẻ div cha
          priority // QUAN TRỌNG NHẤT: Ép trình duyệt tải ảnh này đầu tiên, không được delay!
          sizes="100vw" // Khẳng định ảnh này luôn chiếm 100% chiều rộng màn hình
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-black/80 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="flex-1 text-white text-center lg:text-left max-w-2xl">
            <h1 className="font-headline text-5xl md:text-8xl font-black uppercase leading-[0.95] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              Hanoi <br />{" "}
              <span className="text-primary italic">Residences</span>
            </h1>
            <p className="font-body text-base md:text-xl font-medium opacity-80 italic border-l-0 lg:border-l-4 border-primary px-4 lg:pl-6 max-w-lg mx-auto lg:mx-0">
              Không gian sống lý tưởng – Giải pháp hoàn hảo cho mọi ngân sách.
            </p>
          </div>
          <div className="w-full sm:max-w-[480px] lg:w-[450px] shrink-0 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            <FilterControls />
          </div>
        </div>
      </div>
    </section>
  );
}
