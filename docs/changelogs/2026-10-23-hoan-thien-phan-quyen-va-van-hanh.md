# Phân quyền và điều hành bất động sản — 23/10/2026

Tài liệu này thay thế các quy tắc mâu thuẫn trong thiết kế ngày 12/10. Chỉ sửa source và chạy kiểm thử local/emulator; không deploy, chạy migration production, tạo tài khoản thật hoặc đổi vai trò thật.

## Kiến trúc và dữ liệu đã xác minh

- Next.js 15 App Router, React, TypeScript, Tailwind/Shadcn; Firebase Auth; Firestore/Storage; Admin SDK đã có trong `src/firebase/admin-init.ts`. Không thêm dependency.
- Quyền server dựa trên ID token được `verifyIdToken(token, true)` xác minh và role hiện tại tại `users/{uid}`. Mutation kiểm tra lại role trong transaction. Client không được sửa role, owner hoặc phân công.
- `users` chứa tài khoản/hồ sơ, không phải mọi khách thuê. Nguồn khách còn nằm tại `ctv_bookings`, `guest_consultations`, `user_bookings` do Admin nhập. Vì vậy chỉ đếm `users.role == user` sẽ bỏ sót khách CTV/vãng lai.
- Hồ sơ và lịch nối nhau chỉ bằng `userId` hợp lệ, không gộp bằng tên/SĐT. Một khách xuất hiện ở nhiều nguồn chưa có UID có thể còn nhiều dòng; giao diện ghi rõ đây là **khách / nguồn khách**, không khẳng định là số người duy nhất.
- Quyền căn hộ, chủ nhà, đặt phòng ngắn hạn, thanh toán và thông báo nghiệp vụ khác giữ cơ chế hiện có. `landlordPhoneNumber`/`contactPhone` cũ là liên hệ hiển thị; số thực tế mới chỉ ở `landlordContacts`.

## Ma trận quyền cuối cùng

| Chủ thể | Khách hàng | Công việc khách | Lịch dẫn | Quyền/role/audit | Số chủ nhà thật |
|---|---|---|---|---|---|
| Director | Tất cả hồ sơ và nguồn khách | Giao/chuyển/bỏ giao, cập nhật tiến độ | Toàn bộ, phân công Admin | Quản trị và audit; không tự đổi role mình | Đọc/ghi qua API riêng |
| Admin tạo/chủ quản lý | Khách thuộc mình; khách cũ và quyền đọc hợp lệ khác | Xử lý tiến độ thuộc mình | Quản lý lịch thuộc mình theo quyền cũ | Không cấp quyền, không tự đổi owner/role đặc quyền | Không |
| Admin được giao khách | Đọc đúng khách được giao | Chỉ cập nhật tiến độ công việc | Không tự nhận quyền xử lý lịch | Không chia sẻ, xóa hồ sơ, đổi role/owner hoặc xuất | Không |
| Admin được giao lịch | Thông tin cần thiết của lịch | Không tự mở toàn bộ hồ sơ khách | Cập nhật trạng thái/phản hồi của lịch được giao; không xóa/giao tiếp | Không | Không |
| Admin được cấp quyền xem | Đọc đúng các khách đã chọn | Không sửa tiến độ | Chỉ đọc nếu được cấp quyền lịch tương ứng | Không sửa/xóa/xuất/chia sẻ tiếp | Không |
| Mọi Admin xem khách cũ | Đọc các ID cũ đã được xác minh | Không thêm quyền sửa/xóa/xuất chỉ từ nhãn cũ | Admin cũ xem lịch cũ đã chốt; lịch mới theo phạm vi | Không | Không |
| CTV bên ngoài | Phạm vi giới thiệu/luồng cá nhân đang có | Không quản trị nội bộ | Giữ lịch tự gửi và phản hồi hiện có; không được nhận phân công/chia sẻ lịch nội bộ | Không | Không |
| User / landlord | Hồ sơ, lịch, tin đăng của mình theo quyền cũ | Không quản trị nội bộ | Luồng cá nhân hiện có | Không | Không |

