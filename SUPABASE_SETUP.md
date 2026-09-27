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

Mỗi tài khoản được tạo một hồ sơ cùng UUID nhân vật. Tiến trình game được lưu nguyên trạng trong JSONB. Admin được kiểm tra lại trong Edge Function cho từng yêu cầu; thao tác quản trị được ghi vào `apx_admin_audit`. Online là hoạt động trong 2 phút gần nhất, heartbeat mỗi 45 giây.

Các migration này dành cho project APX đã kiểm tra. Ảnh đại diện tải lên giới hạn PNG/JPG/WEBP tối đa 5 MB; URL public được lưu trong hồ sơ người chơi.

## Hệ thống đầu tư APX

Migration supabase/migrations/202609280001_apx_investments.sql kiểm tra trước các tên bảng/hàm đầu tư để tránh đè dữ liệu. Database đã được kiểm tra: các bảng hồ sơ, bản lưu, báo cáo và Admin APX đang có; chưa có bảng đầu tư nào trùng tên.

Chạy migration trong SQL Editor của project kinhdoanhdothi để tạo:
- apx_investment_assets: mã cổ phiếu, trái phiếu và quỹ mẫu; giá mô phỏng.
- apx_investment_positions: từng lô tài sản theo user_id.
- apx_investment_transactions: lịch sử mua, bán và đáo hạn theo user_id.

Chức năng giao dịch chạy qua RPC PostgreSQL, khóa bản lưu game của đúng tài khoản, kiểm tra số dư và cập nhật tiền cùng danh mục trong một transaction. Không cấp quyền sửa danh mục/lịch sử trực tiếp cho client. Trái phiếu đáo hạn theo ngày thực, tự trả gốc và lãi khi người chơi mở mục Đầu tư hoặc giao dịch tiếp theo. Giá cổ phiếu/quỹ được mô phỏng thay đổi tối đa mỗi giờ.

Đăng nhập bằng tài khoản đã có bản lưu cloud, mở Đầu tư → Thị trường, mua thử một tài sản, kiểm tra số dư/danh mục/lịch sử, sau đó bán lại một phần. Với tài khoản khác, danh mục và lịch sử phải rỗng riêng. Mua vượt số dư hoặc bán quá số lượng sở hữu phải bị từ chối.

## Mã đổi Vé thu doanh thu

Sau khi cập nhật các file game, chạy migration `supabase/migrations/202609280002_apx_vouchers.sql` trong SQL Editor của cùng project. Migration thêm `apx_redeem_codes`, `apx_redeem_claims` và RPC `apx_redeem_voucher`; code được lưu dạng SHA-256, người chơi không có quyền đọc bảng code. RPC kiểm tra đăng nhập, khóa game save, ghi nhận lượt đổi và cộng vé trong một transaction.

Mã chung `APXVE2026` dùng được cho mọi tài khoản, mỗi tài khoản tối đa một lượt. Có 100 mã riêng; mỗi mã chỉ cấp vé cho người đầu tiên đổi thành công. Danh sách mã riêng nằm ngoài thư mục game ở `C:\Users\DELL\Documents\Codex\APX-voucher-codes-private.txt`; không đưa file này lên GitHub hoặc gửi vào nơi công khai. Nếu tạo bộ mã mới, cần thêm hash các mã vào migration/bảng Supabase tương ứng trước khi phát.

## Cộng đồng, bảng xếp hạng và tên công ty riêng

Sau khi cập nhật mã game, chạy `supabase/migrations/202609280003_apx_community.sql` trong SQL Editor của cùng project. Migration chỉ thêm RPC `apx_community_players`, đọc `apx_player_profiles` và `apx_game_saves` hiện có; không tạo lại hoặc chỉnh sửa các bảng người chơi.

Mục **Cộng đồng** có danh sách người chơi khác và hai bảng xếp hạng: tiền cá nhân, và tiền mặt hợp nhất của tập đoàn/các công ty. Trạng thái online dựa trên heartbeat `last_seen_at` 45 giây một lần; người chơi được xem là online nếu hoạt động trong 90 giây gần nhất. Người chơi có thể đổi tên tập đoàn ở **Công ty → Tổng quan tập đoàn**; tên được lưu trong save riêng của tài khoản.

Các bảng xếp hạng công khai tên hiển thị, ảnh đại diện, tên tập đoàn và số dư tiền của người chơi để mọi tài khoản trong server có thể so sánh. RPC không trả về email, UUID tài khoản hoặc save đầy đủ. Sau khi chạy migration, thử đổi tên tập đoàn, đăng xuất/đăng nhập lại, rồi kiểm tra tên đó trong danh sách Cộng đồng và bảng xếp hạng.
