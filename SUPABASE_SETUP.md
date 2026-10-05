# Nối APX Business World với Supabase

Hiện Supabase chưa được cấu hình trong trình duyệt; game tiếp tục lưu cục bộ. Sau khi đưa thư mục lên GitHub, làm theo thứ tự sau.

1. Trong Supabase Dashboard, kiểm tra Table Editor, SQL Editor, triggers và RLS hiện có. Migration chỉ tạo bảng `apx_*`, tự dừng nếu đối tượng đích đã tồn tại và không sửa/xóa các bảng khác. Nếu project đã có schema hồ sơ/save, cần kiểm tra và điều chỉnh trước khi chạy.
2. Chạy `supabase/migrations/202609270001_apx_player_platform.sql` trong SQL Editor.
3. Chạy tiếp `supabase/migrations/202609270002_apx_avatar_storage.sql` để tạo bucket avatar và giới hạn mỗi người chỉ tải/thay ảnh trong thư mục theo user ID của mình. Bucket công khai để ảnh hồ sơ xem được bằng URL; chỉ ảnh trong bucket này được công khai.
4. Game không yêu cầu nhập mã OTP. Nếu **Confirm email** đang bật trong **Authentication → Sign In / Providers → Email**, người chơi cần mở liên kết xác nhận do Supabase gửi rồi đăng nhập. Để đăng ký và đăng nhập ngay mà không cần xác nhận email, tắt **Confirm email** trong Supabase. Việc tắt xác nhận email làm giảm khả năng kiểm tra quyền sở hữu địa chỉ email.

5. Project URL và public anon/publishable key nằm trong `js/supabase-config.js`. Không dùng service_role trong ứng dụng trình duyệt.
6. Thử đăng ký theo cài đặt xác nhận email, tải ảnh đại diện, khôi phục save trên thiết bị khác và gửi báo cáo.

Để BXH cộng đồng hiển thị đầy đủ danh sách và trạng thái online, chạy migration `js/supabase/migrations/202610050001_apx_community_full_leaderboard_presence.sql` trong SQL Editor. Migration này mở rộng giới hạn RPC lên 1.000 người chơi và thêm heartbeat online an toàn cho tài khoản đã đăng nhập. Sau khi chạy migration, tải lại game để cập nhật danh sách.

Mỗi tài khoản được tạo một hồ sơ cùng UUID nhân vật. Tiến trình game được lưu nguyên trạng trong JSONB. Giao diện Admin đã được gỡ khỏi game; các bảng quyền và audit cũ được giữ lại, không tự xóa dữ liệu. Nếu `apx-admin` đã deploy trước đó, hãy xóa Edge Function trong Supabase Dashboard hoặc deploy lại source đã vô hiệu hóa; source trong GitHub không tự thay đổi function đang chạy.

Các migration này dành cho project APX đã kiểm tra. Ảnh đại diện tải lên giới hạn PNG/JPG/WEBP tối đa 5 MB; URL public được lưu trong hồ sơ người chơi.

## APXBank

APXBank lưu số dư ngân hàng, tiết kiệm, khoản vay, điểm tín dụng, giao dịch và thông báo trong cùng `game_state` của tài khoản hiện có; không tạo tài khoản đăng nhập hoặc bảng save mới. Ví cá nhân vẫn tách biệt: nạp/rút chuyển tiền giữa ví và APXBank, còn lương ca làm được chuyển thẳng vào APXBank. Tài sản lấy từ hồ sơ nhân vật; nợ vay cập nhật `character.debt`. Tiết kiệm đáo hạn và kỳ trả nợ dùng hook chốt ngày hiện tại của game (15 phút một ngày), không có bộ đếm riêng.

Để bật chuyển tiền APXBank giữa hai người chơi, chạy `supabase/migrations/202610020001_apx_bank_transfers.sql` trong SQL Editor của đúng Supabase project sau migration nền `202609270001_apx_player_platform.sql`. RPC xác thực người gửi, tìm người nhận bằng UUID nhân vật, khóa hai bản save, kiểm tra số dư và ghi hai phía cùng lịch sử/thông báo trong một transaction. Không cấp quyền client ghi trực tiếp bảng idempotency. Nếu migration chưa chạy, các chức năng tài khoản, nạp/rút, tiết kiệm và vay vẫn lưu trong game save; chuyển liên người chơi sẽ báo migration chưa sẵn sàng.

