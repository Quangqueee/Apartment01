# Kế hoạch triển khai — Hướng 1

Làm tuần tự. Đánh dấu `[x]` khi xong. Chi tiết từng chức năng: `.cursor/skills/mobile-firebase-sync/feature-parity.md`.

## Phase 0 — Nền (không UI)

- [ ] So rules deploy vs `firestore.rules` / `storage.rules`
- [ ] Bổ sung rules cho `notifications`, `user_bookings`, `ctv_bookings`, `guest_consultations`
- [ ] Cấm client đổi `role` tùy ý; cấm landlord tự `published`
- [ ] Tạo Android (và iOS) app trong Firebase project `quang-apartment`
- [ ] Composite indexes khi query báo thiếu
- [ ] Package shared (hoặc copy) `types`, `rbac`, `constants`, `price-range`, `source-code`, search helpers

## Phase 1 — App skeleton + Auth

- [ ] Expo app, Firebase JS SDK ^11, config từ `src/firebase/config.ts`
- [ ] Email login / signup / logout / quên mật khẩu
- [ ] Google native Sign-In + merge user doc
- [ ] Auth gate theo `users/{uid}.role` (listener user doc)

**Parity:** G6, G7.

## Phase 2 — Khách xem tin

- [ ] Feed `published`, sort newest, phân trang
- [ ] Lọc quận (multi), loại phòng, khoảng giá, sort giá
- [ ] Ô tìm text dùng `planApartmentTextSearch` / `matchesAllSearchTokens`
- [ ] Chi tiết: gallery, mô tả `aiContent`, mask mã nguồn / địa chỉ / SĐT / hoa hồng
- [ ] Deep link `hanoiresidences://apartments/{id}` (tùy chọn, cùng id web)

**Parity:** G1–G4. Không làm 12 màn SEO quận.

## Phase 3 — User: tim, hồ sơ, chuông

- [ ] Toggle favorite subcollection
- [ ] Profile + edit + settings + đổi mật khẩu
- [ ] `onSnapshot` notifications, đánh dấu đã đọc

**Parity:** U1–U4, U7.

## Phase 4 — Đặt lịch (3 collection)

- [ ] Guest → `guest_consultations`
- [ ] User → `user_bookings` + notify
- [ ] CTV → `ctv_bookings` + notify
- [ ] Admin đặt hộ từ chi tiết tin (như `booking-widget`)
- [ ] Màn “lịch của tôi” (user + CTV)
- [ ] Admin: list/filter/sửa status 3 collection + tạo tay

**Parity:** G5, U5–U6, C3–C4, A6.

## Phase 5 — CTV + chủ nhà đăng ký

- [ ] Form CTV → `requestStatus: pending` + notify
- [ ] Form chủ nhà → `landlordApprovalStatus` + `landlordRequestData`
- [ ] Admin users: duyệt/từ chối CTV, đổi role `user`/`collaborator`
- [ ] Admin partners: duyệt/từ chối landlord, ngưng hợp tác (xóa tin `landlordId`)

**Parity:** U8–U9, C1–C2, A5, A8.

## Phase 6 — Chủ nhà vận hành tin

- [ ] Upload ảnh Storage, max 15
- [ ] Tạo tin `pending` + `searchKeywords`
- [ ] Sửa tin của mình; đổi `available`/`rented`
- [ ] Danh sách tin `landlordId`
- [ ] Xin đẩy `pushRequestedAt`

**Parity:** L1–L5.

## Phase 7 — Admin căn hộ + AI

- [ ] CRUD tin, `published` khi admin tạo
- [ ] Đẩy 1 tin / batch (bump timestamps)
- [ ] Quota xóa 10/giờ
- [ ] Cloud Function `generateListingSummary` (Groq ở server)
- [ ] Ghi `aiContent`; form admin gọi callable
- [ ] Duyệt submission + ghi `sourceCode`/`address`/`adminNotes`
- [ ] Dashboard counts (A1)
- [ ] Thống kê theo landlord (A9)

**Parity:** A1–A4, A7, A10.

## Phase 8 — Trang tĩnh + polish

- [ ] FAQ / điều khoản / bảo mật (nội dung tĩnh hoặc WebView)
- [ ] FCM sau (website hiện chỉ thông báo in-app Firestore)
- [ ] Siết Storage write = authenticated
- [ ] Test 4 role trên thiết bị thật

**Parity:** G8.

## Định nghĩa xong

Mọi dòng `SDK`/`CF`/`UI` trong `feature-parity.md` là `[x]`, trừ nhóm WEB. Web và app sửa cùng document thì phía kia thấy không cần deploy lại đối phương (trừ Function AI).
