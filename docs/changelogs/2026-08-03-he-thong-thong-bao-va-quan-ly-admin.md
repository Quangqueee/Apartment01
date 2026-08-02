# 🚀 Nâng Cấp Hệ Thống Thông Báo Toàn Diện & Quản Lý Admin

**Ngày cập nhật:** 03/08/2026  
**Hệ thống:** Hanoi Residences  

---

## 📋 Tổng Quan Các Thay Đổi

Bản cập nhật này tập trung hoàn thiện hệ thống thông báo thời gian thực (Real-time Notifications) qua Firestore, chuẩn hóa luồng tương tác giữa **Admin**, **Cộng tác viên (CTV)**, **User thường** và **Khách vãng lai (Guest)**, đồng thời bổ sung các công cụ quản trị quan trọng tại trang tổng quan và danh sách lịch hẹn.

---

## 🛠️ Chi Tiết Các Tính Năng & Thay Đổi Kỹ Thuật

### 1. Hệ Thống Thông Báo & Triggers Đa Luồng (`src/lib/notifications.ts`, `booking-widget.tsx`, `auth-service.ts`)
* **Hàm trợ giúp chung (`notifyAdmins`):** Xây dựng hàm helper tập trung để query toàn bộ các tài khoản có quyền `role == "admin"` và tự động tạo thông báo đồng loạt, tránh lặp code.
* **Thông báo cho Admin:**
  * **Lịch hẹn CTV:** Khi CTV tạo lịch đặt lịch dẫn khách/xem nhà, hệ thống bắn thông báo tới Admin.
  * **Lịch hẹn User & Khách vãng lai:** Cả User thường lẫn khách vãng lai (không có tài khoản) khi gửi yêu cầu đặt lịch/tư vấn đều kích hoạt bắn thông báo tới toàn bộ Admin.
  * **Đăng ký tài khoản User mới:** Tự động tạo thông báo cho Admin khi có user mới hoàn tất đăng ký (`signup`).
  * **Đăng ký CTV mới:** Thông báo cho Admin khi có hồ sơ điền form đăng ký CTV (`ctv-register`) với trạng thái `requestStatus: "pending"`.
* **Thông báo cá nhân cho User / CTV:**
  * **Xác nhận đặt lịch:** Khi User hoặc CTV đặt lịch thành công, hệ thống gửi thông báo xác nhận trực tiếp vào chuông của họ.
  * **Cập nhật ghi chú từ Admin:** Khi Admin thêm hoặc chỉnh sửa `adminNotes` trên lịch hẹn, hệ thống tự động thông báo tới chủ sở hữu lịch hẹn.

### 2. Chuẩn Hóa Câu Chữ (Wording) Trong Thông Báo
* **Gửi Admin:** Nêu rõ danh tính chủ thể thực hiện hành động (Ví dụ: *"Khách [Tên] đã đặt lịch mới"*, *"CTV [Tên] đã đặt lịch hẹn..."*).
* **Gửi User / CTV:** Chuyển đổi toàn bộ sang đại từ xưng hô trực diện là **"Bạn"** (Ví dụ: *"Bạn đã đặt lịch hẹn thành công cho căn..."*, *"Lịch hẹn của bạn đã được chuyển sang trạng thái..."*, *"Admin đã cập nhật ghi chú cho lịch hẹn căn..."*).

### 3. Nâng Cấp Giao Diện Popover Chuông Thông Báo (`notification-bell.tsx`, `use-notifications.ts`)
* Tích hợp nút **"Đánh dấu tất cả là đã đọc"** (Mark all as read) ngay trên tiêu đề Popover.
* Sử dụng Firestore `writeBatch` để cập nhật trạng thái `isRead: true` hàng loạt mượt mà, chỉ hiển thị khi có thông báo chưa đọc.

### 4. Tối Ưu Trang Tổng Quan Admin (`[adminPath]/page.tsx`)
* Bổ sung thêm thẻ thống kê (Metric Card) đếm số lượng tài khoản CTV đang chờ duyệt (`requestStatus == "pending"` trong collection `users`).
* Bổ sung thẻ thống kê số lượng lịch hẹn đang chờ xử lý, đảm bảo đồng bộ hoàn toàn về phong cách thiết kế, màu sắc và layout với các thẻ sẵn có.

### 5. Bộ Lọc Trạng Thái Tại Trang Quản Lý Lịch Hẹn Admin (`[adminPath]/bookings/page.tsx`)
* Bổ sung Dropdown chọn lọc theo trạng thái chuẩn: `pending` (Chờ duyệt), `approved` (Đã duyệt), `contacted` (Đã liên hệ/dẫn), `failed` (Đã hủy/thất bại).
* Đồng bộ logic tìm kiếm, phân trang và xử lý trạng thái trống (empty state).

### 6. Vá Lỗi & Dọn Dẹp Giao Diện Profile User (`profile/page.tsx`)
* Gỡ bỏ hoàn toàn khối form đăng ký CTV trùng lặp nằm trong trang cá nhân của User thường nhằm bảo vệ nguồn doanh thu và tránh nhầm lẫn dữ liệu (`interests` vs `ctvIntroduction`).
* Khắc phục triệt để lỗi runtime `ReferenceError: Dialog is not defined` do thiếu import component.