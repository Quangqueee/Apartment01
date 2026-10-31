# Tối ưu vận hành khu vực Giám đốc

## Phạm vi và mô hình giữ nguyên

Luồng nghiệp vụ: CTV bên ngoài gửi khách/nhu cầu → Giám đốc chọn lịch và Admin → Admin nội bộ dẫn khách. Quyền xem danh sách, quyền hồ sơ khách và quyền xử lý lịch là ba việc riêng. Giữ baseline bốn Admin cũ xem toàn bộ lịch/CTV, khách cũ đã chốt theo ID; chỉ Giám đốc đọc số chủ nhà thật. Không thêm notification phân quyền, không đổi vai trò hay tự giao lịch live.

## Đã triển khai

### Phân công dẫn khách

- Mặc định danh sách lịch đang mở, chưa phân công; sắp theo ngày/giờ hẹn. Có bộ lọc trạng thái, hôm nay/quá ngày, nguồn CTV/web/vãng lai/Admin nhập, Admin phụ trách và tìm không dấu.
- Lịch đã dẫn (`contacted`) hoặc hủy (`failed`) vẫn xem được nhưng không chọn trong luồng phân công thông thường. Không tự xóa/đổi trạng thái lịch cũ. Đây là cách chọn ở UI, không phải một thay đổi quyền quản trị dữ liệu của Giám đốc.
- Hiển thị tải công việc của từng Admin: lịch mở, lịch hôm nay, lịch quá ngày. Selector sắp theo số lịch mở; không tự chọn/giao việc dựa trên chỉ số này.
- Xem trước việc giao/đổi/bỏ phân công: danh sách cụ thể, người nhận, số lịch đang đổi từ người cũ, số không đổi/đã đóng/không còn thấy. Danh sách đã chọn ngoài bộ lọc được nhắc rõ và vẫn có trong preview.
- Cảnh báo cùng mốc ngày/giờ giữa các lịch được giao và lịch của Admin. Chưa có thời lượng/di chuyển nên không suy ra mọi xung đột và không tự chặn một kế hoạch hợp lệ.
- Cảnh báo một số liên hệ xuất hiện trong nhiều lịch mở; nhận biết cách nhập `0...`/`+84...`. Chỉ cảnh báo, không tự gộp khách, quyết định người sở hữu nguồn hay xóa lịch.
- Panel chọn Admin lên trước danh sách trên mobile; có thanh thao tác sticky ở cuối khi đã chọn lịch. Input tối thiểu 16px, label rõ, dialog preview hỗ trợ bàn phím.
- Chọn lịch giữ người/version phân công tại thời điểm chọn. Payload UI có `expectedVersion` từ UID + timestamp phân công để phát hiện cả trường hợp A→B→A. API vẫn nhận payload cũ chỉ có `expectedAdminUid` để tương thích; payload cũ có bảo vệ UID cơ bản, không có toàn bộ kiểm tra version mới.
- Thao tác giống trạng thái hiện có không reset `assignedAt`, tạo audit hoặc tín hiệu refresh thừa. Kết quả trả số thay đổi thật và số không đổi. Lô tối đa 100 lịch, có tiến độ và thông báo phần đã xử lý khi một lô thất bại.

### Duyệt khách và thu hồi quyền

- Preview trước cấp/thu hồi, chốt khách và tài khoản nhận từ danh sách đã chọn. Có chọn nhanh toàn bộ Admin và tìm không dấu.
- Nêu rõ quyền khách cũ/chủ quản lý vẫn còn dù bỏ grant riêng; không báo sai rằng mọi quyền đã bị thu hồi.
- Thu hồi được grant riêng còn sót cho người không còn là Admin hoặc đã mất profile. Chỉ thao tác **remove** được nhận các UID này; **add** vẫn bắt buộc profile role Admin. UI hiển thị người cũ để thu hồi riêng, không đưa họ vào picker cấp mới.
- Tính khách mới chờ cấp dựa trên các Admin hiện còn vai trò hợp lệ; một grant cũ cho người đã chuyển sang CTV không làm khách bị coi là đã có người nhận quyền.
- Grant không đổi bỏ qua ghi/audit/tín hiệu thừa, giữ baselineId và các quyền của tài khoản khác.

