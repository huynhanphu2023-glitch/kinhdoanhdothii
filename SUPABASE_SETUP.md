# Nối APX Business World với Supabase

Hiện Supabase chưa được cấu hình trong trình duyệt; game tiếp tục lưu cục bộ. Sau khi đưa thư mục lên GitHub, làm theo thứ tự sau.

1. Trong Supabase Dashboard, kiểm tra Table Editor, SQL Editor, triggers và RLS hiện có. Migration chỉ tạo bảng `apx_*`, tự dừng nếu đối tượng đích đã tồn tại và không sửa/xóa các bảng khác. Nếu project đã có schema hồ sơ/save, cần kiểm tra và điều chỉnh trước khi chạy.
2. Chạy `supabase/migrations/202609270001_apx_player_platform.sql` trong SQL Editor.
3. Chạy tiếp `supabase/migrations/202609270002_apx_avatar_storage.sql` để tạo bucket avatar và giới hạn mỗi người chỉ tải/thay ảnh trong thư mục theo user ID của mình. Bucket công khai để ảnh hồ sơ xem được bằng URL; chỉ ảnh trong bucket này được công khai.
4. OTP vẫn được gửi qua email; nó thay liên kết xác nhận bằng mã số. Để đăng ký bắt buộc mã OTP, vào **Authentication → Sign In / Providers → Email**, bật **Confirm email**. Sau đó vào **Authentication → Email Templates → Confirm signup** và đổi mẫu thành nội dung có mã, không dùng `{{ .ConfirmationURL }}`. Ví dụ:

```html
<h2>Mã xác nhận APX Business World</h2>
<p>Nhập mã này trong game để xác nhận email:</p>
<h1>{{ .Token }}</h1>
<p>Nếu bạn không tạo tài khoản APX, hãy bỏ qua email này.</p>
```

   Giữ Confirm email bật: game gọi `verifyOtp` để kiểm tra mã nhập vào. Mã OTP và đường dẫn xác nhận là hai định dạng thư khác nhau. Dashboard project hiện báo cần cấu hình SMTP riêng mới sửa được mẫu email; nếu không có SMTP riêng, Supabase có thể tiếp tục gửi mẫu mặc định dạng liên kết và form OTP trong game sẽ không có mã để xác minh. Không gửi SMTP password/API secret qua chat hoặc đưa vào GitHub.

5. Deploy `supabase/functions/apx-admin` thành Edge Function `apx-admin`, bật xác thực JWT. Đặt `SUPABASE_SERVICE_ROLE_KEY` trong Edge Function Secrets; không bao giờ để secret trong JS hay GitHub.
6. Đăng ký tài khoản, nhập OTP nhận qua email, lấy đúng UUID trong Authentication → Users, rồi thêm tài khoản Admin trong SQL Editor:

```sql
insert into public.apx_admin_users(user_id)
select id from auth.users where email = 'EMAIL_ADMIN_CUA_BAN';
```

7. Project URL và public anon/publishable key nằm trong `js/supabase-config.js`. Không dùng service_role trong ứng dụng trình duyệt.
8. Thử đăng ký, nhập OTP, tải ảnh đại diện, khôi phục save trên thiết bị khác, gửi báo cáo và gọi Admin bằng tài khoản thường (phải bị từ chối).

Mỗi tài khoản được tạo một hồ sơ cùng UUID nhân vật. Tiến trình game được lưu nguyên trạng trong JSONB. Admin được kiểm tra lại trong Edge Function cho từng yêu cầu; thao tác quản trị được ghi vào `apx_admin_audit`. Game không gửi heartbeat và không thu thập trạng thái online.

Các migration này dành cho project APX đã kiểm tra. Ảnh đại diện tải lên giới hạn PNG/JPG/WEBP tối đa 5 MB; URL public được lưu trong hồ sơ người chơi.

## Hệ thống đầu tư APX

Migration supabase/migrations/202609280001_apx_investments.sql kiểm tra trước các tên bảng/hàm đầu tư để tránh đè dữ liệu. Database đã được kiểm tra: các bảng hồ sơ, bản lưu, báo cáo và Admin APX đang có; chưa có bảng đầu tư nào trùng tên.

Chạy migration trong SQL Editor của project kinhdoanhdothi để tạo:
- apx_investment_assets: mã cổ phiếu, trái phiếu và quỹ mẫu; giá mô phỏng.
- apx_investment_positions: từng lô tài sản theo user_id.
- apx_investment_transactions: lịch sử mua, bán và đáo hạn theo user_id.

Chức năng giao dịch chạy qua RPC PostgreSQL, khóa bản lưu game của đúng tài khoản, kiểm tra số dư và cập nhật tiền cùng danh mục trong một transaction. Không cấp quyền sửa danh mục/lịch sử trực tiếp cho client. Trái phiếu đáo hạn theo ngày thực, tự trả gốc và lãi khi người chơi mở mục Đầu tư hoặc giao dịch tiếp theo. Giá cổ phiếu/quỹ mô phỏng được hệ thống làm mới theo các mốc 5 phút, kể cả khi không có người chơi đang mở thị trường.

Đăng nhập bằng tài khoản đã có bản lưu cloud, mở Đầu tư → Thị trường, mua thử một tài sản, kiểm tra số dư/danh mục/lịch sử, sau đó bán lại một phần. Với tài khoản khác, danh mục và lịch sử phải rỗng riêng. Mua vượt số dư hoặc bán quá số lượng sở hữu phải bị từ chối.

## Giá cổ phiếu mỗi 5 phút

