# 🚀 Báo Cáo Kỹ Thuật: Tối Ưu SEO Toàn Diện, Bảo Mật Next.js, UX & Hệ Thống AI

**Ngày cập nhật:** 06/08/2026  
**Dự án:** Hanoi Residences  
**Phạm vi:** Technical SEO, Security, Frontend UX/Accessibility & AI Content Generation Engine.

---

## 📋 Tổng Quan Các Hạng Mục Nâng Cấp

Trong đợt cập nhật này, hệ thống tập trung giải quyết 4 nhóm vấn đề cốt lõi: 
1. **Technical SEO & AI-SEO (GEO):** Đưa cấu trúc dữ liệu có cấu trúc (Schema Markup) lên trang chi tiết và tinh chỉnh tệp chỉ dẫn AI.
2. **Bảo mật & Clean Code (Next.js & TypeScript):** Thiết lập tường lửa remotePatterns, chuyển TypeScript strict mode (`ignoreBuildErrors: false`) và xử lý lỗi export service.
3. **Trải nghiệm người dùng (UX) & Khả năng tiếp cận (Accessibility):** Tối ưu giao diện trang 404 căn hộ, bổ sung `aria-label`, đồng bộ hiệu ứng chuyển màu thương hiệu (`hover:bg-primary`).
4. **Hệ thống AI Tạo Nội Dung:** Hoàn thiện cơ chế chống vỡ giao diện (Sanitize), quản lý Token thực tế, Cache thông minh và xử lý lỗi JSON an toàn.

Bổ sung thêm 3 hạng mục tối ưu PageSpeed & backend filter:
5. **Tối ưu PageSpeed (Font Loading):** Loại bỏ render-blocking request tới `fonts.googleapis.com`/`fonts.gstatic.com`, chuyển sang `next/font/google` tự host.
6. **Sitemap Động:** Hoàn thiện `app/sitemap.ts` để lấy danh sách căn hộ thật từ Firestore thay vì placeholder rỗng.
7. **Multi-Select Filter (Backend Query):** Chuyển query Firestore cho `district`/`roomType` từ so khớp tuyệt đối (`==`) sang `in` để hỗ trợ chọn nhiều giá trị cùng lúc trên URL.

---

## 🛠️ Chi Tiết Kỹ Thuật Các Tính Năng Đã Thực Hiện

### 1. Tối Ưu Hóa Technical SEO & Dữ Liệu Có Cấu Trúc (Schema Markup)
* **Khai báo JSON-LD (`Apartment` Schema):** Bổ sung đoạn mã cấu trúc ngầm ở Server Component (`app/apartments/[id]/page.tsx`) định nghĩa rõ loại tài sản là `Apartment`, kèm theo thông tin chi tiết về diện tích (`floorSize`), địa chỉ khu vực (`PostalAddress`), và giá cho thuê (`Offer` quy đổi chuẩn VND). Giúp Google dễ dàng nhận diện và hiển thị Rich Snippets trên kết quả tìm kiếm.
* **Tối ưu Thẻ H1:** Tự động gắn từ khóa địa phương (*Hà Nội*, *Quận*) giúp nâng cao điểm số On-Page SEO.

### 2. Tăng Cường Bảo Mật & Quản Lý Mã Nguồn (Next.js & TS)
* **Tường Lửa `next.config.js` (`remotePatterns`):** Khai báo tường minh danh sách các tên miền ảnh được phép tối ưu hóa qua Next.js Image Optimization (bao gồm Unsplash, Firebase Storage, Google User Content...). Động thái này giúp ngăn chặn triệt để lỗ hổng SSRF (Server-Side Request Forgery) và vô hiệu hóa các request quét mã độc tự động từ bot ngoài.
* **Chuyển Strict TypeScript Mode:** Chuyển `ignoreBuildErrors` từ `true` về `false`. Khắc phục dứt điểm lỗi thiếu module bằng cách bổ sung và export hàm `getCurrentUserRole` trong `auth-service.ts`.
* **Xử lý Xung Đột Cache Build:** Tài liệu hóa cách xử lý lỗi `_buildManifest.js.tmp` (lỗi đụng độ thư mục `.next` trên môi trường Windows).