Các quyền độc lập được hợp lại: thu hồi grant không xóa quyền xem khách cũ, quyền chủ quản lý hay phân công còn hiệu lực. Muốn bỏ trách nhiệm của người nhận phải dùng **Bỏ phân công** hoặc giao lại; muốn dừng chia sẻ dùng **Thu hồi quyền riêng**.

## Mô hình bổ sung

Không di chuyển hoặc ghi đè nguồn gốc. Khóa khách có dạng `collection~id` với collection trong whitelist.

- `customerWork/{key}`: `assignedAdminId`, `assignedAt`, `status`, `revision`, `updatedAt`. Chỉ API ghi; không chứa số chủ nhà, ghi chú nội bộ hoặc người giao để lộ qua hồ sơ cá nhân. Người thực hiện nằm ở audit riêng.
- `customerVisibility/{uid}`: giữ snapshot `legacy`, `baselineId` và `adminReaders` cũ của hồ sơ tài khoản.
- `customerLeadVisibility/{key}`: quyền đọc riêng/legacy cho khách chưa nối với tài khoản.
- `legacyBookingAccess/{collection~id}`: các lịch cũ đã xác minh. Chỉ dùng cùng danh sách Admin cũ hiện tại ở `accessConfig/legacyAdminAccess`.
- `customerLeads/{id}`: khách Admin nhập khi chưa cần tạo lịch/tài khoản. API lấy owner/creator từ token; xác minh CTV giới thiệu nếu được gửi. Không tạo Firebase Auth account ngầm.
- `operationsBulk/{jobId}` và `chunks/{n}`: kế hoạch server xác minh, gắn actor, phạm vi và version; không chứa tên, SĐT hay ghi chú. Client không đọc/ghi database trực tiếp các job này.

Tiến độ khách: chưa cập nhật, mới tiếp nhận, đang xử lý, đã liên hệ, đã xử lý, dừng xử lý. **Đã xử lý không có nghĩa đã thuê thành công**. Dữ liệu cũ chưa có tiến độ để chưa cập nhật; không suy ra từ trạng thái lịch.

## Khách cũ, mới và lịch cũ

Hồ sơ khách cũ vẫn dựa trên snapshot ID đã được tin cậy tại `accessConfig/customerLegacy`. Không mở rộng snapshot bằng lần chạy lại. `createdAt` hoặc `legacy` do client đưa vào không phải bằng chứng cấp quyền.

Nguồn khách/lịch cũ mới bổ sung được xác minh bằng **Firestore document createTime** và mốc `capturedAt` của baseline đã chốt. Đây là metadata của database, khác field `createdAt` có thể do client ghi. Nếu thiếu metadata/mốc hợp lệ thì đưa vào báo cáo chưa xác định, giữ quyền chủ quản lý đã biết và quyền cá nhân; không tự mở rộng quyền hoặc tự gán owner/CTV.

Sau mốc là mới; nguồn có trước mốc nhưng chưa được snapshot xác minh là chưa xác định. Mọi Admin được xem nguồn khách cũ hợp lệ. Chỉ những Admin thuộc baseline Admin cũ được xem thêm lịch cũ nối với hồ sơ mà họ chưa có quyền hồ sơ đầy đủ.

**Thay đổi có chủ ý:** cơ chế cũ cho Admin cũ đọc cả mọi lịch tương lai có thể làm lộ khách mới. Bản này chuyển sang lịch cũ theo ID; lịch mới phải thuộc owner, phân công hoặc quyền đọc cụ thể. Quyền CTV của Admin cũ vẫn giữ. Quyền lịch theo danh sách của một Admin mà Director đã chủ động cấp là quyền riêng, độc lập với baseline.

Xóa rồi tạo lại một booking cùng ID không được kế thừa marker/grant/phân công cũ: rules chặn create nếu ID đã có metadata quyền. Luồng tạo lịch bình thường dùng ID mới vẫn hoạt động. Không xóa audit/marker khi xóa nguồn rồi tái sử dụng ID.

## Giao diện và cách dùng

Vào **Điều hành** bằng tài khoản Director:

