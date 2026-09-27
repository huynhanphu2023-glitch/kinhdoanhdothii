# Nối APX Business World với Supabase

Hiện Supabase chưa được cấu hình trong trình duyệt; game tiếp tục lưu cục bộ. Sau khi đưa thư mục lên GitHub, làm theo thứ tự sau.

1. Trong Supabase Dashboard, kiểm tra Table Editor, SQL Editor, triggers và RLS hiện có. Migration chỉ tạo bảng `apx_*`, tự dừng nếu đối tượng đích đã tồn tại và không sửa/xóa các bảng khác. Nếu project đã có schema hồ sơ/save, cần kiểm tra và điều chỉnh trước khi chạy.
2. Chạy `supabase/migrations/202609270001_apx_player_platform.sql` trong SQL Editor.
3. Deploy `supabase/functions/apx-admin` thành Edge Function `apx-admin`, bật xác thực JWT. Đặt `SUPABASE_SERVICE_ROLE_KEY` trong Edge Function Secrets; không bao giờ để secret trong JS hay GitHub.
4. Đăng ký tài khoản, lấy đúng UUID trong Authentication → Users, rồi thêm tài khoản Admin trong SQL Editor:

```sql
insert into public.apx_admin_users(user_id)
select id from auth.users where email = 'EMAIL_ADMIN_CUA_BAN';
```

5. Điền Project URL và public anon/publishable key vào `js/supabase-config.js`. Không dùng service_role trong ứng dụng trình duyệt.
6. Thử đăng ký, khôi phục save trên thiết bị khác, gửi báo cáo và gọi Admin bằng tài khoản thường (phải bị từ chối).

Mỗi tài khoản được tạo một hồ sơ cùng UUID nhân vật. Tiến trình game được lưu nguyên trạng trong JSONB. Admin được kiểm tra lại trong Edge Function cho từng yêu cầu; thao tác quản trị được ghi vào `apx_admin_audit`. Online là hoạt động trong 2 phút gần nhất, heartbeat mỗi 45 giây.

Migration này là schema chuẩn bị cho project mới; chưa có quyền xem Supabase hiện có để đối chiếu. Ảnh đại diện dùng URL công khai; upload Storage có thể bổ sung sau.
