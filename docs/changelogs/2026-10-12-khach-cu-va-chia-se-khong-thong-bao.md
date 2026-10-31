# Khách hàng cũ và cấp quyền xem không gửi thông báo — 12/10/2026

> Bản tiếp theo đã xác định Giám đốc hiện hữu, áp dụng snapshot khách cũ và bổ sung quyền toàn bộ lịch/CTV cho Admin cũ cùng danh bạ đầy đủ: [Quyền Admin cũ và danh bạ Giám đốc](./2026-10-12-khoi-phuc-admin-cu-va-danh-ba-giam-doc.md). Trạng thái chờ UID bên dưới là lịch sử của bản trước.

## Thay đổi nghiệp vụ

Bản này thay thế phạm vi chia sẻ khách hàng theo danh sách Admin trong bản Giám đốc ban đầu. Khách hàng là hồ sơ `users.role == user`; CTV và đơn đăng ký đối tác giữ quy trình riêng. Danh sách khách hàng cũ được chốt bằng ID từ truy vấn Firestore của operator, không dùng ngày đăng ký do client ghi. Mọi Admin được đọc khách hàng cũ. Khách mới chỉ được đọc khi Giám đốc cấp quyền riêng hoặc phân công Admin quản lý hồ sơ. Phân công là một quyết định có audit của Giám đốc, không phải quyền tự nhận của Admin.

Admin không có hai menu “Quyền xem dữ liệu” và “Dữ liệu được chia sẻ”. Truy cập trực tiếp trang quản lý quyền, API tổng quan và metadata cấp quyền cũng bị chặn. Hồ sơ Giám đốc không xuất hiện trong danh sách/API dành cho Admin. Dữ liệu đã cấp được xem ngay ở các trang Khách hàng/Lịch hẹn thông thường, không hiển thị người phê duyệt.

Không gửi notification, push, email hay banner khi cấp/thu hồi quyền. Đăng ký khách mới không còn gọi `notifyAdmins` chứa tên/email khách chưa được duyệt. API registration chỉ cập nhật tín hiệu tải lại, có kiểm tra danh tính và chống gọi lặp. Thông báo nghiệp vụ hiện có về trạng thái lịch của khách/CTV được giữ nguyên.

Không có cam kết che giấu tuyệt đối vai trò khỏi người kiểm tra mã JavaScript tải về. Quyền hạn do backend/rules kiểm soát; việc ẩn menu không phải biện pháp bảo mật. Cloud Functions/repository mobile ngoài workspace chưa được kiểm chứng.

## Ma trận áp dụng

| Dữ liệu/thao tác | Giám đốc | Admin |
|---|---|---|
| Khách cũ trong snapshot | Đọc/quản lý toàn bộ | Đọc toàn bộ; quản lý theo quyền sở hữu |
| Khách mới | Đọc/quản lý toàn bộ | Đọc đúng ID được cấp hoặc được phân công |
| Quyền xem khách mới | Cấp/thu hồi theo hồ sơ và tài khoản | Không cấp/sửa/chia sẻ tiếp |
| Xuất khách mới được cấp quyền xem | Có | Không được cấp quyền xuất |
| Xuất khách cũ/quản lý hồ sơ của mình | Có | Giữ quyền xuất sẵn có |
| Lịch/CTV | Toàn hệ thống | Của mình; đọc thêm đúng phạm vi được cấp |
| Số chủ nhà thật | Có | Không, kể cả đã được cấp xem khách/lịch |
| Đọc quyền, audit, danh sách Giám đốc | Có | Không |

Quyền xem không cấp sửa/xóa. Thu hồi quyền riêng không xóa quyền sở hữu hoặc quyền toàn cục trên khách cũ; cần đổi phân công nếu muốn bỏ quyền quản lý. Không thể thu hồi dữ liệu mà người dùng đã tự sao chép sau khi được phép xem.

## Giao diện và backend

Giám đốc mở menu “Quyền xem dữ liệu”, tab “Khách hàng”: lọc Chờ cấp quyền/Khách mới/Khách cũ/Tất cả, tìm tên/email/điện thoại, chọn tất cả kết quả kể cả ngoài trang hiện tại, chọn Admin rồi Cấp quyền xem hoặc Thu hồi quyền xem riêng. Chỉ các ID đã chọn được xử lý; không tự mở quyền cho khách tương lai. Tối đa 100 khách mỗi transaction và 50 Admin mỗi hồ sơ; UI chia danh sách lớn thành các lô và báo số đã xử lý nếu một lô lỗi.

Tab còn lại giữ duyệt/cấp lịch và CTV, phân công bản ghi chưa rõ owner và quản trị vai trò. Admin không còn luồng đề nghị chia sẻ qua UI/API, theo yêu cầu bỏ khu vực này.

`/api/customer-access` xác minh ID token, role từ database, kiểm tra lại role/quyền trước response và bên trong transaction ghi. Chỉ Giám đốc cấp/thu hồi. Đối tượng phải là khách `user`, người nhận phải là `admin`; không nhận actor/approver từ client. API hồ sơ và lịch chỉ trả projection cần hiển thị, `private, no-store`. API đối tác tách projection đơn đăng ký để giữ quy trình duyệt cũ mà không mở toàn bộ hồ sơ khách chưa được cấp.