1. **Tổng quan vận hành:** số hồ sơ/nguồn khách, khách sau mốc, chưa giao, đang xử lý, lịch hôm nay và lịch mở chưa giao. Mỗi chỉ số có định nghĩa tại chỗ, tính từ dữ liệu thật theo giờ +07. Tải công việc Admin thể hiện việc đang giao, không xếp hạng hiệu suất.
2. **Khách hàng tập trung:** tìm không dấu, lọc Admin, CTV, cũ/mới/chưa xác định, đã giao/chưa giao, tiến độ, nguồn và ngày tạo; backend trả trang 25 dòng. Chi tiết có tiến độ và liên kết lọc đúng lịch của khách.
3. Chọn từng khách, cả trang hoặc toàn bộ kết quả backend; có thể bỏ chọn vài dòng khi đang chọn toàn bộ. Chọn người nhận rồi **Xem trước giao/chuyển khách**, **Cấp quyền xem** hoặc **Thu hồi quyền riêng**. Khách cũ không tạo grant dư thừa.
4. **Phân công dẫn khách:** giữ component lịch hiện có, bộ lọc ngày/trạng thái/nguồn/Admin/tìm khách, tải việc, cảnh báo cùng giờ và preview trước khi giao. Giao khách không tự giao lịch. Lịch đã dẫn/hủy vẫn xem được; luồng giao thông thường chỉ chọn lịch mở.
5. **Admin, CTV & tài khoản:** đối chiếu Auth và hồ sơ, lọc role và Admin quản lý; hồ sơ thiếu/orphan được liệt kê, không tự suy đoán role. CTV được phân biệt là đối tác ngoài.
6. **Lịch sử thao tác:** quyền, role, phân công khách/lịch và tiến độ khách; chỉ Director. Phần dữ liệu chưa rõ owner vẫn cần Director phân công theo quyết định thực tế.

Admin giữ menu/màn hình khách, căn hộ, lịch quen thuộc. Trong trang khách có phần nghiệp vụ **Khách hàng cần xử lý**, thêm khách và cập nhật tiến độ đúng phạm vi; không có cấp quyền, yêu cầu phê duyệt, danh sách chia sẻ, người phê duyệt hay lịch sử Director. Khách được giao xuất hiện ở đây và hồ sơ tài khoản được giao cũng có trong danh sách khách thông thường.

Không phát sinh notification/email/push phân quyền. `customerAccessState/records` chỉ phát tín hiệu tải lại dữ liệu; không được chuyển thành thông báo. Giữ thông báo đặt lịch, trạng thái và phản hồi khách/CTV hiện tại. Giữ nguyên ghi chú/phản hồi theo xác nhận ngày 13/10; ghi chú nội bộ chỉ là đề xuất. Việc giữ giao diện và không thông báo không bảo đảm mọi nhân sự không bao giờ nhận ra thay đổi kỹ thuật.

## Bulk và bảo mật