### Lịch sử, dữ liệu và hiệu năng

- Thêm tab **Lịch sử thao tác**: 50 sự kiện mới nhất, người thao tác, hành động, thời gian và mã đối tượng; có tìm kiếm/tải lại. Backend chỉ Giám đốc, projection không trả arbitrary before/after, nội dung ghi chú hoặc số riêng tư.
- Đây là lịch sử giao việc/duyệt quyền/quản trị. **Chưa phải nhật ký mọi thay đổi trạng thái/ghi chú của Admin**: các thao tác này hiện ghi Firestore trực tiếp theo quyền cũ, không qua đường ghi audit thống nhất.
- Parent overview từ ba API về một API; panel lịch từ hai API về một API có roster Admin tối thiểu. Mỗi lần refresh logic của overview + panel lịch từ năm API xuống hai; không lấy danh sách hồ sơ khách chỉ để dựng picker Admin.
- `useDirectorResource` / `createRefreshQueue` gộp các tín hiệu cùng lúc, chỉ một request in-flight và tối đa một lần tải tiếp. Response cũ bị loại khi có tín hiệu mới; request/callback của phiên đã đóng bị bỏ qua. Không có cache dùng chung giữa tài khoản, không lưu local storage, không chứa số chủ nhà thật.
- Các màn hình dùng chung loading/error/retry/refresh, tải lại khi focus và mỗi 60 giây khi tab đang hiển thị. Realtime không tự ghi đè draft người nhận đang sửa ở khu vực share nâng cao.
- Danh bạ nhận biết profile tên/role sai kiểu, dùng tên Auth khi có và ghi chưa xác định; không suy đoán thành khách/Admin. Membership khách yêu cầu array đúng kiểu, fail closed với dữ liệu sai kiểu.
- Giờ nghiệp vụ dùng `Asia/Bangkok` (+07), cùng mốc giờ với lịch tại Việt Nam. Timestamp có timezone được chuyển về mốc này; ngày/giờ không hợp lệ không bị biến thành xung đột giả.

### Ghi chú: điểm đã làm rõ, chưa đổi luồng

Code hiện lưu `adminNotes` vào document lịch mà khách/CTV sở hữu có thể đọc, và gửi notification nội dung khi có tài khoản người gửi. Một placeholder cũ lại gọi đây là “ghi chú nội bộ”, gây hiểu nhầm. Đã sửa label/placeholder thành **Phản hồi cho người gửi lịch**, nêu rõ người gửi có thể xem; giữ nguyên nơi lưu và luồng gửi hiện có theo lựa chọn của người dùng ngày 13/10/2026.

Người dùng xác nhận: **“Giữ như hiện tại, chỉ đề xuất phần này.”** Giữ nguyên `adminNotes`, quyền xem phản hồi và luồng thông báo hiện tại; không thêm ghi chú nội bộ, migrate/ẩn ghi chú cũ hoặc thay đổi người nhận. Ghi chú nội bộ chỉ là đề xuất cho lần triển khai sau khi có yêu cầu. Nếu bổ sung, phải nằm ở document/collection riêng vì Firestore không che field trong một document mà CTV được đọc.

## Các phần nghiệp vụ còn thiếu — ưu tiên đề xuất