Đã áp dụng `supabase/migrations/202610020002_apx_game_save_wallet_debits.sql` lên project `kinhdoanhdothi`. Hàm lưu save hiện cho phép khoản trừ tiền đi qua ví/ledger máy chủ, nhưng không chấp nhận số dư tăng do client gửi; tiền tăng phải đến từ giao dịch máy chủ đã xác thực.

Để nhận lương trực tiếp vào APXBank, chạy `js/supabase/migrations/202610030001_apx_bank_career_salary.sql` trong SQL Editor của cùng Supabase project. Hàm xác nhận kết quả ca đã lưu, giới hạn mức trả, ghi số dư/lịch sử/thông báo nguyên tử và dùng ID ca để chống cộng lương trùng khi thử lại. Nếu chưa chạy migration, lương sẽ hiện là đang chờ và có nút thử lại trong kết quả ca; không được báo đã chuyển thành công.

Với tài khoản cloud, cổ tức công ty và đổi vé doanh thu thành tiền cá nhân đang bị giữ/chặn vì kết quả quyết toán hiện do client tính, còn RPC lưu save chủ động từ chối khoản tăng ví không được máy chủ xác thực. Không nới guard này hoặc tự ghi tiền vào save; chỉ bật chi trả sau khi có RPC settlement phía máy chủ xác minh nguồn tiền, số tiền và tính idempotent. Tài khoản lưu cục bộ vẫn dùng luồng hiện có.

Để đồng bộ EXP nhiệm vụ tự động trên tài khoản đăng nhập, chạy `js/supabase/migrations/202610030002_apx_quest_claim_reward.sql`, sau đó chạy `js/supabase/migrations/202610040002_apx_quest_auto_exp.sql`. Migration mới giữ RPC idempotent, kiểm tra số ca và lương đã nhận trước khi trả thưởng, chỉ cộng career EXP và character EXP (không tạo tiền quest). Sau khi ca đã được thanh toán vào APXBank, quest hoàn thành và EXP được cộng tự động. Nếu chưa chạy migration mới, tài khoản cloud sẽ không nhận được thưởng; save cục bộ vẫn tự cộng EXP.

Để nhận thưởng vụ án Luật sư vào APXBank trên tài khoản đăng nhập, chạy `js/supabase/migrations/202610040001_apx_lawyer_case_reward.sql`. RPC kiểm tra vụ án đã hoàn thành và số tiền khớp với kết quả đã lưu, ghi một giao dịch có ID ổn định theo vụ án để retry không cộng trùng. Nếu migration chưa chạy, kết quả vụ án vẫn được lưu nhưng tiền thưởng sẽ ở trạng thái chờ; sau khi áp dụng migration, dùng **Thử nhận thưởng lại** trên kết quả vụ án. Tiến trình cục bộ không cần migration.

Kiểm tra sau khi migration: đăng nhập hai tài khoản A/B, nạp tiền ở A, chuyển tới `character_id` của B, kiểm tra số dư/lịch sử/thông báo của cả hai rồi tải lại cả hai tài khoản. Gửi lại cùng yêu cầu sau lỗi mạng không được trừ tiền lần hai. Thử chuyển thiếu số dư, UUID không tồn tại và chuyển cho chính mình; tất cả phải bị từ chối. Những kiểm tra này cần project Supabase thật và chưa được thực hiện chỉ bằng kiểm tra cục bộ.

## Hệ thống đầu tư APX

Migration supabase/migrations/202609280001_apx_investments.sql kiểm tra trước các tên bảng/hàm đầu tư để tránh đè dữ liệu. Database đã được kiểm tra: các bảng hồ sơ, bản lưu, báo cáo và Admin APX đang có; chưa có bảng đầu tư nào trùng tên.

Chạy migration trong SQL Editor của project kinhdoanhdothi để tạo:
- apx_investment_assets: mã cổ phiếu, trái phiếu và quỹ mẫu; giá mô phỏng.
- apx_investment_positions: từng lô tài sản theo user_id.
- apx_investment_transactions: lịch sử mua, bán và đáo hạn theo user_id.