- Backend tự truy vấn lại phạm vi, không dựa vào toàn bộ ID đã tải ở frontend. Chốt danh sách/version trong preview, trả số sẽ tác động. Khách mới xuất hiện sau preview không bị tự thêm.
- Không lưu chuỗi tìm kiếm tên/SĐT/email trong job. Giữ hash của thông tin khớp tìm kiếm để phát hiện thay đổi trước apply, cùng các bộ lọc không chứa nội dung liên hệ và các ID đã chốt.
- Lựa chọn từng ID tối đa 1.000; lựa chọn toàn bộ theo bộ lọc tối đa 10.000, có tối đa 1.000 ID loại trừ. Mỗi lô 50 khách, mỗi khách tối đa 50 Admin có grant riêng. Phân công lịch giữ lô tối đa 100 theo API hiện có.
- Job 15 phút, ràng buộc Director tạo job; người gọi phải còn role hợp lệ tại mỗi lô. Kiểm tra Auth của Admin nhận, role trong transaction, khách còn tồn tại, còn phù hợp bộ lọc và revision phân công/tiến độ.
- Retry cùng offset không xử lý thêm lô hay tạo audit trùng. Giao cùng người/grant không đổi bỏ qua ghi thừa. Một lô thất bại giữ nguyên các lô đã commit và trả lỗi; UI báo tiến độ, tải lại để chọn phần còn lại. Không tuyên bố toàn bộ job là một transaction.
- Owner/creator/CTV không thay đổi khi giao khách hoặc lịch. API gán owner cũ chỉ dùng cho bản ghi thiếu owner, không dùng thay cho giao việc.
- Quyền xem không cho cập nhật work, hồ sơ, owner, role hoặc lịch. Quyền giao khách chỉ cho tiến độ; lịch cần phân công riêng. Firestore rules chặn client ghi private metadata, role/assignment và job, kể cả Director phải đi qua API được audit.
- Response private/no-store, `Vary: Authorization`; state theo UID/role/tham số, bỏ response cũ khi đổi tài khoản/quyền. Không lưu private data ở local storage. Thu hồi phát tín hiệu yên lặng để xóa/tải lại cache; request sau được server/database xác minh lại.
- Export hồ sơ tại màn hình cũ chuyển sang xác minh owner/Director ở server; không tin `canExport` client. CSV escape dấu ngoặc kép và ký tự công thức. Không tự mở quyền xuất cho người chỉ được chia sẻ hay người được giao khách.
- Số chủ nhà thật chỉ đọc/ghi qua API riêng và collection riêng, không nằm ở DTO khách/lịch/căn hộ công khai, audit hay job. Admin không được nhập số thật trong luồng hiện tại; Director nhập tại phần số riêng sau khi lưu căn. Chưa có số hiển thị “Chưa cập nhật”; không backfill từ số Admin.

## Áp dụng migration — chỉ thực hiện khi có yêu cầu riêng

Đã chuẩn bị code; chưa chạy bất kỳ lệnh production dưới đây trong lượt này. Thay đường dẫn/UID bằng giá trị được xác minh. Dùng ADC hoặc service account của đúng project có quyền quản trị cần thiết; không commit key/snapshot.

Trước hết kiểm tra baseline `customerLegacy` hiện có. Nếu đã complete thì dùng đúng snapshot/mốc cũ, không chốt lại tất cả tài khoản hiện tại thành khách cũ. Nếu chưa từng có baseline, chuẩn bị bằng script `customer-legacy.cjs` theo tài liệu ngày 12/10, review snapshot trước khi apply. Bản này không tự đoán một mốc mới.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path './serviceAccountKey.json').Path
$directorUid = 'UID_DIRECTOR_DA_XAC_MINH'
New-Item -ItemType Directory -Force .test-runtime | Out-Null

# Dry run: chỉ đọc database, tạo manifest local có eligible/bookings/unresolved/current/linked.
node scripts/operations-legacy.cjs --project quang-apartment --snapshot .test-runtime/operations-legacy-reviewed.json

# Chỉ sau khi review và được yêu cầu áp dụng production:
node scripts/operations-legacy.cjs --project quang-apartment --snapshot .test-runtime/operations-legacy-reviewed.json --operator $directorUid --apply
```

Snapshot lưu ID và createTime, không lưu tên/SĐT. Đối chiếu danh sách `unresolved`; nếu còn thiếu owner thì Director phân công thủ công, hoặc dùng mapping có bằng chứng và script `access-migration.cjs` hiện có, không tự suy diễn từ tên/ngày/CTV. Script mới không sửa nguồn, owner, role, số điện thoại hay assignment. Apply xác minh lại createTime và Director trong transaction; hash manifest ngăn đổi/mở rộng baseline khi chạy lại. Có thể tiếp tục lần apply dở mà không ghi đè grants.

Sau migration mới áp dụng web/API và Firestore rules đồng bộ, kiểm tra các client dùng chung project, đặc biệt client mobile nếu còn query toàn bộ bookings không có phạm vi. Rules không lọc kết quả thay client: query quá rộng sẽ bị từ chối; dùng API đã kiểm quyền hoặc query đúng phạm vi. Không deploy rules mới riêng lẻ trước khi client tương thích. Không cần composite index mới cho API operations hiện dùng; các index cũ vẫn giữ nguyên.

## Cấp Director an toàn

Không có tự đăng ký hoặc tạo sẵn Director. Tài khoản Auth phải tồn tại và đã có hồ sơ. Dùng script IAM hiện có; lần đầu mặc định dry run, `--apply` mới ghi và audit, sau đó thu hồi refresh token. Người thao tác chịu trách nhiệm dùng UID audit chính xác; quyền chạy script đến từ ADC/IAM, không phải cờ role của client.

```powershell
# Thay email bằng tài khoản đã được chỉ định; không tự chọn tài khoản Admin hiện tại.
node scripts/access-role.cjs --project quang-apartment --email EMAIL_DUOC_DUYET@example.com --role director

