export default function TrustSection() {
  const values = [
    {
      icon: "🛡️",
      title: "Thông tin xác thực",
      desc: "Căn hộ thật, hình ảnh thật 100% đã được kiểm duyệt.",
    },
    {
      icon: "⚡",
      title: "Hỗ trợ tận tâm",
      desc: "Tư vấn viên chuyên nghiệp luôn sẵn sàng hỗ trợ bạn 24/7.",
    },
    {
      icon: "💎",
      title: "Phân khúc cao cấp",
      desc: "Chỉ cung cấp những căn hộ đạt chuẩn nội thất và tiện nghi.",
    },
  ];

  return (
    <section className="py-24 border-t">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        {values.map((v) => (
          <div key={v.title} className="flex flex-col items-center space-y-4">
            <div className="text-5xl">{v.icon}</div>
            <h4 className="text-xl font-bold">{v.title}</h4>
            <p className="text-muted-foreground text-sm max-w-[250px] italic">
              {v.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