Với database đã có hệ thống đầu tư, chạy migration `supabase/migrations/202609280006_apx_market_refresh_five_minutes.sql` trong SQL Editor. Migration cài lịch chạy chung `pg_cron` mỗi 5 phút và đồng bộ việc cập nhật giá theo mốc thời gian hệ thống.

## Thị trường, NPC và giao dịch

Chạy migration `supabase/migrations/202609280007_apx_marketplace.sql`. Migration tạo NPC hệ thống, listing sản phẩm, giao dịch Player/NPC và job xử lý nhu cầu NPC mỗi 5 phút. NPC không tạo tài khoản đăng nhập và không xuất hiện trong cộng đồng hoặc bảng xếp hạng.

## Vé tuyển dụng và mã quà tặng

Sau khi cập nhật các file game, chạy migration `supabase/migrations/202609280002_apx_vouchers.sql` trong SQL Editor của cùng project. Migration thêm `apx_redeem_codes`, `apx_redeem_claims` và RPC `apx_redeem_voucher`; code được lưu dạng SHA-256, người chơi không có quyền đọc bảng code. RPC kiểm tra đăng nhập, khóa game save, ghi nhận lượt đổi và cộng vé trong một transaction.

Sau các migration voucher hiện có, chạy `supabase/migrations/202609280005_apx_recruitment_tickets.sql` trong SQL Editor. Migration chuyển phần thưởng sang vật phẩm `recruitment-ticket`; mã chung `APXVE2026` cấp 10 vé và mỗi tài khoản chỉ đổi một lần. 100 mã riêng đã lưu trong database mỗi mã cấp 1 vé, chỉ tài khoản đầu tiên đổi thành công nhận được vé. Danh sách mã riêng nằm ngoài thư mục game ở `C:\Users\DELL\Documents\Codex\APX-voucher-codes-private.txt`; không đưa file này lên GitHub hoặc gửi vào nơi công khai.

Trong game, mỗi lượt tuyển ngẫu nhiên dùng 1 vé. Người chơi có thể mua vé với giá 50 triệu đồng hoặc đổi mã quà tặng. Migration giữ nguyên giới hạn đổi và lịch sử nhận mã của từng tài khoản.

## Cộng đồng, bảng xếp hạng và tên công ty riêng

Sau khi cập nhật mã game, chạy `supabase/migrations/202609280003_apx_community.sql` trong SQL Editor của cùng project. Migration chỉ thêm RPC `apx_community_players`, đọc `apx_player_profiles` và `apx_game_saves` hiện có; không tạo lại hoặc chỉnh sửa các bảng người chơi.

Mục **Cộng đồng** có danh sách người chơi khác và hai bảng xếp hạng: tiền cá nhân, và tiền mặt hợp nhất của tập đoàn/các công ty. Cột lịch sử `last_seen_at` của schema cũ được giữ nguyên để tương thích, nhưng game mới không cập nhật, đọc hoặc hiển thị trạng thái này. Người chơi đổi tên công ty tại trang quản lý công ty; tên được lưu trong save riêng của tài khoản.

Các bảng xếp hạng công khai tên hiển thị, ảnh đại diện, tên công ty và số dư tiền của người chơi để mọi tài khoản trong server có thể so sánh. RPC không trả về email, UUID tài khoản hoặc save đầy đủ. Sau khi chạy migration, thử đổi tên công ty, đăng xuất/đăng nhập lại, rồi kiểm tra tên đó trong danh sách Cộng đồng và bảng xếp hạng.

## Khởi nghiệp, tuyển dụng và chat

Người chơi mới bắt đầu với 1 tỷ đồng, không nhận sẵn công ty, chi nhánh hoặc nhân viên. Họ tự thành lập công ty, chọn lĩnh vực và gói phí/vốn ban đầu; gói tiêu chuẩn công ty đầu tiên tổng cộng 650 triệu đồng. Sau đó người chơi dùng vé tuyển dụng để chiêu mộ NPC từ danh sách hiện có. Sức chứa nhân viên theo cấp công ty là C1: 5, C2: 10, C3: 20, C4: 30, C5: 50. Các bản lưu cũ được giữ nguyên; không chạy lệnh reset save.

Sau khi `202609280003_apx_community.sql` đã được áp dụng, chạy `supabase/migrations/202609280004_apx_chat_profiles_and_no_presence.sql` trong SQL Editor. Migration thêm bảng chat tổng/tin nhắn riêng, bật RLS và chỉ cho client truy cập qua RPC có kiểm tra đăng nhập. Nó thay RPC cộng đồng để bỏ trường hiện diện, không xóa bảng hồ sơ hay bản lưu hiện có. Deploy lại Edge Function `apx-admin` từ thư mục `supabase/functions/apx-admin` để trang Admin cũng ngừng truy vấn/trả trạng thái online.

Chat chỉ tải 50 tin gần nhất khi mở trang hoặc bấm **Làm mới**; không chạy polling/realtime. Chat riêng đọc lịch sử theo từng người nhận và lưu ở Supabase. Kiểm tra sau khi migration và deploy: người chơi A nhắn Chat tổng; A nhắn riêng người chơi B; đăng xuất/đăng nhập lại và mở lại cuộc trò chuyện. Dùng hai tài khoản để xác nhận người khác không thể đọc cuộc trò chuyện riêng không thuộc về họ.

Muốn thử khởi đầu mới, dùng tài khoản mới hoặc tạo ván mới. Không xóa bảng `apx_game_saves` và không đặt lại save của tài khoản cũ.
