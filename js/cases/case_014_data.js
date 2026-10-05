(function (global) {
  "use strict";

  const EVIDENCE_GROUPS = [
    {
      category: "Legal / procedural",
      start: 14001,
      rows: [
        "Lệnh tiếp nhận tin báo|03/08 23:36|Trực ban điều tra|Tin báo nêu một người nằm bất động phía đông cầu; người báo không biết danh tính người gây thương tích.|Thời điểm cơ quan tiếp nhận tin.|Người báo không chứng kiến vụ đánh.|Bản gốc, khá cao|Tóm tắt ban đầu ghi nhầm lối tây, cần so với ghi âm.",
        "Phiếu phân công hiện trường|03/08 23:44|Đội trực|Hai tổ được giao bảo vệ đầu cầu và lối xuống; sơ đồ phân công không ghi vùng đệm ở lan can.|Kế hoạch bảo vệ hiện trường.|Không chứng minh việc phong tỏa thực tế đầy đủ.|Khá cao|Ảnh đến sau cho thấy một lối đi vẫn mở.",
        "Biên bản khám nghiệm sơ bộ|04/08 00:12|Điều tra viên hiện trường|Ghi vị trí Vinh nằm nghiêng gần bậc đá, một vệt kéo ngắn và vũng máu nhỏ.|Tình trạng hiện trường khi tổ đến.|Không xác định ai tạo dấu hay thứ tự va chạm.|Trung bình|Sơ đồ đo sau đặt vệt máu lệch khoảng nửa mét.",
        "Sơ đồ đo đạc bổ sung|04/08 02:20|Kỹ thuật hình sự|Lấy mốc lan can tây làm chuẩn nhưng biên bản không nói đã hiệu chỉnh độ dốc.|Quan hệ vị trí tương đối của vật được đánh dấu.|Không tái dựng chính xác chuyển động nạn nhân.|Trung bình|Khác vị trí ghi trên sơ đồ sơ bộ.",
        "Lệnh khám xét phòng trọ Khang|04/08 06:05|Thẩm phán trực|Cho phép tìm quần áo và giày liên quan trong khoảng thời gian xác định.|Phạm vi khám xét hợp lệ theo hồ sơ giả định.|Không xác nhận vật tìm thấy thuộc về đêm xảy ra án.|Cao về phạm vi|Danh mục thi hành có thêm túi vải ngoài mô tả.",
        "Biên bản thi hành lệnh|04/08 07:11|Tổ khám xét|Thu một đôi giày đế cao su, áo khoác xanh đậm và điện thoại; có ảnh niêm phong.|Các vật được tổ ghi đã thu.|Không chứng minh Khang mặc/đi chúng gần cầu.|Trung bình|Một ảnh chụp niêm phong không thấy số tem.",
        "Danh mục vật chứng|04/08 08:02|Thư ký điều tra|Ghi mã bao bì, người nhận và chữ ký; một dòng sửa bằng mực khác.|Lịch sử ghi nhận vật chứng.|Không tự xác nhận nội dung túi trước lúc niêm phong.|Trung bình|Giờ nhận túi ADN khác sổ giao ca.",
        "Biên bản niêm phong mẫu áo|04/08 00:54|Kỹ thuật viên|Áo Vinh được gấp trên khay thép; ảnh không thấy tấm lót dùng một lần.|Cách đóng gói được ghi lại.|Không xác định áo có chạm vật nào trước đó.|Thấp-trung bình|Phiếu lau khay lập sau khi áo đã chuyển.",
        "Phiếu bàn giao ca đêm|04/08 01:20|Cán bộ bảo quản|Ghi hai túi mẫu chuyển cùng lúc đến bàn tiếp nhận.|Việc chuyển giao có chữ ký.|Không ghi khoảng cách giữa các túi hay bề mặt chung.|Trung bình|Mã túi lan can và áo viết sát nhau, một chữ ký thiếu.",
        "Đơn yêu cầu trích xuất thuê bao|04/08 09:18|Điều tra viên|Yêu cầu dữ liệu hai thuê bao trong khung giờ 20:00–00:30.|Phạm vi yêu cầu.|Không chứng minh người dùng thiết bị.|Cao|Yêu cầu bản đầu không gồm metadata đồng bộ giờ.",
        "Văn bản trả lời nhà mạng|05/08 14:07|Nhà mạng hư cấu|Gửi bản ghi kết nối, sector và thời gian mạng; lưu ý vị trí sector thay đổi theo tải.|Thiết bị kết nối mạng vào các thời điểm ghi.|Không định vị chính xác người mang máy.|Cao về bản ghi|Bản tóm tắt điều tra gọi sector là tọa độ cầu.",
        "Lệnh thu giữ thiết bị|04/08 06:44|Điều tra viên|Điện thoại Khang thu khi máy ở chế độ khóa; SIM còn nguyên.|Thiết bị được thu từ phòng trọ.|Không khẳng định Khang là người giữ máy trong mọi thời điểm.|Khá cao|Không có video liên tục từ lúc phát hiện đến niêm phong.",
        "Biên bản mở khóa có mặt người chứng kiến|05/08 10:31|Kỹ thuật viên số|Ghi phương pháp sao lưu và mã băm; màn hình báo pin yếu.|Một bản sao dữ liệu được lập.|Không loại trừ dữ liệu ngoài thiết bị hoặc sai lệch đồng hồ.|Khá cao|Giờ máy lúc mở khác giờ máy được ghi ở phiếu thu.",
        "Phiếu bảo toàn dữ liệu camera|04/08 01:05|Đội kỹ thuật|Sao lưu ổ quán Mây và camera đường dẫn; tệp thứ hai bị lỗi khung.|Các tệp còn đọc được đã được giữ.|Không xác nhận đồng hồ từng máy chuẩn.|Trung bình|Biên nhận ghi thời điểm sao lưu trễ hơn log máy.",
        "Biên bản lấy mẫu sinh học Vinh|04/08 01:42|Nhân viên y tế pháp y|Lấy mẫu đối chiếu tại bệnh viện, ghi dụng cụ và người thực hiện.|Mẫu đối chiếu được lấy sau khi cấp cứu.|Không chứng minh mẫu hiện trường không bị nhiễm.|Khá cao|Nhãn phụ ghi nhầm thứ tự chữ cái.",
        "Phiếu tiếp nhận dấu vết áo|04/08 02:03|Phòng xét nghiệm|Túi áo mở, niêm phong lại để sàng lọc; không có ảnh toàn cảnh lúc mở.|Phòng lab nhận một túi áo.|Không xác định dấu vết được đặt lên áo khi nào.|Trung bình|Không thấy mã tấm lót trong danh mục.",
        "Yêu cầu giám định ADN|04/08 08:20|Điều tra viên|Đề nghị so sánh vết ở tay áo với mẫu Khang và Vinh.|Câu hỏi giám định được đặt ra.|Không thay thế đánh giá cách lấy và bảo quản mẫu.|Cao|Câu hỏi gốc không yêu cầu đánh giá chuyển gián tiếp.",
        "Nhật ký máy phân tích ADN|06/08 16:10|Phòng xét nghiệm|Chạy mẫu hỗn hợp và mẫu trắng; một kiểm soát âm tính bị đánh dấu “không đủ thể tích”.|Quy trình phân tích được ghi nhận.|Không kết luận kết quả là sai hoặc nhiễm bẩn.|Trung bình|Bản tường trình công tố bỏ qua ghi chú mẫu trắng.",
        "Báo cáo kết quả ADN|07/08 11:45|Chuyên viên ADN|Một thành phần hỗn hợp tương thích với hồ sơ tham chiếu Khang; đánh giá giới hạn do lượng thấp.|Có thể có thành phần tương thích.|Không xác định duy nhất nguồn, thời điểm hoặc hành vi.|Trung bình|Tóm tắt báo chí nội bộ dùng từ “trùng khớp”.",
        "Lệnh khám nghiệm tử thi|04/08 00:38|Điều tra viên|Yêu cầu xác định nguyên nhân và ước lượng cửa sổ tử vong.|Phạm vi khám nghiệm.|Không yêu cầu chốt một phút tử vong.|Cao|Bản hỏi cung sau đó nói giờ chết như mốc cố định.",
        "Báo cáo khám nghiệm tử thi|04/08 05:30|Bác sĩ pháp y|Chấn thương đầu nặng là nguyên nhân tử vong; ước tính khoảng rộng, chịu ảnh hưởng môi trường.|Cơ chế tử vong phù hợp chấn thương.|Không cho biết ai gây chấn thương hoặc lúc chính xác.|Khá cao|Ghi chú nhiệt độ hiện trường đến muộn.",
        "Biên bản hỏi cung lần đầu|04/08 09:40|Điều tra viên|Khang nói tối đó ở quanh khu bến, phủ nhận tới cầu; câu hỏi không phân biệt đầu cầu với mặt cầu.|Nội dung phát biểu đầu.|Không chứng minh lời phủ nhận đúng hay sai.|Trung bình|Bản ghi âm cho thấy anh hỏi lại “cầu hay đường dẫn?”.",
        "Biên bản hỏi cung bổ sung|05/08 13:15|Điều tra viên|Khang thừa nhận đứng gần lối tây và gọi Vinh, sửa câu trả lời trước.|Có thay đổi lời khai về phạm vi hiện diện.|Không tự chứng minh hành vi bạo lực.|Khá cao|Mốc giờ anh nêu không khớp đồng hồ điện thoại chưa hiệu chỉnh.",
        "Bản ghi âm hỏi cung|04/08 09:40|Thiết bị ghi âm|Nghe câu hỏi dẫn “anh đã lên cầu phải không” trước đoạn Khang trả lời chối.|Ngữ cảnh đặt câu hỏi.|Không phủ nhận các thay đổi đáng kể khác.|Cao|Biên bản chữ bỏ mất khoảng dừng và câu hỏi làm rõ.",
        "Biên bản nhận dạng ảnh|06/08 15:22|Điều tra viên|Lan chọn ảnh Khang trong bộ một ảnh, sau khi nghe rằng đã có người bị bắt.|Lan liên hệ người trong ảnh với bóng dáng đã thấy.|Không phải thủ tục nhận dạng mù hay độc lập.|Thấp|Bản ghi trước đó mô tả “không thấy mặt”.",
        "Sổ giao nhận bộ ảnh|06/08 14:58|Thư ký|Ghi người đưa ảnh và cuộc trao đổi ngắn trước khi nhận dạng.|Thông tin được nói trước thủ tục.|Không xác định mức ảnh hưởng tâm lý chính xác.|Khá cao|Giờ sổ lệch 24 phút so với video phòng.",
        "Yêu cầu trích xuất camera quán|04/08 00:52|Điều tra viên|Yêu cầu đoạn từ 21:00 đến 22:30, dù bản đầu chỉ lưu từ 21:20.|Phạm vi dữ liệu cần tìm.|Không chứng minh đoạn thiếu bị cố ý xóa.|Trung bình|Hóa đơn cho thấy thời gian ghi đè nhanh hơn dự kiến.",
        "Biên bản tiếp nhận nhân chứng Hà|04/08 01:25|Cán bộ trực|Hà nêu Khang rời quán “khoảng mười giờ kém”, không dùng đồng hồ cá nhân.|Ấn tượng thời gian của Hà.|Không chốt phút rời đi.|Trung bình|Video quán có đồng hồ nhanh, lời kể được sửa ngày sau.",
        "Bản khai bảo vệ Tài|04/08 03:10|Điều tra viên|Tài nghe hai giọng cãi nhưng chỉ thấy bóng người qua hàng rào.|Có tiếng cãi gần lối tây.|Không xác định người nói thứ hai là Vinh.|Trung bình|Sổ ca ban đầu không ghi tiếng cãi.",
        "Biên bản lời khai Lan|04/08 00:58|Điều tra viên|Lan nói thấy người nằm và một bóng đi khỏi phía đông; mặt khuất.|Có người/bóng người trên tuyến chạy.|Không nhận dạng được người rời đi.|Khá cao|Lời khai bổ sung dùng đại từ “anh ấy” sau khi xem ảnh.",
        "Sơ đồ tuyến tuần tra|04/08 04:00|Tổ bảo vệ|Vị trí chốt Tài cách bậc cầu 46 mét và có hàng cây che.|Giới hạn tầm nhìn của chốt.|Không loại trừ nghe tiếng hoặc thấy bóng.|Cao|Bản cáo trạng vẽ vị trí gần hơn thực tế.",
        "Biên bản niêm phong giày|04/08 08:36|Tổ khám xét|Đôi giày cỡ 42 được bỏ trong túi giấy, dây buộc chưa tháo.|Tình trạng giày lúc thu.|Không chứng minh đây là đôi tạo dấu.|Khá cao|Ảnh hiện trường không có thước chuẩn đặt cùng lúc.",
        "Quyết định trưng cầu dấu giày|05/08 08:05|Điều tra viên|Yêu cầu so sánh ảnh dấu mờ với đế giày thu giữ.|Phạm vi so sánh.|Không yêu cầu nhận dạng cá thể hóa.|Cao|Kết luận sơ bộ bị diễn đạt thành “đúng đôi giày”.",
        "Biên bản lấy mẫu lan can|04/08 01:10|Kỹ thuật viên|Mẫu quệt đông lấy trước, mẫu tây lấy sau; găng tay đổi không ghi giờ.|Thứ tự mẫu theo lời người lấy.|Không xác nhận tránh nhiễm chéo.|Thấp-trung bình|Khớp với phiếu giao ca ghi hai mẫu cùng khay.",
        "Phiếu sửa chữa camera cầu|02/08 17:30|Đơn vị vận hành|Camera đông mất màu và lệch giờ sau thay nguồn.|Tình trạng thiết bị trước án.|Không chứng minh tệp đêm án nguyên vẹn hoàn toàn.|Khá cao|Bảng bảo trì trên tủ ghi ngày 03/08.",
        "Biên bản trích xuất camera cầu|04/08 03:18|Kỹ thuật viên|Có hai đoạn hình bóng người; không phân biệt mặt hay quần áo màu.|Chuyển động trong vùng nhìn thấy.|Không nhận dạng Khang hoặc người gây án.|Trung bình|Bản tường trình đầu ghi “một người đàn ông”.",
        "Báo cáo kiểm tra đồng hồ thiết bị|06/08 09:12|Chuyên viên kỹ thuật|So với giờ mạng, máy Khang chậm 6 phút 20 giây; sai lệch có thể trôi.|Offset tại lúc kiểm tra.|Không chứng minh offset bất biến suốt đêm.|Khá cao|Tệp cuộc gọi cho thấy lệch thay đổi theo lần đồng bộ.",
        "Biên bản xác minh quán Mây|05/08 12:30|Điều tra viên|Xác nhận hóa đơn và vị trí máy ghi hình, không có camera ở cửa hông.|Các nguồn dữ liệu của quán.|Không phủ hết lối ra vào.|Khá cao|Lời Hà nói không nhìn thấy cửa hông.",
        "Báo cáo đánh giá tổng hợp|09/08 16:40|Tổ điều tra|Tổng hợp tranh cãi, hiện diện vùng, dấu vết và nhận dạng thành một chuỗi.|Cách công tố kết nối các dấu.|Không phải chứng cứ độc lập mới.|Trung bình|Từng thành phần có giới hạn mà bản tổng hợp không nêu đủ.",
        "Biên bản xác nhận phạm vi cáo buộc|11/08 09:00|Thư ký hồ sơ|Ghi riêng hành vi bị cáo buộc gây chấn thương chết người với các dữ kiện bối cảnh.|Nội dung buộc tội được xác định rõ.|Không thay thế chứng minh từng yếu tố bằng chứng cứ.|Cao về văn bản|Bản tóm tắt họp báo trộn tranh cãi với hành vi gây án."
      ]
    },
    {
      category: "Call / text records",
      start: 14041,
      rows: [
        "Tin nhắn Khang: “chốt khoản còn lại”|03/08 20:42 máy|Sao lưu điện thoại Khang|Khang nhắc khoản tiền đang tranh chấp, Vinh đáp rằng sẽ nói sau.|Có bất đồng tài chính trước án.|Không chứng minh ý định gây thương tích.|Khá cao|Bản sao Vinh có dấu nhận lúc 20:39 mạng.",
        "Tin nhắn Vinh: “đừng làm ầm”|03/08 20:47 máy|Sao lưu điện thoại Vinh|Vinh muốn trao đổi riêng, không nêu đe dọa hoặc bạo lực.|Mâu thuẫn còn chưa giải quyết.|Không xác định ai khơi mào vụ đánh.|Khá cao|Chụp màn hình của Châu thiếu dòng ngay trước.",
        "Cuộc gọi nhỡ Khang→Vinh|03/08 21:06 máy|Nhật ký thiết bị Khang|Một cuộc gọi 18 giây không được trả lời.|Khang cố liên lạc.|Không cho biết mục đích hay vị trí người gọi.|Khá cao|Sổ nhà mạng ghi chuông 14 giây theo giờ mạng.",
        "Tin nhắn Khang: “nói cho rõ”|03/08 21:14 máy|Sao lưu điện thoại Khang|Câu ngắn có thể nghe gay gắt nhưng không nhắc đánh nhau.|Giọng điệu căng thẳng.|Không chứng minh đe dọa cụ thể.|Khá cao|Khang nói giờ máy hiển thị chậm hơn đồng hồ quán.",
        "Trả lời Vinh: “mai tính”|03/08 21:21 máy|Sao lưu điện thoại Vinh|Vinh đề nghị hoãn trao đổi đến hôm sau.|Vinh không xác nhận gặp ngay lúc đó.|Không chứng minh Vinh không đổi kế hoạch.|Khá cao|Bản tóm tắt tin nhắn không đưa dòng này.",
        "Cuộc gọi Khang→Châu|03/08 21:33 máy|Nhật ký nhà mạng|Cuộc gọi 52 giây, Châu nói chuyện khoản tiền.|Khang trao đổi với bạn của Vinh.|Không chứng minh Châu biết lịch Vinh sau đó.|Cao|Châu nhớ cuộc gọi trước giờ đóng quán; log đặt sau.",
        "Tin nhắn Châu→Vinh|03/08 21:39 mạng|Sao lưu Châu|Châu hỏi Vinh có gặp Khang không, chưa có phản hồi ngay.|Châu quan tâm cuộc hẹn.|Không chứng minh Vinh đã hẹn gặp.|Khá cao|Thời gian hiển thị của máy Châu nhanh gần hai phút.",
        "Cuộc gọi Vinh→số chưa lưu|03/08 21:52 mạng|Bản ghi nhà mạng|Cuộc gọi 11 giây, thuê bao trả trước; không có nội dung.|Vinh liên lạc một số khác.|Không nhận dạng người dùng số hoặc nội dung.|Trung bình|Số hết hạn trước khi yêu cầu thông tin thuê bao.",
        "Tin nhắn Vinh: “đang đi”|03/08 21:58 máy|Thiết bị Vinh|Một tin nhắn cho Châu, không nêu điểm đến.|Vinh di chuyển hoặc dự định đi.|Không xác định tuyến đường.|Trung bình|Máy Vinh có độ lệch chưa kiểm tra trực tiếp.",
        "Cuộc gọi nhỡ Hà→Khang|03/08 22:02 máy|Nhật ký quán|Hà gọi hỏi hóa đơn chưa thanh toán.|Hà liên hệ Khang.|Không chứng minh Khang ở quán lúc chuông reo.|Khá cao|Hà đặt giờ theo máy thu ngân nhanh hơn đồng hồ mạng.",
        "Cuộc gọi Khang→Vinh|03/08 22:11 máy|Nhật ký nhà mạng|Cuộc gọi 9 giây, kết nối rồi ngắt.|Hai máy trao đổi tín hiệu.|Không chứng minh gặp trực tiếp hoặc ai cầm máy.|Cao|Điện thoại Khang ghi 22:05 do offset chậm.",
        "Tin nhắn Khang: “tôi chờ phía này”|03/08 22:13 máy|Sao lưu Khang|Câu nói vị trí không rõ “phía này” là quán, bến hay đường dẫn.|Khang nói mình đang đợi ở đâu đó.|Không xác định chính xác điểm hoặc người nhận đọc ngay.|Khá cao|Châu hiểu là bờ tây nhưng không hỏi Khang.",
        "Tin nhắn Vinh: “đừng qua”|03/08 22:14 mạng|Sao lưu Vinh|Một câu trả lời ngắn có thể chỉ việc không đi sang bờ bên kia.|Có trao đổi về di chuyển.|Không xác định người nhận đã đọc hoặc tuyến đi.|Trung bình|Máy Khang không báo nhận cho đến lần đồng bộ sau.",
        "Cuộc gọi Khang→Châu|03/08 22:20 máy|Nhật ký Khang|Cuộc gọi 24 giây không lưu âm thanh.|Khang còn liên lạc với Châu.|Không chứng minh Châu nói chuyện với Vinh sau đó.|Khá cao|Châu khai không nhớ cuộc gọi thứ hai.",
        "Tin nhắn Châu→Khang: “đừng tìm ảnh”|03/08 22:24 máy|Sao lưu Châu|Châu khuyên Khang không tiếp tục nhắn Vinh.|Châu hiểu cuộc cãi vã đang nóng.|Không chứng minh Châu biết hai người ở đâu.|Trung bình|Bản trích xuất đầu bỏ mất chữ “ảnh”.",
        "Cuộc gọi đến Vinh từ số lạ|03/08 22:27 mạng|Nhà mạng|Cuộc gọi 6 giây không có dữ liệu nội dung; số thuê bao không xác minh được.|Vinh nhận tín hiệu từ một số khác.|Không khẳng định người gọi có mặt gần cầu.|Trung bình|Bản ghi cell ở sector rộng phủ hai bờ.",
        "Tin nhắn Vinh: “tới rồi”|03/08 22:31 máy|Thiết bị Vinh|Tin nhắn gửi số trả trước, nội dung không nêu địa điểm.|Vinh báo đã tới một nơi.|Không xác định nơi ấy là cầu.|Thấp-trung bình|Không có báo cáo giao thành công rõ ràng.",
        "Cuộc gọi nhỡ Khang→Vinh|03/08 22:34 máy|Nhật ký Khang|Một cuộc gọi không kết nối đủ lâu để trao đổi.|Khang tiếp tục thử liên hệ.|Không chứng minh Khang đang cạnh Vinh.|Khá cao|Nhà mạng đặt nó sớm hơn 6 phút so đồng hồ máy.",
        "Tin nhắn Vinh chưa gửi|03/08 22:36 máy|Cơ sở dữ liệu thiết bị|Bản nháp “không phải chuyện của mày” chưa có dấu gửi.|Vinh soạn phản hồi.|Không chứng minh Khang nhận được.|Trung bình|Cơ sở dữ liệu không cho biết bản nháp được tạo lúc nào chính xác.",
        "Cuộc gọi Châu→Vinh|03/08 22:42 mạng|Nhà mạng|Chuông 21 giây, không trả lời.|Châu cố gọi Vinh.|Không xác định Vinh còn sống hay đang cầm máy.|Cao|Đồng hồ điện thoại Châu nhanh 1 phút 50 giây.",
        "Sự kiện mạng: đổi sector Vinh|03/08 22:44 mạng|Bản ghi mạng|Máy chuyển từ sector trung tâm sang sector đông; vùng phủ chồng lấn.|Thiết bị di chuyển hoặc mạng tái chọn ô.|Không xác định đường đi hay người mang máy.|Khá cao|Bản đồ sector cập nhật sau sự kiện có vùng biên khác.",
        "Tin nhắn Khang→Vinh: “tôi về”|03/08 22:46 máy|Sao lưu Khang|Một câu cho thấy ý định rời đi theo lời khai sau.|Khang gửi thông điệp.|Không chứng minh người nhận đọc hoặc Khang đã rời nơi nào.|Trung bình|Bản ghi cục bộ hiển thị 22:40 trước hiệu chỉnh.",
        "Cuộc gọi nhỡ số lạ→Vinh|03/08 22:49 mạng|Nhà mạng|Hai hồi chuông rồi ngắt.|Có nỗ lực liên hệ Vinh.|Không nhận diện người gọi.|Trung bình|Số này cũng xuất hiện trong nhóm gọi tự động.",
        "Nhật ký gọi Khang→Hà|03/08 22:51 máy|Thiết bị Khang|Cuộc gọi 31 giây, Hà hỏi hóa đơn và Khang nói sẽ chuyển khoản.|Liên lạc đời thường sau mốc tranh cãi.|Không xác định vị trí hai bên.|Khá cao|Hà nhớ cuộc gọi ngắn hơn một phút.",
        "Cuộc gọi Vinh→Châu|03/08 22:54 mạng|Nhà mạng|Cuộc gọi không trả lời, thời lượng chuông 17 giây.|Thiết bị Vinh phát tín hiệu gọi.|Không chốt thời điểm Vinh bị thương.|Cao|Máy cứu hộ sau đó ghi mốc theo đồng hồ khác.",
        "SMS hệ thống nhà mạng|03/08 22:57 mạng|Nhà mạng|Thông báo bảo trì cell, có khả năng trễ ghi sự kiện.|Một điều kiện kỹ thuật có thể ảnh hưởng thứ tự log.|Không cho phép tùy ý dịch mọi cuộc gọi.|Cao|Bản sao điều tra không kèm phụ lục bảo trì.",
        "Cuộc gọi Tài→trực ban|03/08 23:08 sổ|Điện thoại chốt|Tài báo thấy người nằm, cuộc gọi dùng thời gian thiết bị chốt.|Thời điểm báo tin gần phát hiện.|Không chứng minh Tài đã nhìn thấy cú đánh.|Trung bình|Đồng hồ chốt trễ 3 phút so với tổng đài.",
        "Cuộc gọi 113 nội bộ|03/08 23:14 mạng|Điều phối cứu hộ|Điều phối xe tới lối đông.|Phản ứng cấp cứu được khởi động.|Không xác định thời điểm tử vong.|Cao|Nhật ký xe ghi giờ GPS sớm hơn 2 phút.",
        "Tin nhắn Châu→Khang sau tin báo|04/08 00:03 máy|Sao lưu Châu|Châu hỏi Khang có biết Vinh ở đâu không.|Châu chưa biết chắc tình trạng Vinh.|Không chứng minh Khang không biết sự việc.|Khá cao|Khang đọc sau gần 20 phút theo log đồng bộ.",
        "Yêu cầu mạng cung cấp bản ghi gốc|04/08 09:30|Điều tra viên|Yêu cầu thứ hai nêu rõ múi giờ và thời gian mạng.|Cần phân biệt giờ hiển thị với giờ mạng.|Không hiệu chỉnh được thiết bị ngoài nhà mạng.|Cao|Bản trả lời gốc đến sau bản tổng hợp.",
        "Danh sách sector phục vụ khu cầu|05/08 15:10|Kỹ thuật nhà mạng|Ba sector có thể phủ vùng quanh hai đầu cầu tùy tải.|Phạm vi phủ sóng rộng và chồng lấn.|Không tọa độ hóa máy đến vài mét.|Khá cao|Bản đồ điều tra ban đầu chỉ tô một sector.",
        "Bản ghi đồng bộ thiết bị Vinh|06/08 12:25|Phòng kỹ thuật số|Máy mất đồng bộ mạng trong gần 40 phút.|Giờ máy Vinh có thể trôi.|Không xác định mức trôi chính xác trước hiệu chuẩn.|Trung bình|Bản cáo trạng dùng giờ máy như giờ chuẩn.",
        "Lịch sử định tuyến cuộc gọi|06/08 14:50|Nhà mạng|Một số cuộc gọi định tuyến qua sector không gần nhất.|Chọn sector chịu ảnh hưởng tải và vật cản.|Không cho biết thiết bị ở đâu trong vùng rộng.|Cao|Tài liệu tóm lược bỏ ghi chú định tuyến.",
        "Bản sao lưu tin nhắn Châu|07/08 10:04|Chuyên viên số|Có các dòng khuyên hai người tạm dừng liên hệ.|Châu biết mâu thuẫn nhưng cố hạ nhiệt.|Không chứng minh cô biết kế hoạch gặp mặt.|Khá cao|Một ảnh chụp rời rạc làm câu chữ trông đe dọa hơn.",
        "Lịch sử xóa cuộc gọi|07/08 10:18|Chuyên viên số|Một cuộc gọi bị xóa khỏi giao diện, bản sao đám mây còn thời lượng 8 giây.|Người dùng xóa một mục log.|Không khẳng định ai xóa hay lý do.|Trung bình|Không có dấu sửa dữ liệu gốc."
      ]
    },
    {
      category: "Physical evidence",
      start: 14076,
      rows: [
        "Áo khoác của Vinh|04/08 00:50|Hiện trường phía đông|Tay áo phải có vết máu, bụi đá và một vệt quệt nhỏ.|Áo có tiếp xúc với máu/bề mặt.|Không cho biết ai chạm vào hay khi nào.|Khá cao|Mẫu quệt được lấy sau khi áo đặt trên khay dùng chung.",
        "Vết máu trên bậc đá|04/08 00:21|Hiện trường|Giọt máu tập trung tại cạnh bậc thứ ba, không thành vệt kéo dài.|Có chảy máu gần vị trí.|Không xác định tư thế ban đầu.|Trung bình|Sơ đồ đo bổ sung dịch vị trí tương đối.",
        "Quệt bề mặt lan can đông|04/08 01:10|Tổ lấy mẫu|Mẫu lấy ở độ cao ngang hông, có hỗn hợp sinh học lượng thấp.|Có thể có nhiều lần chạm bề mặt.|Không xác định cá nhân hay thời điểm.|Thấp-trung bình|Cùng khay vận chuyển với gói áo.",
        "Quệt bề mặt lan can tây|04/08 01:18|Tổ lấy mẫu|Mẫu có vật liệu môi trường và tín hiệu yếu không đủ so sánh.|Bề mặt ngoài trời chịu mưa bụi.|Không loại trừ từng có chạm tay.|Thấp|Biên bản không ghi đổi găng lúc chuyển vị trí.",
        "Dấu giày mờ ở bụi|04/08 00:33|Bậc dưới phía đông|Có hai phần vân đế, một phần bị giẫm chồng.|Dấu giày cỡ khoảng 41–43.|Không nhận diện cá thể hoặc hướng chắc chắn.|Trung bình-thấp|Không biết dấu trước hay sau khi người cứu hộ tới.",
        "Ảnh dấu giày có thước|04/08 01:56|Kỹ thuật hình sự|Ảnh được chụp sau khi đặt thước gần dấu, phối cảnh xiên.|Ước lượng kích cỡ tương đối.|Không so sánh chính xác độ sâu/áp lực.|Trung bình|Thước không cùng mặt phẳng với vân dấu.",
        "Đôi giày Khang|04/08 07:11|Phòng trọ Khang|Đế cao su cỡ 42, hoa văn phổ thông; có bụi khô ở rãnh.|Khang sở hữu đôi giày tương thích kích cỡ.|Không chứng minh đôi giày tạo dấu ở cầu.|Khá cao|Không lấy mẫu bụi tham chiếu từ tuyến đường thường đi.",
        "Mẫu bụi trong đế giày|05/08 09:02|Phòng giám định|Hạt khoáng phổ biến, không có thành phần hiếm tương ứng mẫu bậc.|Giày có bụi môi trường thông thường.|Không phân biệt được địa điểm.|Khá cao|Kết luận tóm tắt bỏ chữ “phổ biến”.",
        "Sợi vải trên lan can|04/08 01:22|Tổ lấy mẫu|Sợi xanh sẫm ngắn, chưa xác định loại vải.|Có sợi bám trên bề mặt.|Không chứng minh thuộc áo Khang.|Trung bình-thấp|Không có mẫu nền bụi tại vị trí.",
        "Áo xanh đậm thu tại trọ|04/08 07:11|Phòng trọ Khang|Có bụi vải và vết xước cũ ở khuỷu, không thấy máu quan sát được.|Khang sở hữu áo màu tương tự bóng trên ảnh.|Không loại trừ/khẳng định mặc tối đó.|Khá cao|Nhân chứng Tài nhớ màu áo khác nhau qua hai khai báo.",
        "Điện thoại Khang|04/08 06:44|Phòng trọ Khang|Thiết bị khóa màn hình, pin 18%, vỏ có vết nứt cũ.|Thiết bị thu giữ là máy gắn thuê bao Khang.|Không chứng minh ai mang máy vào thời điểm án.|Khá cao|Không có nhật ký vị trí liên tục.",
        "Điện thoại Vinh|04/08 00:47|Gần nạn nhân|Màn hình nứt, máy còn nguồn và nhận cuộc gọi muộn.|Máy ở gần Vinh khi được tìm thấy.|Không xác định ai sử dụng trước đó.|Khá cao|Bản ảnh hiện trường đầu tiên không chụp vị trí máy.",
        "Ly giấy quán Mây|03/08 21:57|Bàn ngoài quán|Có dấu vân tay hỗn hợp không đủ phân biệt và vệt cà phê.|Khang có thể đã dùng bàn/ly theo lời Hà.|Không xác định thời điểm rời quán.|Thấp-trung bình|Không có ảnh ly trước khi nhân viên dọn bàn.",
        "Hóa đơn thanh toán|03/08 22:01|Máy tính tiền quán|Ghi một đồ uống, thời gian hiển thị nhanh so giờ mạng.|Có giao dịch gần cuối thời gian Khang ở quán.|Không chứng minh khách là Khang nếu thiếu nhận diện.|Khá cao|Hà nhớ Khang thanh toán tiền mặt trước đó.",
        "Túi giấy giao hàng|04/08 00:40|Lối đông|Túi rỗng ướt mưa, không có nhãn giao nhận.|Có vật bị bỏ ở hiện trường.|Không chứng minh liên quan vụ đánh.|Thấp|Nhiều tuyến giao hàng dùng cùng loại túi.",
        "Vết xước trên điện thoại Vinh|04/08 02:12|Phòng khám nghiệm|Xước cạnh máy có bụi đá, không thấy dấu va đập lớn.|Máy có thể đã chạm mặt cứng.|Không chứng minh máy rơi cùng lúc nạn nhân ngã.|Trung bình|Không biết máy đã rơi ở đâu trước khi tìm.",
        "Móng tay Vinh - mẫu trái|04/08 05:06|Bệnh viện|Có vật liệu da biểu mô lượng thấp, không lập được hồ sơ so sánh.|Có dấu vết tiếp xúc không xác định.|Không liên hệ được với Khang hay người khác.|Trung bình-thấp|Mẫu đối chiếu lấy sau cấp cứu.",
        "Móng tay Vinh - mẫu phải|04/08 05:13|Bệnh viện|Không có lượng đủ để định kiểu.|Kết quả âm tính giới hạn cho mẫu này.|Không loại trừ tiếp xúc với người khác.|Khá cao|Không có mẫu lặp do vật liệu ít.",
        "Mẫu đối chiếu Khang|05/08 11:42|Phòng lấy mẫu|Mẫu niêm mạc lấy có nhân chứng và mã vạch rõ.|Hồ sơ tham chiếu được lấy từ Khang.|Không chứng minh dấu hỗn hợp có nguồn từ anh.|Cao|Không sửa được sai sót ở khâu hiện trường.",
        "Tấm lót khay thép|04/08 08:12|Kho vật chứng|Tấm lót được tìm sau khi mẫu áo đã chuyển; không rõ đã dùng hay chưa.|Có thể kiểm tra thiếu sót quy trình.|Không kết luận có nhiễm chéo thực tế.|Thấp|Biên bản đầu nói khay có phủ giấy.",
        "Vệt bùn trên bậc tây|04/08 00:29|Hiện trường|Bùn lẫn sạn kéo dài khoảng 30 cm, không có mẫu so sánh.|Có hoạt động di chuyển gần bậc.|Không phân biệt giày hay bánh xe.|Thấp-trung bình|Ảnh chụp sau khi nhân viên cứu hộ đi qua.",
        "Mảnh nhựa trong rãnh thoát nước|04/08 01:32|Hiện trường|Mảnh nhựa trong, mép vỡ cũ, không khớp thiết bị thu giữ.|Có vật nhỏ ở rãnh.|Không liên hệ được với cuộc ẩu đả.|Thấp|Mảnh có thể là rác tồn tại từ trước.",
        "Đồng hồ đeo tay Vinh|04/08 00:47|Cổ tay nạn nhân|Mặt kính vỡ, kim dừng 22:38 nhưng bộ máy không kiểm tra.|Đồng hồ hỏng ở một thời điểm chưa biết.|Không xác định giờ ngã hay giờ chết.|Thấp|Kim có thể dừng do pin yếu trước đó.",
        "Mẫu nước mưa trên áo|04/08 03:42|Phòng giám định|Độ ẩm phù hợp áo bị ướt ngoài trời nhưng thời gian tiếp xúc không ước lượng được.|Áo từng gặp môi trường ẩm.|Không định được lúc ở cầu.|Trung bình-thấp|Áo được vận chuyển qua hành lang ướt.",
        "Dây đồng hồ Vinh|04/08 00:47|Tổ hiện trường|Khóa dây còn cài nhưng chốt có vết mòn cũ; không thấy sợi vải lạ.|Đồng hồ vẫn ở cổ tay khi phát hiện.|Không xác định đồng hồ dừng cùng lúc nạn nhân ngã.|Trung bình|Chốt mòn có thể khiến đồng hồ dịch chuyển trước sự việc."
      ]
    },
    {
      category: "Camera / logs",
      start: 14101,
      rows: [
        "Camera trong quán Mây|03/08 21:38 máy|Đầu ghi quán|Hình cho thấy Khang ngồi bàn ngoài, không có đồng hồ chuẩn trong khung.|Khang có thể ở quán trong một phần buổi tối.|Không chứng minh anh ở đó liên tục.|Khá cao|Đầu ghi nhanh 3 phút 40 giây so giờ mạng.",
        "Camera cửa quán|03/08 22:04 máy|Đầu ghi quán|Một người có vóc dáng gần Khang rời cửa chính, mặt bị ánh đèn che.|Có người rời quán trong khoảng tương ứng.|Không nhận diện chắc chắn người đó.|Trung bình|Cửa hông ngoài vùng camera.",
        "Camera ngõ sau quán|03/08 22:09 máy|Đầu ghi cửa hàng cạnh|Khung hình mất 11 giây, sau đó không thấy lối ra.|Có điểm mù dữ liệu.|Không chứng minh ai đi qua.|Thấp|Mất hình trùng lần khởi động lại ổ.",
        "Camera đường dẫn tây|03/08 22:15 máy|Bộ ghi cầu|Bóng người đi về phía bờ, không thấy mặt.|Có chuyển động trong lối dẫn.|Không định danh người.|Trung bình-thấp|Đồng hồ nhanh khoảng hai phút, offset dao động.",
        "Camera lối lên cầu|03/08 22:21 máy|Bộ ghi cầu|Hai bóng xuất hiện cách nhau 18 giây, vùng giữa cầu tối.|Có ít nhất hai chuyển động trong chuỗi hình.|Không biết họ là ai hay có gặp nhau.|Thấp-trung bình|Không có khung liên tục giữa hai bóng.",
        "Camera giữa cầu|03/08 22:25 máy|Bộ ghi cầu|Hình mất nét và rung; không thể phân biệt có va chạm hay không.|Chất lượng ghi hình tại điểm trung tâm kém.|Không chứng minh vắng mặt người.|Thấp|Văn bản vận hành ghi lỗi nguồn từ đầu tối.",
        "Camera lối xuống đông|03/08 22:39 máy|Bộ ghi cầu|Một bóng đi nhanh xuống bậc đông, hướng mặt khuất khỏi ống kính.|Có người rời lối đông.|Không nhận diện hoặc xác định thời điểm rời chính xác.|Trung bình-thấp|Nhật ký máy nhanh hơn GPS bộ ghi.",
        "Camera cửa hàng phía đông|03/08 22:46 máy|Cửa hàng tư nhân|Đèn xe che gần hết khung; một bóng lướt qua mép hình.|Có chuyển động gần tuyến đông.|Không nhận dạng người hay phương tiện.|Thấp|Chủ cửa hàng không nhớ máy có chỉnh giờ.",
        "Camera bãi xe hư cấu|03/08 22:52 máy|Bãi xe|Không ghi nhận xe máy ra trong khoảng lưu, nhưng có đoạn ghi đè.|Không thấy chuyển động xe trong phần còn lại.|Không loại trừ phương tiện ngoài khung.|Trung bình-thấp|Ổ cứng bắt đầu ghi đè trước khi trích xuất.",
        "Camera xe điện Hải|03/08 22:57 GPS|Thiết bị xe|Xe dừng 74 giây ở điểm cách cầu 190 mét.|Hải ở gần khu vực theo GPS.|Không chứng minh anh thấy sự kiện.|Khá cao|GPS có bán kính sai số 18–35 mét.",
        "Nhật ký tuần tra Tài|03/08 22:32 sổ|Sổ bảo vệ|Ghi “đi đầu tây”, mực bút khác ghi thêm “nghe tiếng”.|Tài ghi một vòng tuần tra.|Không chứng minh đã quan sát cầu liên tục.|Trung bình|Thời điểm ghi có thể sau vòng tuần tra.",
        "Đồng hồ chốt bảo vệ|03/08 23:08 hiển thị|Thiết bị chốt|Máy lệch chậm 3 phút so bộ đàm.|Offset của thiết bị tuần tra.|Không xác định giờ gọi chính xác.|Khá cao|Không biết lần hiệu chuẩn cuối.",
        "Nhật ký tổng đài cứu hộ|03/08 23:14 mạng|Trung tâm điều phối|Cuộc điều xe ghi giờ mạng, có timestamp đến giây.|Thời điểm điều phối đáng tin hơn đồng hồ hiện trường.|Không xác định lúc thương tích xảy ra.|Cao|Xe cứu hộ lưu giờ GPS khác 2 phút.",
        "GPS xe cứu hộ|03/08 23:18 GPS|Xe cấp cứu|Xe tới lối đông, độ sai số báo 11 mét.|Thời điểm và khu vực tiếp cận cứu hộ.|Không xác định lúc Vinh ngã.|Khá cao|Máy GPS mất đồng bộ trước khi khởi động.",
        "Đồng hồ máy chủ nhà mạng|03/08 22:00 chuẩn|Nhà mạng|Máy chủ dùng giờ mạng chuẩn, ghi chú một đợt tăng trễ ngắn.|Thời gian log mạng có chuẩn tham chiếu.|Không hiệu chỉnh camera hay thiết bị riêng.|Cao|Đợt trễ tối đa 42 giây.",
        "Log khởi động đầu ghi cầu|03/08 20:17 máy|Bộ ghi cầu|Đầu ghi khởi động lại, giữ cấu hình cũ lệch giờ.|Có khả năng mất một đoạn ngắn đầu buổi.|Không biết mọi tệp sau đó mất khung.|Khá cao|Bản sao không giữ đủ thông báo lỗi.",
        "Log lỗi camera giữa cầu|03/08 22:24 máy|Bộ ghi cầu|Cảnh báo lấy nét tự động và rung nguồn kéo dài 8 phút.|Giải thích chất lượng hình ảnh kém.|Không cho biết nội dung ngoài phần nhìn thấy.|Cao|Bản tóm tắt đầu bỏ thời lượng lỗi.",
        "Bản hiệu chỉnh camera quán|06/08 11:02|Kỹ thuật viên quán|Đối chiếu hóa đơn và đồng hồ máy xác định nhanh 3:40, dao động ±20 giây.|Offset ước tính cho đầu ghi quán.|Không áp dụng cho camera khác.|Khá cao|Hiệu chỉnh dựa một giao dịch, không phải đồng hồ GPS.",
        "Bản hiệu chỉnh camera cầu|06/08 11:54|Đơn vị vận hành|So log máy chủ và lần khởi động cho offset nhanh khoảng 2 phút, biên ±1:10.|Ước lượng độ lệch cho bộ ghi cầu.|Không tạo được thứ tự chính xác giữa các đoạn rời.|Trung bình|Giờ trôi tuyến tính chưa được xác nhận.",
        "Nhật ký cảm biến đèn cầu|03/08 22:00–23:00|Tủ điều khiển ánh sáng|Cảm biến ghi ba lần sụt áp ngắn, không gắn với người hay chuyển động.|Ánh sáng không ổn định suốt khoảng tối.|Không giải thích được bóng cụ thể trong video.|Khá cao|Đồng hồ tủ chưa đồng bộ tuyệt đối với bộ ghi."
      ]
    },
    {
      category: "Investigative / medical / witness",
      start: 14121,
      rows: [
        "Bản đồ sector khu Cầu Vân|05/08 15:10|Chuyên viên mạng|Hai sector chồng lấn trên cả đường dẫn tây và khu chợ; tải mạng đổi vùng ưu tiên.|Máy có thể kết nối trong một vùng rộng.|Không đặt thiết bị lên mặt cầu.|Khá cao|Bản đồ công tố đánh dấu một chấm duy nhất.",
        "Ghi chú ước lượng tử vong|04/08 05:30|Bác sĩ pháp y|Nhiệt độ, môi trường gió và cấp cứu làm khoảng tử vong rộng khoảng nửa giờ.|Cửa sổ phù hợp khoảng 22:25–22:55 sau hiệu chỉnh.|Không xác định phút hoặc người gây thương tích.|Khá cao|Bản điều tra dùng 22:38 như mốc giữa chính xác.",
        "Nhiệt độ hiện trường|04/08 00:18|Thiết bị cứu hộ|Máy đo cầm tay ghi nhiệt độ sau khi nạn nhân đã được phủ chăn.|Điều kiện đo muộn có sai số.|Không tái tạo nhiệt độ lúc xảy ra án.|Trung bình-thấp|Không ghi số serial hay lần hiệu chuẩn.",
        "Phân tích cơ chế chấn thương|04/08 05:42|Bác sĩ pháp y|Chấn thương phù hợp va đập mạnh với bề mặt cứng; nhiều cơ chế có thể tạo hình thái.|Có thể là hậu quả cú ngã hoặc bị đánh.|Không phân biệt cú đẩy, cú đấm hay ngã tự nhiên.|Khá cao|Bản tóm tắt dùng từ “bị đánh” rộng hơn kết luận.",
        "Báo cáo dấu giày|06/08 13:20|Giám định viên dấu vết|Kích thước và hai đoạn vân tương tự nhưng phổ biến; không đủ cá thể hóa.|Đôi giày Khang không bị loại trừ.|Không kết luận là cùng một đôi.|Khá cao|Phiếu hỏi ban đầu dùng từ “xác định nguồn”.",
        "Tái dựng quãng đường đi bộ|08/08 10:00|Điều tra viên|Tuyến quán đến lối tây mất 7–13 phút tùy lối và dừng đèn.|Khang có thể đi tới vùng trong khoảng rộng.|Không chứng minh đã đi tuyến đó.|Trung bình|Bản vẽ bỏ tuyến ngõ hông ngắn hơn.",
        "Bản đồ tầm nhìn chốt Tài|08/08 11:15|Kỹ thuật hiện trường|Hàng cây và cột đèn chắn mặt cầu từ vị trí chốt.|Tài không thể thấy rõ giữa cầu.|Không loại trừ nghe tiếng hoặc thấy bóng.|Khá cao|Bản cáo trạng đặt chốt gần hơn 18 mét.",
        "Đánh giá ánh sáng lối đông|08/08 12:04|Đơn vị chiếu sáng|Một đèn tắt luân phiên, vùng tối phủ khoảng 9 mét.|Nhận dạng màu/quần áo khó khăn.|Không chứng minh cả tuyến tối hoàn toàn.|Trung bình|Biên bản sửa đèn lập sau sự kiện.",
        "Đánh giá nhận diện Lan|09/08 09:30|Chuyên gia trí nhớ|Nhìn thoáng, mặt khuất, khoảng cách và gợi ý sau sự kiện đều hạn chế độ chắc chắn.|Mức tin cậy có thể bị ảnh hưởng bởi thủ tục.|Không khẳng định Lan cố ý khai sai.|Khá cao|Lan từng nói “không chắc” trước khi xem ảnh.",
        "Ghi nhận ánh sáng quán|03/08 21:50|Hà và ảnh hiện trường|Ánh đèn quán đủ thấy khách ở bàn nhưng cửa hông nằm ngoài vùng nhìn.|Hà có thể nhớ Khang trong quán.|Không cho biết anh rời bằng cửa nào.|Trung bình|Hà làm nhiều việc cùng lúc.",
        "Lời khai bổ sung Hà|05/08 08:50|Điều tra viên|Hà đổi mốc rời quán từ “gần mười giờ” thành 22:04 theo video.|Hà điều chỉnh trí nhớ dựa hồ sơ.|Không xác nhận giờ video chuẩn tuyệt đối.|Trung bình|Mốc mới dễ bị neo vào bản hiệu chỉnh chưa có lúc hỏi.",
        "Lời khai bổ sung Tài|06/08 07:42|Điều tra viên|Tài nói người áo tối “có thể là Khang” sau khi nhìn ảnh trên bản tin nội bộ.|Nhận diện đến sau tiếp xúc thông tin.|Không phải nhận dạng độc lập.|Thấp|Khai đầu chỉ thấy dáng người qua hàng cây.",
        "Lời khai Hải về chuyến xe|05/08 10:22|Điều tra viên|Hải nhớ một khách xuống trước điểm dừng và bóng người ở bờ đông.|Có khách và chuyển động gần tuyến.|Không nhận dạng khách hay Khang.|Trung bình-thấp|GPS xe dừng tại chỗ khác 30 mét so ký ức.",
        "Lời khai Châu về mâu thuẫn|04/08 07:50|Điều tra viên|Châu nói Khang bực vì khoản tiền, nhưng không nghe đe dọa đánh.|Có xung đột giữa hai người.|Không chứng minh động cơ giết người.|Khá cao|Cụm “sẽ xử lý” là lời Châu diễn giải, không trích nguyên văn.",
        "Bảng ca làm Dũng|03/08 18:00|Nơi làm việc|Dũng gặp Khang đầu tối, ca kết thúc trước khung gần cầu.|Dũng xác nhận lịch làm.|Không xác nhận vị trí Khang sau ca.|Cao|Dũng ban đầu nhớ nhầm ngày thứ sáu.",
        "Nhật ký kỹ thuật viên An|06/08 08:11|Đơn vị camera|An ghi camera cầu lỗi màu và vùng giữa mất nét.|Hạn chế chất lượng nhận diện.|Không thể tái tạo hình ảnh bị mất.|Khá cao|Bản tường trình lời nói của An cường điệu hơn ghi chép.",
        "Bản giải thích của Khánh|07/08 13:34|Nhà mạng|Khánh phân biệt sector phủ sóng với định vị; thiết bị có thể chọn sector xa hơn.|Giới hạn suy luận từ cell.|Không xác định người cầm máy.|Cao|Bản hỏi cung cũ ghi lời ông là “đã ở cầu”.",
        "Phiếu rà soát phòng ADN|08/08 15:40|Kiểm soát chất lượng|Thiếu mục ghi thay găng tại một lần chuyển mẫu, không tìm thấy bằng chứng chắc chắn về nhiễm chéo.|Quy trình cần thận trọng hơn.|Không chứng minh kết quả ADN vô hiệu.|Trung bình|Phiếu phát hiện sau khi báo cáo đã phát hành.",
        "Biên bản hỏi Phương|09/08 14:05|Điều tra viên|Phương nói “tương thích” không đồng nghĩa duy nhất; mẫu ít không xác định tỷ lệ nguồn chắc chắn.|Giới hạn chuyên môn của ADN.|Không loại trừ Khang là một nguồn.|Khá cao|Phần hỏi đáp đầu bị lược trong bản tóm tắt.",
        "Biên bản hỏi Bình|09/08 15:12|Điều tra viên|Bình xác nhận ảnh dấu không đủ độ sâu/chi tiết để khẳng định một đôi giày.|Giới hạn so sánh dấu.|Không loại trừ mọi khả năng giày Khang đã đi qua.|Khá cao|Báo cáo sơ bộ bị đọc thành kết luận chắc.",
        "Ghi chú sơ cứu viên Khôi|03/08 23:29|Nhật ký cấp cứu|Khôi ghi Vinh còn mạch yếu khi tiếp cận; dùng giờ xe cứu hộ.|Vinh sống đến lúc nhân viên tới.|Không cho biết thời điểm chấn thương.|Trung bình|Đồng hồ đeo tay Khôi chậm 2 phút.",
        "Phỏng vấn Vân|07/08 17:00|Điều tra viên|Vân thừa nhận đặt câu hỏi gợi ý và đưa một ảnh thay vì bộ ảnh cân bằng.|Thủ tục nhận dạng có nguy cơ dẫn dắt.|Không chứng minh Lan sẽ chọn người khác trong thủ tục chuẩn.|Khá cao|Ghi chú tự đánh giá ban đầu không lưu cùng hồ sơ.",
        "Thông tin số trả trước|10/08 09:17|Nhà mạng|Thuê bao số lạ đăng ký bằng dữ liệu không xác minh, nạp tiền tại nhiều điểm.|Không thể gắn số cho người cụ thể.|Không chứng minh chủ thuê bao là người gây án.|Cao|Một tin báo dân sự phỏng đoán một cửa hàng nhưng không có hóa đơn.",
        "Khảo sát mưa và mặt đường|04/08 06:20|Đơn vị khí tượng|Mưa bụi bắt đầu khoảng 22:10, mặt bậc ẩm không đều.|Có thể ảnh hưởng dấu giày và trượt ngã.|Không xác định người nào trượt hay dấu mới/cũ.|Khá cao|Máy đo đặt cách cầu gần 2 km.",
        "Lịch sử sửa đèn|02/08 16:00|Đơn vị vận hành|Đèn đông báo chập chờn hai ngày trước; chưa hoàn tất sửa.|Điều kiện ánh sáng có vấn đề trước án.|Không cho biết trạng thái chính xác từng phút.|Khá cao|Phiếu sửa chữa đóng trước khi kỹ thuật tới.",
        "Bản khai hàng xóm Khang|04/08 10:20|Điều tra viên|Hàng xóm nghe cửa đóng khoảng 23 giờ nhưng không nhìn thấy Khang.|Một người rời hoặc về khu trọ.|Không định danh chắc người hay giờ.|Thấp-trung bình|Đồng hồ nhà hàng xóm nhanh khoảng năm phút.",
        "Hồ sơ thanh toán Khang|03/08 22:01|Quán Mây|Thanh toán đồ uống qua ví điện tử lúc gần thời điểm camera ghi.|Giao dịch gắn tài khoản Khang.|Không chứng minh anh ở lại quán sau giao dịch.|Khá cao|Thiết bị thanh toán không ghi người thao tác.",
        "Sổ bảo trì đầu ghi|04/08 02:45|Đơn vị vận hành|Kỹ thuật viên ghi mất nguồn thoáng qua và không kiểm tra đồng bộ giờ.|Có gián đoạn tiềm tàng trong ghi hình.|Không xác định đoạn nào bị mất ngoài log lưu.|Trung bình|Giờ ghi sổ lấy từ điện thoại cá nhân.",
        "Bản tổng hợp mâu thuẫn lời khai|10/08 16:18|Thư ký điều tra|Liệt kê Khang sửa vị trí nhưng không thay đổi việc phủ nhận đánh Vinh.|Có điểm không nhất quán và điểm nhất quán.|Không xác định lời nào cố ý gian dối.|Khá cao|Bản công tố trích phần sửa, không trích câu hỏi mơ hồ.",
        "Bản ghi kiểm tra nguồn video|11/08 10:26|Chuyên viên kỹ thuật số|So mã băm bản sao camera với ổ lưu; hai đoạn gốc bị mất trước thời điểm yêu cầu trích xuất.|Các đoạn còn lại không bị thay đổi sau sao lưu.|Không biết nội dung đã ghi đè hoặc lý do mất đoạn.|Khá cao|Không thể xác nhận đồng hồ gốc đã chuẩn."
      ]
    }
  ];

  const categoryLimits = {
    "Legal / procedural": "Không tự chứng minh nội dung sự kiện ngoài phạm vi ghi nhận.",
    "Call / text records": "Không tự xác định người cầm máy, vị trí chính xác hay hành vi bạo lực.",
    "Physical evidence": "Không tự xác định người tạo dấu, thời điểm hay hành vi gây chết người.",
    "Camera / logs": "Không tự nhận dạng người hoặc xác lập thời gian chuẩn ngoài độ lệch đã nêu.",
    "Investigative / medical / witness": "Không tự nhận diện người gây thương tích hoặc loại trừ mọi khả năng khác."
  };

  const INITIAL_EVIDENCE_IDS = new Set([
    "E14001", "E14003", "E14008", "E14010", "E14011", "E14020", "E14021", "E14022",
    "E14025", "E14041", "E14044", "E14045", "E14051", "E14058", "E14065",
    "E14076", "E14080", "E14082", "E14086", "E14087",
    "E14101", "E14102", "E14104", "E14105", "E14107",
    "E14121", "E14122", "E14124", "E14125", "E14129", "E14134", "E14139"
  ]);

  const ISSUE_RULES = [
    ["time", /giờ|mốc|thời điểm|khoảng|tử vong|đồng hồ|timestamp|trôi|lệch|offset|sớm|muộn|phút|ngày/i],
    ["location", /vị trí|tọa độ|sector|vùng phủ|lối|cầu|đường dẫn|địa điểm|tuyến|hướng|khoảng cách|tầm nhìn|bờ/i],
    ["identity", /nhận diện|nhận dạng|danh tính|người dùng|người mang|người cầm|định danh|ai đi|ai gọi|không thấy mặt|bóng người|thuê bao/i],
    ["forensic", /adn|giám định|mẫu|chấn thương|máu|sinh học|dấu giày|vân|bụi|sợi|pháp y|va đập|nhiệt độ|móng tay|độ ẩm/i],
    ["witness", /lời khai|nhân chứng|khai|nghe|thấy|nhớ|lời kể|nhận dạng ảnh|hỏi cung|phỏng vấn/i],
    ["motive", /tranh cãi|mâu thuẫn|khoản tiền|bực|đe dọa|tin nhắn|liên lạc|động cơ|giận/i],
    ["chain", /bàn giao|niêm phong|khay|găng|nhiễm|kiểm soát|túi mẫu|thu mẫu|lấy mẫu|bảo quản|chuỗi|mẫu trắng/i],
    ["alternative", /không xác định|không chứng minh|không loại trừ|có thể|không đủ|chưa rõ|người khác|số lạ|chuyển gián tiếp|ngã|bóng|ngoài vùng/i],
    ["procedure", /biên bản|lệnh|thủ tục|yêu cầu|quyết định|trưng cầu|hồ sơ|phân công|phiếu|bản sao|ghi nhận|sổ giao|phạm vi/i]
  ];

  function classifyIssues(entry) {
    const text = [entry.title, entry.category, entry.content, entry.proves, entry.doesNotProve, entry.contradiction].join(" ");
    const matched = ISSUE_RULES.filter(function (rule) { return rule[1].test(text); }).map(function (rule) { return rule[0]; });
    if (matched.length) return matched;
    if (entry.category === "Legal / procedural") return ["procedure"];
    if (entry.category === "Call / text records") return ["time", "identity"];
    if (entry.category === "Physical evidence") return ["forensic"];
    if (entry.category === "Camera / logs") return ["time", "location"];
    return ["witness"];
  }

  function evidenceLinks(id) {
    const n = Number(id.slice(3));
    let related;
    if (n <= 14040) {
      const i = n - 14001;
      related = [14076 + (i % 25), 14121 + (i % 30)];
    } else if (n <= 14075) {
      const i = n - 14041;
      related = [14101 + (i % 20), 14121 + (i % 30)];
    } else if (n <= 14100) {
      const i = n - 14076;
      related = [14001 + (i % 40), 14121 + (i % 30)];
    } else if (n <= 14120) {
      const i = n - 14101;
      related = [14041 + (i % 35), 14121 + (i % 30)];
    } else {
      const i = n - 14121;
      related = [14001 + (i % 40), 14041 + (i % 35)];
    }
    return related.map(function (v) { return "E" + String(v).padStart(5, "0"); });
  }

  const evidence = [];
  const legalDocs = [];
  EVIDENCE_GROUPS.forEach(function (group) {
    group.rows.forEach(function (raw, index) {
      const p = raw.split("|");
      const id = "E" + String(group.start + index).padStart(5, "0");
      const reliability = p[6];
      const entry = {
        id: id,
        title: p[0],
        category: group.category,
        time: p[1],
        source: p[2],
        content: p[3],
        proves: p[4],
        doesNotProve: categoryLimits[group.category],
        reliability: reliability,
        links: evidenceLinks(id),
        contradiction: p[7],
        issues: [],
        available: INITIAL_EVIDENCE_IDS.has(id)
      };
      entry.issues = classifyIssues(entry);
      evidence.push(entry);
      if (group.start === 14001) {
        legalDocs.push({
          id: "D" + String(index + 1).padStart(3, "0"),
          title: p[0],
          evidenceIds: [id].concat(entry.links),
          summary: p[3] + " Giá trị cần đọc cùng giới hạn: " + p[4]
        });
      }
    });
  });

  const timelineRows = [
    ["20:42", "Tin nhắn Khang", "communications", "Khang nhắc khoản tiền còn tranh chấp.", ["E14041"], "máy chậm 6:20", "±1 phút"],
    ["20:47", "Tin nhắn Vinh", "communications", "Vinh đề nghị nói chuyện sau, không nêu bạo lực.", ["E14042"], "máy Vinh chưa hiệu chuẩn", "±2 phút"],
    ["21:06", "Nhà mạng", "communications", "Cuộc gọi nhỡ đầu tiên từ Khang tới Vinh.", ["E14043"], "giờ mạng", "±42 giây"],
    ["21:14", "Thiết bị Khang", "communications", "Tin nhắn “nói cho rõ” được gửi.", ["E14044"], "máy chậm 6:20", "±1 phút"],
    ["21:21", "Thiết bị Vinh", "communications", "Vinh trả lời để hôm sau tính.", ["E14045"], "máy Vinh trôi giờ", "±2 phút"],
    ["21:33", "Nhà mạng", "communications", "Khang gọi Châu; cuộc gọi kéo dài chưa đầy một phút.", ["E14046"], "giờ mạng", "±42 giây"],
    ["21:39", "Thiết bị Châu", "communications", "Châu hỏi Vinh có gặp Khang không.", ["E14047"], "máy nhanh gần 2 phút", "±1 phút"],
    ["21:52", "Nhà mạng", "communications", "Vinh gọi thuê bao trả trước không xác minh được.", ["E14048"], "giờ mạng", "±42 giây"],
    ["21:58", "Thiết bị Vinh", "communications", "Tin “đang đi” gửi Châu, không nêu đích đến.", ["E14049"], "máy Vinh trôi giờ", "±2 phút"],
    ["21:38", "Camera quán", "camera", "Khang thấy trong quán; đầu ghi nhanh hơn giờ mạng.", ["E14101"], "+3:40 ±0:20", "±20 giây"],
    ["21:50", "Hà", "witness", "Hà bận phục vụ và nhớ Khang ngồi gần cửa.", ["E14130"], "đồng hồ quán nhanh", "khoảng 5 phút"],
    ["21:57", "Hiện trường quán", "physical", "Ly giấy được dùng ở bàn ngoài, thời điểm thu không chắc.", ["E14088"], "không có giờ gốc", "không rõ"],
    ["22:01", "Máy tính tiền", "log", "Một giao dịch đồ uống được ghi nhận.", ["E14089", "E14139"], "quán nhanh 3:40", "±20 giây"],
    ["22:02", "Điện thoại Hà", "communications", "Hà gọi Khang về khoản hóa đơn.", ["E14050"], "máy Hà nhanh", "±2 phút"],
    ["22:04", "Camera cửa quán", "camera", "Bóng dáng rời cửa chính; mặt bị ánh sáng che.", ["E14102"], "+3:40 ±0:20", "±20 giây"],
    ["22:09", "Camera ngõ", "camera", "Đoạn ghi hình mất 11 giây.", ["E14103"], "đồng hồ chưa hiệu chỉnh", "±1 phút"],
    ["22:11", "Nhà mạng", "communications", "Khang gọi Vinh trong 9 giây; hai máy có thể ở sector rộng.", ["E14051", "E14121"], "giờ mạng", "±42 giây"],
    ["22:13", "Thiết bị Khang", "communications", "Khang viết đang chờ “phía này”.", ["E14052"], "máy chậm 6:20", "±1 phút"],
    ["22:14", "Thiết bị Vinh", "communications", "Vinh nhắn “đừng qua”; câu chữ không chỉ rõ địa điểm.", ["E14053"], "máy chưa hiệu chuẩn", "±2 phút"],
    ["22:15", "Camera đường dẫn", "camera", "Bóng người đi về phía bờ, không thấy mặt.", ["E14104"], "+2 phút, dao động", "±1:10"],
    ["22:17", "Tài", "witness", "Tài nghe tiếng nói qua hàng cây, không nhận rõ giọng.", ["E14029"], "sổ ca ghi sau", "±4 phút"],
    ["22:20", "Điện thoại Khang", "communications", "Cuộc gọi thứ hai tới Châu không lưu nội dung.", ["E14054"], "máy chậm 6:20", "±1 phút"],
    ["22:21", "Camera lối lên", "camera", "Hai bóng đi qua cách nhau 18 giây, không thấy tương tác.", ["E14105"], "+2 phút, dao động", "±1:10"],
    ["22:24", "Thiết bị Châu", "communications", "Châu khuyên Khang ngừng nhắn Vinh.", ["E14055"], "máy nhanh gần 2 phút", "±1 phút"],
    ["22:24", "Camera giữa cầu", "camera", "Đầu ghi báo lỗi lấy nét và rung nguồn.", ["E14117"], "đồng hồ máy", "±1:10"],
    ["22:25", "Camera giữa cầu", "camera", "Khung hình không đủ nét để quan sát hành vi.", ["E14106"], "+2 phút, dao động", "±1:10"],
    ["22:27", "Nhà mạng", "communications", "Vinh nhận cuộc gọi 6 giây từ số lạ.", ["E14056"], "giờ mạng", "±42 giây"],
    ["22:29", "Lan", "witness", "Lan chạy qua tuyến bờ đông, chưa thấy nạn nhân theo lời ban đầu.", ["E14128"], "đồng hồ thể thao", "±3 phút"],
    ["22:31", "Thiết bị Vinh", "communications", "Tin “tới rồi” được gửi đến số trả trước.", ["E14057"], "máy trôi giờ", "±2 phút"],
    ["22:32", "Sổ chốt", "log", "Tài ghi một vòng tuần tra ở đầu tây.", ["E14111"], "ghi sau hành trình", "±4 phút"],
    ["22:34", "Nhật ký Khang", "communications", "Cuộc gọi nhỡ từ Khang tới Vinh.", ["E14058"], "máy chậm 6:20", "±1 phút"],
    ["22:36", "Thiết bị Vinh", "digital", "Bản nháp phản hồi chưa gửi được tìm thấy sau đó.", ["E14059"], "giờ máy trôi", "±2 phút"],
    ["22:38", "Đồng hồ Vinh", "physical", "Kim đồng hồ dừng, bộ máy chưa kiểm tra.", ["E14100"], "không rõ", "có thể dừng trước"],
    ["22:39", "Camera lối đông", "camera", "Một bóng người đi nhanh xuống bậc, mặt quay khỏi ống kính.", ["E14107"], "+2 phút, dao động", "±1:10"],
    ["22:42", "Nhà mạng", "communications", "Châu gọi Vinh nhưng không có trả lời.", ["E14060"], "giờ mạng", "±42 giây"],
    ["22:44", "Mạng di động", "log", "Thiết bị Vinh chuyển sector trong vùng chồng lấn.", ["E14061", "E14121"], "giờ mạng", "±42 giây"],
    ["22:46", "Thiết bị Khang", "communications", "Tin “tôi về” được gửi; không xác nhận người nhận đọc.", ["E14062"], "máy chậm 6:20", "±1 phút"],
    ["22:46", "Camera cửa hàng đông", "camera", "Đèn xe che khung khi một bóng đi qua mép hình.", ["E14108"], "đồng hồ chưa hiệu chuẩn", "±2 phút"],
    ["22:49", "Nhà mạng", "communications", "Số lạ gọi Vinh rồi ngắt sau hai hồi chuông.", ["E14063"], "giờ mạng", "±42 giây"],
    ["22:51", "Điện thoại Khang", "communications", "Khang gọi Hà để nói về hóa đơn.", ["E14064"], "máy chậm 6:20", "±1 phút"],
    ["22:52", "Camera bãi xe", "camera", "Phần còn lưu không thấy xe ra, nhưng ổ đã ghi đè.", ["E14109"], "đồng hồ máy", "±2 phút"],
    ["22:54", "Nhà mạng", "communications", "Cuộc gọi từ Vinh đến Châu không được trả lời.", ["E14065"], "giờ mạng", "±42 giây"],
    ["22:55", "Khung tử vong", "medical", "Mốc này nằm trong khoảng pháp y chứ không phải giờ chết chính xác.", ["E14122"], "ước tính sinh học", "±15 phút"],
    ["22:57", "GPS xe điện", "log", "Xe của Hải dừng gần cầu khoảng 74 giây.", ["E14110"], "GPS sai số 18–35m", "±1 phút"],
    ["23:00", "Cửa hàng đông", "witness", "Hải thấy bóng phản chiếu nhưng không nhận diện ai.", ["E14133"], "ký ức sau sự kiện", "±5 phút"],
    ["23:08", "Tài", "communications", "Tài gọi báo có người nằm gần bậc đông.", ["E14066", "E14112"], "chốt chậm 3 phút", "±3 phút"],
    ["23:14", "Tổng đài cứu hộ", "emergency", "Trung tâm điều xe theo giờ mạng.", ["E14067", "E14113"], "giờ máy chủ", "±42 giây"],
    ["23:18", "GPS xe cứu hộ", "emergency", "Xe tiếp cận lối đông với sai số vị trí 11m.", ["E14114"], "GPS", "±30 giây"],
    ["23:21", "Khôi", "witness", "Sơ cứu viên tiếp cận; ghi mạch yếu và bắt đầu xử trí.", ["E14135"], "đồng hồ chậm 2 phút", "±2 phút"],
    ["23:24", "Hiện trường", "physical", "Giọt máu thấy ở cạnh bậc thứ ba.", ["E14077"], "đo sau", "±3 phút"],
    ["23:29", "Nhật ký cấp cứu", "medical", "Khôi ghi tình trạng nạn nhân sau khi tiếp cận.", ["E14135"], "đồng hồ chậm 2 phút", "±2 phút"],
    ["23:36", "Trực ban", "procedure", "Tin báo được tiếp nhận, đầu mối ban đầu ghi sai lối cầu.", ["E14001"], "giờ tổng đài", "±42 giây"],
    ["23:44", "Đội hiện trường", "procedure", "Phân công bảo vệ hai đầu, chưa lập vùng đệm ở lan can.", ["E14002"], "đồng hồ trực ban", "±1 phút"],
    ["23:48", "Lan", "witness", "Lan báo thấy người nằm và bóng rời đi, không nhận mặt.", ["E14030"], "ước theo đồng hồ chạy", "±4 phút"],
    ["00:12", "Điều tra viên", "procedure", "Khám nghiệm sơ bộ ghi vị trí nằm và vệt kéo ngắn.", ["E14003"], "giờ hiện trường", "±2 phút"],
    ["00:18", "Nhân viên cứu hộ", "log", "Đo nhiệt độ sau khi nạn nhân đã được phủ chăn.", ["E14123"], "thiết bị cầm tay", "không hiệu chuẩn"],
    ["00:21", "Kỹ thuật viên", "physical", "Chụp vết máu ở bậc đá.", ["E14077"], "đồng hồ hiện trường", "±2 phút"],
    ["00:29", "Kỹ thuật viên", "physical", "Ghi vệt bùn ở bậc tây sau khi cứu hộ đi qua.", ["E14097"], "đồng hồ hiện trường", "±2 phút"],
    ["00:33", "Kỹ thuật viên", "physical", "Phát hiện dấu giày mờ chồng lấn.", ["E14080"], "đồng hồ hiện trường", "±2 phút"],
    ["00:38", "Điều tra viên", "procedure", "Ban hành yêu cầu khám nghiệm tử thi.", ["E14020"], "giờ trực", "±1 phút"],
    ["00:40", "Tổ hiện trường", "physical", "Thu túi giấy ướt, không có nhãn nhận dạng.", ["E14090"], "giờ hiện trường", "±2 phút"],
    ["00:47", "Tổ hiện trường", "physical", "Tìm điện thoại Vinh gần người bị nạn.", ["E14087"], "giờ hiện trường", "±2 phút"],
    ["00:50", "Tổ hiện trường", "physical", "Ghi áo Vinh và vết quệt trên tay áo.", ["E14076"], "giờ hiện trường", "±2 phút"],
    ["00:52", "Điều tra viên", "procedure", "Yêu cầu trích xuất camera quán trong khoảng giờ rộng.", ["E14027"], "giờ trực", "±1 phút"],
    ["00:54", "Kỹ thuật viên", "procedure", "Áo được gấp trên khay không rõ tấm lót.", ["E14008"], "đồng hồ bàn", "±2 phút"],
    ["00:58", "Lan", "statement", "Lan khai lần đầu rằng mặt người rời đi bị khuất.", ["E14030"], "giờ điều tra", "±2 phút"],
    ["01:05", "Đội kỹ thuật", "procedure", "Sao lưu camera quán và đường dẫn, một tệp lỗi khung.", ["E14014"], "giờ sao lưu", "±2 phút"],
    ["01:10", "Tổ lấy mẫu", "physical", "Quệt lan can đông trước mẫu lan can tây.", ["E14078", "E14035"], "giờ hiện trường", "±2 phút"],
    ["01:18", "Tổ lấy mẫu", "physical", "Lấy mẫu lan can tây, thời điểm đổi găng không ghi.", ["E14079", "E14035"], "giờ hiện trường", "±2 phút"],
    ["01:20", "Cán bộ bảo quản", "procedure", "Hai túi mẫu đi chung lượt bàn giao.", ["E14009"], "giờ giao ca", "±2 phút"],
    ["01:22", "Tổ lấy mẫu", "physical", "Thu sợi xanh sẫm không xác định được loại.", ["E14084"], "giờ hiện trường", "±2 phút"],
    ["01:25", "Hà", "statement", "Hà ước lượng Khang rời quán gần mười giờ.", ["E14028"], "không dùng đồng hồ cá nhân", "±10 phút"],
    ["01:32", "Kỹ thuật viên", "physical", "Tìm mảnh nhựa cũ trong rãnh thoát nước.", ["E14098"], "giờ hiện trường", "±2 phút"],
    ["01:42", "Pháp y", "medical", "Lấy mẫu đối chiếu Vinh tại bệnh viện.", ["E14015"], "giờ bệnh viện", "±1 phút"],
    ["01:56", "Kỹ thuật viên", "physical", "Chụp dấu giày với thước đặt lệch mặt phẳng.", ["E14081"], "giờ hiện trường", "±2 phút"],
    ["02:03", "Phòng xét nghiệm", "procedure", "Nhận túi áo đã mở để sàng lọc và niêm phong lại.", ["E14016"], "giờ lab", "±1 phút"],
    ["02:12", "Phòng khám nghiệm", "physical", "Ghi vết xước cũ trên điện thoại Vinh.", ["E14093"], "giờ khám nghiệm", "±1 phút"],
    ["02:20", "Kỹ thuật hình sự", "procedure", "Lập sơ đồ bổ sung với mốc lan can tây.", ["E14004"], "đồng hồ hiện trường", "±3 phút"],
    ["02:45", "Đơn vị vận hành", "log", "Ghi chú đầu ghi cầu mất nguồn thoáng qua.", ["E14119"], "giờ điện thoại kỹ thuật", "±2 phút"],
    ["03:10", "Tài", "statement", "Tài khai nghe hai giọng nhưng chỉ thấy bóng qua hàng rào.", ["E14029"], "sổ ca", "±5 phút"],
    ["03:18", "Kỹ thuật viên", "camera", "Trích xuất hai đoạn bóng người, không nhận diện được mặt.", ["E14037"], "camera lệch chưa đo", "±2 phút"],
    ["04:00", "Tổ bảo vệ", "procedure", "Đo lại tuyến tuần tra và khoảng cách chốt đến bậc cầu.", ["E14031"], "bản đồ đo", "±1m"],
    ["05:06", "Bệnh viện", "medical", "Mẫu móng tay trái có lượng biểu mô thấp.", ["E14092"], "giờ bệnh viện", "±1 phút"],
    ["05:13", "Bệnh viện", "medical", "Mẫu móng tay phải không đủ định kiểu.", ["E14093"], "giờ bệnh viện", "±1 phút"],
    ["05:30", "Bác sĩ pháp y", "medical", "Xác định chấn thương đầu và cửa sổ tử vong rộng.", ["E14021", "E14122"], "giờ bệnh viện", "±5 phút"],
    ["05:42", "Bác sĩ pháp y", "medical", "Nhiều cơ chế va đập có thể phù hợp hình thái chấn thương.", ["E14124"], "giờ bệnh viện", "±5 phút"],
    ["06:05", "Thẩm phán trực", "procedure", "Cho phép khám xét phòng trọ Khang.", ["E14005"], "giờ văn bản", "±1 phút"],
    ["06:44", "Điều tra viên", "procedure", "Thu điện thoại Khang đang khóa.", ["E14012"], "giờ hiện trường", "±2 phút"],
    ["07:11", "Tổ khám xét", "procedure", "Thu đôi giày và áo xanh đậm tại phòng trọ.", ["E14006", "E14032"], "giờ tổ", "±2 phút"],
    ["07:50", "Châu", "statement", "Châu kể hai người bất đồng tiền bạc, không nghe đe dọa đánh.", ["E14134"], "giờ khai", "±3 phút"],
    ["08:02", "Thư ký điều tra", "procedure", "Lập danh mục vật chứng có một dòng sửa mực.", ["E14007"], "giờ văn phòng", "±2 phút"],
    ["08:05", "Điều tra viên", "procedure", "Trưng cầu so sánh dấu giày, yêu cầu ban đầu viết rộng.", ["E14033"], "giờ văn bản", "±1 phút"],
    ["08:11", "Kỹ thuật viên An", "statement", "Ghi lỗi màu và vùng giữa cầu mất nét.", ["E14136"], "giờ sổ kỹ thuật", "±2 phút"],
    ["08:20", "Điều tra viên", "procedure", "Yêu cầu so sánh ADN mẫu tay áo với mẫu hai người.", ["E14017"], "giờ văn bản", "±1 phút"],
    ["08:36", "Tổ khám xét", "procedure", "Niêm phong giày trong túi giấy, không tháo dây.", ["E14032"], "giờ tổ", "±2 phút"],
    ["09:02", "Phòng giám định", "physical", "Phân tích bụi đế thấy khoáng phổ biến.", ["E14083"], "giờ lab", "±1 phút"],
    ["09:12", "Chuyên viên số", "digital", "Ước lượng điện thoại Khang chậm hơn giờ mạng 6 phút 20 giây.", ["E14038"], "đo sau sự kiện", "có thể trôi"],
    ["09:18", "Điều tra viên", "procedure", "Gửi yêu cầu trích xuất dữ liệu nhà mạng.", ["E14010"], "giờ văn bản", "±1 phút"],
    ["09:40", "Khang", "statement", "Lời khai đầu nói quanh khu bến, phủ nhận tới cầu.", ["E14022"], "đồng hồ hỏi cung", "±1 phút"],
    ["10:31", "Chuyên viên số", "digital", "Sao lưu điện thoại, ghi mã băm và pin thấp.", ["E14013"], "giờ phòng lab", "±1 phút"],
    ["11:42", "Phòng lấy mẫu", "procedure", "Lấy mẫu tham chiếu Khang có nhân chứng.", ["E14095"], "giờ phòng lab", "±1 phút"],
    ["12:30", "Điều tra viên", "investigation", "Xác minh cửa hông quán không có camera.", ["E14039"], "giờ văn phòng", "±2 phút"],
    ["13:15", "Khang", "statement", "Khang thừa nhận đứng gần lối tây và gọi Vinh.", ["E14023"], "máy chưa hiệu chỉnh", "±2 phút"],
    ["14:07", "Nhà mạng", "procedure", "Trả bản ghi có sector và lưu ý tải mạng.", ["E14011", "E14070"], "giờ mạng", "±42 giây"],
    ["15:10", "Chuyên viên mạng", "analysis", "Bản đồ cho thấy vùng sector chồng lấn nhiều tuyến.", ["E14121"], "bản đồ phiên bản sau", "vùng rộng"],
    ["16:10", "Phòng xét nghiệm", "forensic", "Mẫu hỗn hợp chạy với kiểm soát âm tính thiếu thể tích.", ["E14018"], "giờ lab", "±1 phút"],
    ["08/08 10:00", "Điều tra viên", "analysis", "Ước lượng đường đi bộ tới lối tây trong 7–13 phút.", ["E14126"], "ước lượng tuyến", "±3 phút"],
    ["08/08 11:15", "Kỹ thuật hiện trường", "analysis", "Đánh giá hàng cây chắn tầm nhìn của chốt Tài.", ["E14127"], "đo ban ngày", "khác điều kiện đêm"],
    ["08/08 12:04", "Đơn vị chiếu sáng", "analysis", "Ghi một vùng tối do đèn đông chập chờn.", ["E14128"], "khảo sát sau án", "±2m"],
    ["08/08 15:40", "Kiểm soát chất lượng", "forensic", "Rà soát thiếu ghi nhận thay găng, không kết luận đã nhiễm chéo.", ["E14138"], "hồi cứu", "không áp dụng"],
    ["09/08 09:30", "Chuyên gia trí nhớ", "analysis", "Đánh giá thủ tục ảnh đơn lẻ có nguy cơ làm tăng tự tin.", ["E14129", "E14025"], "hồi cứu", "không định lượng"],
    ["09/08 14:05", "Phương", "testimony", "Giải thích ADN tương thích không đồng nghĩa nguồn duy nhất.", ["E14139"], "giờ lấy lời khai", "±2 phút"],
    ["09/08 15:12", "Bình", "testimony", "Nói ảnh dấu giày không cá thể hóa một đôi.", ["E14140"], "giờ lấy lời khai", "±2 phút"],
    ["10/08 16:18", "Thư ký điều tra", "analysis", "Tổng hợp lời khai sửa đổi và phần vẫn phủ nhận bạo lực.", ["E14150"], "giờ văn phòng", "±2 phút"]
  ];

  const timeline = timelineRows.map(function (r, i) {
    return {
      id: "T" + String(i + 1).padStart(3, "0"),
      time: r[0],
      source: r[1],
      type: r[2],
      description: r[3],
      links: r[4],
      clockOffset: r[5],
      uncertainty: r[6]
    };
  });

  const witnesses = [
    {
      id: "W01", name: "Lê Thu Hà", role: "Chủ quán Mây", initialStatements: ["Tôi nhớ Khang ngồi ngoài gần cửa.", "Anh ấy rời quán khoảng gần mười giờ."], supplementalStatements: ["Video khiến tôi nghĩ anh ra cửa chính.", "Tôi không nhìn thấy lối hông khi đang dọn bàn.", "Tôi gọi anh vì hóa đơn, chứ không biết anh đang ở đâu."], motiveToLieOrMisremember: "Bận phục vụ, sợ bị trách để khách đi chưa trả hóa đơn; dễ neo trí nhớ vào giờ máy.", trulyKnows: "Khang có mặt ở quán một phần buổi tối; Hà gọi hỏi hóa đơn.", thinksKnows: "Cho rằng mình nhớ được phút Khang rời quán.", verifiableInfo: "Hóa đơn, giao dịch ví, video quán và lịch gọi.", contradiction: "Mốc ban đầu gần mười giờ khác 22:04 theo video chưa hiệu chỉnh; không biết lối ra."
    },
    {
      id: "W02", name: "Ngô Đức Tài", role: "Bảo vệ lối tây", initialStatements: ["Tôi nghe tiếng cãi ở xa.", "Chỉ thấy một bóng qua hàng cây."], supplementalStatements: ["Có thể người đó mặc áo tối.", "Sau khi thấy ảnh, tôi nghĩ dáng giống Khang.", "Tôi ghi sổ tuần tra sau khi quay về chốt."], motiveToLieOrMisremember: "Muốn tránh kỷ luật vì rời chốt; ca đêm mệt và tiếp xúc bản tin nội bộ.", trulyKnows: "Nghe hai giọng hoặc âm thanh giống tranh cãi; tầm nhìn bị chắn.", thinksKnows: "Cho rằng bóng dáng là Khang.", verifiableInfo: "Sổ tuần tra, vị trí chốt, sơ đồ cây và cuộc gọi báo tin.", contradiction: "Khai đầu không nhận mặt; nhận dạng xuất hiện sau khi xem ảnh."
    },
    {
      id: "W03", name: "Vũ Ngọc Lan", role: "Người chạy bộ", initialStatements: ["Tôi thấy người nằm gần bậc đông.", "Bóng người rời đi không lộ mặt."], supplementalStatements: ["Tôi nhớ người đó cao vừa phải.", "Trong ảnh một người, tôi nhận ra nét giống Khang.", "Tôi không thể nói chắc người trong ảnh là bóng tôi đã thấy."], motiveToLieOrMisremember: "Muốn giúp điều tra, trí nhớ thị giác bị ảnh hưởng bởi bóng tối và thông tin sau sự kiện.", trulyKnows: "Thấy nạn nhân và một bóng rời đi từ xa.", thinksKnows: "Tin rằng mình nhận ra Khang sau thủ tục ảnh.", verifiableInfo: "Tuyến chạy, dữ liệu đồng hồ thể thao và thời điểm gọi báo.", contradiction: "Từ “không thấy mặt” chuyển thành nhận diện sau khi nghe có người bị bắt."
    },
    {
      id: "W04", name: "Phan Hải", role: "Lái xe điện", initialStatements: ["Xe tôi dừng gần phía đông.", "Tôi thấy một bóng phản chiếu trên kính."], supplementalStatements: ["Có khách xuống trước điểm dừng.", "Tôi không biết khách là ai.", "Tôi không thể nhận dạng bóng phản chiếu đó."], motiveToLieOrMisremember: "Muốn lời kể có ích; mệt và nhìn qua phản chiếu.", trulyKnows: "Xe dừng gần cầu và có khách xuống ở đoạn tuyến.", thinksKnows: "Nghĩ bóng phản chiếu đi về phía cầu.", verifiableInfo: "GPS xe, nhật ký chuyến và camera xe.", contradiction: "Vị trí nhớ lại lệch khoảng 30 mét so với GPS."
    },
    {
      id: "W05", name: "Đặng Bảo Châu", role: "Bạn của Vinh", initialStatements: ["Khang và Vinh bất đồng chuyện tiền.", "Khang có vẻ bực."], supplementalStatements: ["Tôi từng nghe Khang nói sẽ xử lý cho xong.", "Tôi không nghe anh ấy dọa đánh.", "Tôi không biết họ có gặp nhau sau tin nhắn cuối."], motiveToLieOrMisremember: "Bảo vệ bạn đã mất; diễn giải câu chữ mơ hồ theo cảm xúc.", trulyKnows: "Có tranh cãi tiền và trao đổi tin nhắn; Châu khuyên hai bên dừng lại.", thinksKnows: "Tin mâu thuẫn khiến Khang có thể tìm Vinh.", verifiableInfo: "Bản chat, các cuộc gọi và giao dịch tiền.", contradiction: "Cụm “sẽ xử lý” là diễn giải, không phải trích dẫn nguyên văn."
    },
    {
      id: "W06", name: "Mai Quốc Dũng", role: "Đồng nghiệp Khang", initialStatements: ["Tôi gặp Khang ở ca chiều.", "Khang nói có việc riêng sau ca."], supplementalStatements: ["Có thể hôm đó là ngày thứ năm.", "Tôi không biết anh đi đâu sau khi tan ca.", "Tôi chỉ chắc đã gặp anh trước khi hết ca."], motiveToLieOrMisremember: "Lịch ca thay đổi, muốn bảo vệ đồng nghiệp; nhầm thứ trong tuần.", trulyKnows: "Đã gặp Khang đầu tối ở nơi làm việc.", thinksKnows: "Cho rằng Khang về phòng trọ sau ca.", verifiableInfo: "Bảng chấm công và lịch phân ca.", contradiction: "Mốc ngày trong lời đầu không khớp bảng chấm công."
    },
    {
      id: "W07", name: "Trịnh Mỹ An", role: "Kỹ thuật viên camera", initialStatements: ["Camera cầu có lỗi màu.", "Tôi không đọc được mặt người trong hình."], supplementalStatements: ["Có một bóng dáng cao vừa.", "Tôi không thể gọi đó là Khang.", "Tôi chỉ tin được những khung còn nguyên dữ liệu."], motiveToLieOrMisremember: "Bị thúc giục đưa nhận định nhanh, tự tin vào kinh nghiệm hình ảnh.", trulyKnows: "Camera mất nét, lệch giờ và có đoạn lỗi.", thinksKnows: "Cho rằng có thể đoán vóc dáng tương đối.", verifiableInfo: "Log bảo trì, tệp gốc và bản hiệu chỉnh đồng hồ.", contradiction: "Tóm tắt miệng ban đầu ghi “cùng vóc dáng”, sổ kỹ thuật không nhận diện."
    },
    {
      id: "W08", name: "Bùi Khánh", role: "Chuyên viên nhà mạng", initialStatements: ["Thuê bao kết nối sector gần cầu.", "Bản ghi có thời gian mạng."], supplementalStatements: ["Sector có thể phủ cả hai bờ.", "Thiết bị có thể do người khác cầm.", "Không có tọa độ GPS trong bản ghi này."], motiveToLieOrMisremember: "Ngôn ngữ kỹ thuật bị rút gọn khi hỏi nhanh; muốn tránh giải thích dài.", trulyKnows: "Thiết bị thuê bao đã kết nối các sector xác định.", thinksKnows: "Ban đầu nghĩ từ “sector cầu” đủ mô tả vùng.", verifiableInfo: "Bản ghi gốc, sơ đồ sector, log tải và múi giờ.", contradiction: "Bản hỏi cung ghi ông khẳng định máy ở cầu; ông phủ nhận câu chữ ấy."
    },
    {
      id: "W09", name: "Đỗ Phương", role: "Kỹ thuật viên ADN", initialStatements: ["Một thành phần mẫu hỗn hợp tương thích Khang.", "Lượng mẫu thấp."], supplementalStatements: ["Không thể gọi là nguồn duy nhất.", "Không xác định được lúc dấu vết xuất hiện.", "Tôi không thể kết luận cách dấu vết tới tay áo."], motiveToLieOrMisremember: "Thuật ngữ thống kê dễ bị chuyển thành kết luận chắc; áp lực báo cáo sớm.", trulyKnows: "Kết quả sàng lọc và so sánh có giới hạn; kiểm soát âm tính thiếu thể tích.", thinksKnows: "Tin ban đầu rằng quy trình đủ để báo một kết quả tương thích.", verifiableInfo: "Dữ liệu máy, hồ sơ mẫu, mã băm và nhật ký kiểm soát.", contradiction: "Tóm tắt điều tra dùng “trùng khớp”, báo cáo chỉ ghi “tương thích”."
    },
    {
      id: "W10", name: "Lý Thanh Bình", role: "Giám định viên dấu giày", initialStatements: ["Kích thước dấu gần cỡ 42.", "Có hai đoạn vân tương tự đế phổ thông."], supplementalStatements: ["Ảnh không đủ độ sâu để kết luận một đôi.", "Tôi không thể định danh người mang.", "Không có cơ sở kết luận hướng đi từ các phần vân này."], motiveToLieOrMisremember: "Câu hỏi dùng thuật ngữ “đúng đôi” và áp lực trả lời nhị phân.", trulyKnows: "Dấu mờ, bị chồng, ảnh thước xiên; hoa văn phổ biến.", thinksKnows: "Thấy sự tương tự ban đầu giữa dấu và đế.", verifiableInfo: "Ảnh gốc, thước tỷ lệ, giày thu giữ và phiếu giám định.", contradiction: "Bản sơ bộ bị trích thành xác nhận nguồn dù Bình chỉ nói không loại trừ."
    },
    {
      id: "W11", name: "Nguyễn Khôi", role: "Nhân viên sơ cứu", initialStatements: ["Tôi tiếp cận Vinh lúc còn mạch yếu.", "Tôi ghi giờ theo đồng hồ xe."], supplementalStatements: ["Đồng hồ của tôi chậm khoảng hai phút.", "Tôi không biết nạn nhân bị thương lúc nào.", "Tôi chỉ có thể xác nhận tình trạng khi tới nơi."], motiveToLieOrMisremember: "Làm việc trong tình huống căng thẳng; đồng hồ cá nhân không đồng bộ.", trulyKnows: "Thời điểm tiếp cận và tình trạng khi sơ cứu.", thinksKnows: "Ước rằng cuộc gọi cứu hộ đến ngay sau lúc phát hiện.", verifiableInfo: "GPS xe, nhật ký điều phối và phiếu cấp cứu.", contradiction: "Giờ trên ghi chú tay khác giờ máy chủ cứu hộ."
    },
    {
      id: "W12", name: "Tạ Minh Vân", role: "Điều tra viên", initialStatements: ["Lan đã nhận ra người trong ảnh.", "Khang lúc đầu nói không tới cầu."], supplementalStatements: ["Tôi chỉ đưa một ảnh do muốn kiểm tra nhanh.", "Tôi đã nghe Lan nói mặt người bị khuất.", "Tôi không ghi lý do không dùng bộ ảnh cân bằng."], motiveToLieOrMisremember: "Thiên kiến xác nhận sau khi xác định nghi can; muốn bảo vệ lựa chọn thủ tục.", trulyKnows: "Cách hỏi và thứ tự xem ảnh; các lời khai của Khang.", thinksKnows: "Cho rằng lời khai sửa đổi biểu hiện che giấu.", verifiableInfo: "Ghi âm, sổ ảnh, camera phòng hỏi và biên bản gốc.", contradiction: "Bản tổng hợp gọi nhận dạng độc lập dù ảnh đơn lẻ được đưa sau gợi ý."
    }
  ];

  const witnessEvidence = {
    W01: ["E14101", "E14102", "E14050", "E14139"],
    W02: ["E14029", "E14031", "E14111", "E14066"],
    W03: ["E14030", "E14129", "E14025", "E14128"],
    W04: ["E14110", "E14133", "E14108", "E14066"],
    W05: ["E14041", "E14042", "E14046", "E14134"],
    W06: ["E14006", "E14012", "E14022", "E14150"],
    W07: ["E14014", "E14036", "E14117", "E14118"],
    W08: ["E14011", "E14070", "E14121", "E14061"],
    W09: ["E14018", "E14019", "E14138", "E14139"],
    W10: ["E14033", "E14034", "E14140", "E14080"],
    W11: ["E14113", "E14114", "E14135", "E14122"],
    W12: ["E14024", "E14025", "E14026", "E14027"]
  };
  witnesses.forEach(function (witness) {
    witness.statements = witness.initialStatements.concat(witness.supplementalStatements);
    witness.knows = witness.trulyKnows;
    witness.assumes = witness.thinksKnows;
    witness.motive = witness.motiveToLieOrMisremember;
    witness.verifiable = witness.verifiableInfo;
    witness.evidenceIds = witnessEvidence[witness.id];
  });

  const hypotheses = [
    { id: "H1", title: "Khang gây thương tích chết người", status: "Giả thuyết buộc tội", basis: ["tranh cãi", "liên lạc", "hiện diện vùng", "dấu vết tương thích"], limitation: "Không chứng cứ trực tiếp về cú đánh; từng mắt xích có giới hạn riêng." },
    { id: "H2", title: "Khang ở gần nhưng người khác gây thương tích", status: "Khả năng chưa kiểm chứng", basis: ["lời khai Khang sau bổ sung", "sector rộng", "thời điểm không khớp chặt"], limitation: "Không có chứng cứ đủ chứng minh Khang rời đi trước cuộc đánh." },
    { id: "H3", title: "Người thứ ba gặp Vinh độc lập với Khang", status: "Khả năng mở", basis: ["số trả trước", "bóng người không nhận diện", "lời khai Vinh đang đi"], limitation: "Không xác định được người, nội dung cuộc gặp hay hành vi." },
    { id: "H4", title: "ADN được chuyển gián tiếp hoặc đã có từ trước", status: "Khả năng về cơ chế dấu vết", basis: ["mẫu hỗn hợp lượng thấp", "khay dùng chung", "thiếu ghi nhận đổi găng"], limitation: "Không có chứng cứ xác nhận đã xảy ra chuyển nhiễm." },
    { id: "H5", title: "Nhân chứng nhầm người do điều kiện nhìn và gợi ý", status: "Khả năng về nhận dạng", basis: ["bóng tối", "không thấy mặt ban đầu", "ảnh đơn lẻ"], limitation: "Không chứng minh Lan/Tài cố ý khai sai." },
    { id: "H6", title: "Thiết bị Khang ở trong vùng nhưng người khác mang", status: "Khả năng kỹ thuật", basis: ["sector rộng", "không có định vị liên tục", "thiết bị-vs-người"], limitation: "Không có chứng cứ máy đã bị người khác cầm tối đó." },
    { id: "H7", title: "Vinh tự ngã sau khi trượt", status: "Ngõ cụt chưa được chứng minh", basis: ["mặt đường ẩm", "chấn thương có nhiều cơ chế"], limitation: "Pháp y không xác định cơ chế này; không phải kết luận nội bộ." }
  ];

  const strategyCategories = [
    { id: "time", title: "Hiệu chỉnh thời gian", evidenceIds: ["E14101", "E14104", "E14038", "E14122", "E14113"], objective: "Dùng khoảng và offset; không biến timestamp thiết bị thành giờ gây án." },
    { id: "device", title: "Thiết bị và vùng phủ", evidenceIds: ["E14011", "E14070", "E14121", "E14061"], objective: "Tách dữ liệu thuê bao khỏi danh tính người mang và sector khỏi tọa độ." },
    { id: "trace", title: "Giới hạn dấu vết", evidenceIds: ["E14019", "E14018", "E14035", "E14082", "E14085"], objective: "Phân biệt tương thích nguồn với thời điểm, cơ chế chuyển và hành vi." },
    { id: "identity", title: "Độ tin cậy nhận dạng", evidenceIds: ["E14025", "E14026", "E14129", "E14131", "E14132"], objective: "Đối chiếu lần nhìn đầu và thủ tục ảnh sau gợi ý." },
    { id: "statement", title: "Mâu thuẫn lời khai", evidenceIds: ["E14022", "E14023", "E14024", "E14150"], objective: "Thừa nhận việc sửa lời khai nhưng kiểm tra câu hỏi, ngữ cảnh và phần không đổi." },
    { id: "chain", title: "Chuỗi bảo quản", evidenceIds: ["E14008", "E14009", "E14016", "E14138"], objective: "Đánh giá thiếu sót cụ thể mà không khẳng định đã có nhiễm bẩn." }
  ];

  const courtPhases = [
    { id: "step01", stage: "Thủ tục", title: "Khai mạc phiên tòa", prompt: "Xác định phạm vi cáo buộc và điểm nào còn phải được chứng minh.", issue: "procedure", evidenceIds: ["E14001", "E14141"] },
    { id: "step02", stage: "Công tố", title: "Công bố luận cứ buộc tội", prompt: "Tách dữ kiện nền về tranh cãi khỏi suy luận rằng Khang đã dùng bạo lực.", issue: "motive", evidenceIds: ["E14041", "E14044", "E14134"] },
    { id: "step03", stage: "Chứng cứ", title: "Đối chiếu liên lạc", prompt: "Làm rõ nội dung tin nhắn chứng minh mâu thuẫn đến đâu và điều gì vẫn chưa được xác lập.", issue: "motive", evidenceIds: ["E14041", "E14045", "E14052"] },
    { id: "step04", stage: "Chứng cứ", title: "Kiểm tra thời gian thiết bị", prompt: "Đặt giờ máy, giờ mạng và khoảng bất định cạnh nhau thay vì chọn một mốc duy nhất.", issue: "time", evidenceIds: ["E14038", "E14051", "E14118"] },
    { id: "step05", stage: "Chứng cứ", title: "Xem xét vị trí và sector", prompt: "Hỏi vùng phủ xác định vị trí thiết bị rộng tới đâu và có nhận diện người mang không.", issue: "location", evidenceIds: ["E14011", "E14070", "E14121"] },
    { id: "step06", stage: "Nhân chứng", title: "Đối chất về nhận dạng", prompt: "Đối chiếu lời kể ban đầu với ảnh đơn lẻ và thông tin được nghe sau đó.", issue: "identity", evidenceIds: ["E14025", "E14026", "E14129"] },
    { id: "step07", stage: "Nhân chứng", title: "Kiểm tra lời khai tại hiện trường", prompt: "Phân biệt điều Tài nghe hoặc nhìn thấy với suy đoán về danh tính.", issue: "witness", evidenceIds: ["E14029", "E14031", "E14127"] },
    { id: "step08", stage: "Giám định", title: "Đánh giá ADN", prompt: "Hỏi kết quả tương thích có thể kết luận về nguồn, thời điểm và hành vi ở mức nào.", issue: "forensic", evidenceIds: ["E14018", "E14019", "E14139"] },
    { id: "step09", stage: "Giám định", title: "Rà soát chuỗi bảo quản", prompt: "Xác định thiếu sót ghi nhận làm giảm độ chắc chắn ra sao mà không mặc định đã nhiễm bẩn.", issue: "chain", evidenceIds: ["E14008", "E14009", "E14016", "E14138"] },
    { id: "step10", stage: "Giám định", title: "Kiểm tra dấu giày và chấn thương", prompt: "Tách sự tương tự kích cỡ/hình thái khỏi nhận dạng cá thể và cơ chế gây thương tích.", issue: "forensic", evidenceIds: ["E14080", "E14081", "E14033", "E14124"] },
    { id: "step11", stage: "Bào chữa", title: "Đối chiếu lời khai Khang", prompt: "Thừa nhận thay đổi lời khai; xem câu hỏi, offset và phần phủ nhận hành vi còn nhất quán.", issue: "witness", evidenceIds: ["E14022", "E14023", "E14024", "E14150"] },
    { id: "step12", stage: "Bào chữa", title: "Kiểm tra giả thuyết thay thế", prompt: "Nêu khả năng khác như giới hạn suy luận; không biến một người chưa nhận dạng thành thủ phạm.", issue: "alternative", evidenceIds: ["E14048", "E14056", "E14107", "E14121"] },
    { id: "step13", stage: "Nhận định", title: "Kết luận về từng mắt xích", prompt: "Đánh giá tổng thể động cơ, thời gian, vị trí, nhận dạng và vật chứng mà không cộng điểm cơ học.", issue: "procedure", evidenceIds: ["E14040", "E14122", "E14129", "E14150"] }
  ];

  const outcomes = [
    { id: "O1", title: "Không đủ căn cứ kết tội", result: "Tuyên bị cáo không phạm tội đối với cáo buộc gây thương tích dẫn đến tử vong.", rationale: "Khi các dấu vết tương thích không chỉ ra hành vi và mốc giờ/nhận dạng không độc lập củng cố nhau đủ mạnh, tổng thể chưa xác định Khang là người gây thương tích. Không xác định ai khác gây án." },
    { id: "O2", title: "Chỉ xác định được vi phạm riêng biệt", result: "Không quy kết hành vi gây chết người; xem xét riêng chứng cứ hành vi khác nếu có.", rationale: "Tranh cãi hoặc lời khai thiếu chính xác không tự biến thành tội giết người. Chỉ dùng khi hồ sơ chứng minh một hành vi riêng biệt, không suy từ mâu thuẫn." },
    { id: "O3", title: "Trả hồ sơ để bổ sung", result: "Tạm dừng kết luận cuối cùng.", rationale: "Bản gốc camera, offset và tài liệu chuỗi mẫu còn thiếu có thể làm rõ; việc trả hồ sơ không đồng nghĩa Khang có tội hay sẽ xuất hiện chứng cứ mới." },
    { id: "O4", title: "Giám định độc lập", result: "Hoãn kết luận để đánh giá lại dữ liệu còn bảo toàn.", rationale: "Chỉ hợp lý khi mẫu và dữ liệu nguồn đủ để rà soát. Kết quả mới có thể giữ nguyên giới hạn; không hứa sẽ loại trừ Khang." },
    { id: "O5", title: "Chứng cứ buộc tội có trọng lượng nhưng chưa khép kín", result: "Không thể kết luận chắc chắn chỉ từ các tương thích.", rationale: "Thừa nhận tranh cãi, liên lạc và vùng hiện diện là bất lợi cho Khang, nhưng không đánh đồng thiết bị với người hoặc dấu vết với cú đánh." },
    { id: "O6", title: "Kết tội theo cách đọc công tố", result: "Nhánh kết thúc bất lợi trong trò chơi.", rationale: "Chỉ đạt tới nếu người chơi chấp nhận nhận dạng và các tương thích như liên kết trực tiếp, xem mốc giữa cửa sổ tử vong là chính xác, và coi lời khai sửa là che giấu. Đây là kết quả do cách cân nhắc của nhánh, không phải sự thật nội bộ." }
  ];

  global.APX_CASE_014_DATA = {
    facts: {
      title: "Hồ sơ Cầu Vân",
      caseTitle: "Đêm ở Cầu Vân",
      caseId: "APX-014",
      summary: "Phạm Quốc Vinh tử vong sau một vụ hành hung trên cây cầu đi bộ mang tên Cầu Vân, một địa danh hư cấu. Trần Minh Khang bị cáo buộc đã gây thương tích chết người. Hồ sơ cho thấy tranh cãi, liên lạc, sự hiện diện của thiết bị trong vùng rộng, nhận diện nhân chứng và dấu vết tương thích; từng nhóm đều có giới hạn cần kiểm tra.",
      caseSummary: "Phạm Quốc Vinh tử vong sau một vụ hành hung trên cây cầu đi bộ mang tên Cầu Vân, một địa danh hư cấu. Trần Minh Khang bị cáo buộc đã gây thương tích chết người. Hồ sơ cho thấy tranh cãi, liên lạc, sự hiện diện của thiết bị trong vùng rộng, nhận diện nhân chứng và dấu vết tương thích; từng nhóm đều có giới hạn cần kiểm tra.",
      indictment: "Công tố cho rằng Khang có mâu thuẫn tiền bạc với Vinh, liên lạc với nạn nhân, tới gần cầu trong khoảng thời gian tử vong, được nhân chứng nhận diện và để lại dấu giày/ADN tương thích; lời khai đầu không nhất quán được xem là che giấu. Các mệnh đề là cáo buộc cần đánh giá, không phải kết luận.",
      charge: "Gây thương tích dẫn đến tử vong đối với Phạm Quốc Vinh (cáo buộc hư cấu; nội dung chưa được chứng minh).",
      year: 2026,
      accused: "Trần Minh Khang",
      accusedDetails: { occupation: "Nhân viên giao nhận", position: "Phủ nhận đánh Vinh; thừa nhận mâu thuẫn và sau đó thừa nhận đứng gần lối tây." },
      victim: "Phạm Quốc Vinh",
      victimDetails: { occupation: "Kỹ thuật viên sửa thiết bị", cause: "Chấn thương đầu sau một cuộc ẩu đả ngắn; thời điểm tử vong chưa xác định chính xác." },
      fictionalNotice: "Toàn bộ nhân vật, địa danh và hồ sơ đều hư cấu; không phải tư vấn pháp lý.",
      counts: { evidence: evidence.length, witnesses: witnesses.length, timeline: timeline.length, legalDocs: legalDocs.length }
    },
    evidence: evidence,
    timeline: timeline,
    witnesses: witnesses,
    legalDocs: legalDocs,
    hypotheses: hypotheses,
    strategyCategories: strategyCategories,
    courtPhases: courtPhases,
    outcomes: outcomes
  };
}(typeof window !== "undefined" ? window : globalThis));
