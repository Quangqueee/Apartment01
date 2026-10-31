# Đồng bộ số lượng căn hộ giữa trang chủ, tìm kiếm và Admin

**Ngày:** 30/10/2026  
**Trạng thái:** Đã sửa mã nguồn, chưa triển khai production.

## Kết quả kiểm tra dữ liệu

Script đọc trực tiếp Firestore production (`quang-apartment`) trả về:

| Điều kiện | Số căn |
| --- | ---: |
| Toàn bộ `apartments` | 1303 |
| `submissionStatus == published` | 1303 |
| Published và có `createdAt` để sắp xếp | 1303 |
| Published bị loại khỏi danh sách do thiếu `createdAt` | 0 |

Như vậy chênh lệch 1281 / 1300 / 1303 không do bản ghi bị mất, thiếu trạng thái duyệt hay thiếu ngày tạo. Lúc kiểm tra, tải mới website production cũng trả 1303 ở trang chủ và `/tim-kiem`.

## Nguyên nhân

- Trang chủ dùng `getCachedHomeApartments`; `/tim-kiem` dùng `getCachedPublishedApartments`. Cả hai cache cùng truy vấn căn published nhưng có **khóa riêng**, được làm nóng ở những thời điểm khác nhau.
- `LISTING_REVALIDATE = false` khiến cache tồn tại vô thời hạn nếu một lần invalidation không xảy ra. Trang Admin đọc `getCountFromServer` trực tiếp nên hiện số mới hơn.
- Một số thao tác chủ nhà (đổi trạng thái, yêu cầu đẩy tin) cập nhật Firestore nhưng chưa gọi `revalidateApartmentCacheAction`. Khi quản trị từ môi trường local, cấu hình gọi làm mới production qua secret cũng chưa có; vì vậy không thể xem invalidation thủ công là bảo đảm duy nhất.

## Cách sửa

1. Khi tìm kiếm không có bộ lọc và dùng sắp xếp mặc định, `/tim-kiem` dùng đúng cache trang chủ (`getCachedHomeApartments` và `getCachedHomeApartmentsPage`). Hai màn hình vì thế chia sẻ cùng count và trang dữ liệu.
2. Đặt TTL 60 giây cho các cache listing; nếu một thao tác ghi bỏ lỡ invalidation, cache sẽ tự lấy lại Firestore. Đổi phiên bản khóa để cache cũ không sống tiếp sau khi phát hành.
3. Bổ sung invalidation sau đổi trạng thái/yêu cầu đẩy tin của chủ nhà và sau backfill trạng thái cũ.
4. Thêm `scripts/audit-apartment-counts.cjs` để kiểm tra lại số liệu trực tiếp mà không in thông tin cá nhân.

## Xác minh

- `npm run typecheck`: đạt.
- `npm run build`: đạt.
- Build production chạy cục bộ với Firestore hiện tại: `/`, `/tim-kiem`, `/tim-kiem?page=2` đều trả 1303.
- Dữ liệu production không bị sửa trong quá trình kiểm tra. Cần phát hành bản mã mới để cơ chế cache tự hồi phục có hiệu lực trên website production.
