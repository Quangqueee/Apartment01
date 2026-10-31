# Sửa lỗi Firestore listener và triển khai rules — 12/10/2026

## Triệu chứng và nguyên nhân

Ảnh người dùng ghi nhận Firebase JS SDK 11.10.0 ném `INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9) CONTEXT: {"ve":-1}` và Next.js overlay hiển thị nhiều issue. Người dùng đang đăng nhập Giám đốc và xác nhận có thể chưa deploy rules mới; sau đó yêu cầu deploy rules.

Đây là hai vấn đề cần phân biệt:

- Rules cũ chưa nhận vai trò `director`, có thể từ chối truy cập những collection quản trị.
- `ca9` là lỗi nội bộ của bộ đếm watch target trong SDK. Firebase có [bản vá race condition từ 12.13.0](https://firebase.google.com/support/release-notes/js), [PR #9842](https://github.com/firebase/firebase-js-sdk/pull/9842). Không coi mọi lỗi SDK/network là permission-denied. Chưa tái hiện được chính phiên trình duyệt trong ảnh, vì phiên đó không kết nối với browser tool.

## Thay đổi code local

- Pin `firebase` từ 11.10.0 (lockfile) lên 12.19.0, cập nhật `@firebase/rules-unit-testing` lên 5.0.0 để tương thích SDK 12; không nâng Next.js ngoài phạm vi.
- Thêm `managedSubscription`: defer setup một microtask để mount bị hủy ngay bởi React Strict Mode không tạo watch target; cleanup idempotent; bỏ callback từ phiên cũ; đưa lỗi setup/cleanup về error handler.
- `watchDoc`/`watchQuery` dùng API `onSnapshot` công khai. Áp dụng cho AuthContext, favorites, notifications, hooks doc/collection và các trang quản trị/chia sẻ đang dùng realtime. Không thay đổi rules hoặc thêm quyền bằng client.
- Hooks doc/collection chỉ tạo `FirestorePermissionError` khi SDK thực sự trả `permission-denied`, giữ nguyên lỗi SDK/network khác để caller xử lý đúng nguyên nhân.
- Giữ quyền xem số chủ nhà thật qua API riêng `no-store`, không thêm vào listener hoặc cache client.

## Kiểm tra

- TypeScript: đạt sau khi cài hoàn tất dependency mới.
- `npm run test:access`: 10/10 đạt.
- `npm run test:listeners`: 4/4 đạt (Strict Mode cleanup, bỏ callback phiên cũ, lỗi setup, chuyển tiếp lỗi thiếu quyền).
- `npm run test:rules`: 8/8 đạt trên Firestore Emulator với Firebase SDK 12.19.0, project demo.
- Next.js build ở chế độ `compile`: đạt; chưa chạy full generate/prerender hoặc deploy website.

Không khẳng định đã quan sát mọi issue trong ảnh biến mất; cần khởi động lại dev server và full reload trình duyệt để tải SDK mới và tạo lại Firestore client, vì client đã bị internal assertion không phục hồi được chỉ bằng Fast Refresh.

## Deploy được người dùng cho phép

Đã chạy thành công trên project `quang-apartment`:

```powershell
firebase deploy --project quang-apartment --only "firestore:rules,firestore:indexes,storage" --non-interactive
```

CLI xác nhận Firestore rules và Storage rules biên dịch, phát hành thành công; index trong file đã triển khai. 32 index có trên Firebase nhưng không có trong file local **được giữ nguyên**, không chạy `--force`. Không chạy migration/backfill hoặc thay đổi vai trò tài khoản trong thao tác sửa lỗi này.

Đã xác minh qua API chỉ đọc sau deploy: nội dung release `cloud.firestore` và `firebase.storage/quang-apartment.firebasestorage.app` khớp source local (so sánh SHA-256 sau chuẩn hóa line ending). Các index owner/createdAt cần dùng ở ba collection lịch đều ở trạng thái `READY`.

Rules có cảnh báo compiler về hai helper cũ không dùng (`roleUnchanged`, `notSelfAdminEscalation`); không có lỗi biên dịch và không ảnh hưởng các hàm kiểm soát role/owner mới đang được sử dụng.

## Tải lại ứng dụng

Trong terminal đang chạy Next dev: `Ctrl+C`, sau đó `npm run dev`. Trong trình duyệt nhấn `Ctrl+F5` để tải lại toàn bộ trang. Nếu đang xem website production, cần triển khai code/SDK mới theo quy trình website riêng; lần deploy này chỉ phát hành rules/index theo yêu cầu.
