# Vai trò Giám đốc và duyệt chia sẻ dữ liệu — 12/10/2026

> Cập nhật sau bản này: [Khách cũ và cấp quyền không thông báo](./2026-10-12-khach-cu-va-chia-se-khong-thong-bao.md) thay thế phạm vi chia sẻ khách hàng bằng từng hồ sơ, bỏ menu/luồng đề nghị của Admin và tích hợp dữ liệu được cấp vào trang quản trị thông thường. Ma trận/luồng khách hàng bên dưới mô tả bản triển khai ban đầu.

## Hiện trạng và quyết định

Next.js 15 App Router, Firebase Auth, Firebase JS SDK 11, Firestore và Storage rules; Admin SDK đã có trong `src/firebase/admin-init.ts`. Không bổ sung framework hoặc database. API mới dùng chính Admin SDK này và xác minh ID token (bao gồm revoked token), sau đó đọc vai trò từ `users/{uid}`. Client role/local storage không phải nguồn xác thực.

Trước thay đổi, Admin đọc mọi hồ sơ/lịch trong rules. `createdByAdminId` chỉ tồn tại ở một số lịch thủ công; UI có lọc lịch external nhưng rules không giới hạn. Hồ sơ khách/CTV chưa có chủ quản lý thống nhất. Hiện dùng `ownerAdminId`, bất biến đối với client; Giám đốc phân công qua API có audit. Bản ghi chưa có chủ quản lý chỉ Giám đốc quản lý, vẫn giữ quyền cá nhân vốn có của khách/CTV đối với lịch của chính họ. Không tự nhận quyền sở hữu bản ghi chưa phân công.

`landlordPhoneNumber` là tên trường legacy, được nhập thủ công ở form Admin, dùng trong hiển thị/copy/tìm kiếm; không có code bắt buộc lấy số từ hồ sơ Admin. Luồng landlord có thể copy `contactPhone` sang trường này. Vì không có bằng chứng về số chủ nhà thật, giữ nguyên cả hai trường là số liên hệ cũ, không backfill số thật. Tất cả nhãn quản trị liên quan đổi thành “Số liên hệ hiển thị”.

Chọn chia sẻ **danh sách thuộc một Admin**, độc lập ba loại `bookings`, `collaborators`, `customers`. Không thêm phạm vi từng căn/từng bản ghi. Cấp quyền áp dụng cả bản ghi tương lai trong danh sách đó. Đổi chủ sở hữu chuyển bản ghi sang phạm vi của Admin mới, nên các quyền chia sẻ tương ứng cũng thay đổi. CTV là `users.role == collaborator`, khách hàng là `users.role == user`; lịch xem gồm `user_bookings`, `ctv_bookings`, `guest_consultations`. Đặt phòng ngắn hạn, thanh toán và quy trình đối tác/chủ nhà giữ cơ chế quản trị trước đây.

## Ma trận quyền cuối cùng

| Quyền | Giám đốc | Admin sở hữu | Người khác có grant | Người khác chưa có grant |
|---|---|---|---|---|
| Chức năng Admin ngoài ba danh sách bị giới hạn | Kế thừa | Giữ nguyên | Theo vai trò cũ | Theo vai trò cũ |
| Đọc lịch, CTV, khách do Admin quản lý | Tất cả | Của mình | Đúng loại và Admin được cấp | Không |
| Sửa/xóa dữ liệu quản lý | Tất cả | Của mình | Không được cấp thêm | Không |
| Gửi đề nghị chia sẻ | Có | Danh sách của mình | Không | Không |
| Duyệt/từ chối/cấp/thu hồi | Có | Không | Không | Không |
| Đọc/ghi số chủ nhà thật | Có | Không | Không | Không |
| Phân công/đổi chủ quản lý | Có, API có audit | Không | Không | Không |
| Đổi vai trò | Tài khoản khác, API có audit | User/CTV/landlord thuộc phạm vi; duyệt yêu cầu landlord như cũ | Không | Không |
| Tự đổi vai trò/giả mạo người duyệt | Không | Không | Không | Không |

Quyền xem được cấp không tạo chức năng xuất, sửa, xóa hoặc chia sẻ tiếp. Quyền cá nhân trước đây trên lịch của chính khách/CTV vẫn tồn tại độc lập với grant. Khi đã nhận dữ liệu để xem, trình duyệt không thể ngăn người dùng tự ghi chép/copy dữ liệu đó; hệ thống không cung cấp thêm endpoint hoặc nút xuất cho grant.