# Khi có yêu cầu nâng vai trò rõ ràng và đã review kết quả dry run:
node scripts/access-role.cjs --project quang-apartment --email EMAIL_DUOC_DUYET@example.com --role director --operator UID_NGUOI_VAN_HANH --apply
```

Đăng xuất/đăng nhập lại sau cấp role. Không tự đổi `ngducquazg@gmail.com`; lựa chọn giữ tài khoản này trước đây vẫn được tôn trọng.

## Rollback

- Rollback giao/chuyển khách bằng phân công lại qua UI/API, đối chiếu audit; không đổi owner. Bỏ grant qua thao tác thu hồi; không xóa audit.
- Rollback baseline mới bằng **đúng manifest**:

```powershell
node scripts/operations-legacy.cjs --project quang-apartment --snapshot .test-runtime/operations-legacy-reviewed.json --operator $directorUid --apply --rollback
```

- Chỉ tắt marker legacy/enabled do đúng baseline này tạo, giữ grant riêng, customerWork, nguồn và audit. Chạy lại rollback không thêm thay đổi. Baseline hồ sơ khách cũ ngày 12/10 độc lập, không bị script mới rollback.
- Rollback UI bằng bản source đã lưu/commit trước release, giữ API authorization/rules của bản này. Chỉ rollback API khi bản đích đã được đối chiếu ACL khách mới; API cũ có thể bỏ qua rules vì dùng Admin SDK. Không khôi phục cơ chế đọc mọi lịch tương lai chỉ để rollback giao diện, không deploy rules cũ bỏ bảo vệ private metadata. Client cũ cần tương thích truy vấn theo quyền.
- Repository có nhiều thay đổi chưa commit từ các lượt trước; trước release tạo checkpoint có chủ đích. Không dùng reset/clean để xóa công việc đang dang dở.

## File/module chính

- `src/lib/customer-operations.ts`: khóa nguồn, lọc, policy đọc/xử lý, kiểu DTO.
- `src/lib/customer-operations-server.ts`: nối nguồn, metadata createTime, projection an toàn.
- `src/app/api/operations/route.ts`: dashboard, trang khách, chi tiết, tạo khách, tiến độ, bulk preview/apply.
- `src/app/api/customer-access/route.ts`: quyền assigned profile, lịch cũ theo ID, export server; `src/app/api/access/route.ts`: giữ owner đã có.
- `firestore.rules`: ACL cho metadata/lead/job, read theo assignment, chống tái tạo ID kế thừa quyền.
- `src/components/{access-management,customer-access-manager,director-dashboard,customer-work-panel,booking-assignment-manager,director-account-directory,director-activity}.tsx` và sidebar/UsersPage/AddBookingModal.
- `src/hooks/use-director-resource.ts`, `src/lib/access-client.ts`, `src/lib/customer-access-policy.ts`, `src/lib/director-account-directory.ts`.
- `scripts/operations-legacy*.cjs`, `tests/access-api.test.cjs`, `tests/access-rules.test.cjs`, `tests/operations-ui.test.cjs`, loader kiểm thử và script package.

## Kiểm chứng và giới hạn

| Kiểm tra đã chạy | Kết quả |
|---|---|
| `npm run test:access` | 34/34: token/role, số riêng, IDOR, owner, legacy, giao/chuyển khách/lịch, grants, bulk nhiều trang, loại trừ, version, partial failure, retry, export và bảo vệ nội dung tìm kiếm |
| `npm run test:rules` | 19/19 trên Firestore Emulator: đọc/ghi trực tiếp, spoofing, assignment, private data, chặn tái tạo ID, script migration apply/rerun/rollback và API với transaction thật |
| Integration operations sau chốt hash tìm kiếm | 1/1 chạy lại trên emulator, gồm hai request apply đồng thời và dữ liệu phát sinh sau preview; đây là chạy lại một ca trong 19 ca trên, không cộng trùng |
| `npm run test:director` | 8/8: refresh, lọc, giờ nghiệp vụ, xung đột và dữ liệu danh bạ sai kiểu |
| `npm run test:listeners` | 4/4: lifecycle, Strict Mode, đổi tài khoản và permission errors |
| `npm run test:operations-ui` | 4/4 static render thực: menu Admin, chặn role khác, loading/error/retry/empty và số 0 thật; không phải browser E2E |
| `npm run typecheck` | Đạt; production build cuối cũng kiểm tra kiểu đầy đủ |
| `node node_modules/next/dist/bin/next build --no-lint` | Đạt đầy đủ compile, type validation, 43/43 static pages và build traces |
| `npm run lint` | Đã thử, dừng ở yêu cầu cấu hình ESLint vì repository chưa có cấu hình; không báo lint đạt |
| `git diff --check`, `node --check` các script mới | Đạt |
| `graphify update .` | Đã cập nhật AST graph; parser có cảnh báo partial extraction một số TSX/JSON, không thay thế TypeScript/build |

Tổng **69 ca khác nhau đạt**. Lần đầu emulator timeout cổng localhost và build bị EPERM trong sandbox; đã chạy lại ngoài sandbox thành công. Không coi các lỗi môi trường ban đầu là kiểm thử đạt khi chưa chạy lại.

Các giới hạn có chủ ý:

- Danh sách trả phân trang từ server và không tải toàn bộ PII về browser. Để nối schema cũ không có customer ID/index thống nhất, server hiện vẫn đọc các nguồn rồi lọc/đếm trong transaction; chi phí O(N). Không tuyên bố đây là cursor/index phân trang Firestore cho dữ liệu rất lớn. Khi dữ liệu tăng cần read model/index khách thống nhất và đồng bộ từ mọi client, không tạo cache quyền toàn cục để che chi phí này.
- Job hết hạn chặn apply; metadata job/chunks chưa có lịch dọn tự động. Chỉ chứa ID/version, chỉ server đọc; cần chính sách lưu/dọn khi triển khai lâu dài. Audit giữ nguyên, không dọn cùng job.
- Chưa có browser đang đăng nhập Director trong surface công cụ; chưa kiểm chứng thao tác mobile/desktop bằng phiên người dùng thật. Static render kiểm tra menu/phân quyền và các trạng thái, không thay thế E2E.
- Repo này không có mã Cloud Functions đang triển khai của app mobile. Mã web/API đã kiểm tra không gọi notification/email/push khi cấp/thu hồi/phân công; integration xác minh không thêm notification. Trước phát hành phải đối chiếu các trigger/callable ngoài repo để bảo đảm không có thông báo từ dịch vụ ngoài và callable cũng nhận role Director; không tuyên bố đã kiểm chứng mã ngoài repo.
- Lịch sử API hiển thị 50 sự kiện mới nhất. Audit giao việc/quyền đầy đủ được lưu; chưa làm lịch sử mọi lần sửa phản hồi/trạng thái lịch đang ghi Firestore trực tiếp.
- Chưa thêm thời lượng/di chuyển để kiểm tra trùng lịch thực; giữ cảnh báo cùng mốc giờ. Chưa tự gộp khách trùng liên hệ hay suy ra kết quả thuê.
- Các cải tiến chỉ đề xuất: ghi chú nội bộ riêng, nhận/từ chối việc, lịch rảnh/thời lượng, quy trình nghỉ việc và kết quả thuê. Không âm thầm thay đổi phản hồi/notification hiện có.
