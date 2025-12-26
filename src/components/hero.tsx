export default function Hero() {
  return (
    <section className="relative h-[480px] w-full overflow-hidden bg-gray-900">
      <img
        src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"
        alt="Hanoi Residences Banner"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="container relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
          HANOI RESIDENCES
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-light text-gray-200 md:text-2xl">
          Tuyển chọn không gian sống đẳng cấp và dịch vụ nghỉ dưỡng cao cấp nhất
          tại trái tim thủ đô.
        </p>
      </div>
    </section>
  );
}