| Ưu tiên | Vấn đề quan sát được | Tác động / đề xuất |
|---|---|---|
| 1 | Chưa có audit mọi thao tác xử lý của Admin | Không nên dùng assignment hiện tại để suy ra ai thực sự đổi trạng thái. Cần API ghi thống nhất, actor từ token, trước/sau, lý do hủy/mở lại; phối hợp client mobile trước khi chặn ghi trực tiếp bằng rules. |
| 1 | Chưa có ghi chú nội bộ riêng | Chỉ đề xuất theo xác nhận ngày 13/10/2026; giữ phản hồi khách/CTV hiện tại. Nếu triển khai sau, tách nhận xét nội bộ và quyết định rõ Admin phụ trách/owner/Giám đốc nào được đọc; nội bộ không notification ra ngoài. |
| 1 | Giao việc chưa có xác nhận nhận/từ chối | Thêm trạng thái tiếp nhận, lý do từ chối, thời gian phản hồi và danh sách chưa nhận/quá hạn cho Giám đốc. Không tự gửi thông báo phân quyền hoặc tiết lộ người giao. |
| 1 | Owner và assignee đều có thể xử lý theo quyền hiện có | Cần quyết định khi đã giao cho B thì A (owner) có tiếp tục sửa trạng thái hay chỉ sửa dữ liệu gốc. Hiện giữ quyền cũ; không tự thu hẹp quyền của Admin sở hữu. |
| 2 | `contacted` đang dùng cho “đã dẫn”, chưa có kết quả thuê | Tách đã liên hệ, đã hẹn, đã dẫn, thuê thành công, chưa thuê/khách bỏ, lý do thất bại; giữ trạng thái cũ có mapping được review, không suy ra kết quả thuê từ `contacted`. |
| 2 | Chưa có thời lượng và lịch rảnh của Admin | Bổ sung khoảng thời gian dẫn/di chuyển và lịch nghỉ. Khi có dữ liệu đó mới tính xung đột thực, công suất; hiện chỉ nhắc cùng mốc giờ. |
| 2 | Trùng khách giữa nhiều CTV/căn chưa có chính sách nguồn | Cần xác minh nguồn, giữ CTV gốc, lịch sử chuyển người phụ trách và quy tắc khách xem nhiều căn. Không tự gộp theo số điện thoại, vì số chung/nhiều lượt xem có thể hợp lệ. |
| 2 | Nghỉ việc/khóa tài khoản chưa là một quy trình trọn vẹn | Kiểm tra lịch còn phụ trách, đổi người, thu hồi grants riêng, khóa Auth/revoke phiên khi có yêu cầu; role downgrade một mình chưa là toàn bộ offboarding. |
| 3 | Hồ sơ Auth và users chưa khớp hoàn toàn | Danh bạ đã chỉ ra profile thiếu/orphan; cần quy trình sửa có nguồn đáng tin cậy. Không gán vai trò Admin/CTV dựa vào email/tên hoặc suy đoán dữ liệu cũ. |
| 3 | Chưa có chỉ số quy trình sau khi audit đầy đủ | Thời gian từ gửi khách→giao việc→nhận→dẫn, tỷ lệ chưa xử lý, kết quả theo nguồn. Không xếp hạng nhân viên chỉ bằng số lịch đang mang tên họ. |

Thứ tự hợp lý: nhật ký xử lý + ghi chú riêng → nhận việc/lý do trả → kết quả dẫn/nguồn khách → lịch rảnh và báo cáo. Đây là đề xuất nghiệp vụ, không phải các chức năng đã được âm thầm triển khai hoặc kích hoạt live.

## Kiểm tra, áp dụng và rollback

- API/security: 22/22 đạt; refresh/workflow: 8/8; listener: 4/4; Firestore Emulator: 13/13. Tổng **47 kiểm thử**.
- TypeScript đạt; Next compile build cuối đạt, kể cả sửa label phản hồi (không full prerender). Graphify local lỗi uv trampoline, repository chưa cấu hình lint.
- Không có browser đang đăng nhập Giám đốc trong các surface công cụ truy cập được, nên chưa xác minh UI bằng phiên live; không mint token đăng nhập thay người dùng để thử.
- Bản tối ưu chỉ sửa source và kiểm thử local/emulator. Không ghi metadata quyền production, chạy migration, đổi vai trò, tự giao lịch hoặc deploy website. **Không thay đổi Firestore/Storage rules** ở bản này; giữ release bảo mật đã deploy ở bản phân công trước.
- Không cần migration cho các cải tiến này; version phân công tính từ field đã có. Rollback source bằng commit trước, giữ rules/landlordContacts/customerVisibility/accessAudit và các baseline. Không xóa dữ liệu hay audit để rollback UI. Nếu client cũ không nhận `admins` ở response lịch thì dùng source API/UI cùng phiên bản khi triển khai.

Hướng dẫn sử dụng: chọn bộ lọc lịch → xem tải Admin → chọn lịch → preview cảnh báo/trước-sau → xác nhận. Duyệt khách mới độc lập tại tab khách, lịch sử tại tab cuối. Chọn “Tất cả trạng thái” để xem lịch đã đóng, không dùng luồng giao mới để sửa lịch sử cũ.
