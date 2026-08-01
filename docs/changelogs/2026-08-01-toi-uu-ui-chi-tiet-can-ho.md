# Cập Nhật & Tối Ưu Giao Diện Chi Tiết Căn Hộ

**Ngày thực hiện:** 01/08/2026  
**Module ảnh hưởng:** `ApartmentDetailsPageClient`, `ShareModal`

---

## 🎯 1. Phân Quyền & Bổ Sung Tính Năng Tải Ảnh (B2B)
- **Tính năng:** Tích hợp thư viện `JSZip` để nén và tải toàn bộ ảnh căn hộ dưới dạng file `.zip`.
- **Giao diện & UX:** 
  - Hiển thị Toast Notification báo cáo tiến trình tải và nén ảnh (0% - 100%) chân thực.
  - Tự động đặt tên file tải về theo cú pháp: `anh-can-ho-[Mã-Căn]-[Ngày-Tải].zip`.
- **Phân quyền:** Chỉ hiển thị nút "Tải ảnh" đối với người dùng có role là `admin` hoặc `collaborator`.

## 📱 2. Tái Cấu Trúc Nút Tương Tác Trên Mobile (Floating UI)
Để giải quyết tình trạng UI bị chật hẹp, ép chữ ở phần tiêu đề trên thiết bị di động, toàn bộ nút tương tác đã được gỡ khỏi cụm tiêu đề và chuyển thành dạng **Floating Buttons** nổi trên Carousel ảnh:
- **Góc trên bên Trái:** Đặt nút `Download` (Chỉ hiện với B2B).
- **Góc trên bên Phải:** Đặt cụm nút `Share` và `Favorite` (Tim).
- Nút bấm được đồng bộ kích thước (`h-10 w-10`), đổ bóng (`shadow-sm`) và hiệu ứng kính mờ (`backdrop-blur-md`), mang lại giao diện hiện đại chuẩn app.

## 🚀 3. Nâng Cấp Share Modal (Bottom Sheet & Messenger)
- **Responsive UI:** Chuyển đổi popup chia sẻ từ Modal ở giữa màn hình (trên Desktop) thành dạng **Bottom Sheet** kéo từ dưới lên trên thiết bị Mobile, tích hợp hiệu ứng `animate-in` mượt mà của Tailwind.
- **Messenger Integration:**
  - Gỡ bỏ chia sẻ Facebook công khai (tỷ lệ chuyển đổi thấp) để thay thế bằng tính năng gửi tin nhắn trực tiếp qua **Messenger**.
  - Thiết kế logo Messenger vector chuẩn với hiệu ứng dải màu Linear Gradient (Xanh - Tím - Đỏ).
  - Tích hợp logic nhận diện thiết bị (`navigator.userAgent`): Mở thẳng ứng dụng App Messenger thông qua `fb-messenger://share/?link=...` trên mobile hoặc mở tab Web Messenger trên Desktop.
- **Sửa lỗi Icon:** Thay thế SVG logo Zalo bị lỗi hiển thị.

## 📖 4. Tùy Chỉnh Hiển Thị "Thông Tin Chi Tiết"
Tinh chỉnh lại logic render nội dung chi tiết nhằm tối ưu trải nghiệm đọc tùy theo phân quyền:
- **Khách hàng (B2C):** Giới hạn văn bản hiển thị bằng `line-clamp-[17]`. Thêm hiệu ứng gradient mờ ở phần đáy văn bản và yêu cầu bấm nút "Hiển thị thêm" để mở Dialog đọc toàn bộ.
- **Quản trị viên / CTV (B2B):** Hiển thị toàn bộ thông tin gốc, gỡ bỏ `line-clamp`, gỡ bỏ gradient mờ và ẩn nút "Hiển thị thêm" nhằm tối ưu thao tác lấy thông tin nhanh. Cập nhật lại UI Header của Dialog tránh bị mất nút đóng (X).

## 🛠️ 5. Nhận Diện Lỗi Kỹ Thuật Next.js Image
- Ghi nhận tình trạng `TimeoutError` ở môi trường Localhost do tính năng nén ảnh của Next.js (`next/image`) vượt quá thời gian tải ảnh gốc nặng từ Firebase. 
- *Lưu ý:* Vấn đề không nghiêm trọng ở môi trường Production có băng thông lớn. Nếu cản trở quá trình dev, có thể sử dụng cờ `unoptimized` để xử lý tạm thời.