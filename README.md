# 📂 Lịch Sử Cập Nhật Hệ Thống (Changelogs)

Thư mục này lưu trữ tài liệu kỹ thuật và lịch sử các tính năng, bản vá lỗi được phát triển cho hệ thống **Hanoi Residences**.

---

## 📋 Bảng Mục Lục Cập Nhật

| Ngày           | Tiêu Đề / Tính Năng                                             | Mô Tả Ngắn Gọn                                                                                                                                       | File Chi Tiết                                                       |
| :------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| **03/08/2026** | Nâng Cấp Hệ Thống Thông Báo Toàn Diện & Quản Lý Admin           | Xây dựng hệ thống thông báo đa luồng (Admin, User, CTV, Khách vãng lai), chuẩn hóa wording, bổ sung thống kê chờ duyệt, bộ lọc trạng thái và vá lỗi. | [Xem chi tiết](./2026-08-03-he-thong-thong-bao-va-quan-ly-admin.md) |
| **02/08/2026** | Nâng Cấp Toàn Diện Hệ Thống Đặt Lịch & Quản Lý Khách Hàng (CRM) | Xây dựng Booking Widget đa luồng, trang quản lý Admin & Profile, tìm kiếm không dấu, phân quyền Khách cá nhân/CTV, tối ưu hiệu năng Firestore.       | [Xem chi tiết](./2026-08-02-he-thong-quan-ly-dat-lich.md)           |
| **01/08/2026** | Tối Ưu UI Chi Tiết Căn Hộ & Modal Chia Sẻ                       | Bổ sung tải ảnh ZIP (B2B), chuyển Share Modal sang Bottom Sheet, thêm chia sẻ Messenger, cấu trúc lại cụm nút Floating trên Mobile.                  | [Xem chi tiết](./2026-08-01-toi-uu-ui-chi-tiet-can-ho.md)           |
| **31/07/2026** | Khắc Phục Cache, Serialization & Tối Ưu Markdown                | Xử lý triệt để lỗi chuyển đổi Timestamp Firebase sang Client Component, khắc phục kẹt cache, tích hợp hiển thị Markdown chuẩn SEO.                   | [Xem chi tiết](./2026-07-31-xu-ly-cache-serialization-markdown.md)  |
| **30/07/2026** | Phân Quyền Tag & Giao Diện Card                                 | Nâng cấp hệ thống Zod schema, tách biệt tag B2B/B2C, thiết kế UI dạng ruy-băng cho thẻ căn hộ.                                                       | [Xem chi tiết](./2026-07-30-tag-marketing-phan-quyen.md)            |

---

## 📌 Quy Tắc Đặt Tên File Tài Liệu Mới

Khi phát triển tính năng mới sau này, hãy tuân thủ quy tắc đặt tên file:

- **Cú pháp:** `YYYY-MM-DD-ten-tinh-nang-ngan-gon.md`
- **Ví dụ:** `2026-08-15-tinh-nang-dat-lich-xem-nha.md`
- Sau khi tạo file mới, nhớ cập nhật bổ sung vào bảng mục lục ở trên để dễ dàng tra cứu.