Chức năng giao dịch chạy qua RPC PostgreSQL, khóa bản lưu game của đúng tài khoản, kiểm tra số dư và cập nhật tiền cùng danh mục trong một transaction. Không cấp quyền sửa danh mục/lịch sử trực tiếp cho client. Tiền trái phiếu được máy chủ tự trả gốc và lãi khi người chơi mở mục Đầu tư hoặc giao dịch tiếp theo sau ngày đáo hạn. Giá cổ phiếu/quỹ mô phỏng được hệ thống làm mới theo các mốc 5 phút, kể cả khi không có người chơi đang mở thị trường.

Sau migration đầu tư nền, chạy `js/supabase/migrations/202610040003_apx_investment_game_time_maturity.sql`. Trái phiếu mua sau migration này đáo hạn theo ngày game (15 phút thật/ngày game); các lô đang nắm giữ giữ nguyên lịch đáo hạn thời gian thực ban đầu. Ứng dụng kiểm tra phiên bản migration và không cho giao dịch nếu migration chưa sẵn sàng.

Đăng nhập bằng tài khoản đã có bản lưu cloud, mở Đầu tư → Thị trường, mua thử một tài sản, kiểm tra số dư/danh mục/lịch sử, sau đó bán lại một phần. Với tài khoản khác, danh mục và lịch sử phải rỗng riêng. Mua vượt số dư hoặc bán quá số lượng sở hữu phải bị từ chối.

## Giá cổ phiếu mỗi 5 phút

Với database đã có hệ thống đầu tư, chạy migration `supabase/migrations/202609280006_apx_market_refresh_five_minutes.sql` trong SQL Editor. Migration cài lịch chạy chung `pg_cron` mỗi 5 phút và đồng bộ việc cập nhật giá theo mốc thời gian hệ thống.

## Thị trường, NPC và giao dịch

Chạy migration `supabase/migrations/202609280007_apx_marketplace.sql`. Migration tạo NPC hệ thống, listing sản phẩm, giao dịch Player/NPC và job xử lý nhu cầu NPC mỗi 5 phút. NPC không tạo tài khoản đăng nhập và không xuất hiện trong cộng đồng hoặc bảng xếp hạng.

Tiếp theo chạy `supabase/migrations/202609280008_apx_market_offline_listings.sql` để máy chủ cập nhật listing từ kho hàng đã lưu kể cả khi người chơi offline. Có thể chạy `supabase/migrations/202609280009_apx_market_weighted_npc_selection.sql` để áp dụng cách chọn người bán có trọng số mới. Nếu chỉ cần NPC mua offline, migration `008` là cần thiết; migration `009` chỉ thay đổi cách chọn listing.

Để tăng nhu cầu NPC, chạy `supabase/migrations/202609290002_apx_expand_npc_customers.sql` sau migration marketplace `007`. Migration thêm các khách còn thiếu để tổng số đạt 2.400 và nâng tối đa số lượt mua thử từ 24 lên 80 mỗi 5 phút; chạy lại an toàn, không tạo trùng khách.

Để tăng lên 8.000 NPC và nâng trần xử lý lên 800 khách mỗi 5 phút, chạy tiếp `supabase/migrations/202609290006_apx_expand_npc_batch_800.sql` sau các migration marketplace `007` và `009`. Cron job cũ cùng tên được thay thế để không chạy trùng. Số đơn thực tế vẫn phụ thuộc listing hợp lệ, giá trong ngân sách NPC và hàng còn tồn.

Nếu đã tăng số NPC nhưng một số ngành vẫn không có khách, chạy `supabase/migrations/202609290008_apx_balance_npc_budgets.sql`. Migration sửa ngân sách NPC theo ngành cho phép họ mua sản phẩm đang có, không tạo lại NPC hoặc thay đổi số lượng.

Migration `202609290010_apx_npc_unlimited_budget_demand.sql` là cấu hình cũ, đặt ngân sách NPC gần như vô hạn. Không dùng cấu hình này cho cân bằng kinh tế hiện tại.

Nếu project đã chạy `010`, chạy `supabase/migrations/202609290018_apx_market_product_price_caps.sql` sau `007`, `008`, `009` và `010`. Migration khôi phục ngân sách NPC hữu hạn; đặt trần mỗi sản phẩm: lifestyle ₫500.000, technology ₫1.000.000, bất động sản ₫1.000.000; áp dụng cho listing online, listing offline và cron mua NPC. Listing cũ vượt trần được ngừng hoạt động, không sửa giá hay xóa save. Các sản phẩm cũ vượt trần cần chủ công ty hạ giá trong mục Sản phẩm để được niêm yết lại.

