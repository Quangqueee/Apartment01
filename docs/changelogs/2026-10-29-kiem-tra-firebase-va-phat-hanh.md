# Kiểm tra chức năng và Firebase — 29/10/2026

## Kết luận kiểm tra

Người dùng đã xác nhận áp dụng snapshot và phát hành Firestore rules, web/API, hai callable. Tất cả đã phát hành thành công và đối chiếu trực tiếp. Web revision `hanoiresidences-build-2026-10-29-002` nhận 100% traffic; ba API mới đã hết HTTP 404. Yêu cầu “public Firestore rules” được hiểu là phát hành rules đúng quyền, không mở dữ liệu nội bộ cho mọi người đọc. Kiểm thử tự động đạt nhưng chưa xác nhận E2E bằng phiên đăng nhập trên trình duyệt.

Không thay đổi tài khoản, role, owner, phân công hoặc số điện thoại thật trong lượt kiểm tra này. Không gọi thử các callable tạo thông báo vào production.

## Trạng thái production trước phát hành, xác minh bằng thao tác chỉ đọc

Project: `quang-apartment`, website `https://hanoiresidence.site`.

| Thành phần | Kết quả |
|---|---|
| Firestore release | Vẫn là bản cập nhật `2026-10-12T14:49:19.716218Z`, khác source hiện tại |
| Storage release | Khớp source local, không cần đăng lại |
| Firestore indexes cần trong file local | Đều đã có, không có index cần thiết bị thiếu hoặc chưa READY |
| `/`, `/login`, `/can-ho-ngan-han` | HTTP 200 |
| `/api/access`, `/api/customer-access`, `/api/operations` | HTTP 404 với POST không có token; website thật chưa có ba route mới |
| Baseline hồ sơ khách cũ | Complete, 15 ID đã chốt; trong dữ liệu hiện tại có 14 hồ sơ role user |
| Baseline Admin cũ | Complete, 4 Admin hiện tại đều thuộc baseline |
| Baseline nguồn khách/lịch mới bổ sung | `operationsLegacy` chưa tồn tại; `customerLeadVisibility` và `legacyBookingAccess` đều trống |
| Lịch hiện có | 79; cả 79 chưa có owner; có 3 phân công dẫn khách đã tồn tại, phải giữ nguyên |
| Tổng hợp khách bằng service hiện tại | 93 hồ sơ/nguồn: 14 tài khoản, 28 Admin/nguồn chưa nối UID, 39 CTV, 12 vãng lai; không lỗi kiểu dữ liệu |

Các số đếm ở đây không có nghĩa 93 người duy nhất: không tự gộp người theo SĐT, không suy diễn owner hoặc CTV. Thực thi service tổng hợp chỉ dùng quyền đọc IAM của operator, không tạo token đăng nhập thay người dùng.

Đã lưu bản rules đang chạy, ruleset IDs, hash, metadata release và index vào thư mục ignored `.test-runtime/firebase-audit-1793288630010/` để đối chiếu/rollback. Firestore ruleset hiện tại: `5eb0ca73-c649-4370-a756-904b8d26728f`; Storage ruleset: `1142ca6f-1169-4d95-b26d-0c1a39193793`.

## Điều kiện trước khi đăng rules mới

Rules hiện tại ở source nhận biết customerWork/lead permissions và giới hạn lịch cũ theo ID. Đăng ngay khi metadata lịch cũ đang trống sẽ làm Admin mất phần lịch cũ chưa có owner/phân công. Không giải quyết bằng `allow read, write: if true` hay mở rộng role CTV.

Đã chạy **dry run**, không ghi database:

```powershell
node scripts/operations-legacy.cjs --project quang-apartment --snapshot .test-runtime/operations-legacy-2026-10-29-reviewed.json
```

Manifest đã chuẩn bị:

- Mốc giữ nguyên: `2026-10-12T05:11:48.162Z`.
- 78 nguồn khách/lịch có metadata createTime chứng minh tồn tại trước mốc.
- 1 bản ghi sau mốc, không tự gắn thành khách cũ hoặc mở quyền chung.
- 0 bản ghi không xác định ngày tạo, 0 liên kết tài khoản được tự suy ra.
- Không thay owner, nguồn, 3 phân công đã có, role, số hiển thị hoặc số chủ nhà thật.

