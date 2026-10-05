# APX Business World — Hướng dẫn chơi

APX Business World là game mô phỏng kinh doanh. Người chơi xây dựng nhân vật, lập công ty, tuyển người, quản lý sản phẩm và phát triển tài sản trong thế giới APX.

## Bắt đầu

1. Mở `index.html` hoặc vào trang GitHub Pages của game.
2. Phải đăng nhập tài khoản APX để vào game. Khi chưa đăng nhập, game chỉ hiển thị màn hình tài khoản.
3. Đăng nhập bằng tài khoản APX hiện có để đồng bộ tiến trình giữa các lần đăng nhập. Không cần tạo tài khoản thứ hai.
4. Tạo và hoàn thiện hồ sơ nhân vật trong **Nhân vật → Hồ sơ cá nhân**.
5. Người chơi mới chưa có công ty; số dư khởi tạo phụ thuộc tiến trình và được hiển thị trong game. Ứng tuyển công việc NPC, chọn thời hạn hợp đồng và ký trước khi đi làm. Hoàn thành tối đa một ca mỗi ngày để nhận ₫500.000–₫1.000.000 vào APXBank, tăng cấp và mở khóa dần tính năng. Mỗi ca có ít nhất 15 đơn; từ cấp sự nghiệp 5 và sau 8 ca làm, người chơi đủ điều kiện khởi nghiệp khi có ít nhất ₫15 triệu tiền mặt để chọn gói tinh gọn. Nếu lương nằm trong APXBank, hãy rút về ví trước khi thành lập công ty. Các gói vốn lớn hơn vẫn có sẵn nếu người chơi muốn bắt đầu ở quy mô lớn.

Ngày game tự chuyển theo chu kỳ 15 phút đồng bộ; không có nút bỏ qua ngày.

## Cài APX như ứng dụng (PWA)

Sau khi deploy phiên bản có `manifest.webmanifest` và `service-worker.js` lên HTTPS:

- **Android / Chrome:** mở `https://kinhdoanhdothii.vercel.app/`, chạm **Cài APX** rồi xác nhận cài đặt. Nếu trình duyệt chưa hiện lời mời, mở menu Chrome và chọn **Cài đặt ứng dụng**.
- **iPhone / iPad:** mở liên kết bằng Safari, chạm **Chia sẻ → Thêm vào Màn hình chính**.
- **Máy tính / Chrome hoặc Edge:** chạm **Cài APX** hoặc chọn biểu tượng cài đặt trên thanh địa chỉ.

PWA lưu cache phần vỏ ứng dụng và các tài nguyên cốt lõi để tải nhanh/mở giao diện khi mất mạng. Đăng nhập, đồng bộ Supabase và các nội dung tải từ CDN vẫn cần kết nối mạng. Sau khi cập nhật source, cần deploy lại lên Vercel; lần đầu mở bản mới khi có mạng sẽ cập nhật cache của ứng dụng đã cài.

## Các khu vực

- **Nhân vật:** hồ sơ, kỹ năng, tài sản cá nhân và thành tựu.
- **Sự nghiệp:** chỉ giữ một nghề chính; ứng tuyển công ty NPC, chọn hợp đồng 3/5/7/30 ngày game rồi ký trước khi làm. Mỗi ca vẫn dùng mini-game bán hàng, kho hoặc bếp, ít nhất 15 đơn; kết quả ảnh hưởng XP, hiệu suất, uy tín và cơ hội thăng tiến. Hợp đồng hỗ trợ gia hạn, nghỉ sớm có bồi thường được giới hạn, và các vị trí cao hơn mở thêm thử thách quản lý.
- **Luật sư:** vào **Sự nghiệp → Hồ sơ Luật sư**, nhận việc Luật sư trong **Tìm việc**, rồi tiếp nhận vụ án. Hồ sơ gồm **Tranh chấp hợp đồng mua bán nhà An Phú**, **Nhân viên bị sa thải sau khi tố cáo sai phạm**, **Tranh chấp chuyển nhượng phần vốn góp và quyền biểu quyết**, **Tranh chấp hợp đồng cung cấp thiết bị cho chuỗi cửa hàng**, **Vụ tai nạn tại tầng hầm chung cư An Bình**, **Vụ hợp đồng 3,2 tỷ và chữ ký bị giả** (vụ 007 và bản hồ sơ địa phương vụ 009), **Kho hàng 1,8 tỷ và lô hàng “biến mất”**, **Chiếc xe trong đêm**, **Sổ sách hai hệ thống**, **Đế Chế 680 Tỷ** và **Người Không Tồn Tại**. Vụ án 007 và 009 điều tra email, hợp đồng, metadata, khoản thanh toán 500 triệu và quyền sử dụng chữ ký; vụ án 008 điều tra số lượng hàng giao, dữ liệu kho, camera, GPS và thẩm quyền người ký nhận. Vụ án 010 mở mini-game HTML gốc riêng; vụ án 011–013 được nhúng trực tiếp trong game. Vụ án 013 xoay quanh deepfake, dữ liệu cá nhân, dấu vết số và giới hạn suy luận từ tài khoản/thiết bị sang cá nhân. Tiến trình các vụ án tích hợp được lưu cùng save nghề nghiệp; kết quả chỉ lộ sau khi bàn giao hồ sơ. Thưởng được ghi vào APXBank; tài khoản cloud cần migration `js/supabase/migrations/202610040001_apx_lawyer_case_reward.sql`. Các hồ sơ và thư viện luật là nội dung hư cấu trong game, không phải tư vấn pháp lý.
- **Thành phố:** bản đồ, bất động sản, xây dựng và thị trường thành phố.
- **Công ty:** tổng quan, công ty, tài chính, sản phẩm và thị trường.
- **Nhân viên:** danh sách, tuyển dụng, phòng ban và đào tạo.
- **Túi đồ / Shop:** vật phẩm đang sở hữu; vé tuyển dụng dùng trong **Nhân viên → Tuyển dụng**. Xem trước lương và hiệu suất của tối đa 3 ứng viên luân phiên theo ngày game trước khi chọn; chỉ trừ vé khi xác nhận tuyển. Lương nhân viên được tính khi công ty đóng sổ ngày.
- **Đầu tư:** thị trường, danh mục và lịch sử giao dịch.
- **Cộng đồng:** người chơi, bảng xếp hạng, chat và tin nhắn. Chat tổng có bong bóng nổi trên mọi màn hình; có thể kéo bong bóng hoặc thanh tiêu đề để di chuyển.
- **Cuộc sống CEO (APX LIFE):** nhà, garage, trang trí, thành phố, mạng xã hội, bạn bè, nhật ký và cửa hàng cuộc sống.
- **APXBank:** tài khoản, nạp/rút từ ví game, chuyển tiền cho người chơi, tiết kiệm kỳ hạn, khoản vay trả theo ngày game, điểm tín dụng, thông báo và lịch sử.