Sau khi đã áp dụng marketplace và giới hạn giá (`202609280007`, `202609280008`, `202609280009` và `202609290018`), chạy `js/supabase/migrations/202610040004_apx_market_npc_customer_brains.sql`. Migration thêm các đặc tính mua sắm ổn định theo từng NPC và bộ nhớ công ty/sản phẩm đã mua; người mua chọn hàng theo mức nhạy giá, ưu tiên chất lượng, uy tín, lượng tồn, độ trung thành và lịch sử mua. Khách doanh nghiệp có thể mua nhiều đơn vị trong ngân sách; nhóm khách có thời gian quay lại khác nhau. Tiền, kho và giao dịch vẫn cập nhật nguyên tử qua RPC hiện có; migration không cộng tiền giả hoặc sửa save cũ. Migration thay cron NPC hiện tại, không cần cập nhật frontend. **Chạy file SQL này trong SQL Editor của đúng Supabase project sau 018.**

QA sau khi chạy: kiểm tra `cron.job` chỉ còn một job `apx-market-npc-batch-every-five-minutes`; quan sát giao dịch NPC có các đơn nhiều hơn một sản phẩm nhưng không vượt tồn kho/ngân sách; xác nhận cùng NPC không mua lại ngay trong thời gian chờ; kiểm tra số dư công ty, tồn kho và doanh thu thị trường thay đổi khớp giao dịch. Các bước này cần Supabase thật; chưa được thực hiện trong phiên này.

Để phát hành mã tiền mặt `APX10TY2026` nhận 10 tỷ cho tối đa 100 tài khoản, trước tiên chạy migration `supabase/migrations/202609290001_apx_cash_giftcodes.sql`, sau đó chạy `supabase/migrations/202609290003_apx_issue_cash_giftcode.sql`. Nếu mã đã cấp vé nhầm, hãy để người chơi thoát game, chạy `supabase/migrations/202609290004_apx_fix_cash_giftcode_redemption.sql` để sửa RPC, rồi chạy `supabase/migrations/202609290005_apx_reward_mailbox.sql` để gửi thư bù 10 tỷ cho tài khoản bị ảnh hưởng. Người chơi tự nhận thư trong **Cộng đồng → Tin nhắn → Thư quà tặng**. Những tài khoản đã được migration 004 cộng tiền trực tiếp sẽ không bị gửi thư trùng. Mỗi tài khoản chỉ đổi mã này một lần.

## Vé tuyển dụng và mã quà tặng

Sau khi cập nhật các file game, chạy migration `supabase/migrations/202609280002_apx_vouchers.sql` trong SQL Editor của cùng project. Migration thêm `apx_redeem_codes`, `apx_redeem_claims` và RPC `apx_redeem_voucher`; code được lưu dạng SHA-256, người chơi không có quyền đọc bảng code. RPC kiểm tra đăng nhập, khóa game save, ghi nhận lượt đổi và cộng vé trong một transaction.

Sau các migration voucher hiện có, chạy `supabase/migrations/202609280005_apx_recruitment_tickets.sql` trong SQL Editor. Migration chuyển phần thưởng sang vật phẩm `recruitment-ticket`; mã chung `APXVE2026` cấp 10 vé và mỗi tài khoản chỉ đổi một lần. 100 mã riêng đã lưu trong database mỗi mã cấp 1 vé, chỉ tài khoản đầu tiên đổi thành công nhận được vé. Danh sách mã riêng nằm ngoài thư mục game ở `C:\Users\DELL\Documents\Codex\APX-voucher-codes-private.txt`; không đưa file này lên GitHub hoặc gửi vào nơi công khai.

Trong game, người chơi có thể mua vé với giá 50 triệu đồng hoặc đổi mã quà tặng. Tại **Nhân viên → Tuyển dụng**, người chơi xem trước lương và năng lực của tối đa 3 ứng viên luân phiên theo ngày game; 1 vé chỉ bị trừ khi xác nhận tuyển thành công. Thay đổi này chỉ nằm ở frontend, không cần migration mới; migration vẫn giữ nguyên giới hạn đổi và lịch sử nhận mã của từng tài khoản.