### 3. Cải Tiến Trải Nghiệm Người Dùng (UX) & Accessibility
* **Nâng Cấp Giao Diện 404 / Không Tìm Thấy Căn Hộ:** Thay vì một dòng chữ thông báo sơ sài, trang lỗi khi khách hàng truy cập vào một căn hộ đã bị xóa hoặc gỡ bỏ nay được thiết kế lại chuyên nghiệp với đầy đủ Header/Footer, icon trực quan (`SearchX`), thông điệp giải thích lịch sự, cùng các nút điều hướng thông minh (Về trang chủ, Xem căn hộ khác) có hiệu ứng hover đổi sang màu thương hiệu (`hover:bg-primary`).
* **Chuẩn Hóa Khả Năng Tiếp Cận (Accessibility):** Bổ sung thuộc tính `aria-label` và `aria-current="page"` vào các nút điều hướng (MobileNav) và Modal chia sẻ (ShareModal) giúp các thiết bị đọc màn hình (Screen Readers) định vị chính xác, đạt chuẩn tối ưu PageSpeed.
* **Đồng Bộ Hiệu Ứng Nút Bấm (UI Polish):** Áp dụng hiệu ứng nổi 3D mượt mà (`hover:-translate-y-0.5`, `hover:shadow-lg`, `duration-300`) cho các nút hành động chính (Đăng ký, Về trang chủ).

### 4. Nâng Cấp Hệ Thống AI Tạo Nội Dung (Content Generation Engine)
* **Sanitize Output (Chống vỡ giao diện Markdown):** Thêm bước tiền xử lý chuỗi trả về thông qua Regex (`replace(/^[ \t]+/gm, "")`) nhằm cắt bỏ các khoảng trắng thừa ở đầu dòng vô tình sinh ra từ LLM, ngăn chặn việc Markdown bị nhận diện nhầm thành khối code (code block).
* **Prompt Engineering & Try-Catch Parsing:** Tách biệt rõ ràng System Role (luật định dạng Markdown/JSON) và User Role (dữ liệu thô) khi gọi mô hình Llama-3.3-70b. Toàn bộ quá trình phân tích phản hồi được bọc an toàn trong khối `try...catch` để tránh làm sập tiến trình khi AI trả về JSON lỗi cú pháp.
* **Rate Limiter & Quản Lý Token Thực Tế:** Cập nhật cơ chế tính toán hạn mức (TPM) dựa trên dữ liệu tiêu thụ thực tế từ `response.usage.total_tokens` thay vì dùng con số ước tính, giúp hàm `waitForTokenBudget` kiểm soát chính xác giới hạn của Groq API.
* **In-Memory Caching & `forceRefresh`:** Tích hợp bộ nhớ đệm (node-cache/Redis) kết hợp mã băm MD5 cho Cache Key. Bổ sung tham số `forceRefresh` (boolean) để linh hoạt cho phép ép hệ thống tạo mới dữ liệu khi cần thiết, triệt tiêu lỗi 429 Rate Limit và tăng tốc độ phản hồi đáng kể.

### 5. Tối Ưu PageSpeed Insights (Font Loading)
* **Loại Bỏ Render-Blocking Request:** Xóa các thẻ `<link>` gọi trực tiếp `fonts.googleapis.com`/`fonts.gstatic.com` trong `<head>` (`app/layout.tsx`) và dòng `@import` trùng lặp trong `globals.css` (trước đó Playfair Display bị tải **2 lần** từ 2 nguồn khác nhau).
* **Chuyển Sang `next/font/google`:** Tự host font `Be_Vietnam_Pro` (400/500/600/700) và `Playfair_Display` (400/700/900, normal + italic) với `subsets: ['latin', 'vietnamese']` và `display: 'swap'`, xuất ra CSS variable (`--font-body`, `--font-headline`) gắn vào `<html>`.
* **Đồng Bộ Cấu Hình Font:** `globals.css` và `tailwind.config.ts` được cập nhật để `font-body`/`font-headline` trỏ đúng vào các biến CSS mới, khắc phục luôn bug cũ (`body` set cứng `'PT Sans'` trong khi class Tailwind lại dùng `Be Vietnam Pro`).