## Công ty và tiền

Tiền cá nhân và tiền công ty là hai khoản riêng. Tài sản ròng cá nhân cộng ví, APXBank, tiết kiệm và tài sản cá nhân rồi trừ nợ; không tính tiền công ty. Danh mục đầu tư cloud được cộng trong mục Đầu tư vì dữ liệu vị thế được lưu riêng trên Supabase.

Trái phiếu mới mua có kỳ hạn theo ngày game: 1 ngày game tương đương 15 phút thật. Các lô trái phiếu đã mua trước khi cập nhật vẫn giữ ngày đáo hạn thực ban đầu để không thay đổi hợp đồng đang nắm giữ. Tài khoản cloud cần chạy migration `js/supabase/migrations/202610040003_apx_investment_game_time_maturity.sql`.

Trong trang công ty, người chơi có thể quản lý chi nhánh, sản phẩm, kho, nhân viên và chiến dịch. **Một ngày game dài 15 phút**; doanh thu/lợi nhuận ngày trong sổ công ty chỉ phản ánh các giao dịch của chu kỳ game đó. Thống kê thị trường “hôm nay / 7 ngày / 30 ngày” dùng thời gian thật theo ngày lịch, nên không so trực tiếp với một ngày game. Khi đóng ngày trên tài khoản cloud, game đồng bộ doanh số từ Supabase trước; nếu không kết nối được, ngày chưa được khóa sổ và game sẽ thử lại để tránh ghi thiếu doanh thu. Doanh thu bán hàng không âm; nếu chi phí vượt doanh thu, chỉ **lợi nhuận** chuyển âm và được hiển thị là khoản lỗ. Giá sản phẩm bị giới hạn theo ngành:

- Lifestyle: tối đa ₫500.000.
- Technology: tối đa ₫1.000.000.
- Bất động sản: tối đa ₫1.000.000.

Công ty đầu tiên có gói khởi nghiệp tinh gọn: ₫1 triệu phí thành lập và ₫14 triệu vốn công ty, với tồn kho khởi điểm nhỏ hơn. Doanh thu dự báo trong giao diện là mô phỏng, không phải tiền mặt được tạo ra; tiền công ty chỉ tăng từ giao dịch marketplace hoặc dự án đã được ghi nhận.

Giá vượt trần không được niêm yết lên marketplace và NPC sẽ không mua. Sản phẩm cũ vượt trần cần được hạ giá trong **Công ty → Sản phẩm** để bán lại trên thị trường.

Marketplace bán hàng dựa trên tồn kho công ty. NPC là khách hệ thống, không phải tài khoản người chơi. Sau migration `202610040004`, mỗi khách có hồ sơ tính cách ổn định (nhạy cảm giá, ưu tiên chất lượng, độ trung thành thương hiệu), ghi nhớ lần mua trước, có nhịp quay lại và chọn lượng mua theo loại khách cùng ngân sách. Họ cân nhắc giá, chất lượng, uy tín, hàng sẵn có và lịch sử mua thay vì chọn listing ngẫu nhiên; lượt mua vẫn trừ kho và cộng doanh thu qua giao dịch Supabase thật. Giao dịch marketplace cần đăng nhập và các migration marketplace đã được cài trong Supabase.

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

### Bổ sung hồ sơ vụ án

Mỗi hồ sơ đặt trong `js/cases/case_NNN.js` và đăng ký vào `window.APX_LAW_CASES`. Để triển khai một hồ sơ mới, thêm script đó sau `career.js` trong `index.html` và thêm đường dẫn vào `APP_SHELL` trong `service-worker.js`; không cần sửa engine hoặc schema Supabase. Mỗi tình huống phải có đúng bốn lựa chọn, còn khóa đáp án, điểm và kết cục chỉ được dùng khi kết thúc hồ sơ.

Nếu một giao dịch báo lỗi, đừng bấm liên tục. Kiểm tra số dư, thử tải lại trang và chỉ gửi thông tin lỗi cho quản trị viên; không chia sẻ mật khẩu hay khóa bí mật.