## Dữ liệu riêng tư và kiểm soát quyền

- `landlordContacts/{collection}~{apartmentId}`: `{ phone, updatedBy, updatedAt }`. Collection căn được allowlist: `apartments` hoặc `short_term_apartments`.
- Chỉ `director` đọc collection này ở Firestore. Không client nào ghi trực tiếp, kể cả director. API `phone-write` xác minh Giám đốc trong transaction rồi ghi. Không ghi giá trị số vào audit/log.
- Số thật không được nhập vào document căn hộ, `searchKeywords`, AI/SEO, listingCache, CSV hoặc nội dung chia sẻ thông thường. Các mapper bỏ thêm hai trường số riêng tư nếu có dữ liệu không đúng chuẩn.
- Panel số thật chỉ gọi API khi là Giám đốc; xóa state khi đổi tài khoản/role hoặc khi API bị từ chối, bỏ response cũ khi unmount/đổi phiên. Không đưa số thật vào cache dùng chung của Firebase client SDK. API trả `private, no-store` và `Vary: Authorization`.
- `shareRequests`: đề nghị immutable đối với client, `ownerAdminId`, `kind`, `proposedRecipients`, `note`, `status`, timestamps, `reviewedBy`, `approvedRecipients`.
- `shareGrants/{ownerAdminId}~{kind}~{recipientUid}`: `active`, owner, kind, recipient, người cập nhật, timestamp. Chỉ server ghi; rules đọc grant này để kiểm tra cả get ID và list có điều kiện owner.
- Chỉ Giám đốc duyệt hoặc thay thế danh sách nhận quyền. Transaction xử lý đề nghị và thay thế grant cùng audit, không có khoảng thời gian đề nghị đã approved nhưng grant chưa đồng bộ. Danh sách cũ ngoài danh sách mới bị thu hồi. Từ chối không xóa grant hợp lệ được cấp độc lập trước đó.
- `/api/access` kiểm tra role server ở mọi lần gọi và trong transaction của thao tác ghi. Luồng shared kiểm tra lại quyền sau khi đọc; chỉ trả các trường hiển thị, không trả internal notes hoặc arbitrary profile fields. API không nhận actor/reviewer từ body.
- `/profile/shared` chỉ xem, theo dõi grants realtime và xóa ngay danh sách đã tải khi grants thay đổi; dùng generation guard để response cũ không phục hồi dữ liệu sau thu hồi. Mỗi lần mở danh sách lại được backend xác minh.
- `accessAudit`: actor UID, target, action, before/after, server timestamp. Client chỉ Giám đốc đọc, không client nào ghi/sửa/xóa. Ghi yêu cầu, duyệt, từ chối, thay thế/cấp/thu hồi grant, phân công và thay đổi vai trò; số điện thoại không vào audit.
- UID ở API dùng charset an toàn `A-Z a-z 0-9 _ -`, tối đa 128 ký tự; nếu hệ thống có UID tùy biến ngoài charset này phải thay encoding grant ID và kiểm thử trước khi dùng.

