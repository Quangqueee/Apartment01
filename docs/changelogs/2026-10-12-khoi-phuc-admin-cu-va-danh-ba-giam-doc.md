# Khôi phục quyền xem của Admin cũ và làm rõ danh bạ Giám đốc

> Bổ sung nghiệp vụ: [Giám đốc phân công Admin dẫn khách](./2026-10-12-phan-cong-admin-dan-khach.md). CTV là đối tác ngoài cung cấp khách; chỉ Admin nhận lịch chung và việc dẫn khách. Phân công từng lịch tách riêng khỏi quyền xem danh sách/owner.

## Quyết định và quyền áp dụng

Theo yêu cầu bổ sung ngày 12/10/2026, Admin **đã tồn tại trong snapshot** được xem toàn bộ lịch xem nhà và CTV, kể cả dữ liệu chưa phân công và dữ liệu lịch/CTV phát sinh sau đó. Chỉ **khách hàng mới** cần Giám đốc cấp quyền theo hồ sơ. Các Admin mới không tự tham gia nhóm Admin cũ khi tạo tài khoản hoặc đổi vai trò sau snapshot. Dữ liệu chủ nhà thật tiếp tục chỉ Giám đốc đọc.

| Dữ liệu | Giám đốc | 4 Admin cũ trong snapshot | Admin ngoài snapshot |
|---|---|---|---|
| Lịch xem nhà và CTV | Toàn bộ | Đọc toàn bộ | Của mình hoặc đúng phạm vi được cấp |
| 15 khách hàng cũ | Toàn bộ | Đọc toàn bộ | Đọc khách cũ theo cơ chế baseline hiện có |
| Khách hàng mới | Toàn bộ | Đúng ID được cấp / Giám đốc phân công | Đúng ID được cấp / Giám đốc phân công |
| Sửa/xóa dữ liệu | Toàn hệ thống | Theo chủ quản lý; quyền xem không mở quyền quản lý | Theo chủ quản lý |
| Số chủ nhà thật, quản trị quyền và audit | Có | Không | Không |

Không sửa owner để khôi phục quyền xem. `accessConfig/legacyAdminAccess` chỉ có danh sách UID Admin được chốt và metadata audit; client không được ghi và chỉ Giám đốc đọc. Rules dùng cấu hình này để kiểm tra get ID, list và query lịch/CTV. API thường và API shared cũng áp dụng cùng quyền, kiểm tra lại role/quyền trước response. Đổi vai trò khỏi Admin chấm dứt quyền phục hồi này, dù UID vẫn có trong snapshot.

Danh sách khách hàng cũ vẫn là snapshot **15 ID** chốt trước đó, không dùng `createdAt` do client kiểm soát. Khách mới không được hưởng quyền này chỉ vì nằm trong lịch hoặc được tạo bởi Admin. Cấp quyền mới vẫn không gửi notification/push/email, không mở quyền xuất hay số chủ nhà thật.

## Vì sao số tài khoản trước đây thiếu

Kiểm kê thật đầu phiên: `users` có **102 hồ sơ**: 15 khách hàng, 79 CTV, 4 Admin, 1 Giám đốc, 2 chủ nhà và 1 hồ sơ chưa có role. Lần xác minh cuối có **14 khách hàng và 80 CTV**, các số còn lại giữ nguyên; dữ liệu vai trò đã thay đổi trong lúc làm việc, còn hai script migration chỉ ghi metadata quyền. Snapshot khách giữ đúng 15 ID đã chốt, không bị mở rộng/thu hẹp theo thay đổi role sau đó. Giao diện đếm theo role hiện tại và tải lại khi có tín hiệu thay đổi.

Firebase Authentication có **128 tài khoản**; **28 tài khoản không có hồ sơ users**, và **2 hồ sơ users không có Auth tương ứng**. Danh bạ hợp nhất theo UID có **130 mục**, không phải 130 khách hàng. Không tự tạo hồ sơ hoặc suy đoán role cho dữ liệu thiếu.

API director-only `accounts` lấy tất cả trang Auth (1000 tài khoản/trang), đối chiếu với Firestore và trả projection UID/tên/email/role/trạng thái hồ sơ. Không trả custom claims, token, hash mật khẩu, provider data hoặc số chủ nhà thật. Admin gọi trực tiếp endpoint này bị từ chối. Runtime server cần quyền IAM liệt kê Firebase Auth; không thêm quyền IAM tự động.

Giao diện có bốn tab:

1. **Duyệt khách mới**: mặc định hiển thị tất cả hồ sơ khách theo role hiện tại, bộ lọc chờ cấp/mới/cũ, phân trang với số kết quả rõ ràng, chọn tất cả và cấp/thu hồi theo Admin.
2. **Tất cả tài khoản**: danh bạ hợp nhất, số lượng theo vai trò, tìm tên/email/UID, phân trang, trạng thái chưa có hồ sơ/chỉ có hồ sơ/chưa rõ role. Đây là danh bạ chỉ xem; không cấp quyền cho một tài khoản chưa xác định role.
3. **Lịch & CTV**: thống kê toàn hệ thống và Admin cũ được xem. Chia sẻ bổ sung/lịch sử duyệt nằm trong khu vực thu gọn; checkbox ở đây được ghi rõ là người nhận quyền. Giới hạn chọn 50 là giới hạn mỗi phạm vi, không phải số tài khoản tải về. Grant đang hoạt động được nhóm theo chủ quản lý và loại danh sách, không in hàng loạt UID.
4. **Phân công & vai trò**: phân công có selector Admin riêng, tên collection/role bằng tiếng Việt; giữ kiểm tra backend và audit cũ.

