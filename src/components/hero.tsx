"use client";
import FilterControls from "./filter-controls";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"
          alt="Hanoi Residences Hero"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-black/80 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="flex-1 text-white text-center lg:text-left max-w-2xl">
            <h1 className="font-headline text-5xl md:text-8xl font-black uppercase leading-[0.95] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              Hanoi <br /> <span className="text-primary italic">Residences</span>
            </h1>
            <p className="font-body text-base md:text-xl font-medium opacity-80 italic border-l-0 lg:border-l-4 border-primary px-4 lg:pl-6 max-w-lg mx-auto lg:mx-0">
              Định nghĩa chuẩn mực sống thượng lưu giữa lòng thủ đô.
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