# Lưu ý bắt buộc — app Hướng 1

Đọc file này trước khi viết bất kỳ màn Firebase nào. Rule Cursor: `.cursor/rules/mobile-firebase-sync.mdc`.

## Cấm

1. Clone Firestore / tạo database “bản mobile”.
2. Viết REST để giả Server Actions (`createOrUpdateApartmentAction`, `toggleFavoriteAction`, …).
3. Gọi URL website như API (trừ WebView trang pháp lý).
4. Đưa `GROQ_API_KEY` hoặc Firebase **service account** vào app.
5. Bỏ `submissionStatus == "published"` trên feed khách.
6. Cho client tự set `role: "admin"` hoặc tự `submissionStatus: "published"` khi là landlord.
7. Xóa hay “đơn giản hóa” field website để app chạy cho nhanh.

## Bẫy dữ liệu

- **Giá** là triệu VND (`12` = 12 triệu), không phải VND đầy đủ.
- **Đẩy tin** không có field `priority`. Website ghi đè `createdAt` + `updatedAt`.
- Tin thiếu `submissionStatus` **biến mất** khỏi query `== published`. Đừng lặp lại; admin có `backfillSubmissionStatusAction`.
- `aiContent.description` mới là mô tả B2C. Đừng đọc `listingSummary` cũ (đang migrate xóa).
- Favorite ID = apartment ID, nằm subcollection, không phải mảng `users.favorites` (signup còn ghi `favorites: []` rác — đừng dựa vào mảng đó).
- `notifyAdmins` cần **list** user `role==admin`. Rules repo **không cho list users** → trên app có thể fail; fallback Cloud Function.
- Notification `link` là path web. Map sang route app; đừng `Linking.openURL` vào `ADMIN_PATH`.

## Auth

- Cùng project → cùng tài khoản web/app.
- Google: native SDK, không `signInWithPopup`.
- Lần đầu Google: `setDoc(users/{uid}, { role: "user", email, ... }, { merge: true })`.
- Đổi mật khẩu: reauth `EmailAuthProvider` như `changePassword` trong `auth-service.ts`.
- User Google không đổi mật khẩu email (website đã chặn).

## Ảnh

- Path: `apartments/...` (form dùng `apartments/{Date.now()}-{id}.jpg`).
- Tối đa 15; nén trước khi upload (web: max width 1920, quality ~0.82).
- Xóa tin: xóa object Storage còn lại.
- `storage.rules` đang `allow write: if true` — siết `request.auth != null` trước store.

## Rules

So **rules đang deploy** trên Firebase Console với file repo. Repo đang thiếu booking + notification.

Khi siết:

- Public chỉ đọc tin `published` (hoặc tách field nhạy cảm).
- Write apartments: admin; landlord chỉ tin `landlordId == uid` và không tự published.
- Bookings: create đúng collection theo role; guest chỉ `guest_consultations`.
- Notifications: user chỉ đọc/sửa `isRead` tin `recipientId == uid`.

Test trên Expo với 4 tài khoản: user, CTV, landlord, admin.

## UI / UX app

- Mobile-first; không tràn ngang.
- Input font ≥ 16px (iOS zoom).
- Hoa hồng / địa chỉ / SĐT chủ nhà / mã `-` ẩn đúng `rbac.ts` + `source-code.ts`.
- Realtime chuông: `onSnapshot`, unsubscribe khi unmount.
- Offline: Firestore persistence mặc định; ghi rõ khi đang stale.

## Monorepo (khuyến nghị)

```
packages/shared   types, rbac, constants, search, price-range, source-code
apps/web          Next.js hiện tại
apps/mobile       Expo
```

Chưa tách monorepo thì copy có kiểm soát các file `src/lib/*` trên, không copy component React DOM.

## Graphify

Sau khi sửa code: `graphify update .`  
Hỏi kiến trúc: `graphify query "..."` — xem skill graphify.