Người dùng đã trả lời **“Cho phép áp dụng snapshot và deploy rules”**. Đã kiểm tra lại operator là Director, áp dụng đúng manifest và phát hành rules. Xác minh sau ghi: đúng 78 marker ở mỗi collection `customerLeadVisibility` và `legacyBookingAccess`; một bản ghi sau mốc không được gắn legacy. Cả 79 source document giữ nguyên updateTime, owner và assignment; 3 phân công và bản đồ UID → role không thay đổi.

Ruleset mới: `35e74a05-eee6-4cd6-9837-9a95d52a7ffb`, cập nhật `2026-10-29T16:17:02.366818Z`. Hash source rules đang chạy khớp local. Storage cũng khớp local, không đăng lại; các index cần thiết READY, giữ nguyên index ngoài file local và không dùng `--force`.

## Lỗi Cloud Functions đã xác minh và bản vá đã chuẩn bị

Đã đọc metadata và tải source archive của hai callable ACTIVE tại `asia-southeast1`. Không có eventTrigger trên hai function này, nên chúng không tự phát notification chỉ vì ghi metadata quyền.

Source runtime đang triển khai có hai điểm chưa kế thừa Director:

1. `createNotification` chỉ nhận caller role `admin` khi gửi tới tài khoản khác; Director bị `permission-denied` khi gửi phản hồi/trạng thái cho khách/CTV.
2. `notifyAdmins` chỉ query role `admin`, bỏ Director khỏi thông báo nghiệp vụ.

Đã chuẩn bị bản vá nhỏ, giữ nguyên payload, các notification type và luồng khách tự nhận thông báo:

- Cho phép `admin` hoặc `director` lấy từ user document đáng tin cậy; không tin role/approvedBy trong payload.
- Người nhận thông báo nghiệp vụ gồm Admin và Director, không thêm CTV/User.
- Không thêm notification loại cấp/thu hồi quyền, không gọi các hàm này từ grant/assign APIs.
- Không deploy thêm function AI có trong archive nhưng không thuộc hai callable đang kiểm tra.

File source có thể review/tạo lại:

- `scripts/notification-director-patch.cjs`: chuẩn bị bản vá từ archive chính xác, kiểm tra anchor, có thể chạy lại patch; từ chối source lạ.
- `tests/fixtures/notification-functions-2026-10-12.cjs`: runtime gốc từ source đang triển khai để tái hiện lỗi, không chứa key/credential.
- `tests/notification-functions.test.cjs`: chạy handler thật trong runtime test với database/SDK mock, không gọi Firebase thật.
- Artifact đã phát hành: `.test-runtime/notification-director-release-node22-2026-10-29/`, có TS/runtime JS, package/lock/tsconfig và manifest hash. `npm ci` và `npm run build` thành công. Runtime nâng lên Node.js 22; giữ nguyên phiên bản dependencies đã khóa.

Người dùng đã xác nhận **“Phát hành cả web/API và hai callable”**. Đã deploy đúng `notifyAdmins` và `createNotification`, không deploy function AI. Cả hai ACTIVE trên `nodejs22`; tải lại archive theo generation mới và so sánh runtime JS khớp bản đã build. `notifyAdmins` generation `1793291537000072`; `createNotification` generation `1793291599593414`. Chỉ gửi payload rỗng để kiểm tra từ chối trước thao tác database: HTTP 400/INVALID_ARGUMENT và HTTP 401/UNAUTHENTICATED; không gửi notification thử vào production.

## Kết quả kiểm tra thực tế

| Kiểm tra | Kết quả |
|---|---|
| API/policy, workflow, listeners, static UI | 50/50 đạt |
| Firestore Emulator, direct database reads/writes, migrations và transaction thật | 19/19 đạt |
| Bản vá callable từ source production | 6/6 đạt, gồm tái hiện lỗi gốc, Director/Admin, chặn CTV/role giả, audience, payload và patch lặp |
| Tổng | **75 kiểm thử khác nhau đạt** |
| Full production build Next.js | Đạt compile, type validation, 43/43 static pages và build traces |
| Lint | Repository vẫn chưa cấu hình ESLint; không tuyên bố lint đạt |
| Source Cloud Functions production | Hai bản vá đã deploy, ACTIVE trên Node.js 22; source tải lại khớp artifact, request không hợp lệ bị từ chối |
| Browser với phiên đăng nhập hiện có | Công cụ thấy cửa sổ Chrome nhưng dừng vì không xác minh URL hiện tại đủ chắc chắn để áp dụng chính sách; không điều khiển tiếp hoặc tuyên bố E2E đã đạt |