## Cộng đồng, bảng xếp hạng và tên công ty riêng

Sau khi cập nhật mã game, chạy `supabase/migrations/202609280003_apx_community.sql` trong SQL Editor của cùng project. Migration chỉ thêm RPC `apx_community_players`, đọc `apx_player_profiles` và `apx_game_saves` hiện có; không tạo lại hoặc chỉnh sửa các bảng người chơi.

Mục **Cộng đồng** có danh sách người chơi khác và hai bảng xếp hạng: tiền cá nhân, và tiền mặt hợp nhất của tập đoàn/các công ty. Cột lịch sử `last_seen_at` của schema cũ được giữ nguyên để tương thích, nhưng game mới không cập nhật, đọc hoặc hiển thị trạng thái này. Người chơi đổi tên công ty tại trang quản lý công ty; tên được lưu trong save riêng của tài khoản.

Các bảng xếp hạng công khai tên hiển thị, ảnh đại diện, tên công ty và số dư tiền của người chơi để mọi tài khoản trong server có thể so sánh. RPC không trả về email, UUID tài khoản hoặc save đầy đủ. Sau khi chạy migration, thử đổi tên công ty, đăng xuất/đăng nhập lại, rồi kiểm tra tên đó trong danh sách Cộng đồng và bảng xếp hạng.

## Khởi nghiệp, tuyển dụng và chat

Người chơi mới bắt đầu với 0 đồng, không nhận sẵn công ty, chi nhánh hoặc nhân viên và phải đăng nhập để vào game. Trước tiên, người chơi ứng tuyển vào một công ty NPC, chọn hợp đồng 3/5/7/30 ngày game và phải ký mới được làm; chỉ có một nghề chính. Ca sáng/chiều/toàn thời gian có thời lượng 6/8/14 giờ game; lương, KPI và EXP được tính theo thời lượng thực tế, tối đa một ca mỗi ngày. Kết quả mini-game ảnh hưởng hiệu suất, uy tín và thưởng KPI. Hợp đồng hết hạn được giữ lại để chọn gia hạn hoặc kết thúc; nghỉ trước hạn cần bồi thường theo thời gian còn lại và giới hạn tối đa ba ngày lương. Thăng tiến yêu cầu cả XP, số ca, hiệu suất, uy tín và thời gian làm; vị trí cấp cao thêm thử thách nghề nghiệp/quản lý. Lên cấp mở dần tính năng; từ cấp sự nghiệp 5, sau 8 ca làm và khi có đủ ít nhất 2 tỷ đồng, người chơi có thể tự thành lập công ty. Gói tiêu chuẩn công ty đầu tiên tổng cộng 2 tỷ đồng. Sau đó người chơi dùng vé tuyển dụng để chiêu mộ NPC từ danh sách hiện có. Sức chứa nhân viên theo cấp công ty là C1: 5, C2: 10, C3: 20, C4: 30, C5: 50. Các bản lưu cũ được giữ nguyên; không chạy lệnh reset save.

Sau khi `202609280003_apx_community.sql` đã được áp dụng, chạy `supabase/migrations/202609280004_apx_chat_profiles_and_no_presence.sql` trong SQL Editor. Migration thêm bảng chat tổng/tin nhắn riêng, bật RLS và chỉ cho client truy cập qua RPC có kiểm tra đăng nhập. Nó thay RPC cộng đồng để bỏ trường hiện diện, không xóa bảng hồ sơ hay bản lưu hiện có.

## APX LIFE — Giai đoạn 1: Nhà ở và garage

Chạy `supabase/migrations/202609290011_apx_life_housing.sql` sau migration hồ sơ `202609270001`. Migration này tạo nền catalog nhà, sở hữu nhà và RPC mua/đặt nơi ở chính.

Sau đó chạy `supabase/migrations/202609290012_apx_life_wallet_vehicles.sql`. Migration cộng dồn này backfill ví cá nhân từ `game_state.cash`, thêm sổ cái, đồng bộ các RPC kinh tế cũ qua trigger, thêm 3 mẫu nhà để catalog có 8 loại và tạo 12 mẫu xe cùng garage/RPC mua, chọn xe, bán xe. Phí bán xe là `floor(giá mua × resale_rate)`; sức chứa lấy từ nhà chính, mặc định một chỗ nếu chưa chọn nhà. Dữ liệu save và hồ sơ cũ không bị xóa hoặc reset.

