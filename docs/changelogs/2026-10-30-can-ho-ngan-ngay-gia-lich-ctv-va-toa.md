# Căn hộ ngắn ngày: giá, lịch, CTV và nền tảng quản lý tòa

**Ngày:** 30/10/2026  
**Trạng thái:** Đã triển khai trong mã nguồn; chưa triển khai production.

## Khảo sát và phương án

- [Airbnb](https://www.airbnb.com/help/article/474) dùng giá đêm cơ bản, giá tùy ngày và [chiết khấu theo kỳ lưu trú](https://www.airbnb.com/help/article/1233). Lịch có thời gian chuẩn bị, giới hạn số đêm và cửa sổ đặt trước ([nguồn](https://www.airbnb.com/help/article/2729)).
- [Booking.com Connectivity](https://developers.booking.com/connectivity/docs/ari) tách tòa/cơ sở, loại phòng, gói giá, tồn phòng và lịch khả dụng. Đây là mô hình đích cho các tòa nhiều căn và đồng bộ đối tác sau này.
- [Dayuse](https://partners-blog.dayuse.com/hubfs/B2B%20DOCUMENTS/GUIDES/WHite%20PaperUSA%202026.pdf) cho khách chọn phòng và khung giờ cụ thể. Do đó giá giờ phải gắn với giờ nhận/trả và kiểm tra giao nhau, không chỉ với một ngày.
- [Airbnb Co-Host](https://news.airbnb.com/wp-content/uploads/sites/4/2023/05/Airbnb-2023-Summer-Release-Media-Guide.pdf) tách quyền lịch và khoản chia sẻ doanh thu. Ở website này, CTV gửi khách và xem hoa hồng; Admin xác nhận; khách chỉ thấy giá thuê.

## Đối chiếu với luồng dài hạn

| Chủ thể | Dài hạn hiện có | Ngắn ngày sau cập nhật |
| --- | --- | --- |
| Khách | Xem giá, gửi lịch tư vấn | Xem giá giờ/đêm/7 đêm, gửi yêu cầu theo giờ hoặc qua đêm |
| CTV | Gửi khách, xem hoa hồng | Gửi thông tin khách theo tài khoản CTV, xem hoa hồng riêng và trong đơn của mình |
| Chủ nhà/đối tác | Gửi tin chờ duyệt | Gửi căn ngắn ngày chờ duyệt, chọn giá, quy cách phòng và kênh dự kiến |
| Admin/Giám đốc | Duyệt tin, xử lý lịch | Duyệt tin, xác nhận đơn, xem nhóm tòa/phòng, chọn tự vận hành hoặc đối tác |

## Đã làm

1. Bật lại danh sách và trang chi tiết ngắn ngày trên website.
2. Thêm giá giờ, số giờ tối thiểu, giá 7 đêm, tên tòa/cơ sở, mã phòng, mô hình vận hành và kênh nhận khách dự kiến. Tin cũ mặc định tiếp tục tính giá đêm; không cần migration bắt buộc.
3. Giá kỳ ở 7 đêm được tính theo từng nhóm 7 đêm, phần lẻ theo giá đêm. Giá giờ chỉ áp dụng cho khung kết thúc trong cùng ngày. Tổng tiền được tính lại trên máy chủ khi gửi đơn.
   "Theo ngày" trên giao diện là một đêm lưu trú từ giờ nhận phòng đến giờ trả phòng hôm sau, không phải cửa sổ 24 giờ tùy ý.
4. Đơn mới lưu khoảng giờ, loại lưu trú và giá tại lúc đặt. Yêu cầu vẫn ở trạng thái chờ và chưa thu tiền. Khi Admin xác nhận, transaction đọc lịch và ghi phiên bản tồn phòng để hai lần xác nhận đồng thời không cùng chốt một khung giờ.
5. Lịch công khai chỉ trả ngày/khung giờ bận, không trả tên hay số điện thoại khách. Khách có thể gửi nhiều yêu cầu chờ cho cùng thời gian; chỉ một yêu cầu không xung đột được xác nhận.
6. Hoa hồng nằm trong `short_term_commissions/{apartmentId}`, tách khỏi tin công khai. Admin đặt mức hoa hồng; CTV đọc tin đã duyệt và thấy mức hoa hồng được chụp vào đơn của mình. Đây là **mức dự kiến**, chưa phải sổ đối soát/chi trả.
7. Danh sách quản trị lọc theo tên tòa/cơ sở và cho thấy phòng, mô hình tự vận hành/đối tác, các mức giá. Chủ nhà tiếp tục dùng workflow `pending` → duyệt như tin dài hạn.

## Giới hạn và bước kế tiếp cho tòa/đối tác

- `buildingName` hiện là nhãn nhóm phòng. Khi có nhiều tòa tự vận hành, cần collection `short_term_buildings` với mã tòa, địa chỉ, người vận hành, tài khoản đối tác, chính sách check-in, và liên kết `buildingId` từ từng căn. Mỗi căn vẫn phải có lịch riêng; không gộp lịch của cả tòa.
- `distributionChannels` là **lựa chọn dự kiến** cho website/CTV/đối tác. Chưa có kết nối hay tự động đẩy phòng ra OTA. Giai đoạn tích hợp cần mapping mã phòng theo kênh, quota tồn phòng, webhook nhận đơn, idempotency, retry và đối soát để tránh bán trùng.
- Giá hiện là giá cơ bản, chưa có giá theo ngày lễ/cuối tuần, phí dọn phòng, phụ thu người thêm, đặt cọc hay quy tắc hủy sau xác nhận. Nên bổ sung cùng bảng giá theo ngày và chính sách hiển thị trước khi thu tiền online.
- `short_term_apartments` vẫn là document Firestore công khai như luồng cũ, có thể chứa `address`/`contactPhone`. Giao diện không hiện các trường này nhưng Firestore không che được từng field. Trước khi coi địa chỉ và số đối tác là riêng tư tuyệt đối, cần tách private document hoặc chuyển public read qua API lọc trường, đồng thời phối hợp app mobile dùng chung rules.
- Admin ở app mobile hoặc client cũ vẫn có thể cập nhật đơn qua Firestore trực tiếp. Cần chuyển các client đó sang API xác nhận mới và siết rules trước khi bảo đảm mọi kênh đều chống bán trùng.

## Phát hành và kiểm tra

1. Kiểm tra rules/index trên Firebase emulator có Java; đặc biệt quyền đọc `short_term_commissions` của khách/CTV/Admin và yêu cầu cũ từ app mobile.
2. Triển khai `firestore.rules` trước ứng dụng vì form Admin ghi hoa hồng ở collection mới. Triển khai ứng dụng sau; kiểm tra `/can-ho-ngan-han`, gửi đơn giờ/đêm, CTV và Admin xác nhận trên staging hoặc production với dữ liệu thử.
3. Đã chạy `npm run typecheck`, `npm run build`, `node --test tests/stay-pricing.test.mjs` thành công. Test rules chưa chạy được tại máy này do thiếu Java (`Could not spawn java -version`).