## Phát hành web và đối chiếu dữ liệu

- Dùng Firebase CLI local-source deploy vào backend `hanoiresidences`, environment `prod`, giữ cấu hình runtime đang có trên backend. Không commit/push toàn bộ working tree.
- Sửa `apphosting.yaml` về schema `env`/`variable`. Thêm backend và danh sách loại trừ upload trong `firebase.json`. Đã kiểm tra archive: không có `.env`, service-account key, `.test-runtime`, `node_modules`, `.git` hoặc output Next.js; có đủ ba API mới.
- Lần build Cloud đầu dừng do lockfile thiếu bốn peer dependency dưới npm 10 của Node.js 22. Đã bổ sung lock entries bằng npm 10; không đổi phiên bản package đã khóa. `npm ci --dry-run` npm 10 đạt, Cloud cài đủ dependencies thành công.
- Trong quá trình chuẩn bị đã chạy nhầm lệnh cài ở root web; cài lại theo lockfile và chạy lại 75/75 kiểm thử, full Next.js build 43/43 trang. Dev server port 9002 đã khởi động lại, log Ready; lỗi local không thay dữ liệu production.
- Service tổng hợp sau snapshot đọc được 93 hồ sơ/nguồn: 92 legacy và 1 mới, không có dữ liệu sai kiểu. Cả bốn Admin cũ có quyền đọc 92 mục legacy. Đây là số nguồn/hồ sơ, không tự gộp thành số người duy nhất.
- Cloud Build `4650e314-b35b-44c4-8783-fdf46a52185d` SUCCESS; Firebase CLI báo rollout complete. Revision `hanoiresidences-build-2026-10-29-002` là latestReady/latestCreated và nhận 100% traffic; RoutesReady và ConfigurationsReady đều SUCCEEDED. Các cấu hình `overrideEnv` trên backend giữ nguyên so với backup.
- Trên `https://hanoiresidence.site`: `/`, `/login`, `/can-ho-ngan-han` HTTP 200. Cả `/api/access`, `/api/customer-access`, `/api/operations` HTTP 401 khi thiếu token hoặc dùng token giả; chỉ trả thông báo lỗi, `Cache-Control: private, no-store, max-age=0`, `Vary: Authorization`. Không tạo dữ liệu hay truy cập thay tài khoản thật.
- Artifact kiểm tra và log release được giữ trong `.test-runtime/2026-10-29-*`: xác minh rules, nguồn callable tải lại, dữ liệu trước/sau, trạng thái runtime, HTTP smoke, 75 kiểm thử và full build. Không ghi số chủ nhà thật vào báo cáo/log.

## Backup và rollback

- Backup trước release: `.test-runtime/release-approved-1793290345312/`; rules và source callable cũ: `.test-runtime/firebase-audit-1793288630010/`. Thư mục ignored chứa dữ liệu vận hành/cấu hình riêng, không upload hoặc đưa vào Git.
- Nếu cần rollback metadata, dùng đúng snapshot đã duyệt và `--apply --rollback` như tài liệu ngày 23/10. Script chỉ tắt marker của baseline này; giữ nguồn, grants riêng, phân công và audit.
- Bản web cũ: revision `hanoiresidences-build-2026-09-24-001`, image `asia-southeast1-docker.pkg.dev/quang-apartment/firebaseapphosting-images/hanoiresidences:build-2026-09-24-001`. Trước rollback phải đối chiếu ACL: code/API cũ có thể không hiểu metadata mới, nên ưu tiên sửa tiếp hoặc rollback giao diện cùng API tương thích. Không tự mở rules để chữa lỗi giao diện.
- Callable cũ có source ZIP/generation và hash đã lưu. Chuẩn bị artifact rollback trên Node.js 22, build, rồi deploy đích danh hai callable; không quay về runtime Node.js 20 sắp hết vòng hỗ trợ, không deploy function AI ngoài phạm vi. [Hướng dẫn runtime chính thức](https://docs.cloud.google.com/functions/docs/runtime-support).
- Chưa xác nhận E2E qua phiên đăng nhập hiện có: Computer Use dừng vì không xác minh được URL. Không tạo token thay người dùng, đổi role hoặc tạo khách/lịch/notification thật để giả lập.