Thống kê khách trên dashboard chỉ đếm `role=user`; số lịch chờ xử lý tính trên tập lịch backend cho phép xem, gồm quyền Admin cũ. Admin không có menu quản trị/chia sẻ và không thấy hồ sơ Giám đốc trong API danh sách.

## Snapshot, áp dụng và rollback

`scripts/legacy-admin-access.cjs` mặc định dry run, chốt UID Admin từ truy vấn database của operator. Khi apply cần Giám đốc hiện hữu, transaction kiểm tra role operator, snapshot hash và từng UID nhận quyền; không mở rộng nhóm khi chạy lại. Cấu hình/audit/tín hiệu refresh được ghi cùng transaction. Apply lại snapshot complete không thay đổi. Rollback giữ hồ sơ, vai trò, owner và các grant đã có.

Snapshot khách: `.test-runtime/customer-legacy-snapshot.json` (15 ID). Snapshot Admin: `.test-runtime/legacy-admin-snapshot.json` (4 UID). Cần lưu bản sao vào nơi quản trị được bảo vệ; `.test-runtime` gitignored. Đã tìm thấy Giám đốc hiện hữu **Quang Nguyễn Đức / quangluxury6886@gmail.com**, UID `U0W8RAIbghM2kYuKMYUTl9ij1Eq1`. Không đổi vai trò `ngducquazg@gmail.com` hoặc tài khoản nào khác.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path './serviceAccountKey.json').Path
# Dry run để kiểm tra snapshot đã chốt:
node scripts/legacy-admin-access.cjs --project quang-apartment --snapshot .test-runtime/legacy-admin-snapshot.json
# Apply sau kiểm thử; hai snapshot đã được áp dụng ở phiên làm việc này:
node scripts/customer-legacy.cjs --project quang-apartment --snapshot .test-runtime/customer-legacy-snapshot.json --operator U0W8RAIbghM2kYuKMYUTl9ij1Eq1 --apply
node scripts/legacy-admin-access.cjs --project quang-apartment --snapshot .test-runtime/legacy-admin-snapshot.json --operator U0W8RAIbghM2kYuKMYUTl9ij1Eq1 --apply
firebase deploy --project quang-apartment --only "firestore:rules" --non-interactive
# Rollback quyền phục hồi, không xóa grant/profile/role:
node scripts/legacy-admin-access.cjs --project quang-apartment --snapshot .test-runtime/legacy-admin-snapshot.json --operator U0W8RAIbghM2kYuKMYUTl9ij1Eq1 --apply --rollback
node scripts/customer-legacy.cjs --project quang-apartment --snapshot .test-runtime/customer-legacy-snapshot.json --operator U0W8RAIbghM2kYuKMYUTl9ij1Eq1 --apply --rollback
```

Không rollback rules về bản cho tự nâng role/đọc dữ liệu riêng tư. Không chạy lại dry run bằng snapshot mới để biến khách/Admin phát sinh sau đó thành dữ liệu cũ. Số chủ nhà thật không được nhập, backfill hoặc ghi vào log ở các thao tác này. Thông tin owner chưa rõ vẫn do Giám đốc phân công riêng.

## Kiểm tra và triển khai

- API/policy: 17/17 đạt, có kiểm thử Auth phân trang, hồ sơ thiếu, quyền Admin cũ, đọc ID, khách tương lai và giới hạn quản lý.
- Firestore Emulator: 11/11 đạt, có chạy thực tế hai script dry-run/apply/rerun/rollback, query cả collection lịch và query CTV; kiểm tra Admin mới không được hưởng baseline, khách mới không bị mở, quyền xem không thành sửa/xóa và metadata/số thật vẫn bị chặn.
- Listener: 4/4 đạt. TypeScript đạt. Next compile build đạt; chưa chạy full prerender hoặc browser có phiên đăng nhập thực tế.
- Graphify bị lỗi local `uv trampoline failed to canonicalize script path`; đã đọc graph report. Repository chưa có lint config.

Production `quang-apartment`: hai snapshot đã apply thành công và được đối chiếu đúng **15 ID / 4 UID**, có audit, hai script không sửa vai trò/hồ sơ. Firestore rules đã deploy thành công và xác minh **hash khớp source local**. Storage vẫn khớp source cũ; các index lịch owner/createdAt hiện hữu READY, không thay đổi Storage/index ở bản này. CLI có cảnh báo hai helper role cũ không sử dụng, không có lỗi biên dịch rules. Chưa deploy code website; mã API/UI đã sửa trong workspace, cần chạy phiên bản web mới để sử dụng giao diện/danh bạ mới. Chưa xác minh browser có phiên đăng nhập; không kiểm tra hoặc sửa repository mobile/Cloud Functions ngoài workspace.