### 6. Sitemap Động (Dynamic Sitemap từ Firestore)
* **Hoàn Thiện `app/sitemap.ts`:** Thay phần placeholder rỗng bằng truy vấn Firestore thật (`collection(firestore, 'apartments')` từ `@/firebase/server-init`), tạo URL `/apartments/{id}` cho từng căn hộ.
* **`lastModified` Ưu Tiên Dữ Liệu Thật:** Lấy theo thứ tự `updatedAt.toDate()` → `createdAt.toDate()` → `new Date()` (fallback an toàn nếu field bị thiếu).

### 7. Nâng Cấp Bộ Lọc Multi-Select (`district`/`roomType`)
* **Bối Cảnh:** Frontend (`filter-controls.tsx`) đã hỗ trợ chọn nhiều quận/loại phòng cùng lúc, ghi vào URL dạng chuỗi phân tách dấu phẩy (vd: `district=Ba+Đình,Tây+Hồ`), nhưng backend (`lib/data.ts`) vẫn so khớp tuyệt đối (`==`) nên không trả kết quả nào khi có nhiều giá trị.
* **Parse Chuỗi Thành Mảng:** `getApartments()` tách `district`/`roomType` bằng dấu phẩy, `trim()` khoảng trắng thừa và loại bỏ phần tử rỗng trước khi đưa vào query; mảng rỗng vẫn giữ nguyên hành vi cũ (lấy tất cả).
* **Đổi Toán Tử Query:** Chuyển `where(field, '==', value)` sang `where(field, 'in', arrayValue)`, có chặn sớm (throw Error) nếu mảng vượt quá giới hạn 30 giá trị của Firestore.
* **Tiêu Đề Kết Quả Tìm Kiếm:** `app/page.tsx` khi chọn nhiều hơn 1 quận sẽ hiển thị tiêu đề chung "KẾT QUẢ TÌM KIẾM" thay vì liệt kê tên quận lỗi định dạng (vd: "CĂN HỘ TẠI BA ĐÌNH,TÂY HỒ"); giữ nguyên format "CĂN HỘ TẠI {TÊN QUẬN}" khi chỉ chọn 1 quận.
* **Lưu Ý Composite Index:** Khi `district` và `roomType` cùng active (2 mệnh đề `in` trên 2 field khác nhau), Firestore có thể yêu cầu composite index mới — index chưa được tạo sẵn (repo không quản lý `firestore.indexes.json`), cần theo dõi lỗi runtime kèm link tạo index trong Firebase Console khi triển khai.

---

## 📌 Hướng Dẫn Bảo Trì Sau Cập Nhật
1. **Kiểm tra Build:** Khi thực hiện các lệnh triển khai (deployment), hãy chắc chắn lệnh `npm run build` không bị báo lỗi TypeScript (`ignoreBuildErrors: false`).
2. **Quản lý Cache:** Nếu gặp lỗi lạ liên quan đến `_buildManifest` trong quá trình dev local, thực hiện xóa thư mục `.next` (`rd /s /q .next` trên Windows).
3. **Mở rộng AI Prompt:** Khi điều chỉnh câu lệnh AI, luôn duy trì cấu trúc tách biệt System/User Role để đảm bảo tính ổn định của cấu trúc dữ liệu JSON trả về.
4. **Thêm/Đổi Font:** Nếu cần thêm font mới, khai báo qua `next/font/google` trong `app/layout.tsx` (không quay lại dùng thẻ `<link>`/`@import` trỏ Google Fonts trực tiếp) và trỏ CSS variable tương ứng trong `tailwind.config.ts`.
5. **Sitemap Phụ Thuộc Firestore:** `sitemap.ts` gọi Firestore ngay tại thời điểm build/revalidate — nếu Firestore lỗi hoặc chậm lúc build, sitemap sẽ log lỗi và trả về mảng rỗng cho phần căn hộ (không làm sập toàn bộ sitemap) chứ không tự retry.
6. **Composite Index Cho Multi-Select Filter:** Khi bổ sung thêm field lọc dùng toán tử `in` kết hợp với `district`/`roomType` hiện có, kiểm tra Firebase Console xem có yêu cầu composite index mới không trước khi deploy lên production.