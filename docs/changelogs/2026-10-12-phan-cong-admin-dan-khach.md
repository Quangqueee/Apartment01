# Giám đốc phân công Admin dẫn khách; CTV là nguồn khách bên ngoài

## Mô hình nghiệp vụ đã sửa

CTV là đối tác ngoài đăng tin/tìm nhà và gửi nhu cầu/khách. CTV không phải nhân sự nhận việc dẫn khách và không được cấp quyền xem lịch chung. Nhân sự dẫn khách là tài khoản `admin`, do Giám đốc phân công. CTV vẫn xem và cập nhật các thông tin cá nhân vốn được phép trên lịch do chính họ gửi; không xem lịch của CTV/khách khác qua grant, API shared hoặc truy vấn database.

Có hai quyền khác nhau: **quyền xem danh sách** và **trách nhiệm xử lý một lịch**. Bốn Admin cũ vẫn được xem toàn bộ lịch/CTV theo baseline đã áp dụng trước đó. Chia sẻ quyền xem lịch bổ sung chỉ nhận Admin nội bộ, không tạo quyền sửa/xóa. Giám đốc giao từng lịch cho Admin cụ thể để cập nhật trạng thái/ghi chú xử lý. Khách mới vẫn cần duyệt quyền hồ sơ riêng; giao một lịch không tự mở toàn bộ hồ sơ khách hay số chủ nhà thật.

## Dữ liệu, API và rules

- Lịch thuộc `user_bookings`, `ctv_bookings`, `guest_consultations`. Thêm `assignedAdminId` và `assignedAt`, do API Giám đốc ghi. Không ghi đè `ownerAdminId` hoặc `createdByAdminId`; người quản lý dữ liệu/đăng căn và người dẫn khách là hai thông tin riêng.
- Người phân công nằm trong `accessAudit` chỉ Giám đốc đọc, không ghi `assignedBy` mới vào document lịch mà Admin đọc trực tiếp. Audit có actor UID, đường dẫn lịch, Admin trước/sau và server timestamp; không có số điện thoại hay nội dung khách.
- `/api/customer-access`, action `assign-bookings`: chỉ Giám đốc, tối đa 100 lịch/lô; recipient phải có profile role `admin` và Auth account tồn tại, đang hoạt động. `adminUid:null` bỏ phân công. Transaction xác minh lại actor/recipient, tồn tại tất cả lịch và `expectedAdminUid` để phát hiện form cũ. Một lô lỗi không ghi một phần. Client giữ giá trị phân công tại lúc chọn; nếu bị xung đột thì yêu cầu chọn lại trên dữ liệu mới.
- API lịch đọc quyền/role/grants/assignment/dữ liệu trong cùng transaction. Admin nhận việc được đọc dữ liệu cần dẫn khách, cập nhật `status`, `adminNotes`, `updatedAt`; không tự được xóa, đổi owner, đổi client, đổi người phụ trách hoặc chia sẻ tiếp. `canManage` và `canDelete` được tách trong response/UI. Người quản lý dữ liệu vẫn giữ quyền cũ của mình.
- Firestore cho Admin được phân công chỉ cập nhật trạng thái hợp lệ và ghi chú tối đa 4000 ký tự, `updatedAt` là server timestamp. Mọi client, kể cả Giám đốc, không được trực tiếp ghi/thay assignment; dùng API có audit. Các luồng tạo lịch không được tự chèn assignment.
- Cấp/duyệt/đề nghị share `bookings` chỉ nhận role `admin`. Đọc lịch qua API shared và rules yêu cầu staff; grant lịch cũ cho CTV hoặc tài khoản ngoài không tạo quyền đọc. Quyền cá nhân của CTV trên chính lịch mình gửi vẫn tồn tại độc lập.
- Giao/đổi/bỏ phân công không gọi notification/email/push. Tín hiệu timestamp làm mới danh sách và xóa dữ liệu cũ khi đổi quyền; người nhận không được cung cấp actor phân công. Thông báo trạng thái/ghi chú cho khách hoặc CTV gửi lịch giữ quy trình hiện có.