`customerVisibility/{customerUid}` chứa `legacy`, `adminReaders`, `baselineId`, `updatedBy`, `updatedAt`. Chỉ Giám đốc đọc trực tiếp, không client nào ghi. Firestore rules dùng metadata này cho get ID và truy vấn; giả ngày đăng ký hoặc gửi field legacy trong profile không tạo quyền. Mã API dùng Admin SDK nên tự thực hiện cùng kiểm tra, không dựa vào rules thay cho backend.

`customerAccessState/records` chỉ chứa server timestamp; staff được đọc. Nó làm mới danh sách và xóa dữ liệu đã cache khi quyền đổi, không phải notification và không tiết lộ actor. Response cũ được loại bằng revision guard. Danh sách tải lại mỗi 60 giây khi tab đang hiển thị và khi focus để hỗ trợ thay đổi từ client cũ không gọi tín hiệu. Backend/rules chặn lượt đọc tiếp theo ngay khi quyền thu hồi.

Audit server lưu actor, đối tượng, before/after và thời gian; không ghi số chủ nhà thật. Grant cập nhật giữ nguyên baselineId để rollback không mất dấu dữ liệu cũ.

## Chốt khách cũ, áp dụng và rollback

Script `scripts/customer-legacy.cjs` mặc định dry run. Nó tạo file snapshot một lần, không ghi Firebase. Apply yêu cầu operator đang là Giám đốc trong database. Khi đã chốt không được tạo snapshot mới để biến khách mới thành khách cũ. Bản ghi đổi vai trò khỏi `user` hoặc đã xóa được bỏ qua; không suy đoán owner, không sửa profile/role. Trạng thái applying/complete cho phép tiếp tục an toàn nếu bị gián đoạn. Rerun cùng snapshot complete không tạo thêm thay đổi.

Snapshot đã kiểm tra tại workspace: `.test-runtime/customer-legacy-snapshot.json`, **15 ID**, mốc **12/10/2026 12:11:48 GMT+7** (`2026-10-12T05:11:48.162Z`). Lưu bản sao snapshot vào nơi quản trị được bảo vệ để dùng rollback; thư mục `.test-runtime` được gitignore.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path './serviceAccountKey.json').Path
# Tạo snapshot mới chỉ khi hệ thống chưa có baseline; không chạy lại để mở rộng khách cũ:
node scripts/customer-legacy.cjs --project quang-apartment --snapshot SNAPSHOT.json
# Sau khi kiểm tra snapshot và danh tính Giám đốc:
node scripts/customer-legacy.cjs --project quang-apartment --snapshot SNAPSHOT.json --operator DIRECTOR_UID --apply
firebase deploy --project quang-apartment --only "firestore:rules" --non-interactive
# Rollback đúng snapshot đã áp dụng:
node scripts/customer-legacy.cjs --project quang-apartment --snapshot SNAPSHOT.json --operator DIRECTOR_UID --apply --rollback
```

Rollback chỉ bỏ cờ legacy có đúng baselineId, giữ các grant riêng, profile, owner và audit. Không rollback rules về bản cũ cho phép tự đổi role/đọc số riêng tư. Nếu rollback code website thì phải giữ backend/rules hiện tại và điều chỉnh truy vấn; website/mobile cũ truy vấn toàn bộ users sẽ bị từ chối.

Kiểm tra production trước áp dụng phát hiện email `ngducquazg@gmail.com` có role `admin`. Script đã dừng và không ghi Firebase. Cần được người dùng xác nhận cấp Giám đốc hoặc cung cấp operator Giám đốc hiện hữu trước khi apply; không tự đổi vai trò để vượt điều kiện này.

## Xác minh

- `npm run test:access`: 15/15 đạt, bao gồm cấp đúng ID/receiver, chưa duyệt, pending/rejected, revoke, view-only, metadata riêng, legacy, chống giả ngày/approver và không tạo notification.
- `npm run test:rules`: 10/10 đạt trên Firestore Emulator, bao gồm chạy script chốt/apply/rerun/rollback thật, khách đăng ký sau snapshot, truy vấn ID/list và chống ghi trực tiếp quyền.
- `npm run test:listeners`: 4/4 đạt.
- `npm run typecheck`: đạt.
- Next compile build đạt; không thực hiện full prerender/generate trên dữ liệu thật. Chưa kiểm thử browser đăng nhập thực tế.
- Repository chưa cấu hình lint; Graphify local lỗi uv trampoline, không báo hai kiểm tra này đạt.

Người dùng đã chọn giữ nguyên `ngducquazg@gmail.com` và sẽ cung cấp UID Giám đốc khác. Chưa apply snapshot hoặc deploy rules của bản sửa đổi này, để tránh khoảng trống quyền khách cũ trước khi chuyển đổi hoàn tất. Rules đã deploy ở bước trước vẫn giữ nguyên. Code website chỉ sửa ở workspace, chưa deploy website.
