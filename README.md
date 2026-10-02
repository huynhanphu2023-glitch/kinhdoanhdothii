# APX Business World — Hướng dẫn chơi

APX Business World là game mô phỏng kinh doanh. Người chơi xây dựng nhân vật, lập công ty, tuyển người, quản lý sản phẩm và phát triển tài sản trong thế giới APX.

## Bắt đầu

1. Mở `index.html` hoặc vào trang GitHub Pages của game.
2. Phải đăng nhập tài khoản APX để vào game. Khi chưa đăng nhập, game chỉ hiển thị màn hình tài khoản.
3. Đăng nhập bằng tài khoản APX hiện có để đồng bộ tiến trình giữa các lần đăng nhập. Không cần tạo tài khoản thứ hai.
4. Tạo và hoàn thiện hồ sơ nhân vật trong **Nhân vật → Hồ sơ cá nhân**.
5. Người chơi mới bắt đầu với ₫0 tiền cá nhân và chưa có công ty. Ứng tuyển công việc NPC, chọn thời hạn hợp đồng và ký trước khi đi làm. Hoàn thành tối đa một ca mỗi ngày để nhận ₫500.000–₫1.000.000, tăng cấp và mở khóa dần tính năng. Mỗi ca có ít nhất 15 đơn; từ cấp sự nghiệp 5, sau 8 ca làm và khi tích lũy đủ ít nhất ₫2 tỷ, người chơi có thể thành lập công ty.

Ngày game tự chuyển theo chu kỳ 15 phút đồng bộ; không có nút bỏ qua ngày.

## Các khu vực

- **Nhân vật:** hồ sơ, kỹ năng, tài sản cá nhân và thành tựu.
- **Sự nghiệp:** chỉ giữ một nghề chính; ứng tuyển công ty NPC, chọn hợp đồng 3/5/7/30 ngày game rồi ký trước khi làm. Mỗi ca vẫn dùng mini-game bán hàng, kho hoặc bếp, ít nhất 15 đơn; kết quả ảnh hưởng XP, hiệu suất, uy tín và cơ hội thăng tiến. Hợp đồng hỗ trợ gia hạn, nghỉ sớm có bồi thường được giới hạn, và các vị trí cao hơn mở thêm thử thách quản lý.
- **Thành phố:** bản đồ, bất động sản, xây dựng và thị trường thành phố.
- **Công ty:** tổng quan, công ty, tài chính, sản phẩm và thị trường.
- **Nhân viên:** danh sách, tuyển dụng, phòng ban và đào tạo.
- **Túi đồ / Shop:** vật phẩm đang sở hữu và cửa hàng trong game.
- **Đầu tư:** thị trường, danh mục và lịch sử giao dịch.
- **Cộng đồng:** người chơi, bảng xếp hạng, chat và tin nhắn.
- **Cuộc sống CEO (APX LIFE):** nhà, garage, trang trí, thành phố, mạng xã hội, bạn bè, nhật ký và cửa hàng cuộc sống.
- **APXBank:** tài khoản, nạp/rút từ ví game, chuyển tiền cho người chơi, tiết kiệm kỳ hạn, khoản vay trả theo ngày game, điểm tín dụng, thông báo và lịch sử.

## Công ty và tiền

Tiền cá nhân và tiền công ty là hai khoản riêng. Chi tiêu cá nhân không lấy từ ngân quỹ công ty; đừng coi toàn bộ vốn công ty là tiền riêng.

Trong trang công ty, người chơi có thể quản lý chi nhánh, sản phẩm, kho, nhân viên và chiến dịch. Giá sản phẩm bị giới hạn theo ngành:

- Lifestyle: tối đa ₫500.000.
- Technology: tối đa ₫1.000.000.
- Bất động sản: tối đa ₫1.000.000.

Giá vượt trần không được niêm yết lên marketplace và NPC sẽ không mua. Sản phẩm cũ vượt trần cần được hạ giá trong **Công ty → Sản phẩm** để bán lại trên thị trường.

Marketplace bán hàng dựa trên tồn kho công ty. NPC là khách hệ thống, không phải tài khoản người chơi. Giao dịch marketplace cần đăng nhập và các migration marketplace đã được cài trong Supabase.

## APX LIFE

APX LIFE dùng cùng tài khoản APX. Các giao dịch nhà, xe, nội thất và hoạt động thành phố dùng ví cá nhân; giá và quyền sở hữu được xác nhận ở server.

- Mua nhà và xe: kiểm tra số dư, sức chứa và xác nhận trước khi thanh toán.
- Garage: sức chứa phụ thuộc nhà chính; xe không tạo lợi thế kinh doanh.
- Trang trí: mua vật dụng, chọn slot, xoay/xem trước rồi lưu bố trí. Nếu còn nợ phí duy trì, một số thao tác trang trí bị khóa.
- Thành phố: chọn địa điểm và hoạt động; phí được báo trước, giới hạn theo ngày game.
- Mạng xã hội: bài viết tối đa 500 ký tự, bình luận 200 ký tự; ảnh chỉ chọn từ asset trong game, không tải ảnh tự do lên.
- Hồ sơ: người chơi tự chọn chế độ riêng tư và nội dung nhà/xe muốn chia sẻ.

APX LIFE cần migrations `202609290011` đến `202609290017`. Giới hạn giá sản phẩm/NPC cần marketplace migration `202609290018`. Nếu migration chưa được áp dụng ở Supabase, một số trang cloud có thể chưa hoạt động; xem [hướng dẫn Supabase](SUPABASE_SETUP.md).

APXBank lưu dữ liệu trong tiến trình tài khoản hiện có và dùng cùng lịch ngày 15 phút của game. Muốn bật chuyển tiền giữa người chơi, cần chạy migration `202610020001_apx_bank_transfers.sql`; các giao dịch ngân hàng nội bộ được lưu trong save. Xem hướng dẫn Supabase để biết cách triển khai và kiểm tra với hai tài khoản.

## Lưu tiến trình

- **Đăng nhập:** game yêu cầu tài khoản APX; save gắn với tài khoản và được lưu trên Supabase khi backend đã cấu hình.
- Không chỉnh sửa/xóa dữ liệu Supabase thủ công để đặt lại game. Dùng tài khoản mới nếu muốn bắt đầu một tiến trình khác.

Nếu một giao dịch báo lỗi, đừng bấm liên tục. Kiểm tra số dư, thử tải lại trang và chỉ gửi thông tin lỗi cho quản trị viên; không chia sẻ mật khẩu hay khóa bí mật.