Firestore đọc cả document, không che field bằng rules; vì vậy số thật phải nằm ngoài document listing. Tham khảo [Firebase: quyền với field](https://firebase.google.com/docs/firestore/security/rules-fields) và [Firebase: rules không lọc kết quả query](https://firebase.google.com/docs/firestore/security/rules-query).

## Vận hành

1. Giám đốc dùng trang quản trị hiện tại: `/[ADMIN_PATH]/access` (menu “Quyền xem dữ liệu”). Các trang lịch/khách/CTV hiện có hiển thị toàn hệ thống cho Giám đốc.
2. Admin chọn loại dữ liệu, tài khoản đề nghị, nhập lý do; chỉ đề nghị danh sách của chính mình. Không gửi thông báo tính năng mới hoặc thông báo duyệt đến Admin.
3. Giám đốc xem owner/type/phạm vi/tài khoản, điều chỉnh checkbox rồi duyệt hoặc từ chối. Duyệt thay thế danh sách được cấp trong phạm vi đó. Trang cũng cho cấp trực tiếp, bỏ checkbox để thu hồi; danh sách trống thu hồi tất cả.
4. Người nhận mở `/profile/shared` từ menu tài khoản. Admin nhận grant của Admin khác cũng xem tại đây, không qua các trang có thao tác quản lý.
5. Giám đốc dùng khu vực phân công để tải bản ghi chưa có owner, chọn bản ghi và Admin nhận quản lý. Không gán hồ sơ admin/director làm khách/CTV. Chức năng này giải quyết dữ liệu cũ không đủ căn cứ.
6. Trong form sửa căn hoặc phần thông tin chi tiết, Giám đốc nhập “Số chủ nhà thật · Chỉ Giám đốc”. Căn mới cần lưu trước rồi mở sửa/chi tiết để nhập số thật. Không có số thì hiển thị “Chưa cập nhật”. Admin không có input/response số thật.

## Cấp Giám đốc an toàn

Giám đốc hiện hữu có thể đổi vai trò tài khoản khác trong khu vực quyền. Admin không cấp được admin/director. Không client nào thay `users.role` trực tiếp.

Để cấp **Giám đốc đầu tiên**, operator Firebase có quyền IAM dùng ADC, không dùng key trong repository hay mã client. Công cụ kiểm tra tồn tại Auth user và profile, default dry run; `--apply` mới ghi và audit, rồi revoke refresh tokens để tài khoản đăng nhập lại. `--operator` là UID/danh tính operator chịu trách nhiệm.

```powershell
node scripts/access-role.cjs --project PROJECT_ID --uid TARGET_UID --role director --operator OPERATOR_UID
# Sau khi operator rà soát đúng project/tài khoản:
node scripts/access-role.cjs --project PROJECT_ID --uid TARGET_UID --role director --operator OPERATOR_UID --apply
```

Chưa chạy công cụ này vào môi trường thật. Rollback vai trò bằng cùng công cụ với vai trò trước đó; không tự hạ Giám đốc cuối cùng khi chưa có phương án operator khôi phục.

Công cụ cũng nhận `--email` thay cho `--uid` để tra đúng tài khoản Auth, không tự tạo tài khoản. Dry run không cần `--operator`; apply vẫn bắt buộc danh tính operator. Không dùng nguyên các giá trị mẫu trong lệnh. Nếu máy chưa có ADC nhưng đã có service account JSON hợp lệ, operator cấu hình rõ đường dẫn trước khi chạy:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path -LiteralPath './serviceAccountKey.json').Path
node scripts/access-role.cjs --project quang-apartment --email EMAIL_TAI_KHOAN --role director
```

Đã chạy một kiểm tra chỉ đọc (dry run) để hỗ trợ tra email sau triển khai mã local; chưa thực hiện apply hay đổi vai trò tài khoản thật.

## Migration, áp dụng và rollback

Không cần tạo số thật rỗng hàng loạt: không có document contact nghĩa là “Chưa cập nhật”. Tuyệt đối không chép số liên hệ cũ sang `landlordContacts`.

Migration owner default **dry run**, chỉ dùng project được chỉ định và ADC operator. Không tự đọc key local. Không lấy `createdByAdminId` làm bằng chứng tự động: rules cũ chưa bảo vệ đầy đủ attribution ở mọi luồng. Thiếu mapping được liệt kê trong `unresolved`; có thể dùng UI Giám đốc phân công thay cho migration.

Mapping optional là JSON array do operator review:

```json
[{ "collection": "users", "id": "CUSTOMER_UID", "ownerAdminId": "ADMIN_UID", "evidence": "Nguồn phân công đã được operator kiểm chứng" }]
```

```powershell
node scripts/access-migration.cjs --project PROJECT_ID --report access-migration-report.json
node scripts/access-migration.cjs --project PROJECT_ID --mapping REVIEWED_MAPPING.json --report access-migration-report.json
# Chỉ sau khi review báo cáo và có yêu cầu áp dụng:
node scripts/access-migration.cjs --project PROJECT_ID --mapping REVIEWED_MAPPING.json --report access-migration-report.json --operator OPERATOR_UID --apply
```

Chỉ thêm owner còn thiếu, xác minh owner là Admin/Giám đốc, không ghi đè owner có sẵn. Conflicts dừng trước khi ghi. Transaction phát hiện thay đổi đồng thời. Có thể chạy lại mapping trên dữ liệu đã áp dụng mà không thêm thay đổi. Report chỉ có đường dẫn và owner, không số riêng tư. Giữ report apply để rollback; không ghi đè report apply bằng dry run cùng đường dẫn.

```powershell
node scripts/access-rollback.cjs --project PROJECT_ID --report access-migration-report.json --operator OPERATOR_UID
node scripts/access-rollback.cjs --project PROJECT_ID --report access-migration-report.json --operator OPERATOR_UID --apply
```

Rollback chỉ bỏ owner mà migration đã thêm nếu owner vẫn đúng giá trị migration. Nếu owner đã được Giám đốc đổi thì dừng để review; không ghi đè dữ liệu mới. Audit vẫn giữ. Dữ liệu quay lại trạng thái chưa phân công, Giám đốc quản lý.

Khi được yêu cầu triển khai: kiểm thử trên project staging; đồng bộ code và rules với repo mobile như hướng dẫn sẵn trong rules. Tạo index mới `ownerAdminId ASC, createdAt DESC` cho ba collection lịch. Triển khai Firestore/Storage rules trước khi cấp Giám đốc và nhập số thật; sau đó API/UI và phân công dữ liệu. Admin có thể thấy danh sách rỗng cho đến khi được phân công. Luồng số thật phải dùng phiên bản web mới; client mobile cũ vẫn dùng legacy display contact, không đọc số thật.

Không rollback rules về bản cũ cho phép sửa role hoặc đọc toàn bộ hồ sơ. Nếu rollback UI/API, giữ nguyên bảo vệ `landlordContacts`, `shareGrants`, `shareRequests`, `accessAudit`, `users.role`; tắt chức năng mới và thu hồi grants theo Giám đốc trước. Không chép số thật trở về listing. Không xóa dữ liệu contact hoặc audit để rollback UI.

## Kiểm thử và giới hạn

- `npm run test:access`: 10 test API/policy/migration, chạy route thật với doubles cho Auth/Admin SDK để kiểm tra các ranh giới quyền và transaction atomic; không phải tích hợp Auth production.
- `npm run test:rules`: 8 test Firestore Emulator, project `demo-apartment-access`, thực thi get/list/write/delete thật. Bao phủ quyền director, số thật, scope/recipient, pending/rejected, revoke, read-only, giả mạo owner/role/reviewer/audit và quyền cá nhân/landlord/public cũ.
- `npm run typecheck`: kiểm tra TypeScript.
- `next build --no-lint --experimental-build-mode compile`: kiểm tra biên dịch Next, không prerender dữ liệu Firebase thật. Không thay thế full generate/build staging.
- `npm run lint`: repository chưa có ESLint config; CLI yêu cầu cấu hình tương tác, không báo lint đạt và không tạo config ngoài phạm vi.
- `graphify update .`: công cụ local lỗi `uv trampoline failed to canonicalize script path`; đã đọc report graph hiện có, chưa cập nhật graph được.

Máy Windows này dùng Java portable trong `.test-runtime` (gitignored). Để chạy lại emulator khi có lỗi socket do ứng dụng MSIX:

```powershell
$accessJava = Get-ChildItem .test-runtime/java -Filter java.exe -Recurse | Select-Object -First 1
$env:PATH = $accessJava.DirectoryName + ';' + $env:PATH
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=D:\Workspace\Apartment\Apartment01\.test-runtime\sockets'
npm run test:rules
```

Ở thời điểm hoàn thiện code ban đầu chưa deploy, chưa chạy migration production, chưa cấp/hạ quyền tài khoản thật. Theo yêu cầu deploy tiếp theo của người dùng ngày 12/10/2026, Firestore/Storage rules và index đã phát hành và xác minh trên `quang-apartment`; xem [bản sửa lỗi và ghi nhận deploy](./2026-10-12-sua-loi-firestore-listener-va-deploy-rules.md). Chưa deploy code website. Chưa kiểm thử giao diện với tài khoản staging và mobile repository ngoài workspace. Cloud Functions thông báo hiện hữu thuộc repo mobile, không nằm trong workspace này; cần kiểm thử callable với director trong staging vì callable có thể có kiểm tra role riêng. Không có thông báo mới về phân quyền được gọi bởi API/UI mới.