## Giao diện

Tab mặc định của Giám đốc là **Phân công dẫn khách**: đếm toàn bộ/chưa phân công/đã phân công; tìm khách, số điện thoại, căn, CTV nguồn khách hoặc Admin; chọn từng lịch hoặc tất cả kết quả; chọn **một Admin nội bộ**; Giao/đổi Admin hoặc Bỏ phân công. Danh sách hỗ trợ phân trang, mobile, loading/rỗng/lỗi và báo số lô đã xử lý khi một lô thất bại.

Khu vực share danh sách nâng cao được ghi rõ là quyền đọc, picker lịch chỉ liệt kê Admin. Khu vực dữ liệu của CTV được gọi là nguồn khách, không phải người nhận việc. Trang Lịch thông thường hiển thị Admin dẫn khách và bộ lọc **Lịch tôi nhận dẫn khách**; Admin được giao việc có trạng thái/ghi chú, nút xóa bị chặn khi không có quyền chủ quản lý. Menu Giám đốc vẫn không xuất hiện cho Admin.

## Áp dụng, dữ liệu cũ và rollback

Kiểm kê chỉ đọc production có 79 lịch (28 user, 39 CTV, 12 khách vãng lai), chưa có assignment, và không có grant lịch active cho tài khoản nào. Vì vậy không cần migration/backfill hay thu hồi dữ liệu live. **Không tự giao 79 lịch cho ai**; Giám đốc tự chọn ở giao diện. Lịch thiếu `assignedAdminId` hiện “Chưa phân công”. Không suy đoán người phụ trách từ owner hoặc người đăng căn.

Rules cần deploy cùng source mới để hỗ trợ Admin xử lý việc được giao và chặn share lịch cho CTV. Không cần index mới vì API truy vấn server theo cơ chế hiện có; truy vấn trực tiếp bằng `assignedAdminId` đã được kiểm thử emulator.

Rollback một phân công: Giám đốc chọn lịch và Bỏ phân công hoặc đổi lại Admin trước đó, có kiểm tra version/audit. Không xóa owner, contact, audit hoặc customer grants. Nếu rollback UI/API thì giữ rules chặn khách/CTV đọc lịch chung và giữ các field assignment bất biến. Không quay về rules cũ cho grant lịch ngoài Admin. Operator chưa có script tự rollback hàng loạt assignment vì không có phân công live nào được tạo trong phiên này.

## Kiểm thử

- API: 19/19 đạt, kiểm tra recipient chỉ Admin, tài khoản disabled/missing, body giả actor, bulk invalid không ghi một phần, stale assignment 409, reassign/unassign, quyền xử lý/xóa, không cấp hồ sơ khách và không notification.
- Firestore Emulator: 13/13 đạt, gồm grant cũ cho CTV vẫn bị từ chối, quyền cá nhân CTV giữ nguyên, direct ID/query của assignee, chỉ sửa trạng thái/ghi chú, chống tạo/sửa assignment trực tiếp và thu hồi quyền xử lý sau bỏ phân công.
- Listener: 4/4 đạt. TypeScript và Next compile build đạt (compile mode, không full prerender).
- Chưa kiểm thử browser với phiên đăng nhập thực tế hoặc mobile/Cloud Functions ngoài workspace. Không báo full prerender/lint đạt; Graphify local vẫn lỗi uv trampoline.

Firestore rules đã deploy thành công lên `quang-apartment` sau kiểm thử. Chưa đổi vai trò tài khoản hay tự phân công lịch trên production. Mã API/UI cập nhật ở workspace; chưa deploy website. Người dùng chạy phiên bản web mới và chọn Admin/lịch cụ thể để phân công. Storage và index không thay đổi trong bản này.