**Triển khai đồng bộ:** frontend mới gọi `apx_save_game_state`; migration thu hồi quyền INSERT/UPDATE trực tiếp lên `apx_game_saves`. Hãy chuẩn bị bản frontend mới và chạy migration trong cùng cửa sổ triển khai, sau đó publish ngay. Nếu migration chạy trước mà frontend cũ còn hoạt động, thao tác lưu game cũ sẽ bị từ chối; frontend mới nếu lên trước migration cũng chưa gọi được RPC này. Thử đăng nhập và lưu tiến trình ngay sau khi hoàn tất.

Ví cá nhân được backfill từ cash hiện có; ledger chỉ ghi các thay đổi do server RPC tác động lên save. Quỹ công ty/treasury tiếp tục là dữ liệu riêng, không được tính vào số dư APX LIFE. Không cấp `service_role` cho trình duyệt. Các bảng wallet và garage bật RLS, không cấp quyền đọc/ghi trực tiếp; thao tác chạy qua RPC có `auth.uid()`, kiểm tra quyền và khóa `search_path`.

Ảnh nhà, nội thất và 12 xe hiện có là SVG do dự án tạo, không phải ảnh WebP/AVIF cuối. Manifest `assets/apx-life/asset-manifest.json` ghi alt, kích thước, nguồn, giấy phép, fallback và upload slot. Để thay ảnh nhà/xe, chỉ cần chép WebP vào đúng tên trong `assets/apx-life/UPLOAD_IMAGES.md`; game ưu tiên ảnh mới rồi fallback SVG. Không đổi ID tài sản và không cần SQL cho thao tác thay ảnh tĩnh.

**QA cần chạy sau khi migration được áp dụng:** dùng hai tài khoản riêng để xác nhận ví riêng; mua xe đủ/thiếu tiền; gửi lặp cùng idempotency key; bán rồi xác nhận xe không còn trong garage; thử đổi xe và reload; thử sửa số dư/save qua REST trực tiếp (phải bị từ chối); đăng xuất/đăng nhập và kiểm tra save. Chưa xác nhận các kết quả này nếu chưa chạy trên Supabase thật.

### Nội thất và bố trí phòng

Sau migration `202609290012`, chạy `supabase/migrations/202609290013_apx_life_interiors.sql`. Migration tạo catalog 13 món, kho đồ sở hữu và room layout phiên bản 1. RPC chỉ nhận danh sách vật dụng/slot/tọa độ/hướng xoay có schema cố định; kiểm tra nhà và vật dụng thuộc đúng người chơi, giới hạn sức chứa, slot hợp lệ và không đặt cùng một món trong hai nhà. Giao diện là lưới 2D có thể thao tác bằng chạm; đây chưa phải kéo-thả tự do/isometric.

Icon 13 món hiện là SVG APX tự vẽ. Sau migration, mua một món, đặt vào slot, lưu, tải lại và thử gọi RPC với owned item của tài khoản khác hoặc slot không hợp lệ; các lời gọi sai phải bị từ chối.

### Thành phố APX LIFE

Chạy `supabase/migrations/202609290014_apx_life_city.sql` sau migration `012`. Migration thêm sáu địa điểm, 18 hoạt động theo catalog, log theo bucket ngày game 15 phút và ba sự kiện server mẫu. Các hoạt động cùng sự kiện trừ ví cá nhân bằng RPC, xác nhận số dư/giới hạn/idempotency trước khi ghi; sự kiện có thời gian bắt đầu/kết thúc và khóa sức chứa. Giá trong seed là giá mô phỏng, không phải tiền thật.

Sau đó chạy `supabase/migrations/202609290015_apx_life_interior_assets.sql` để chuyển catalog tám nhà sang tám ảnh nội thất tương ứng. Đây là update đường dẫn, không thay ID, giá hay tài sản sở hữu.

Tiếp theo chạy `supabase/migrations/202609290017_apx_life_property_finance.sql`. RPC `apx_life_housing_home_v2` thu phí duy trì theo ngày game 15 phút với unique key cho từng nhà/ngày. Nếu số dư không đủ, nhà được giữ nguyên và khoản phí ghi thành nợ; hệ thống thu cả nợ khi ví đủ. Nhà đang nợ phí không thể bán. Bán nhà dùng `floor(purchase_price * resale_rate)` từ catalog; người chơi xác nhận trước, đồ nội thất đã đặt được gỡ khỏi layout nhưng vẫn nằm trong kho sở hữu.

