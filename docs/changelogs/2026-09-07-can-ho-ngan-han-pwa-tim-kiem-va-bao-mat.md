# Bản Cập Nhật: Căn Hộ Ngắn Hạn, PWA, Tìm Kiếm & Bảo Mật Firestore

**Ngày cập nhật:** 07/09/2026  
**Phạm vi ghi nhận:** các thay đổi kể từ changelog gần nhất (07/08/2026)  
**Người thực hiện:** Admin / AI Assistant  
**Dự án:** Hanoi Residences

---

## 🎯 Tổng Quan

Đợt này mở thêm **luồng căn hộ ngắn hạn theo đêm** (tách collection, không đụng tin dài hạn), bật **PWA**, siết **Firestore/Storage rules**, và nâng cấp tìm kiếm công khai (landing quận, phân trang, cache). Yêu thích đồng bộ array + subcollection. Trang công khai `/can-ho-ngan-han` tạm ẩn bằng cờ `SHORT_TERM_PUBLIC_ACCESS` (route và logic vẫn giữ).

---

## 🛠️ Chi Tiết Kỹ Thuật

### 1. Căn hộ ngắn hạn (`short_term_apartments`)

- Collection riêng, giá **VND/đêm** (không dùng triệu như tin dài hạn). Schema: `nightlyPrice`, `minNights`, `maxGuests`, `checkInTime` / `checkOutTime`, `amenities`, `blockedDates`.
- Workflow duyệt tin giống dài hạn: landlord tạo `pending`, admin `published` / `rejected`.
- Public: `/can-ho-ngan-han`, `/can-ho-ngan-han/[id]`.
- Admin: `/{adminPath}/short-term` (danh sách, tạo, sửa). Sidebar thêm mục **Căn hộ ngắn hạn**.
- Landlord: form + danh sách trong hồ sơ / submit tin.
- Cờ `SHORT_TERM_PUBLIC_ACCESS = false` ẩn link Header/Home/Mobile; route không xóa.

### 2. Đặt phòng ngắn hạn (`stay_bookings`)

- Khách gửi yêu cầu `pending` (chưa thu tiền online). Admin: `confirmed` → `completed`, hoặc `rejected`. Khách chỉ hủy khi còn `pending`.
- Widget chọn ngày, chống trùng `blockedDates` + booking đã giữ chỗ.
- `getUnavailableStayDatesAction` dùng Admin SDK để khách xem lịch trống mà không đọc PII trong `stay_bookings`.
- Admin: `/{adminPath}/stay-bookings`. User: mục đặt phòng trong profile. Dashboard đếm đơn chờ duyệt.

### 3. PWA (Progressive Web App)

- `src/app/manifest.ts`: standalone, tiếng Việt, icon 192/512 (any + maskable).
- `apple-web-app`, `theme-color` `#e07a2f`, icon Apple Touch.
- Script `scripts/generate-pwa-icons.mjs` sinh icon từ nguồn thiết kế.

### 4. Yêu thích (Favorites)

- Gộp ID từ `users/{uid}.favorites[]` và subcollection `users/{uid}/favorites/{apartmentId}` (mới nhất trước).
- Trang `/favorites` load theo ID, báo số tin đã gỡ / không còn public.

### 5. Tìm kiếm, landing quận, phân trang (đã commit 08–21/08)

- Trang tìm kiếm dày hơn: card 3 cột, sidebar, giá nổi, tag lọc, phân trang.
- Landing từng quận (`/ba-dinh`, `/tay-ho`, …), hero WebP, `DistrictNav`.
- Query Firestore: `submissionStatus` + `searchKeywords` / giá / `createdAt`; index tương ứng.
- Cache listing + `revalidate` (ISR, `cache-policy`, API `/api/revalidate`). Sitemap trả 200 khi Firestore chậm.

### 6. Admin, Landlord, ghi client-side (đã commit 08–23/08)

- `AdminSidebar` tách khỏi layout; batch xóa/cập nhật tin (quota xóa theo giờ).
- Ghi căn hộ/duyệt tin qua client (`apartments-write-client`, `landlord-admin-client`) thay vì chỉ Server Action.
- Form tin: thêm loại phòng, siết submit; mã nguồn có dấu `-` hiện `888` với khách.
- Trang hướng dẫn CTV cập nhật nội dung dài.

### 7. Firestore, Storage, Auth

- Rules: `short_term_apartments` và `stay_bookings` (user chỉ tạo `pending`, không tự `confirmed`).
- Index: `short_term_apartments` (`submissionStatus`+`createdAt`, `landlordId`+`createdAt`); `stay_bookings` (`userId`+`createdAt`, `apartmentId`+`status`+`checkIn`).
- Storage P0 đã deploy. Firebase import tách để tránh circular dependency.
- `firebase-admin` init cho server action lịch trống ngắn hạn.

### 8. Nền tảng mobile & vận hành

- `docs/mobile/`: Hướng 1 (cùng project Firebase), GRAPH_REPORT, IMPLEMENTATION_PLAN, NOTES, HANDOFF.
- `.gitignore`: bỏ qua key Firebase admin, output Graphify, cấu hình editor.

---

## 📂 File chính

### Căn hộ ngắn hạn & đặt phòng

- `src/lib/types.ts`, `src/lib/constants.ts`
- `src/lib/short-term-data.ts`, `short-term-data-client.ts`, `short-term-mapper.ts`, `short-term-write-client.ts`
- `src/lib/stay-bookings-admin-client.ts`, `src/app/stay-actions.ts`, `src/firebase/admin-init.ts`
- `src/app/can-ho-ngan-han/page.tsx`, `src/app/can-ho-ngan-han/[id]/page.tsx`
- `src/app/[adminPath]/short-term/` (list, new, edit), `src/app/[adminPath]/stay-bookings/page.tsx`
- `src/components/short-term-form.tsx`, `short-term-list-client.tsx`, `short-term-detail-client.tsx`
- `src/components/stay-booking-widget.tsx`, `stay-bookings-list.tsx`, `landlord-short-term-list.tsx`

### PWA & Favorites

- `src/app/manifest.ts`, `src/lib/pwa.ts`, `src/app/layout.tsx`
- `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/apple-touch-icon.png`
- `scripts/generate-pwa-icons.mjs`
- `src/lib/favorites.ts`, `src/lib/favorites-client.ts`, `src/app/(public)/favorites/page.tsx`

### Cấu hình Firebase

- `firestore.rules`, `firestore.indexes.json`, `storage.rules`

### UI / luồng cũ bị ảnh hưởng

- `src/components/header.tsx`, `mobile-nav.tsx`, `admin-sidebar.tsx`, `apartment-card.tsx`
- `src/app/page.tsx`, `src/app/submit-apartment/page.tsx`
- `src/app/(public)/profile/apartments/page.tsx`, `profile/bookings/page.tsx`
- `src/app/[adminPath]/page.tsx`, `submissions/page.tsx`
- `src/context/auth-context.tsx`