### Social và bạn bè APX LIFE

Chạy `supabase/migrations/202609290016_apx_life_social.sql` sau `014` và `015`. Migration thêm cài đặt hồ sơ APX LIFE riêng (không tạo lại hồ sơ đăng nhập), feed 20 bài/trang, like/comment/follow, lời mời/bạn bè, block, thông báo và báo cáo vào bảng report APX hiện có. Bài viết và bình luận giới hạn ký tự/tần suất; ảnh chỉ chọn asset location hoặc nhà/xe đang chia sẻ. Không có upload ảnh tự do.

Các bảng social bật RLS và thu hồi truy cập trực tiếp; client chỉ dùng RPC `SECURITY DEFINER` kiểm tra `auth.uid()`. Feed loại nội dung riêng tư và chặn tương tác hai chiều sau block. Notification được subscribe qua Supabase Realtime với filter `owner_id` và policy SELECT chỉ đọc hàng chính chủ; migration thêm bảng vào publication `supabase_realtime` nếu publication đã tồn tại. Client deduplicate event và làm mới feed khi reconnect. Nếu project không có publication/Realtime được cấu hình, RPC tải lại vẫn là fallback.

### QA triển khai thực tế

Chạy migrations theo thứ tự `011 → 012 → 013 → 014 → 015 → 016 → 017` trong SQL Editor của đúng Supabase project sau khi kiểm tra schema hiện có. Không chạy lại migrations cũ đã apply một cách thủ công ngoài quy trình migration của project. Sau đó publish file game lên GitHub Pages; các asset đều dùng path tương đối `assets/...`, phù hợp subpath `/kinhdoanhdothii/`.

Với hai tài khoản A/B, kiểm tra: đăng nhập không tạo tài khoản phụ; số dư APX LIFE chỉ riêng theo tài khoản; A mua/bán nhà và xe, B không nhìn thấy sở hữu riêng; mua thiếu tiền và retry không tạo tài sản/charge trùng; đổi xe; mua đồ, lưu phòng, reload; nợ phí không xóa nhà và phí không thu hai lần/ngày; hoạt động/sự kiện và giới hạn theo game day; B xem được profile/bài công khai, like/comment/follow; lời mời nhận/chấp nhận/từ chối/hủy; block ngăn feed và tương tác; hồ sơ riêng tư không trả thông tin nhạy cảm; đăng xuất/đăng nhập lại giữ dữ liệu. Thử thêm truy cập REST trực tiếp vào bảng wallet/owned/social để xác nhận bị từ chối bởi quyền/RLS.

Các bước QA trên chưa được chạy với Supabase thật trong phiên này. Workspace không có `psql`, Supabase CLI, Docker hoặc Node.js và không có quyền Dashboard được cung cấp; vì vậy migration chỉ qua kiểm tra tĩnh của editor, chưa được thực thi. Không có push/deploy hoặc commit tự động.

Để hồ sơ công khai hiển thị thêm cấp độ, skin, thành tựu, thống kê và thông tin công ty, chạy `supabase/migrations/202609290007_apx_public_player_profile_details.sql` sau các migration hồ sơ/cộng đồng, gồm migration chat/profile `202609280004`. Migration chỉ thêm RPC đọc dữ liệu; không tạo bảng mới, không trả email hoặc `auth.users.user_id`, và không sửa save. Trạng thái online không hiển thị vì hệ thống hiện không thu thập presence.

Chat chỉ tải 50 tin gần nhất khi mở trang hoặc bấm **Làm mới**; không chạy polling/realtime. Chat riêng đọc lịch sử theo từng người nhận và lưu ở Supabase. Kiểm tra sau khi migration và deploy: người chơi A nhắn Chat tổng; A nhắn riêng người chơi B; đăng xuất/đăng nhập lại và mở lại cuộc trò chuyện. Dùng hai tài khoản để xác nhận người khác không thể đọc cuộc trò chuyện riêng không thuộc về họ.

Muốn thử khởi đầu mới, dùng tài khoản mới hoặc tạo ván mới. Không xóa bảng `apx_game_saves` và không đặt lại save của tài khoản cũ.
