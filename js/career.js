/* APX career pilot: NPC job board, three shift mini-games and progression gates. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";

  var FOUNDING_COST = 2000000000;
  var RECIPES = [
    { id: "egg-banh-mi", name: "Bánh mì trứng", ingredients: ["Bánh mì", "Trứng", "Dưa leo", "Pate"], method: "Áp chảo", minutes: 5, price: 35000, cost: 12000 },
    { id: "stir-noodles", name: "Mì xào", ingredients: ["Mì", "Rau cải", "Thịt bò", "Tỏi"], method: "Xào", minutes: 7, price: 65000, cost: 26000 },
    { id: "fried-rice", name: "Cơm chiên", ingredients: ["Cơm", "Trứng", "Lạp xưởng", "Hành lá"], method: "Chiên", minutes: 8, price: 60000, cost: 24000 },
    { id: "pho-bo", name: "Phở bò", ingredients: ["Bánh phở", "Thịt bò", "Nước dùng", "Hành lá"], method: "Nấu nước dùng", minutes: 12, price: 75000, cost: 30000 },
    { id: "chicken-rice", name: "Cơm gà", ingredients: ["Cơm", "Thịt gà", "Dưa leo", "Nước mắm"], method: "Luộc", minutes: 10, price: 65000, cost: 26000 },
    { id: "bun-thit-nuong", name: "Bún thịt nướng", ingredients: ["Bún", "Thịt heo", "Rau sống", "Nước mắm"], method: "Nướng", minutes: 9, price: 65000, cost: 26000 },
    { id: "shaken-beef", name: "Bò lúc lắc", ingredients: ["Thịt bò", "Ớt chuông", "Hành tây", "Khoai tây"], method: "Áp chảo", minutes: 8, price: 120000, cost: 48000 },
    { id: "braised-fish", name: "Cá kho", ingredients: ["Cá", "Nước mắm", "Tiêu", "Đường"], method: "Kho", minutes: 14, price: 85000, cost: 34000 },
    { id: "milk-coffee", name: "Cà phê sữa", ingredients: ["Cà phê", "Sữa đặc", "Nước nóng", "Đá"], method: "Pha phin", minutes: 4, price: 30000, cost: 10000 },
    { id: "peach-tea", name: "Trà đào", ingredients: ["Trà", "Đào", "Syrup", "Đá"], method: "Ủ trà", minutes: 6, price: 45000, cost: 15000 },
    { id: "mung-bean-sweet", name: "Chè đậu xanh", ingredients: ["Đậu xanh", "Nước cốt dừa", "Đường", "Nước"], method: "Ninh", minutes: 16, price: 35000, cost: 12000 },
    { id: "flan", name: "Bánh flan", ingredients: ["Trứng", "Sữa", "Đường", "Caramel"], method: "Hấp", minutes: 18, price: 30000, cost: 10000 }
  ];
  var EXTRA_INGREDIENTS = ["Nấm", "Cà rốt", "Phô mai", "Rau thơm", "Gừng", "Bơ", "Tôm", "Mè rang"];
  var EMPLOYERS = {
    sales: ["Minh Phát Retail", "Thiên Hà Electronics", "An Thịnh Mart", "Sao Mai Trading"],
    warehouse: ["APX Logistics", "Bình Minh Distribution", "Khang Vận Global", "Kho vận Đại Nam"],
    chef: ["Bếp Nhà An Nhiên", "Phố Nướng", "Lantern Dining", "Bếp Mùa Vui"],
    lawyer: ["Văn phòng Luật An Tín", "Công ty Luật Minh Chính", "Văn phòng Pháp lý Đại Việt"]
  };
  var JOBS = {
    sales: { title: "Nhân viên bán hàng", icon: "🛍️", basePay: 500000, bonusPay: 500000, skill: "negotiation", skillName: "Đàm phán", shift: "Đón và tư vấn khách theo nhịp hoạt động của cửa hàng." },
    warehouse: { title: "Nhân viên kho", icon: "📦", basePay: 550000, bonusPay: 450000, skill: "analysis", skillName: "Phân tích", shift: "Nhận, ưu tiên và soạn các đơn giao phát sinh." },
    chef: { title: "Đầu bếp", icon: "🍳", basePay: 600000, bonusPay: 400000, skill: "business", skillName: "Kinh doanh", shift: "Nấu các món theo ticket khách gọi trong ngày." },
    lawyer: { title: "Luật sư", icon: "⚖️", basePay: 600000, bonusPay: 400000, skill: "analysis", skillName: "Phân tích", shift: "Nghiên cứu hồ sơ, kiểm tra chứng cứ và xử lý tình huống pháp lý." }
  };
  var salaryPaymentsInFlight = Object.create(null);
  // Career roles are data records so new jobs and branches can be added without
  // changing contract, promotion, or shift handling.
  var CAREER_ROLES = {
    sales_associate: { jobId: "sales_associate", jobName: "Nhân viên bán hàng", type: "sales", salary: 500000, careerLevel: 1, skillRequirements: { negotiation: 1 }, contractOptions: [3, 5, 7, 30], promotionRequirements: { xp: 250, shifts: 2, performance: 60, reputation: 1, tenure: 2 }, nextJobs: ["sales_senior", "sales_lead"], gameplayType: "sales", advancedTasks: [] },
    sales_senior: { jobId: "sales_senior", jobName: "Nhân viên bán hàng chính", type: "sales", salary: 580000, careerLevel: 2, skillRequirements: { negotiation: 2 }, promotionRequirements: { xp: 250, shifts: 2, performance: 60, reputation: 1, tenure: 2 }, nextJobs: ["sales_specialist"], gameplayType: "sales", advancedTasks: [{ prompt: "Khách muốn đổi sản phẩm sau khi thanh toán. Bạn xử lý thế nào?", choices: ["Kiểm tra điều kiện đổi và tư vấn lựa chọn phù hợp", "Từ chối ngay"], correct: 0 }] },
    sales_specialist: { jobId: "sales_specialist", jobName: "Chuyên viên bán hàng", type: "sales", salary: 680000, careerLevel: 3, skillRequirements: { negotiation: 3 }, promotionRequirements: { xp: 900, shifts: 8, performance: 75, reputation: 7, tenure: 8 }, nextJobs: ["sales_expert"], gameplayType: "sales", advancedTasks: [{ prompt: "Khách cần phương án trong ngân sách và có thể mua bổ sung sau. Ưu tiên gì?", choices: ["Đề xuất gói phù hợp, giải thích lựa chọn nâng cấp", "Ép mua gói đắt nhất"], correct: 0 }] },
    sales_expert: { jobId: "sales_expert", jobName: "Chuyên viên kinh doanh cấp cao", type: "sales", salary: 780000, careerLevel: 4, skillRequirements: { negotiation: 4 }, promotionRequirements: { xp: 1250, shifts: 12, performance: 82, reputation: 11, tenure: 12 }, nextJobs: [], gameplayType: "sales", advancedTasks: [{ prompt: "Doanh số giảm nhưng khách quay lại tốt. Quyết định nào hợp lý?", choices: ["Phân tích nhóm hàng và thử ưu đãi có mục tiêu", "Giảm giá toàn bộ không giới hạn"], correct: 0 }] },
    sales_lead: { jobId: "sales_lead", jobName: "Trưởng nhóm bán hàng", type: "sales", salary: 760000, careerLevel: 3, skillRequirements: { negotiation: 3 }, promotionRequirements: { xp: 900, shifts: 8, performance: 74, reputation: 7, tenure: 8 }, nextJobs: ["sales_manager"], gameplayType: "sales", advancedTasks: [{ prompt: "Một nhân viên đông khách, một người mới cần hỗ trợ. Phân ca thế nào?", choices: ["Ghép người mới với nhân viên kinh nghiệm", "Để cả hai tự xoay sở"], correct: 0 }, { prompt: "KPI chốt đơn giảm giữa ca. Bạn làm gì trước?", choices: ["Xem dữ liệu tư vấn và hỗ trợ đúng điểm nghẽn", "Gây áp lực đồng đều cho cả nhóm"], correct: 0 }] },
    sales_manager: { jobId: "sales_manager", jobName: "Quản lý cửa hàng", type: "sales", salary: 900000, careerLevel: 4, skillRequirements: { negotiation: 4 }, promotionRequirements: { xp: 1300, shifts: 12, performance: 82, reputation: 12, tenure: 12 }, nextJobs: [], gameplayType: "sales", advancedTasks: [{ prompt: "Tồn kho một mặt hàng cao, doanh số chậm. Bạn chọn gì?", choices: ["Tạo khuyến mãi có giới hạn và theo dõi KPI", "Giảm giá toàn cửa hàng"], correct: 0 }, { prompt: "Hai ca thiếu người cùng lúc. Ưu tiên điều gì?", choices: ["Điều phối theo lượng khách và kỹ năng", "Xếp ca ngẫu nhiên"], correct: 0 }] },
    warehouse_assistant: { jobId: "warehouse_assistant", jobName: "Nhân viên kho", type: "warehouse", salary: 550000, careerLevel: 1, skillRequirements: { analysis: 1 }, contractOptions: [3, 5, 7, 30], promotionRequirements: { xp: 250, shifts: 2, performance: 60, reputation: 1, tenure: 2 }, nextJobs: ["warehouse_senior", "warehouse_lead"], gameplayType: "warehouse", advancedTasks: [] },
    warehouse_senior: { jobId: "warehouse_senior", jobName: "Nhân viên kho chính", type: "warehouse", salary: 630000, careerLevel: 2, skillRequirements: { analysis: 2 }, promotionRequirements: { xp: 250, shifts: 2, performance: 60, reputation: 1, tenure: 2 }, nextJobs: ["warehouse_specialist"], gameplayType: "warehouse", advancedTasks: [{ prompt: "Số lượng thực tế lệch sổ một đơn vị. Bước đầu tiên?", choices: ["Kiểm đếm lại và ghi nhận chênh lệch", "Tự sửa số liệu"], correct: 0 }] },
    warehouse_specialist: { jobId: "warehouse_specialist", jobName: "Chuyên viên kho", type: "warehouse", salary: 720000, careerLevel: 3, skillRequirements: { analysis: 3 }, promotionRequirements: { xp: 900, shifts: 8, performance: 75, reputation: 7, tenure: 8 }, nextJobs: ["warehouse_manager"], gameplayType: "warehouse", advancedTasks: [{ prompt: "Hàng gần hết hạn nằm phía sau lô mới. Bạn làm gì?", choices: ["Đảo lô theo nguyên tắc nhập trước xuất trước", "Để nguyên vị trí"], correct: 0 }] },
    warehouse_lead: { jobId: "warehouse_lead", jobName: "Trưởng ca kho", type: "warehouse", salary: 790000, careerLevel: 3, skillRequirements: { analysis: 3 }, promotionRequirements: { xp: 900, shifts: 8, performance: 74, reputation: 7, tenure: 8 }, nextJobs: ["warehouse_manager"], gameplayType: "warehouse", advancedTasks: [{ prompt: "Đơn gấp và đơn thường cùng chờ. Bạn điều phối ra sao?", choices: ["Ưu tiên đơn gấp, phân người theo khu vực", "Làm theo thứ tự bất kể hạn"], correct: 0 }, { prompt: "Một kệ báo tồn thấp bất thường. Bước đầu tiên?", choices: ["Kiểm kê nhanh và đối chiếu giao dịch", "Đặt hàng ngay không kiểm tra"], correct: 0 }] },
    warehouse_manager: { jobId: "warehouse_manager", jobName: "Quản lý kho", type: "warehouse", salary: 900000, careerLevel: 4, skillRequirements: { analysis: 4 }, promotionRequirements: { xp: 1300, shifts: 12, performance: 82, reputation: 12, tenure: 12 }, nextJobs: [], gameplayType: "warehouse", advancedTasks: [{ prompt: "Tỉ lệ giao trễ tăng ở một khu vực. Quyết định nào tốt nhất?", choices: ["Xem nút nghẽn, điều chỉnh nhân lực và theo dõi", "Tăng tốc toàn bộ quy trình"], correct: 0 }, { prompt: "Kho thiếu chỗ nhưng hàng bán chậm. Bạn làm gì?", choices: ["Rà soát tồn và lập kế hoạch nhập theo nhu cầu", "Nhập thêm để tránh thiếu"], correct: 0 }] },
    chef_helper: { jobId: "chef_helper", jobName: "Phụ bếp", type: "chef", salary: 600000, careerLevel: 1, skillRequirements: { business: 1 }, contractOptions: [3, 5, 7, 30], promotionRequirements: { xp: 250, shifts: 2, performance: 60, reputation: 1, tenure: 2 }, nextJobs: ["chef_cook"], gameplayType: "chef", advancedTasks: [] },
    chef_cook: { jobId: "chef_cook", jobName: "Nhân viên bếp", type: "chef", salary: 680000, careerLevel: 2, skillRequirements: { business: 2 }, promotionRequirements: { xp: 250, shifts: 2, performance: 60, reputation: 1, tenure: 2 }, nextJobs: ["chef_head"], gameplayType: "chef", advancedTasks: [{ prompt: "Một nguyên liệu trong đơn đã hết. Bạn nên làm gì?", choices: ["Báo khách và đề xuất thay thế phù hợp", "Tự ý bỏ nguyên liệu"], correct: 0 }] },
    chef_head: { jobId: "chef_head", jobName: "Đầu bếp chính", type: "chef", salary: 780000, careerLevel: 3, skillRequirements: { business: 3 }, promotionRequirements: { xp: 900, shifts: 8, performance: 75, reputation: 7, tenure: 8 }, nextJobs: ["chef_executive"], gameplayType: "chef", advancedTasks: [{ prompt: "Nhiều đơn cùng gọi món lâu. Bạn tổ chức bếp thế nào?", choices: ["Sơ chế song song và phân khu theo công đoạn", "Làm từng món từ đầu đến cuối"], correct: 0 }] },
    chef_executive: { jobId: "chef_executive", jobName: "Bếp trưởng", type: "chef", salary: 870000, careerLevel: 4, skillRequirements: { business: 4 }, promotionRequirements: { xp: 1300, shifts: 12, performance: 82, reputation: 12, tenure: 12 }, nextJobs: ["chef_manager"], gameplayType: "chef", advancedTasks: [{ prompt: "Món trả lại nhiều vì quá mặn. Bạn xử lý thế nào?", choices: ["Kiểm tra công thức, nếm mẫu và hướng dẫn lại", "Bỏ qua vì các món khác ổn"], correct: 0 }, { prompt: "Giờ cao điểm thiếu người ở khu ra món. Ưu tiên gì?", choices: ["Điều phối người hỗ trợ theo điểm nghẽn", "Dừng nhận mọi đơn"], correct: 0 }] },
    chef_manager: { jobId: "chef_manager", jobName: "Quản lý bếp", type: "chef", salary: 950000, careerLevel: 5, skillRequirements: { business: 5 }, promotionRequirements: { xp: 1700, shifts: 16, performance: 86, reputation: 16, tenure: 16 }, nextJobs: [], gameplayType: "chef", advancedTasks: [{ prompt: "Chi phí nguyên liệu tăng mà chất lượng phải giữ ổn định. Bạn làm gì?", choices: ["Rà soát định lượng, nguồn cung và hao hụt", "Giảm khẩu phần không báo khách"], correct: 0 }, { prompt: "Lên lịch ca bếp cho ngày dự kiến đông khách. Ưu tiên gì?", choices: ["Xếp người theo kỹ năng và dự báo đơn", "Chia đều giờ cho tất cả"], correct: 0 }] },
    lawyer_associate: { jobId: "lawyer_associate", jobName: "Luật sư", type: "lawyer", salary: 600000, careerLevel: 1, skillRequirements: { analysis: 1 }, contractOptions: [3, 5, 7, 30], promotionRequirements: { xp: 300, shifts: 3, performance: 65, reputation: 1, tenure: 3 }, nextJobs: [], gameplayType: "lawyer", advancedTasks: [] }
  };
  Object.keys(CAREER_ROLES).forEach(function (id) {
    var role = CAREER_ROLES[id];
    if (!role.contractOptions) role.contractOptions = [3, 5, 7, 30];
    role.company = EMPLOYERS[role.type];
    role.reputation = 0;
    role.xp = 0;
  });
  var ROOT_ROLES = { sales: "sales_associate", warehouse: "warehouse_assistant", chef: "chef_helper", lawyer: "lawyer_associate" };
  var CONTRACT_OPTIONS = [3, 5, 7, 30];
  var GAME_DAY_MS = 15 * 60 * 1000;
  var SALES_SCENARIOS = [
    { customer: "Lan", need: "Laptop học tập", budget: 15000000, choices: [{ id: "study", name: "Laptop học tập", price: 13500000 }, { id: "tablet", name: "Máy tính bảng", price: 9000000 }, { id: "gaming", name: "Laptop gaming", price: 26000000 }], correct: "study" },
    { customer: "Quân", need: "Tai nghe chống ồn", budget: 4000000, choices: [{ id: "earbuds", name: "Tai nghe phổ thông", price: 1200000 }, { id: "noise", name: "Tai nghe chống ồn", price: 3500000 }, { id: "studio", name: "Tai nghe phòng thu", price: 6500000 }], correct: "noise" },
    { customer: "Hà", need: "Điện thoại chụp ảnh tốt", budget: 12000000, choices: [{ id: "camera", name: "Điện thoại camera kép", price: 10900000 }, { id: "basic", name: "Điện thoại cơ bản", price: 3500000 }, { id: "pro", name: "Điện thoại flagship", price: 18000000 }], correct: "camera" },
    { customer: "Duy", need: "Máy in cho văn phòng nhỏ", budget: 6000000, choices: [{ id: "laser", name: "Máy in laser", price: 5500000 }, { id: "photo", name: "Máy in ảnh chuyên dụng", price: 9800000 }, { id: "scanner", name: "Máy quét tài liệu", price: 3200000 }], correct: "laser" },
    { customer: "Vy", need: "Bộ bàn phím và chuột không dây", budget: 2500000, choices: [{ id: "set", name: "Bộ phím chuột không dây", price: 1800000 }, { id: "keyboard", name: "Bàn phím cơ", price: 2900000 }, { id: "mouse", name: "Chuột gaming", price: 1200000 }], correct: "set" },
    { customer: "Nam", need: "Màn hình làm đồ họa", budget: 10000000, choices: [{ id: "color", name: "Màn hình màu chuẩn 2K", price: 9500000 }, { id: "office", name: "Màn hình văn phòng", price: 4200000 }, { id: "ultra", name: "Màn hình siêu rộng 4K", price: 16000000 }], correct: "color" },
    { customer: "Hương", need: "Máy tính gọn để đi công tác", budget: 18000000, choices: [{ id: "travel", name: "Laptop mỏng nhẹ", price: 16500000 }, { id: "office", name: "Laptop văn phòng", price: 12500000 }, { id: "gaming", name: "Laptop gaming", price: 26000000 }], correct: "travel" },
    { customer: "Khoa", need: "Máy tính cho thiết kế", budget: 22000000, choices: [{ id: "design", name: "Máy trạm đồ họa", price: 20500000 }, { id: "study", name: "Laptop học tập", price: 13500000 }, { id: "basic", name: "Máy tính cơ bản", price: 9000000 }], correct: "design" },
    { customer: "My", need: "Điện thoại pin bền", budget: 9000000, choices: [{ id: "battery", name: "Điện thoại pin lớn", price: 8200000 }, { id: "basic", name: "Điện thoại cơ bản", price: 3500000 }, { id: "pro", name: "Điện thoại flagship", price: 18000000 }], correct: "battery" },
    { customer: "Phúc", need: "Máy in cho cửa hàng", budget: 8000000, choices: [{ id: "printer", name: "Máy in đa năng", price: 7200000 }, { id: "laser", name: "Máy in laser", price: 5500000 }, { id: "photo", name: "Máy in ảnh", price: 9800000 }], correct: "printer" }
  ];
  var SHELVES = [
    { bin: "A1", item: "Cà phê rang" }, { bin: "A2", item: "Ly giấy" }, { bin: "A3", item: "Bánh mì" },
    { bin: "B1", item: "Trà đào" }, { bin: "B2", item: "Hộp cơm" }, { bin: "B3", item: "Đường" },
    { bin: "C1", item: "Sữa đặc" }, { bin: "C2", item: "Mì gói" }, { bin: "C3", item: "Nước suối" },
    { bin: "D1", item: "Thịt bò" }, { bin: "D2", item: "Trứng gà" }, { bin: "D3", item: "Rau cải" },
    { bin: "E1", item: "Nước mắm" }, { bin: "E2", item: "Bún tươi" }, { bin: "E3", item: "Hành lá" },
    { bin: "F1", item: "Cá tươi" }, { bin: "F2", item: "Đậu xanh" }, { bin: "F3", item: "Nước cốt dừa" }
  ];
  var SHIFT_EVENTS = {
    sales: [
      { id: "sales-rush", title: "Cửa hàng bất ngờ đông khách", detail: "Ba khách đang chờ. Bạn ưu tiên tốc độ hay giữ trải nghiệm tư vấn?", choices: [{ label: "Chia lượt và hỏi nhanh nhu cầu", effects: { speed: 8, satisfaction: 3, quality: 1 } }, { label: "Tư vấn kỹ từng khách", effects: { speed: -7, satisfaction: 8, quality: 6 } }] },
      { id: "sales-vip", title: "Khách VIP ghé cửa hàng", detail: "Khách cân nhắc mua theo bộ và quan tâm dịch vụ sau bán.", choices: [{ label: "Tư vấn gói đầy đủ, minh bạch", effects: { revenue: 180000, satisfaction: 7, quality: 5 } }, { label: "Chốt nhanh sản phẩm chính", effects: { speed: 5, satisfaction: -2, quality: 0 } }] },
      { id: "sales-promo", title: "Khuyến mãi đột xuất", detail: "Quản lý cho phép dùng ưu đãi có giới hạn trong ca.", choices: [{ label: "Dành ưu đãi cho khách nhạy giá", effects: { revenue: 70000, satisfaction: 5, quality: 2 } }, { label: "Giữ giá và tặng phụ kiện", effects: { revenue: 130000, satisfaction: 3, quality: 4 } }] },
      { id: "sales-stock", title: "Mặt hàng khách cần sắp hết", detail: "Còn ít hàng. Có thể kiểm kho hoặc đề xuất sản phẩm thay thế.", choices: [{ label: "Kiểm tra tồn và giữ hàng", effects: { speed: -5, accuracy: 8, satisfaction: 3 } }, { label: "Đề xuất mẫu thay thế", effects: { speed: 4, satisfaction: -1, quality: 3 } }] }
    ],
    warehouse: [
      { id: "warehouse-urgent", title: "Đơn giao gấp vừa tới", detail: "Đơn ưu tiên chen hàng. Bạn đổi thứ tự hay hoàn tất đơn đang làm?", choices: [{ label: "Chuyển đơn gấp lên trước", effects: { speed: 7, accuracy: -1, satisfaction: 2 } }, { label: "Chốt đơn hiện tại rồi chuyển", effects: { speed: -4, accuracy: 5, quality: 4 } }] },
      { id: "warehouse-count", title: "Kho phát hiện lệch tồn", detail: "Sổ ghi nhiều hơn thực tế một sản phẩm.", choices: [{ label: "Kiểm đếm lại và ghi nhận", effects: { speed: -5, accuracy: 9, quality: 3 } }, { label: "Tạm xử lý theo sổ", effects: { speed: 5, accuracy: -8, quality: -2 } }] },
      { id: "warehouse-damage", title: "Một kiện hàng có dấu hiệu móp", detail: "Đơn chưa đóng gói. Kiểm tra kỹ sẽ chậm hơn.", choices: [{ label: "Mở kiểm tra và thay kiện", effects: { speed: -4, accuracy: 4, quality: 9 } }, { label: "Gia cố lớp ngoài", effects: { speed: 3, accuracy: -2, quality: 2 } }] },
      { id: "warehouse-scanner", title: "Máy quét mã vạch chập chờn", detail: "Có thể nhập mã thủ công hoặc thử quét lại.", choices: [{ label: "Đối chiếu mã thủ công", effects: { speed: -3, accuracy: 8, quality: 2 } }, { label: "Quét lại để giữ nhịp kho", effects: { speed: 5, accuracy: -3, quality: 0 } }] }
    ],
    chef: [
      { id: "chef-rush", title: "Giờ cao điểm · 5 đơn cùng lúc", detail: "Bếp nhận thêm năm ticket. Sơ chế theo mẻ hay làm từng đơn?", choices: [{ label: "Sơ chế song song theo công đoạn", effects: { speed: 9, quality: -2, satisfaction: 1 } }, { label: "Ưu tiên từng ticket, nếm trước khi ra món", effects: { speed: -7, quality: 8, satisfaction: 5 } }] },
      { id: "chef-missing", title: "Nguyên liệu trong đơn đã hết", detail: "Khách có thể chờ thay thế hoặc chọn món gần giống.", choices: [{ label: "Báo khách và xin đổi nguyên liệu", effects: { speed: -4, quality: 5, satisfaction: 5 } }, { label: "Đề xuất món thay thế gần nhất", effects: { speed: 5, quality: 1, satisfaction: -1 } }] },
      { id: "chef-vip", title: "Bàn VIP yêu cầu món đúng chuẩn", detail: "Bếp có thể nếm lại và trình bày kỹ hơn.", choices: [{ label: "Nếm mẫu, chỉnh vị và trình bày", effects: { speed: -5, quality: 10, satisfaction: 8 } }, { label: "Ra món theo nhịp hiện tại", effects: { speed: 5, quality: -2, satisfaction: -3 } }] },
      { id: "chef-return", title: "Khách phản hồi món hơi mặn", detail: "Có thể làm lại hoặc điều chỉnh phần sốt.", choices: [{ label: "Làm lại theo ghi chú bếp", effects: { speed: -6, quality: 9, satisfaction: 8 } }, { label: "Điều chỉnh sốt tại bàn", effects: { speed: 3, quality: 1, satisfaction: 1 } }] }
    ]
  };
  var SHIFT_OPTIONS = {
    morning: { label: "Ca sáng", startHour: 8, endHour: 14 },
    evening: { label: "Ca chiều", startHour: 14, endHour: 22 },
    full: { label: "Toàn thời gian", startHour: 8, endHour: 22 }
  };
  var ORDER_SCHEDULE = {
    sales: { open: 6, close: 23, baseRate: 0.024, pendingLimit: 18, patienceMs: 105000 },
    warehouse: { open: 6, close: 24, baseRate: 0.026, pendingLimit: 20, patienceMs: 240000 },
    chef: { open: 6, close: 23, baseRate: 0.027, pendingLimit: 18, patienceMs: 165000 },
    density: [[0, 6, 0.08], [6, 9, 0.8], [9, 11, 1.05], [11, 13.5, 1.8], [13.5, 17, 0.78], [17, 20.5, 1.65], [20.5, 23, 0.72], [23, 24, 0.08]]
  };
  var UNLOCKS = {
    character: { profile: 1, skills: 2, assets: 3, achievements: 2, wardrobe: 4 },
    city: { map: 2, properties: 8, build: 8, market: 8 },
    company: { overview: 5, companies: 5, finance: 7, market: 7 },
    employees: { directory: 6, hiring: 6, departments: 6, training: 6 },
    investment: { market: 8, portfolio: 8, transactions: 8 },
    community: { players: 3, "personal-ranking": 3, "company-ranking": 3, "global-chat": 4, messages: 4 },
    inventory: { all: 4, equipment: 4, materials: 4, documents: 4 },
    shop: { overview: 4 },
    life: { overview: 6, homes: 8, garage: 8, decor: 9, city: 6, social: 8, friends: 8, journal: 6, shop: 9 },
    account: { profile: 1, reports: 3 },
    career: { jobs: 1, current: 1, contract: 1, quests: 1 }
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function money(value) { return window.APXUI.money(value); }
  function physicalStatusMarkup(state, compact) {
    if (!window.APXCharacter || !window.APXCharacter.getPhysicalState) return "";
    var physical = window.APXCharacter.getPhysicalState(state);
    if (!physical) return "";
    var stats = compact
      ? [["energy", "⚡ Năng lượng"], ["fullness", "🍚 Độ no"], ["focus", "🧠 Tập trung"]]
      : [["health", "❤️ Sức khỏe"], ["energy", "⚡ Năng lượng"], ["fullness", "🍚 Độ no"], ["focus", "🧠 Tập trung"], ["mood", "😊 Tinh thần"]];
    return '<section class="career-physical-strip' + (compact ? ' is-compact' : '') + '" aria-label="Trạng thái thể chất">' +
      stats.map(function (item) {
        var value = Math.max(0, Math.min(100, Number(physical[item[0]]) || 0));
        return '<div class="career-physical-item"><div><span>' + item[1] + '</span><strong data-physical-value="' + item[0] + '">' + value + '</strong></div>' +
          '<span class="physical-bar" role="progressbar" aria-label="' + item[1].slice(2) +
          '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + value +
          '"><i data-physical-bar="' + item[0] + '" style="width:' + value + '%"></i></span></div>';
      }).join("") + '</section>';
  }
  function ensureState(state) {
    if (!state.career || typeof state.career !== "object") {
      state.career = { version: 0, legacy: true, xp: 0, level: 1, completedJobs: 0, activeJob: null, history: [], professions: {} };
    }
    var career = state.career;
    career.version = Number(career.version) || 0;
    career.legacy = career.legacy === true || career.version < 1;
    career.xp = Math.max(0, Number(career.xp) || 0);
    career.completedJobs = Math.max(0, Math.floor(Number(career.completedJobs) || 0));
    if (!Array.isArray(career.history)) career.history = [];
    if (!Number.isFinite(Number(career.completedWorkShifts))) career.completedWorkShifts = career.completedJobs;
    career.completedWorkShifts = Math.max(0, Math.floor(Number(career.completedWorkShifts) || 0));
    var historicalSalary = career.history.reduce(function (sum, item) {
      return sum + (!item.abandoned ? Math.max(0, Number(item.salaryReceived != null ? item.salaryReceived : item.pay) || 0) : 0);
    }, 0);
    if (!Number.isFinite(Number(career.totalSalaryEarned))) career.totalSalaryEarned = historicalSalary;
    if (!Number.isFinite(Number(career.totalSalaryReceived))) career.totalSalaryReceived = historicalSalary;
    career.totalSalaryEarned = Math.max(0, Number(career.totalSalaryEarned) || 0);
    career.totalSalaryReceived = Math.max(0, Number(career.totalSalaryReceived) || 0);
    if (!Array.isArray(career.dailyReports)) career.dailyReports = [];
    if (!Array.isArray(career.recentEvents)) career.recentEvents = [];
    if (!Array.isArray(career.recentCustomers)) career.recentCustomers = [];
    if (!career.restDays || typeof career.restDays !== "object") career.restDays = {};
    if (!career.professions || typeof career.professions !== "object") career.professions = {};
    if (!career.employment || typeof career.employment !== "object") career.employment = {};
    if (!Array.isArray(career.employment.history)) career.employment.history = [];
    if (!career.employment.current) career.employment.current = null;
    if (!career.employment.pending) career.employment.pending = null;
    if (!career.promotionOffer) career.promotionOffer = null;
    ["sales", "warehouse", "chef", "lawyer"].forEach(function (type) {
      var profession = career.professions[type] || {};
      profession.xp = Math.max(0, Number(profession.xp) || 0);
      profession.level = Math.max(1, Math.floor(Number(profession.level) || (1 + Math.floor(profession.xp / 350))));
      profession.shifts = Math.max(0, Number(profession.shifts) || 0);
      profession.correct = Math.max(0, Number(profession.correct) || 0);
      profession.total = Math.max(0, Number(profession.total) || 0);
      profession.performance = profession.total ? Math.round(profession.correct / profession.total * 100) : 0;
      profession.reputation = Math.max(0, Number(profession.reputation) || 0);
      profession.tenureDays = Math.max(0, Number(profession.tenureDays) || 0);
      career.professions[type] = profession;
    });
    career.level = levelForXP(career.xp);
    if (career.activeJob) {
      if (!Array.isArray(career.activeJob.selectedIngredients)) career.activeJob.selectedIngredients = [];
      if (JOBS[career.activeJob.type]) {
        career.activeJob.totalOrders = career.activeJob.gameplay && career.activeJob.gameplay.version === 2
          ? Math.max(0, Number(career.activeJob.totalOrders) || 0)
          : Math.max(1, Number(career.activeJob.totalOrders) || 1);
        career.activeJob.day = Math.max(1, Number(career.activeJob.day) || Number(state.day) || 1);
        career.activeJob.orderIndex = Math.max(0, Number(career.activeJob.orderIndex) || 0);
        if (career.activeJob.type !== "lawyer" && career.activeJob.gameplay && career.activeJob.gameplay.version !== 2) migrateShiftToLive(state, career, career.activeJob);
        else if (!career.activeJob.gameplay) migrateBareShiftToLive(state, career, career.activeJob);
      }
    }
    career.version = 2;
    return career;
  }
  function createShiftGameplay(type, level, seed, career, state, shiftCode) {
    var now = Date.now(), clock = window.APXGame && window.APXGame.getGameClock ? window.APXGame.getGameClock(now) : null;
    var shift = SHIFT_OPTIONS[shiftCode] || SHIFT_OPTIONS.full;
    var currentMinute = clock ? (typeof clock.progress === "number" ? clock.progress * 1440 : clock.hour * 60 + clock.minute) : shift.startHour * 60;
    var remainingMs = Math.max(1000, (shift.endHour * 60 - currentMinute) * 900000 / 1440);
    return {
      version: 2, level: level, day: Number(state.day) || 1, startedAt: now,
      shift: { code: shiftCode || "full", label: shift.label, startHour: shift.startHour, endHour: shift.endHour, durationMs: remainingMs },
      deadlineAt: now + remainingMs, gameHour: clock ? clock.hour + clock.minute / 60 : 0,
      workCount: 0, workDone: 0, queue: [], currentId: null, pendingEvent: null, eventsDone: [],
      scheduler: { lastTickAt: now, sequence: 0 },
      metrics: { revenue: 0, operatingCosts: 0, units: 0, orders: 0, customers: 0, customersAppeared: 0, customersServed: 0, customersPurchased: 0, customersLeft: 0, ordersAppeared: 0, ordersCompleted: 0, ordersFailed: 0, satisfaction: 0, satisfactionCount: 0, satisfactionBonus: 0, accuracy: 0, accuracyCount: 0, accuracyBonus: 0, quality: 0, qualityCount: 0, qualityBonus: 0, speed: 70, mistakes: 0, returns: 0, responseMs: 0, responseCount: 0 }
    };
  }
  function migrateShiftToLive(state, career, active) {
    var old = active.gameplay, oldMetrics = old.metrics || {}, now = Date.now();
    var play = createShiftGameplay(active.type, old.level || career.professions[active.type].level, active.seed, career, state);
    var current = active.type === "sales" ? old.queue[old.customerAt || 0] : old.queue.find(function (item) { return item.id === old.currentId && !item.delivered; });
    if (current) {
      current.status = "processing";
      current.createdAt = Number(current.createdAt) || now;
      current.expiresAt = Number(current.expiresAt) || now + ORDER_SCHEDULE[active.type].patienceMs;
      if (active.type === "sales" && current.stage === "feedback") current.expiresAt = 0;
      play.queue.push(current);
      play.currentId = current.id;
      if (active.type === "sales") play.metrics.customersAppeared = Math.max(1, Number(old.customerAt) + 1);
      else play.metrics.ordersAppeared = Math.max(1, Number(oldMetrics.orders) || 0) + 1;
    }
    Object.keys(oldMetrics).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(play.metrics, key)) play.metrics[key] = Number(oldMetrics[key]) || 0;
    });
    if (active.type === "sales") {
      play.metrics.customersServed = Number(oldMetrics.customers) || 0;
      play.metrics.customersAppeared = Math.max(play.metrics.customersAppeared, play.metrics.customersServed + (current ? 1 : 0));
      play.metrics.customersPurchased = Number(oldMetrics.purchased) || 0;
    } else {
      play.metrics.ordersCompleted = Number(oldMetrics.orders) || 0;
      play.metrics.ordersAppeared = Math.max(play.metrics.ordersAppeared, play.metrics.ordersCompleted + (current ? 1 : 0));
    }
    play.workDone = Number(old.workDone) || 0;
    play.workCount = 0;
    play.pendingEvent = old.pendingEvent || null;
    play.eventsDone = Array.isArray(old.eventsDone) ? old.eventsDone.slice(-4) : [];
    play.scheduler.sequence = old.queue.length;
    active.gameplay = play;
    active.totalOrders = 0;
    active.round = play.workDone;
  }
  function migrateBareShiftToLive(state, career, active) {
    var now = Date.now(), previousDone = active.type === "chef" ? Number(active.orderIndex) || 0 : Number(active.round) || 0;
    var previousCorrect = Number(active.score) || 0;
    var play = createShiftGameplay(active.type, career.professions[active.type].level, active.seed, career, state);
    var metrics = play.metrics;
    play.workDone = Math.max(0, previousDone);
    if (active.type === "sales") {
      metrics.customersAppeared = previousDone;
      metrics.customersServed = previousDone;
      metrics.customers = previousDone;
      metrics.customersPurchased = Math.min(previousDone, previousCorrect);
      metrics.ordersCompleted = metrics.customersPurchased;
      metrics.ordersFailed = Math.max(0, previousDone - metrics.customersPurchased);
      metrics.units = previousDone;
      metrics.accuracyCount = previousDone;
      metrics.satisfactionCount = previousDone;
      metrics.satisfaction = previousDone * 72;
      metrics.qualityCount = previousDone;
      metrics.quality = previousDone * 72;
      metrics.mistakes = metrics.ordersFailed;
    } else {
      metrics.ordersAppeared = previousDone;
      metrics.ordersCompleted = Math.min(previousDone, previousCorrect);
      metrics.ordersFailed = Math.max(0, previousDone - metrics.ordersCompleted);
      metrics.orders = metrics.ordersCompleted;
      metrics.units = previousDone;
      metrics.accuracyCount = Math.max(0, previousDone);
      metrics.satisfactionCount = previousDone;
      metrics.satisfaction = previousDone * 72;
      metrics.qualityCount = previousDone;
      metrics.quality = previousDone * 72;
      metrics.mistakes = metrics.ordersFailed;
    }
    play.scheduler.lastTickAt = now;
    active.gameplay = play;
    active.totalOrders = 0;
    active.round = play.workDone;
  }
  function nextEvent(active) {
    var play = active.gameplay;
    if (!play || play.pendingEvent) return false;
    if (play.version === 2) return false;
    var event = play.events.find(function (item) { return item.after <= play.workDone && play.eventsDone.indexOf(item.id) < 0; });
    if (!event) return false;
    play.pendingEvent = event;
    return true;
  }
  function playStats(play) {
    var m = play.metrics, units = Math.max(1, m.accuracyCount || m.units || play.workDone || 1), people = Math.max(1, m.satisfactionCount || m.customers || play.workDone || 1), qualityCount = Math.max(1, m.qualityCount || play.workDone || 1);
    var hasWork = Number(m.accuracyCount) + Number(m.satisfactionCount) + Number(m.qualityCount) > 0;
    return {
      accuracy: hasWork ? Math.max(0, Math.min(100, Math.round(100 - m.mistakes * (100 / units) + (m.accuracyBonus || 0)))) : 0,
      satisfaction: m.satisfactionCount ? Math.max(0, Math.min(100, Math.round((m.satisfaction / people || 0) + (m.satisfactionBonus || 0)))) : 0,
      quality: m.qualityCount ? Math.max(0, Math.min(100, Math.round((m.quality / qualityCount || 0) + (m.qualityBonus || 0)))) : 0,
      speed: Math.max(0, Math.min(100, Math.round(m.speed))),
      performance: hasWork ? Math.max(0, Math.min(100, Math.round(((100 - m.mistakes * 100 / units) * 0.35) + ((m.satisfaction / people || 0) * 0.25) + ((m.quality / qualityCount || 0) * 0.2) + m.speed * 0.2))) : 0
    };
  }
  function gameClockAt(state, now) {
    if (window.APXGame && typeof window.APXGame.getGameClock === "function") return window.APXGame.getGameClock(now);
    var endAt = Number(state.nextDayAt) || (now + 900000), startAt = Number(state.dayStartedAt) || endAt - 900000;
    var progress = Math.max(0, Math.min(0.999, (now - startAt) / 900000)), minute = Math.floor(progress * 1440);
    return { day: Number(state.day) || 1, hour: Math.floor(minute / 60), minute: minute % 60, progress: progress, now: now, nextDayAt: endAt };
  }
  function scheduleDensity(hour) {
    var band = ORDER_SCHEDULE.density.find(function (item) { return hour >= item[0] && hour < item[1]; });
    return band ? band[2] : 0.08;
  }
  function reactionWindowMultiplier(state) {
    if (!window.APXCharacter || !window.APXCharacter.getPhysicalState) return 1;
    var physical = window.APXCharacter.getPhysicalState(state);
    var multiplier = 1 - Math.max(0, 60 - physical.focus) * 0.003 -
      Math.max(0, 30 - physical.energy) * 0.003 -
      Math.max(0, 20 - physical.fullness) * 0.002 -
      Math.max(0, 40 - physical.health) * 0.002;
    return Math.max(0.65, Math.min(1, multiplier));
  }
  function spawnLiveOrder(active, state, now) {
    var play = active.gameplay, schedule = ORDER_SCHEDULE[active.type], metrics = play.metrics;
    if (!schedule) return null;
    var reactionWindow = reactionWindowMultiplier(state);
    var activeCount = play.queue.filter(function (order) { return order.status === "pending" || order.status === "processing"; }).length;
    if (activeCount >= schedule.pendingLimit) return null;
    var number = ++play.scheduler.sequence, order, index, scenario, recent, available;
    if (active.type === "sales") {
      recent = ensureState(state).recentCustomers.slice(-2);
      available = SALES_SCENARIOS.map(function (_, i) { return i; }).filter(function (i) { return recent.indexOf(i) < 0; });
      index = (available.length ? available : SALES_SCENARIOS.map(function (_, i) { return i; }))[Math.floor(Math.random() * (available.length || SALES_SCENARIOS.length))];
      scenario = SALES_SCENARIOS[index];
      ensureState(state).recentCustomers.push(index);
      ensureState(state).recentCustomers = ensureState(state).recentCustomers.slice(-12);
      order = { id: "customer-" + play.day + "-" + number, scenarioIndex: index, customer: scenario.customer, need: scenario.need, choices: scenario.choices, preferred: scenario.correct, budget: Math.round(scenario.budget * (0.86 + Math.random() * 0.28)), understanding: Math.round(30 + Math.random() * 70), difficulty: Math.round(25 + Math.random() * 65), priceSensitivity: Math.round(20 + Math.random() * 80), upsell: Math.round(20 + Math.random() * 80), orderUnits: 1 + Math.floor(Math.random() * 3), stage: "discover", asked: false, outcome: null, status: "pending", createdAt: now, expiresAt: now + schedule.patienceMs * reactionWindow * (0.8 + Math.random() * 0.6) };
      metrics.customersAppeared += 1;
      metrics.units += order.orderUnits;
    } else if (active.type === "warehouse") {
      var itemCount = Math.random() < 0.28 ? 2 : 1, items = [];
      for (var i = 0; i < itemCount; i += 1) {
        var shelf = SHELVES[Math.floor(Math.random() * SHELVES.length)];
        items.push({ bin: shelf.bin, item: shelf.item, quantity: 1 + Math.floor(Math.random() * 3) });
      }
      order = { id: "warehouse-order-" + play.day + "-" + number, number: 10000 + Math.floor(Math.random() * 89999), items: items, urgent: Math.random() < 0.25, fragile: Math.random() < 0.25, condition: Math.random() < 0.12 ? "Móp nhẹ" : "Nguyên vẹn", stage: "pick", itemIndex: 0, picks: 0, checked: false, status: "pending", createdAt: now, expiresAt: now + schedule.patienceMs * reactionWindow * (1 + Math.random() * 1.5) };
      metrics.ordersAppeared += 1;
      metrics.units += items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    } else {
      var recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
      var note = ["Không hành", "Ít cay", "Sốt riêng", "Dị ứng đậu phộng", "Thêm rau", "Không yêu cầu riêng"][Math.floor(Math.random() * 6)];
      order = { id: "chef-ticket-" + play.day + "-" + number, table: 2 + Math.floor(Math.random() * 12), recipeId: recipe.id, note: note, stage: note === "Không yêu cầu riêng" ? "ingredients" : "note", selectedIngredients: [], score: 0, delivered: false, urgent: Math.random() < 0.25, quality: Math.random() < 0.15 ? "Yêu cầu nếm kỹ" : "Tiêu chuẩn", revenue: recipe.price, cost: recipe.cost, status: "pending", createdAt: now, expiresAt: now + schedule.patienceMs * reactionWindow * (0.8 + Math.random() * 1.3) };
      metrics.ordersAppeared += 1;
      metrics.units += 1;
    }
    if (!play.currentId) { play.currentId = order.id; order.status = "processing"; }
    play.queue.push(order);
    play.workCount += 1;
    return order;
  }
  function startScheduler(state, now) {
    var active = ensureState(state).activeJob;
    if (active && active.gameplay && active.gameplay.version === 2) active.gameplay.scheduler.lastTickAt = Number(now) || Date.now();
  }
  function tickScheduler(state, now) {
    var career = ensureState(state), active = career.activeJob;
    if (window.APXAccount && typeof window.APXAccount.isLoggedIn === "function" && !window.APXAccount.isLoggedIn()) return null;
    if (!active || !active.gameplay || active.gameplay.version !== 2 || active.gameplay.day !== Number(state.day)) return null;
    var play = active.gameplay, schedule = ORDER_SCHEDULE[active.type], current = Number(now) || Date.now();
    if (!schedule) return null;
    var last = Number(play.scheduler.lastTickAt) || current;
    var elapsed = Math.max(0, Math.min(120, (current - last) / 1000));
    play.scheduler.lastTickAt = current;
    var clock = gameClockAt(state, current), hour = clock.hour + clock.minute / 60;
    play.gameHour = hour;
    var expired = 0;
    play.queue.forEach(function (order) {
      if ((order.status === "pending" || order.status === "processing") && order.stage !== "feedback" && Number(order.expiresAt) <= current) {
        order.status = "expired"; order.failedAt = current; order.delivered = true; expired += 1;
        if (active.type === "sales") { play.metrics.customersLeft += 1; play.metrics.ordersFailed += 1; }
        else play.metrics.ordersFailed += 1;
        play.workDone += 1;
        if (order.id === play.currentId) play.currentId = null;
      }
    });
    var generated = 0, eventGenerated = false;
    var shift = play.shift || SHIFT_OPTIONS.full;
    if (hour >= shift.endHour) {
      play.queue.forEach(function (order) {
        if (order.status !== "pending" && order.status !== "processing") return;
        order.status = "expired"; order.delivered = true; order.failedAt = current;
        play.metrics.ordersFailed += 1;
        if (active.type === "sales") play.metrics.customersLeft += 1;
        play.workDone += 1;
      });
      play.currentId = null;
      play.shiftClosed = true;
      active.totalOrders = play.workDone;
      active.round = play.workDone;
      finishJob(state);
      return { changed: true, message: "Đã hết " + (shift.label || "ca làm") + ". Lương đã được chốt." };
    }
    var inBusinessHours = hour >= Math.max(schedule.open, shift.startHour) && hour < Math.min(schedule.close, shift.endHour);
    var density = scheduleDensity(hour) * (inBusinessHours ? 1 : 0.12);
    var probability = 1 - Math.exp(-schedule.baseRate * density * elapsed);
    var eventProbability = 1 - Math.exp(-0.00075 * density * elapsed);
    if (!play.pendingEvent && elapsed > 0 && Math.random() < eventProbability) {
      var pool = SHIFT_EVENTS[active.type] || [], recent = career.recentEvents.slice(-4).concat(play.eventsDone.slice(-3));
      var availableEvents = pool.filter(function (item) { return recent.indexOf(item.id) < 0; });
      var eventPool = availableEvents.length ? availableEvents : pool;
      var scheduledEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
      if (scheduledEvent) { play.pendingEvent = { id: scheduledEvent.id, title: scheduledEvent.title, detail: scheduledEvent.detail, choices: scheduledEvent.choices }; eventGenerated = true; }
    }
    if (elapsed > 0 && Math.random() < probability) {
      var burstSize = 2 + Math.floor(Math.random() * 2);
      while (generated < burstSize && spawnLiveOrder(active, state, current)) generated += 1;
    }
    if (!play.currentId) {
      var next = play.queue.find(function (order) { return order.status === "pending"; });
      if (next) { next.status = "processing"; play.currentId = next.id; }
    }
    if (generated || expired || eventGenerated) {
      return { changed: true, message: eventGenerated ? "Có tình huống mới cần bạn xử lý." : generated ? (generated === 1 ? "Đơn mới vừa đến." : generated + " đơn mới vừa đến cùng lúc.") : expired + " đơn đã hết hạn." };
    }
    return null;
  }
  function noteIngredient(note) {
    if (note === "Không hành") return "Hành lá";
    if (note === "Dị ứng đậu phộng") return "Đậu phộng";
    return "";
  }
  function levelForXP(xp) {
    var level = 1;
    while (level < 100 && Number(xp) >= careerXPForLevel(level + 1)) level += 1;
    return level;
  }
  function careerXPForLevel(level) {
    level = Math.max(1, Math.floor(Number(level) || 1));
    if (level === 1) return 0;
    if (level === 2) return 100;
    if (level === 3) return 465;
    if (level === 4) return 1300;
    return 1300 * Math.pow(3, level - 4);
  }
  function progressFor(state) {
    var career = ensureState(state);
    var level = Math.max(1, Number(career.level) || 1);
    var previous = careerXPForLevel(level), next = careerXPForLevel(level + 1);
    return { level: level, xp: Math.max(0, career.xp - previous), next: Math.max(1, next - previous), totalXP: career.xp, nextTotal: next };
  }
  function hasCompany(state) {
    if (window.APXCompanies && typeof window.APXCompanies.getCompanies === "function") return window.APXCompanies.getCompanies(state).length > 0;
    var companies = state.companyOperations && state.companyOperations.companies;
    return !!companies && Object.keys(companies).some(function (key) { return !!companies[key]; });
  }
  function getGate(section, page, state) {
    if (!state) return null;
    var career = ensureState(state);
    if (career.legacy) return null;
    var required = UNLOCKS[section] && UNLOCKS[section][page];
    if (!required || required <= career.level) {
      if ((section === "company" && (page === "overview" || page === "companies")) && !hasCompany(state)) {
        return founderGate(career, state);
      }
      if (section === "employees" && !hasCompany(state)) return { requiredLevel: 6, title: "Mở doanh nghiệp trước", reasons: ["Thành lập công ty sau khi hoàn thành nhiệm vụ khởi nghiệp."] };
      return null;
    }
    if ((section === "company" && (page === "overview" || page === "companies")) && !hasCompany(state)) return founderGate(career, state);
    return { requiredLevel: required, title: "Tính năng đang khóa", reasons: ["Đạt cấp sự nghiệp " + required + " để mở khu vực này."] };
  }
  function canFoundCompany(state) {
    if (!state) return { ok: false, message: "Chưa tải được tiến trình người chơi." };
    var career = ensureState(state);
    if (career.legacy) return { ok: true, message: "Bản lưu cũ được giữ nguyên quyền truy cập." };
    var reasons = founderGate(career, state);
    return reasons ? { ok: false, message: reasons.reasons.join(" ") } : { ok: true, message: "Đủ điều kiện thành lập công ty." };
  }
  function founderGate(career, state) {
    var reasons = [];
    if (career.level < 5) reasons.push("Đạt cấp sự nghiệp 5 (hiện cấp " + career.level + ").");
    if (career.completedJobs < 8) reasons.push("Hoàn thành 8 ca làm (đã xong " + career.completedJobs + "/8).");
    if ((Number(state.cash) || 0) < FOUNDING_COST) reasons.push("Có ít nhất " + money(FOUNDING_COST) + " để thành lập công ty.");
    return reasons.length ? { requiredLevel: 5, title: "Chưa đủ điều kiện khởi nghiệp", reasons: reasons } : null;
  }
  function renderLocked(gate, state) {
    var prog = progressFor(state);
    return '<header class="page-heading"><span class="eyebrow">TIẾN TRÌNH SỰ NGHIỆP</span><h1>' + esc(gate.title) + '</h1><p>Các hệ thống được mở dần khi bạn làm việc và phát triển nhân vật.</p></header>' +
      '<section class="panel career-lock-card"><div class="career-lock-mark" aria-hidden="true">🔒</div><div><span class="eyebrow">CẤP SỰ NGHIỆP HIỆN TẠI · ' + prog.level + '</span><h2>' + esc(gate.title) + '</h2><p>' + (gate.reasons || []).map(esc).join("<br>") + '</p><a class="button button-gold" href="#" data-action="page" data-section="career" data-page="jobs">Xem việc làm</a></div></section>';
  }
  function roleFor(jobId) { return CAREER_ROLES[jobId] || null; }
  function contractEndAt(state, startDay, duration) {
    var nextBoundary = Number(state.nextDayAt) || (Date.now() + GAME_DAY_MS);
    return nextBoundary + Math.max(0, Number(duration) - 1) * GAME_DAY_MS;
  }
  function remainingText(milliseconds) {
    var ms = Math.max(0, Number(milliseconds) || 0);
    var days = Math.floor(ms / GAME_DAY_MS);
    var withinDay = ms % GAME_DAY_MS;
    var minutes = Math.floor(withinDay / 60000);
    var seconds = Math.floor(withinDay % 60000 / 1000);
    return days + " ngày " + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }
  function appendEmploymentEvent(career, event) {
    career.employment.history.unshift(Object.assign({ id: "employment-" + Date.now() }, event));
    career.employment.history = career.employment.history.slice(0, 50);
  }
  function createContract(state, details, duration, status) {
    var day = Math.max(1, Number(state.day) || 1);
    var role = roleFor(details.roleId) || roleFor(ROOT_ROLES[details.type]);
    var start = Date.now();
    return {
      id: "contract-" + details.type + "-" + start,
      jobId: role.jobId,
      roleId: role.jobId,
      type: role.type,
      jobName: role.jobName,
      employer: details.employer,
      salary: Math.min(1000000, Math.max(500000, Number(details.salary) || role.salary)),
      duration: Number(duration),
      startDay: day,
      endDay: day + Number(duration) - 1,
      startAt: start,
      endAt: contractEndAt(state, day, duration),
      status: status || "active",
      terms: ["Chỉ đảm nhận một công việc chính tại một thời điểm.", "Ngày game dài đúng 15 phút thật; đơn phát sinh theo giờ game.", "Đơn có thể hoàn tất, thất bại hoặc hết hạn; KPI dựa trên hoạt động thực tế.", "Thưởng KPI được tính cuối ngày; tổng lương không vượt ₫1.000.000.", "Nghỉ trước hạn phải bồi thường theo thời gian còn lại, tối đa ba ngày lương."]
    };
  }
  function compensation(contract, now) {
    if (!contract || contract.status !== "active") return 0;
    var remainingDays = Math.max(0, (Number(contract.endAt) - (Number(now) || Date.now())) / GAME_DAY_MS);
    return Math.min(Number(contract.salary) * 3, Math.round(Number(contract.salary) * remainingDays * 0.35));
  }
  function promotionCandidates(state, current) {
    var role = roleFor(current && current.roleId);
    if (!role || !role.nextJobs.length) return [];
    var profession = ensureState(state).professions[role.type];
    return role.nextJobs.filter(function (id) {
      var next = roleFor(id), req = next && next.promotionRequirements;
      return req && profession.xp >= req.xp && profession.shifts >= req.shifts && profession.performance >= req.performance && profession.reputation >= req.reputation && profession.tenureDays >= req.tenure;
    });
  }
  function updatePromotionOffer(state, current) {
    var career = ensureState(state), eligible = promotionCandidates(state, current);
    if (!eligible.length) return;
    var profession = career.professions[current.type];
    if (career.promotionOffer && career.promotionOffer.roleId === current.roleId) return;
    if (Number(profession.promotionDeclinedAtXP) === profession.xp) return;
    career.promotionOffer = { roleId: current.roleId, jobIds: eligible, offeredAt: Date.now() };
  }
  function offerList(state) {
    var career = ensureState(state);
    var day = Math.max(1, Number(state.day) || 1);
    var shift = career.completedJobs;
    return Object.keys(JOBS).map(function (type) {
      var job = JOBS[type];
      var role = roleFor(ROOT_ROLES[type]);
      var employerIndex = ((day + shift - 2) % EMPLOYERS[type].length + EMPLOYERS[type].length) % EMPLOYERS[type].length;
      var employer = EMPLOYERS[type][employerIndex];
      var basePay = Math.min(1000000, role.salary + ((day + shift) % 3) * 50000);
      var offer = { type: type, roleId: role.jobId, title: role.jobName, employer: employer, basePay: basePay, bonusPay: 1000000 - basePay, skill: job.skill, seed: day + shift * 2 };
      if (type === "chef") {
        var recipeIndex = (day + shift * 5) % RECIPES.length;
        offer.recipeId = RECIPES[recipeIndex].id;
        offer.recipeName = RECIPES[recipeIndex].name;
      }
      return offer;
    });
  }
  function professionLevel(state, type) { return ensureState(state).professions[type].level; }
  function progressPanel(state) {
    var career = ensureState(state), prog = progressFor(state);
    var pct = Math.max(0, Math.min(100, Math.round(prog.xp / prog.next * 100)));
    var nextGate = career.completedJobs >= 8 ? "Đủ số ca khởi nghiệp" : "Còn " + (8 - career.completedJobs) + " ca trước mốc khởi nghiệp";
    var legacy = career.legacy ? '<div class="career-legacy-note">Bản lưu có sẵn vẫn giữ toàn bộ tính năng đã mở. Bạn có thể thử việc làm mới bất cứ lúc nào.</div>' : '';
    return '<section class="career-progress panel"><div class="career-progress-top"><div><span class="eyebrow">HÀNH TRÌNH NHÂN VIÊN</span><h2>Cấp sự nghiệp ' + prog.level + '</h2><p>' + career.completedJobs + ' ca hoàn thành · ' + nextGate + '</p></div><div class="career-xp-badge"><strong>' + prog.xp.toLocaleString("vi-VN") + '<small> / ' + prog.next.toLocaleString("vi-VN") + '</small></strong><span>XP còn cần trong cấp này</span><small>Tổng ' + prog.totalXP.toLocaleString("vi-VN") + ' · mốc kế tiếp ' + prog.nextTotal + ' XP</small></div></div><div class="progress" role="progressbar" aria-label="Kinh nghiệm sự nghiệp" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div><div class="career-xp-milestones">Mốc tổng XP: Cấp 2 · 100 | Cấp 3 · 465 | Cấp 4 · 1.300 | Cấp 5 · 3.900; từ đó mỗi mốc ×3.</div><div class="career-profession-levels">' + Object.keys(JOBS).map(function (type) { return '<span>' + JOBS[type].icon + ' ' + JOBS[type].title + ' · cấp ' + professionLevel(state, type) + '</span>'; }).join('') + '</div>' + legacy + '</section>';
  }
  function resultCard(result) {
    if (!result) return '';
    var salaryStatus = result.salaryStatus === "paid" ? "Đã vào APXBank" : result.salaryStatus === "pending" ? "Chưa chuyển vào APXBank" : "";
    var salaryRetry = result.salaryStatus === "pending" ? ' <button class="button" type="button" data-career-action="retry-salary" data-shift-id="' + esc(result.id) + '">Thử nhận lương lại</button>' : "";
    if (result.performance != null) return '<section class="panel career-result"><span class="eyebrow">KẾT QUẢ CA' + (result.earlyClosed ? ' · CHỐT SỚM' : '') + ' · ' + esc(result.grade || 'Đã hoàn thành') + '</span><strong>' + esc(result.title) + ' · ' + esc(result.employer) + '</strong><div class="career-result-grid"><span>Hiệu suất<strong>' + result.performance + '%</strong></span><span>Chính xác<strong>' + (result.accuracy == null ? '—' : result.accuracy + '%') + '</strong></span><span>Hài lòng<strong>' + (result.satisfaction == null ? '—' : result.satisfaction + '%') + '</strong></span><span>Chất lượng<strong>' + (result.quality == null ? '—' : result.quality + '%') + '</strong></span><span>Đơn/khách<strong>' + (result.orders == null ? result.score + '/' + result.total : result.orders) + '</strong></span><span>Sản phẩm<strong>' + (result.units == null ? '—' : result.units) + (result.closedUnits == null ? '' : ' · đã bán ' + result.closedUnits) + '</strong></span><span>Sai sót<strong>' + (result.mistakes || 0) + ' · Trả hàng ' + (result.returns || 0) + '</strong></span><span>KPI<strong>' + (result.kpi ? 'Đạt' : 'Chưa đạt') + '</strong></span><span>Thưởng<strong>' + money(result.bonus || 0) + '</strong></span>' + (salaryStatus ? '<span>Thanh toán<strong>' + salaryStatus + '</strong></span>' : '') + '</div><p>Lương ' + money(result.pay) + ' · +' + result.xp + ' XP sự nghiệp' + (result.revenue == null ? '' : ' · Doanh thu ' + money(result.revenue)) + '</p>' + salaryRetry + '</section>';
    return '<section class="panel career-result"><span class="eyebrow">CA LÀM GẦN NHẤT</span><strong>' + esc(result.title) + ' · ' + esc(result.employer) + '</strong><p>Đơn chính xác ' + result.score + '/' + result.total + ' · Lương ' + money(result.pay) + ' · +' + result.xp + ' XP sự nghiệp' + (salaryStatus ? ' · ' + salaryStatus : '') + '</p>' + salaryRetry + '</section>';
  }
  function settleCareerSalary(state, result) {
    var career = ensureState(state);
    if (!result || result.salaryStatus === "paid") return Promise.resolve(true);
    if (salaryPaymentsInFlight[result.id]) return Promise.reject(new Error("Giao dịch nhận lương đang được xử lý."));
    if (!window.APXBank || typeof window.APXBank.recordCareerSalary !== "function") {
      return Promise.reject(new Error("Hệ thống APXBank chưa sẵn sàng."));
    }
    result.salaryStatus = "pending";
    salaryPaymentsInFlight[result.id] = true;
    return Promise.resolve().then(function () {
      return window.APXBank.recordCareerSalary(
        state, result.id, Number(result.salaryEarned != null ? result.salaryEarned : result.pay),
        "Lương ca làm tại " + result.employer
      );
    }).then(function () {
      if (result.salaryStatus !== "paid") career.totalSalaryReceived += Math.max(0, Number(result.salaryEarned != null ? result.salaryEarned : result.pay) || 0);
      result.salaryStatus = "paid";
      result.salaryReceived = Math.max(0, Number(result.salaryEarned != null ? result.salaryEarned : result.pay) || 0);
      result.salaryReceivedAt = new Date().toISOString();
      delete salaryPaymentsInFlight[result.id];
      return true;
    }, function (error) {
      result.salaryStatus = "pending";
      delete salaryPaymentsInFlight[result.id];
      throw error;
    });
  }
  function dailyReportCard(report) {
    if (!report) return '';
    return '<section class="panel career-result"><span class="eyebrow">BÁO CÁO NGÀY GAME ' + report.day + '</span><div class="career-result-grid"><span>Doanh thu<strong>' + money(report.revenue) + '</strong></span><span>Chi phí<strong>' + money(report.costs) + '</strong></span><span>Khách xuất hiện<strong>' + report.customers + '</strong></span><span>Khách đã phục vụ<strong>' + report.served + '</strong></span><span>Khách mua<strong>' + report.purchased + ' · rời đi ' + report.left + '</strong></span><span>Đơn phát sinh<strong>' + report.orders + '</strong></span><span>Đơn hoàn tất / lỗi<strong>' + report.completed + ' / ' + report.failed + '</strong></span><span>Thời gian xử lý TB<strong>' + report.averageResponse + ' giây</strong></span><span>Chất lượng<strong>' + report.quality + '%</strong></span><span>KPI<strong>' + (report.kpi ? 'Đạt' : 'Chưa đạt') + '</strong></span><span>Thưởng<strong>' + money(report.bonus) + '</strong></span><span>Lương<strong>' + money(report.salary) + '</strong></span><span>Danh tiếng<strong>' + report.reputation + '</strong></span></div></section>';
  }
  function offerCard(offer, state) {
    var job = JOBS[offer.type];
    var profession = ensureState(state).professions[offer.type];
    var alreadyPaid = Number(ensureState(state).lastPaidDay) === Number(state.day);
    return '<article class="career-job-card panel"><div class="career-job-top"><span class="career-job-icon" aria-hidden="true">' + job.icon + '</span><span class="career-job-rank">Cấp nghề ' + profession.level + '</span></div><span class="eyebrow">' + esc(offer.employer) + '</span><h3>' + esc(offer.title) + '</h3><p>' + esc(job.shift) + '</p><div class="career-job-reward"><span>Lương cơ bản/ca<strong>' + money(offer.basePay) + '</strong></span><span>Thưởng KPI<strong>tối đa ' + money(offer.bonusPay) + '</strong></span><span>Lưu lượng<strong>Theo giờ game</strong></span></div><button class="button button-gold" type="button" data-career-action="apply" data-job="' + offer.type + '">Ứng tuyển</button>' + (alreadyPaid ? '<small class="career-muted">Đã nhận lương hôm nay; có thể ứng tuyển, bắt đầu ca từ ngày game kế tiếp.</small>' : '') + '</article>';
  }
  function careerLink(page, label, style) {
    return '<a class="button ' + (style || '') + '" href="#" data-action="page" data-section="career" data-page="' + page + '">' + label + '</a>';
  }
  function contractDocument(state, contract, signed) {
    var role = roleFor(contract.roleId) || roleFor(ROOT_ROLES[contract.type]);
    var remaining = signed ? remainingText(Number(contract.endAt) - Date.now()) : (contract.duration + " ngày");
    var pay = Number(contract.salary || contract.basePay || role.salary);
    var cancelFee = signed ? compensation(contract) : Math.min(pay * 3, Math.round(pay * Number(contract.duration || 3) * 0.35));
    var days = signed ? (contract.startDay + " → " + contract.endDay) : (Number(state.day || 1) + " → " + (Number(state.day || 1) + Number(contract.duration || 3) - 1));
    var terms = contract.terms || ["Một công việc chính tại một thời điểm.", "Đơn phát sinh theo giờ game và hoạt động tại nơi làm.", "Mini-game theo nghề; mỗi đơn có trạng thái và hạn xử lý riêng.", "Tổng lương và thưởng KPI tối đa ₫1.000.000/ngày game.", "Nghỉ trước hạn bồi thường theo thời gian còn lại, tối đa ba ngày lương."];
    return '<header class="page-heading"><span class="eyebrow">HỢP ĐỒNG LAO ĐỘNG</span><h1>' + (signed ? "Chi tiết hợp đồng" : (contract.renewal ? "Đề nghị gia hạn" : "Đề nghị nhận việc")) + '</h1><p>' + (signed ? "Xem thời hạn, điều khoản và trạng thái hợp đồng hiện tại." : "Kiểm tra thông tin và ký để chính thức bắt đầu công việc.") + '</p></header><section class="panel career-contract"><div class="career-contract-heading"><span class="career-job-icon">' + JOBS[contract.type].icon + '</span><div><span class="eyebrow">' + esc(contract.employer) + '</span><h2>' + esc(role.jobName) + '</h2></div><span class="career-contract-status">' + (signed ? (contract.status === "expired" ? "ĐÃ HẾT HẠN" : "ĐANG CÓ HIỆU LỰC") : "CHỜ KÝ") + '</span></div><div class="career-contract-grid"><div><small>Công ty</small><strong>' + esc(contract.employer) + '</strong></div><div><small>Công việc</small><strong>' + esc(role.jobName) + '</strong></div><div><small>Lương cơ bản / ca</small><strong>' + money(pay) + '</strong></div><div><small>Thưởng KPI tối đa</small><strong>' + money(Math.max(0, 1000000 - pay)) + '</strong></div><div><small>Thời hạn</small><strong>' + (signed ? contract.duration : '<select data-career-term aria-label="Thời hạn hợp đồng">' + CONTRACT_OPTIONS.map(function (d) { return '<option value="' + d + '" ' + (Number(contract.duration) === d ? 'selected' : '') + '>' + d + ' ngày game</option>'; }).join('') + '</select>') + '</strong></div><div><small>Ngày bắt đầu → kết thúc</small><strong>' + (signed ? ("Ngày " + days) : ("Ngày game " + days)) + '</strong></div><div><small>Thời gian còn lại</small><strong>' + remaining + '</strong></div><div><small>Bồi thường nếu nghỉ sớm</small><strong>' + money(cancelFee) + '</strong></div></div><div class="career-contract-terms"><strong>Điều khoản cơ bản</strong><ul>' + terms.map(function (term) { return '<li>' + esc(term) + '</li>'; }).join('') + '</ul></div>' +
      (signed ? (contract.status === "expired" ? '<div class="career-contract-actions"><button class="button button-gold" type="button" data-career-action="renew">Gia hạn hợp đồng</button><button class="button" type="button" data-career-action="no-renew">Không gia hạn</button><button class="button" type="button" data-career-action="find-other">Kết thúc và tìm việc khác</button></div>' : '<div class="career-contract-actions">' + careerLink("current", "Quay lại công việc") + '</div>') : '<div class="career-contract-actions"><button class="button button-gold" type="button" data-career-action="sign">Ký hợp đồng</button><button class="button" type="button" data-career-action="cancel-application">Quay lại</button></div>') + '</section>';
  }
  function promotionCard(state, current) {
    var career = ensureState(state), offer = career.promotionOffer;
    if (!offer || offer.roleId !== current.roleId) return '';
    var roles = offer.jobIds.map(roleFor).filter(Boolean);
    if (!roles.length) return '';
    return '<section class="panel career-promotion"><span class="eyebrow">ĐỦ ĐIỀU KIỆN · XP ' + career.professions[current.type].xp + ' · HIỆU SUẤT ' + career.professions[current.type].performance + '% · UY TÍN ' + career.professions[current.type].reputation + '</span><h2>Cơ hội thăng tiến</h2><div class="career-promotion-choices">' + roles.map(function (role) { return '<article><strong>' + esc(role.jobName) + '</strong><span>Lương cơ bản ' + money(role.salary) + ' / ca</span><small>' + role.advancedTasks.length + ' thử thách quản lý/nghiệp vụ bổ sung mỗi ca</small><button class="button button-gold" type="button" data-career-action="promote" data-role="' + role.jobId + '">Nhận vị trí</button></article>'; }).join('') + '</div><button class="button" type="button" data-career-action="promotion-stay">Giữ vị trí hiện tại</button></section>';
  }
  function currentJobPage(state) {
    var career = ensureState(state), current = career.employment.current;
    if (career.activeJob) {
      if (career.activeJob.type === "lawyer" && window.APXLawyerCases) return window.APXLawyerCases.renderShift(state);
      return activeShift(state, career.activeJob);
    }
    if (career.employment.pending) return contractDocument(state, career.employment.pending, false);
    if (!current) return '<header class="page-heading"><span class="eyebrow">CÁ NHÂN · SỰ NGHIỆP</span><h1>Chưa có công việc chính</h1><p>Chọn một vị trí NPC và ký hợp đồng để bắt đầu làm việc.</p></header>' + progressPanel(state) + careerLink("jobs", "Tìm công việc", "button-gold");
    var role = roleFor(current.roleId) || roleFor(ROOT_ROLES[current.type]);
    var profession = career.professions[current.type];
    if (current.status === "expired") return '<header class="page-heading"><span class="eyebrow">CÁ NHÂN · SỰ NGHIỆP</span><h1>Hợp đồng đã hết hạn</h1><p>Vị trí được giữ lại để bạn chọn bước tiếp theo.</p></header>' + contractDocument(state, current, true);
    var elapsed = Math.max(0, Date.now() - Number(current.startAt));
    var pct = Math.max(0, Math.min(100, Math.round(elapsed / Math.max(1, Number(current.endAt) - Number(current.startAt)) * 100)));
    var rested = Boolean(career.restDays[String(state.day)]);
    var resignPanel = career.resignConfirmation ? '<div class="career-resign-warning"><strong>Hủy hợp đồng trước hạn</strong><p>Phí bồi thường là <b>' + money(compensation(current)) + '</b>. Số dư hiện tại: ' + money(state.cash) + '.</p>' + (Number(state.cash) < compensation(current) ? '<p class="career-error">Không đủ tiền bồi thường để chấm dứt hợp đồng.</p>' : '<button class="button button-danger" type="button" data-career-action="resign-confirm">Xác nhận hủy hợp đồng</button>') + ' <button class="button" type="button" data-career-action="resign-cancel">Quay lại</button></div>' : '';
    var shiftPicker = '<label class="career-shift-picker">Ca làm <select data-career-shift aria-label="Chọn ca làm"><option value="morning">Ca sáng · 08:00–14:00</option><option value="evening">Ca chiều · 14:00–22:00</option><option value="full" selected>Toàn thời gian · 08:00–22:00</option></select></label><small class="career-muted">Chọn một ca mỗi ngày. Đơn thường đến theo đợt 2–3 đơn, giữa các đợt có thời gian chờ.</small>';
    var physical = window.APXCharacter && window.APXCharacter.getPhysicalState ? window.APXCharacter.getPhysicalState(state) : null;
    var tooTired = physical && physical.energy < 10;
    return '<header class="page-heading"><span class="eyebrow">CÁ NHÂN · CÔNG VIỆC HIỆN TẠI</span><h1>' + esc(role.jobName) + '</h1><p>' + esc(current.employer) + '</p></header>' + physicalStatusMarkup(state, true) + (tooTired ? '<p class="career-error">Bạn đang rất mệt. Hãy nghỉ ngơi trước khi nhận ca mới.</p>' : '') + '<section class="panel career-current"><div class="career-current-grid"><div><small>Công việc</small><strong>' + esc(role.jobName) + '</strong></div><div><small>Công ty</small><strong>' + esc(current.employer) + '</strong></div><div><small>Cấp nghề</small><strong>' + role.careerLevel + '</strong></div><div><small>Lương cơ bản / ca</small><strong>' + money(current.salary) + '</strong></div><div><small>Hợp đồng còn lại</small><strong>' + remainingText(Number(current.endAt) - Date.now()) + '</strong></div><div><small>XP nghề</small><strong>' + profession.xp + '</strong></div><div><small>Hiệu suất</small><strong>' + profession.performance + '%</strong></div><div><small>Uy tín</small><strong>' + profession.reputation + '</strong></div><div><small>Ca đã làm</small><strong>' + profession.shifts + '</strong></div></div><div class="progress career-contract-progress"><span style="width:' + pct + '%"></span></div><div class="career-current-actions">' + shiftPicker + '<button class="button button-gold" type="button" data-career-action="start-shift"' + (rested || tooTired ? ' disabled' : '') + '>Bắt đầu ca đã chọn</button><button class="button" type="button" data-career-action="rest-day"' + (rested ? ' disabled' : '') + '>Nghỉ ca hôm nay</button>' + careerLink("contract", "Chi tiết hợp đồng") + '<button class="button button-danger" type="button" data-career-action="resign-request">Hủy hợp đồng</button></div>' + (rested ? '<p class="career-muted">Bạn đã chọn nghỉ ca hôm nay; có thể làm lại từ ngày game tiếp theo.</p>' : '') + resignPanel + '</section>' + promotionCard(state, current) + dailyReportCard(career.dailyReports[0]) + resultCard(career.history[0]) + (current.type === "lawyer" && window.APXLawyerCases ? window.APXLawyerCases.renderCareerResult(state) : '') + progressPanel(state);
  }
  function cookbook() {
    return '<details class="career-cookbook panel"><summary>Sổ công thức · ' + RECIPES.length + ' món</summary><div class="career-recipe-grid">' + RECIPES.map(function (recipe) {
      return '<article><strong>' + esc(recipe.name) + '</strong><span>' + esc(recipe.ingredients.join(' · ')) + '</span><small>' + esc(recipe.method) + ' · ' + recipe.minutes + ' phút</small></article>';
    }).join('') + '</div></details>';
  }
  function boardPage(state) {
    var career = ensureState(state);
    if (career.activeJob) return activeShift(state, career.activeJob);
    if (career.employment.pending) return contractDocument(state, career.employment.pending, false);
    if (career.employment.current) return currentJobPage(state);
    var offers = offerList(state);
    return '<header class="page-heading"><span class="eyebrow">SỰ NGHIỆP · VIỆC LÀM NPC</span><h1>Tìm công việc</h1><p>Ứng tuyển vào một công ty NPC, xem điều khoản rồi ký hợp đồng trước khi bắt đầu đi làm.</p></header>' +
      progressPanel(state) + dailyReportCard(career.dailyReports[0]) + resultCard(career.history[0]) +
      '<section class="career-job-board"><div class="section-title-row"><div><span class="eyebrow">ĐANG TUYỂN · NGÀY GAME ' + Number(state.day || 1) + '</span><h2>Ứng tuyển một nghề chính</h2><p>Đơn đến theo giờ hoạt động, giờ cao điểm và đặc thù công việc.</p></div><span class="career-job-count">' + offers.length + ' vị trí</span></div><div class="career-job-grid">' + offers.map(function (offer) { return offerCard(offer, state); }).join('') + '</div></section>' +
      '<section class="panel career-founder-progress"><div><span class="eyebrow">MỤC TIÊU DÀI HẠN</span><h2>Trở thành nhà sáng lập</h2><p>Mở công ty khi đạt cấp sự nghiệp 5, hoàn thành 8 ca và có tối thiểu ' + money(FOUNDING_COST) + '.</p></div><div class="career-founder-meter"><strong>' + Math.min(8, career.completedJobs) + ' / 8</strong><span>ca làm đã xong</span></div></section>' + cookbook();
  }
  function activeShift(state, active) {
    if (active.type === "lawyer" && window.APXLawyerCases) return window.APXLawyerCases.renderShift(state);
    if (active.gameplay && active.gameplay.version === 2) return liveGameplayShift(state, active);
    if (active.gameplay && active.gameplay.version === 1) return gameplayShift(state, active);
    var role = roleFor(active.roleId);
    var tasks = active.rankTasks || (role && role.advancedTasks) || [];
    if (active.round >= active.totalOrders && Number(active.specialRound || 0) < tasks.length) return advancedShift(active, tasks);
    if (active.type === "sales") return salesShift(state, active);
    if (active.type === "warehouse") return warehouseShift(state, active);
    return chefShift(state, active);
  }
  function eventCard(active) {
    var event = active.gameplay.pendingEvent;
    if (!event) return "";
    return '<section class="panel career-live-event"><span class="eyebrow">SỰ KIỆN · QUYẾT ĐỊNH TRONG CA</span><h2>' + esc(event.title) + '</h2><p>' + esc(event.detail) + '</p><div class="career-choice-grid">' + event.choices.map(function (choice, index) { return '<button class="career-choice-card" type="button" data-career-action="resolve-event" data-choice="' + index + '"><strong>' + esc(choice.label) + '</strong><span>Lựa chọn sẽ đổi tốc độ, chất lượng và trải nghiệm khách.</span></button>'; }).join('') + '</div></section>';
  }
  function runMetrics(active) {
    var m = active.gameplay.metrics, s = playStats(active.gameplay);
    var physicalSummary = physicalStatusMarkup(window.APXGame.state, true);
    if (active.gameplay.version === 2) {
      var waiting = active.gameplay.queue.filter(function (order) { return order.status === 'pending' || order.status === 'processing'; }).length;
      var clock = gameClockAt(window.APXGame.state, Date.now());
      return physicalSummary + '<div class="career-live-metrics"><span>Khách/đơn đến<strong>' + (active.type === 'sales' ? m.customersAppeared : m.ordersAppeared) + '</strong></span><span>Đang chờ<strong>' + waiting + '</strong></span><span>Hoàn thành<strong>' + m.ordersCompleted + '</strong></span><span>Lỗi / hết hạn<strong>' + m.ordersFailed + '</strong></span><span>Hiệu suất<strong>' + s.performance + '%</strong></span><span>Chất lượng<strong>' + s.quality + '%</strong></span><span>Doanh thu<strong>' + money(m.revenue) + '</strong></span><span>Giờ game<strong>' + String(clock.hour).padStart(2, '0') + ':' + String(clock.minute).padStart(2, '0') + '</strong></span></div>';
    }
    return physicalSummary + '<div class="career-live-metrics"><span>Hiệu suất<strong>' + s.performance + '%</strong></span><span>Chính xác<strong>' + s.accuracy + '%</strong></span><span>Khách hài lòng<strong>' + s.satisfaction + '%</strong></span><span>Chất lượng<strong>' + s.quality + '%</strong></span><span>Đã xử lý<strong>' + active.gameplay.workDone + '/' + active.gameplay.workCount + '</strong></span><span>Sai sót<strong>' + m.mistakes + '</strong></span><span>Thời gian còn<strong data-career-clock>' + shiftClockText(active.gameplay.deadlineAt - Date.now()) + '</strong></span></div>';
  }
  function shiftClockText(milliseconds) {
    var seconds = Math.max(0, Math.ceil(Number(milliseconds) / 1000));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function nextOrderButtons(active, orders, action) {
    return '<div class="career-ticket-grid">' + orders.filter(function (order) { return active.gameplay.version === 2 ? (order.status === 'pending' || order.status === 'processing') : !order.delivered; }).slice(0, 5).map(function (order) { var recipe = RECIPES.find(function (item) { return item.id === order.recipeId; }); var picked = active.gameplay.currentId === order.id; var itemText = order.items ? order.items.map(function (item) { return item.item + (item.quantity ? ' ×' + item.quantity : ''); }).join(' · ') : recipe && recipe.name; return '<button class="career-ticket' + (picked ? ' selected' : '') + '" type="button" data-career-action="' + action + '" data-id="' + esc(order.id) + '"><strong>' + (order.urgent ? '⚡ ' : '') + (action === 'chef-ticket' ? 'Bàn ' + order.table : 'Đơn #' + order.number) + '</strong><span>' + esc(itemText || '') + '</span><small>' + (action === 'chef-ticket' ? esc(order.note) : order.items.length + ' mặt hàng · ' + (order.fragile ? 'hàng dễ vỡ' : 'kiện tiêu chuẩn')) + '</small></button>'; }).join('') + '</div>';
  }
  function salesGameplayShift(state, active) {
    var play = active.gameplay, live = play.version === 2;
    var customer = live ? play.queue.find(function (item) { return item.id === play.currentId && item.status !== 'expired'; }) : play.queue[play.customerAt || 0];
    var queue = live ? '<section class="panel career-task-card"><h2>Khách đang chờ</h2>' + salesQueueButtons(active, play.queue) + '</section>' : '';
    if (!customer) return shiftHeader(active, 0, 0) + runMetrics(active) + eventCard(active) + queue + '<section class="panel career-task-card"><h2>Đang chờ khách tiếp theo</h2><p>Khách sẽ xuất hiện theo giờ hoạt động của cửa hàng. Giờ cao điểm có thể mang nhiều lượt liên tiếp.</p></section>';
    var step = '';
    if (customer.stage === 'feedback') step = '<span class="eyebrow">PHẢN HỒI KHÁCH</span><h2>' + esc(customer.customer) + (customer.outcome.won ? ' đã chốt ' + esc(customer.orderUnits + ' sản phẩm') : ' chưa chốt đơn') + '</h2><p>' + esc(customer.outcome.message) + '</p><p>Doanh thu khách này: <strong>' + money(customer.outcome.revenue) + '</strong> · Hài lòng ' + customer.outcome.satisfaction + '%</p><button class="button button-gold" type="button" data-career-action="sales-next">Tiếp khách</button>';
    else if (customer.stage === 'discover') step = '<span class="eyebrow">' + (live ? 'KHÁCH ĐANG CHỜ · ' : 'KHÁCH ' + ((play.customerAt || 0) + 1) + '/' + play.queue.length + ' · ') + customer.orderUnits + ' SẢN PHẨM DỰ KIẾN</span><h2>' + esc(customer.customer) + ' cần ' + esc(customer.need) + '</h2><p>Khách chưa nói rõ ngân sách, mức ưu tiên hay hiểu biết sản phẩm.</p><div class="career-choice-grid"><button class="career-choice-card" type="button" data-career-action="sales-ask"><strong>Hỏi thêm nhu cầu</strong><span>Biết thêm ngân sách và ưu tiên · tốn ít thời gian</span></button><button class="career-choice-card" type="button" data-career-action="sales-quick"><strong>Tư vấn nhanh</strong><span>Giữ nhịp cửa hàng · thông tin khách còn thiếu</span></button></div>';
    else if (customer.stage === 'product') step = '<span class="eyebrow">CHỌN GIẢI PHÁP</span><h2>' + esc(customer.asked ? 'Khách cho biết mức ngân sách khoảng ' + money(customer.budget) : 'Bạn chưa xác minh ngân sách của khách') + '</h2><p>Chọn một sản phẩm để tư vấn cho ' + esc(customer.customer) + '.</p><div class="career-choice-grid">' + customer.choices.map(function (item) { return '<button class="career-choice-card" type="button" data-career-action="sales-product" data-id="' + esc(item.id) + '"><strong>' + esc(item.name) + '</strong><span>' + money(item.price) + '</span></button>'; }).join('') + '</div>';
    else if (customer.stage === 'strategy') step = '<span class="eyebrow">ĐÀM PHÁN · GIÁ ĐỐI THỦ THẤP HƠN 300.000 ₫</span><h2>Khách đang cân nhắc đề nghị của bạn</h2><p>Khách nhạy giá: ' + (customer.priceSensitivity >= 60 ? 'cao' : 'vừa/thấp') + ' · cơ hội mua thêm: ' + (customer.upsell >= 60 ? 'cao' : 'vừa/thấp') + '.</p><div class="career-choice-grid"><button class="career-choice-card" type="button" data-career-action="sales-strategy" data-id="value"><strong>Giải thích lợi ích</strong><span>Giữ giá · tăng niềm tin nếu tư vấn đúng nhu cầu</span></button><button class="career-choice-card" type="button" data-career-action="sales-strategy" data-id="discount"><strong>Giảm giá có giới hạn</strong><span>Tăng cơ hội chốt · giảm doanh thu mỗi sản phẩm</span></button><button class="career-choice-card" type="button" data-career-action="sales-strategy" data-id="accessory"><strong>Tặng phụ kiện</strong><span>Tăng hài lòng · dùng ngân sách quà tặng của ca</span></button><button class="career-choice-card" type="button" data-career-action="sales-strategy" data-id="hold"><strong>Giữ giá</strong><span>Bảo toàn doanh thu · có thể mất khách nhạy giá</span></button></div>';
    return shiftHeader(active, play.workDone, play.workCount) + runMetrics(active) + eventCard(active) + queue + '<section class="panel career-task-card career-sales-scene">' + step + '</section>' + (live || play.pendingEvent ? '' : '<button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>');
  }
  function salesQueueButtons(active, orders) {
    return '<div class="career-ticket-grid">' + orders.filter(function (order) { return order.status === 'pending' || order.status === 'processing'; }).slice(0, 5).map(function (order) { return '<button class="career-ticket' + (active.gameplay.currentId === order.id ? ' selected' : '') + '" type="button" data-career-action="sales-select" data-id="' + esc(order.id) + '"><strong>' + esc(order.customer) + '</strong><span>' + esc(order.need) + '</span><small>' + order.orderUnits + ' sản phẩm · khách chờ</small></button>'; }).join('') + '</div>';
  }
  function warehouseGameplayShift(state, active) {
    var play = active.gameplay, live = play.version === 2;
    var order = play.queue.find(function (item) { return item.id === play.currentId; }) || play.queue.find(function (item) { return live ? item.status === 'pending' || item.status === 'processing' : !item.delivered; });
    if (!order) return shiftHeader(active, 0, 0) + runMetrics(active) + eventCard(active) + '<section class="panel career-task-card"><h2>Kho đang chờ đơn mới</h2><p>Đơn giao sẽ vào hàng chờ theo giờ game; giờ cao điểm có thể có nhiều đơn cùng lúc.</p></section>';
    var body = '<span class="eyebrow">' + (order.urgent ? '⚡ ĐƠN ƯU TIÊN · ' : 'ĐƠN KHO · ') + '#' + order.number + '</span>';
    if (order.stage === 'pick') {
      var target = order.items[order.itemIndex || 0];
      body += '<h2>Lấy ' + esc(target.item) + ' tại khu ' + target.bin.charAt(0) + '</h2><p>' + (order.items.length > 1 ? 'Mặt hàng ' + ((order.itemIndex || 0) + 1) + '/' + order.items.length + ' · ' : '') + (target.quantity ? 'Số lượng cần lấy: ' + target.quantity + ' · ' : '') + 'Chọn kệ chính xác; có thể kiểm tra lại trước khi đóng đơn.</p><div class="career-shelf-grid">' + SHELVES.map(function (shelf) { return '<button class="career-shelf" type="button" data-career-action="warehouse-pick" data-bin="' + shelf.bin + '"><strong>' + shelf.bin + '</strong><span>' + esc(shelf.item) + '</span></button>'; }).join('') + '</div>';
    } else if (order.stage === 'inspect') body += '<h2>Kiểm số lượng và tình trạng</h2><p>' + order.items.length + ' mặt hàng · tình trạng kiện: ' + esc(order.condition) + (order.fragile ? ' · hàng dễ vỡ' : '') + '</p><div class="career-choice-grid"><button class="career-choice-card" type="button" data-career-action="warehouse-inspect" data-id="careful"><strong>Đếm và kiểm từng món</strong><span>Chậm hơn · giảm nhầm hàng, phát hiện hàng lỗi</span></button><button class="career-choice-card" type="button" data-career-action="warehouse-inspect" data-id="quick"><strong>Bỏ qua kiểm tra chi tiết</strong><span>Nhanh hơn · tăng rủi ro trả hàng</span></button></div>';
    else if (order.stage === 'pack') body += '<h2>Đóng gói và xác nhận đơn</h2><p>Chọn cách đóng gói cho ' + (order.fragile ? 'hàng dễ vỡ' : 'đơn hàng thường') + '.</p><div class="career-choice-grid"><button class="career-choice-card" type="button" data-career-action="warehouse-pack" data-id="careful"><strong>Đóng gói gia cố</strong><span>Tốn thời gian · bảo vệ hàng tốt</span></button><button class="career-choice-card" type="button" data-career-action="warehouse-pack" data-id="quick"><strong>Đóng gói tiêu chuẩn</strong><span>Nhanh · phù hợp kiện hàng nguyên vẹn</span></button></div>';
    else body += '<h2>Đơn đã sẵn sàng giao</h2><p>Đối chiếu mã đơn rồi xác nhận bàn giao.</p><button class="button button-gold" type="button" data-career-action="warehouse-dispatch">Xác nhận giao đơn</button>';
    var orders = nextOrderButtons(active, play.queue, 'warehouse-select');
    return shiftHeader(active, play.workDone, play.workCount) + runMetrics(active) + eventCard(active) + '<section class="panel career-task-card"><h2>Danh sách đơn cần soạn</h2>' + orders + '</section><section class="panel career-task-card career-warehouse-scene">' + body + '</section>' + (live || play.pendingEvent ? '' : '<button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>');
  }
  function chefGameplayShift(state, active) {
    var play = active.gameplay, live = play.version === 2;
    var order = play.queue.find(function (item) { return item.id === play.currentId; }) || play.queue.find(function (item) { return live ? item.status === 'pending' || item.status === 'processing' : !item.delivered; });
    if (!order) return shiftHeader(active, 0, 0) + runMetrics(active) + eventCard(active) + '<section class="panel career-task-card"><h2>Bếp đang chờ ticket mới</h2><p>Món mới được gọi theo giờ hoạt động; giờ ăn có thể dồn nhiều ticket vào bếp.</p></section>';
    var recipe = RECIPES.find(function (item) { return item.id === order.recipeId; }) || RECIPES[0];
    var body = '<span class="eyebrow">' + (order.urgent ? '⚡ ƯU TIÊN · ' : '') + 'BÀN ' + order.table + '</span><h2>' + esc(recipe.name) + '</h2><p>Ghi chú: <strong>' + esc(order.note) + '</strong> · ' + esc(order.quality) + '</p>';
    if (order.stage === 'ingredients') {
      var options = ingredientChoices(recipe, active.seed + order.table);
      body += '<p>Chọn nguyên liệu đúng công thức; nếu đã nhận ghi chú loại nguyên liệu, bỏ nguyên liệu đó.</p><div class="career-ingredient-grid">' + options.map(function (ingredient) { var selected = order.selectedIngredients.indexOf(ingredient) >= 0, removed = order.noteHandled && noteIngredient(order.note) === ingredient; return '<button class="career-ingredient' + (selected ? ' selected' : '') + '" type="button" data-career-action="chef-toggle" data-ingredient="' + esc(ingredient) + '"' + (removed ? ' disabled aria-disabled="true" title="Đã loại bỏ theo ghi chú khách"' : '') + '>' + (removed ? '× ' : (selected ? '✓ ' : '+ ')) + esc(ingredient) + '</button>'; }).join('') + '</div><button class="button button-gold" type="button" data-career-action="chef-confirm-ingredients">Xác nhận nguyên liệu</button>';
    } else if (order.stage === 'note') body += '<h3>Ghi chú: ' + esc(order.note) + '</h3><div class="career-choice-grid"><button class="career-choice-card" type="button" data-career-action="chef-note" data-id="follow"><strong>Thực hiện ghi chú khách</strong><span>' + (noteIngredient(order.note) ? 'Loại ' + esc(noteIngredient(order.note)) + ' khỏi phần ăn' : 'Điều chỉnh vị, sốt hoặc lượng rau') + '</span></button><button class="career-choice-card" type="button" data-career-action="chef-note" data-id="skip"><strong>Giữ quy trình chuẩn</strong><span>Nhanh hơn · khách có thể không hài lòng</span></button></div>';
    else if (order.stage === 'method') body += '<p>Chọn phương pháp chế biến.</p><div class="career-choice-grid">' + ["Xào", "Luộc", "Nướng", "Áp chảo", "Chiên", "Kho", "Nấu nước dùng", "Pha phin", "Ủ trà", "Ninh", "Hấp"].map(function (method) { return '<button class="career-choice-card" type="button" data-career-action="chef-method" data-id="' + esc(method) + '">' + esc(method) + '</button>'; }).join('') + '</div>';
    else if (order.stage === 'time') body += '<p>Công thức cần ' + recipe.minutes + ' phút. Cân bằng tốc độ và chất lượng.</p><div class="career-choice-grid"><button class="career-choice-card" type="button" data-career-action="chef-time" data-id="fast"><strong>Nấu nhanh</strong><span>Ra món sớm · giảm chất lượng</span></button><button class="career-choice-card" type="button" data-career-action="chef-time" data-id="steady"><strong>Đúng thời gian</strong><span>Giữ chất lượng món</span></button><button class="career-choice-card" type="button" data-career-action="chef-time" data-id="careful"><strong>Nấu kỹ và nếm lại</strong><span>Chậm hơn · tăng chất lượng, hài lòng</span></button></div>';
    else body += '<h3>Sẵn sàng giao món</h3><button class="button button-gold" type="button" data-career-action="chef-deliver">Giao món cho bàn ' + order.table + '</button>';
    return shiftHeader(active, play.workDone, play.workCount) + runMetrics(active) + eventCard(active) + '<section class="panel career-task-card"><h2>Ticket đang chờ</h2>' + nextOrderButtons(active, play.queue, 'chef-ticket') + '</section><section class="panel career-task-card career-chef-scene">' + body + '</section>' + (live || play.pendingEvent ? '' : '<button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>');
  }
  function liveGameplayShift(state, active) {
    var body = active.type === 'sales' ? salesGameplayShift(state, active) : active.type === 'warehouse' ? warehouseGameplayShift(state, active) : chefGameplayShift(state, active);
    return '<div class="career-minigame">' + body + liveRankTask(active) + '<section class="panel career-live-note"><span class="eyebrow">CA ĐANG MỞ</span><p>Đơn mới phát sinh theo giờ game thành từng đợt 2–3 đơn, xen kẽ khoảng chờ. Hàng chờ có giới hạn; việc xử lý, thất bại và hết hạn được tính vào báo cáo ca.</p></section><div class="career-minigame-actions"><button class="button button-gold" type="button" data-career-action="close-early">Chốt ca sớm · nhận lương theo thời gian làm</button><button class="button button-danger" type="button" data-career-action="quit">Bỏ ca ngay · không lương</button></div></div>';
  }
  function liveRankTask(active) {
    var tasks = active.rankTasks || [], index = Number(active.specialRound) || 0, task = tasks[index];
    if (!task) return '';
    return '<section class="panel career-task-card"><span class="eyebrow">THỬ THÁCH VỊ TRÍ · ' + (index + 1) + '/' + tasks.length + '</span><h2>' + esc(task.prompt) + '</h2><div class="career-choice-grid">' + task.choices.map(function (choice, choiceIndex) { return '<button class="career-choice-card" type="button" data-career-action="rank-choice" data-choice="' + choiceIndex + '">' + esc(choice) + '</button>'; }).join('') + '</div></section>';
  }
  function gameplayShift(state, active) {
    var play = active.gameplay;
    if (play.pendingEvent) return shiftHeader(active, play.workDone, play.workCount) + runMetrics(active) + eventCard(active);
    var tasks = active.rankTasks || [];
    if (play.workDone >= play.workCount && Number(active.specialRound || 0) < tasks.length) return advancedShift(active, tasks);
    if (play.workDone >= play.workCount) return active.type === 'sales' ? salesGameplayShift(state, active) : active.type === 'warehouse' ? warehouseGameplayShift(state, active) : chefGameplayShift(state, active);
    return active.type === 'sales' ? salesGameplayShift(state, active) : active.type === 'warehouse' ? warehouseGameplayShift(state, active) : chefGameplayShift(state, active);
  }
  function advancedShift(active, tasks) {
    var index = Number(active.specialRound) || 0, task = tasks[index];
    return shiftHeader(active, active.totalOrders, active.totalOrders) + '<section class="panel career-task-card"><span class="eyebrow">TRÁCH NHIỆM VỊ TRÍ · ' + (index + 1) + '/' + tasks.length + '</span><h2>' + esc(task.prompt) + '</h2><div class="career-choice-grid">' + task.choices.map(function (choice, choiceIndex) { return '<button class="career-choice-card" type="button" data-career-action="rank-choice" data-choice="' + choiceIndex + '">' + esc(choice) + '</button>'; }).join('') + '</div><small>Hoàn thành các quyết định quản lý/nghiệp vụ để bàn giao ca.</small></section><button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>';
  }
  function shiftHeader(active, step, total) {
    var job = JOBS[active.type];
    if (active.gameplay && active.gameplay.version === 2) {
      var clock = gameClockAt(window.APXGame.state, Date.now());
      var shift = active.gameplay.shift || SHIFT_OPTIONS.full;
      return '<header class="page-heading"><span class="eyebrow">CA LÀM · ' + esc(active.employer) + ' · NGÀY ' + Number(active.day || 1) + '</span><h1>' + job.icon + ' ' + esc(active.title) + '</h1><p>' + esc(shift.label) + ' · ' + String(shift.startHour).padStart(2, '0') + ':00–' + String(shift.endHour).padStart(2, '0') + ':00. Ca tự kết thúc theo đồng hồ game.</p></header><section class="career-shift-progress panel"><strong>Giờ game ' + String(clock.hour).padStart(2, '0') + ':' + String(clock.minute).padStart(2, '0') + '</strong><span class="career-shift-pay">Lương cơ bản ' + money(active.basePay) + ' · KPI tính khi hết ca</span></section>';
    }
    return '<header class="page-heading"><span class="eyebrow">CA LÀM · ' + esc(active.employer) + ' · NGÀY ' + Number(active.day || 1) + '</span><h1>' + job.icon + ' ' + esc(active.title) + '</h1><p>NPC tuyển dụng trả công khi hoàn thành ca; tổng lương và thưởng từ ₫500.000 đến tối đa ₫1.000.000/ngày.</p></header><section class="career-shift-progress panel"><strong>Đơn ' + Math.min(step + 1, total) + ' / ' + total + '</strong><span class="career-shift-pay">Lương cơ bản ' + money(active.basePay) + '</span></section>';
  }
  function salesShift(state, active) {
    var round = active.round || 0;
    if (round >= active.totalOrders) return shiftHeader(active, active.totalOrders - 1, active.totalOrders) + '<section class="panel career-task-card"><h2>Đã tư vấn xong</h2><p>Chốt được ' + active.score + '/' + active.totalOrders + ' đơn phù hợp.</p><button class="button button-gold" type="button" data-career-action="finish">Giao ca và nhận lương NPC</button></section>';
    var scenario = SALES_SCENARIOS[(active.seed + round) % SALES_SCENARIOS.length];
    return shiftHeader(active, round, active.totalOrders) + '<section class="panel career-task-card"><span class="eyebrow">ĐƠN #' + (round + 1) + ' · KHÁCH ' + esc(scenario.customer) + '</span><h2>Khách cần ' + esc(scenario.need) + '</h2><p>Ngân sách tối đa: <strong>' + money(scenario.budget) + '</strong>. Chọn sản phẩm phù hợp nhất.</p><div class="career-choice-grid">' + scenario.choices.map(function (choice) {
      return '<button class="career-choice-card" type="button" data-career-action="sales-choice" data-choice="' + choice.id + '"><strong>' + esc(choice.name) + '</strong><span>' + money(choice.price) + '</span></button>';
    }).join('') + '</div><small>Đơn đúng nhu cầu và ngân sách giúp tăng thưởng KPI.</small></section><button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>';
  }
  function warehouseTarget(active) { return SHELVES[(active.seed + (active.round || 0) * 5) % SHELVES.length]; }
  function warehouseShift(state, active) {
    var round = active.round || 0;
    if (round >= active.totalOrders) return shiftHeader(active, active.totalOrders - 1, active.totalOrders) + '<section class="panel career-task-card"><h2>Đơn đã soạn xong</h2><p>Chọn đúng vị trí cho ' + active.score + '/' + active.totalOrders + ' mặt hàng.</p><button class="button button-gold" type="button" data-career-action="finish">Bàn giao và nhận lương NPC</button></section>';
    var target = warehouseTarget(active);
    return shiftHeader(active, round, active.totalOrders) + '<section class="panel career-task-card"><span class="eyebrow">ĐƠN HÀNG #' + (1840 + active.seed + round) + '</span><h2>Tìm mặt hàng: ' + esc(target.item) + '</h2><p>Chọn đúng kệ trong kho 3 × 3.</p><div class="career-shelf-grid">' + SHELVES.map(function (shelf) {
      return '<button class="career-shelf" type="button" data-career-action="pick-bin" data-bin="' + shelf.bin + '"><strong>' + shelf.bin + '</strong><span>' + esc(shelf.item) + '</span></button>';
    }).join('') + '</div></section><button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>';
  }
  function ingredientChoices(recipe, seed) {
    var choices = recipe.ingredients.slice();
    var offset = seed % EXTRA_INGREDIENTS.length;
    for (var i = 0; i < EXTRA_INGREDIENTS.length && choices.length < recipe.ingredients.length + 2; i += 1) {
      var ingredient = EXTRA_INGREDIENTS[(offset + i) % EXTRA_INGREDIENTS.length];
      if (choices.indexOf(ingredient) < 0) choices.push(ingredient);
    }
    return choices;
  }
  function chefShift(state, active) {
    var recipe = RECIPES.find(function (item) { return item.id === active.recipeId; }) || RECIPES[0];
    var header = shiftHeader(active, active.orderIndex || 0, active.totalOrders || 4);
    var choices = ingredientChoices(recipe, active.seed);
    var recipePanel = '<aside class="career-recipe-reference"><span class="eyebrow">CÔNG THỨC CA NÀY</span><strong>' + esc(recipe.name) + '</strong><span>Nguyên liệu: ' + esc(recipe.ingredients.join(' · ')) + '</span><span>Cách nấu: ' + esc(recipe.method) + '</span><span>Thời gian: ' + recipe.minutes + ' phút</span></aside>';
    var stage = active.stage || "ingredients";
    var body = '';
    if (stage === "ingredients") {
      body = '<h2>Chọn nguyên liệu cho ' + esc(recipe.name) + '</h2><p>Chọn đủ nguyên liệu trong công thức, không lấy thêm món khác.</p><div class="career-ingredient-grid">' + choices.map(function (ingredient) {
        var selected = active.selectedIngredients.indexOf(ingredient) >= 0;
        return '<button class="career-ingredient' + (selected ? ' selected' : '') + '" type="button" aria-pressed="' + selected + '" data-career-action="toggle-ingredient" data-ingredient="' + esc(ingredient) + '">' + (selected ? '✓ ' : '+ ') + esc(ingredient) + '</button>';
      }).join('') + '</div><button class="button button-gold" type="button" data-career-action="submit-ingredients">Xác nhận nguyên liệu</button>';
    } else if (stage === "method") {
      body = '<h2>Chọn cách nấu</h2><p>Thực hiện theo công thức của đầu bếp trưởng.</p><div class="career-choice-grid">' + ["Xào", "Luộc", "Nướng", "Áp chảo", "Chiên", "Kho", "Nấu nước dùng", "Pha phin", "Ủ trà", "Ninh", "Hấp"].map(function (method) {
        return '<button class="career-choice-card" type="button" data-career-action="choose-method" data-method="' + esc(method) + '">' + esc(method) + '</button>';
      }).join('') + '</div>';
    } else if (stage === "time") {
      var times = [Math.max(1, recipe.minutes - 3), recipe.minutes, recipe.minutes + 4];
      body = '<h2>Canh thời gian nấu</h2><p>Công thức yêu cầu ' + recipe.minutes + ' phút.</p><div class="career-choice-grid">' + times.map(function (minutes) {
        return '<button class="career-choice-card" type="button" data-career-action="choose-time" data-minutes="' + minutes + '"><strong>' + minutes + ' phút</strong></button>';
      }).join('') + '</div>';
    } else if (stage === "delivery") {
      body = '<h2>Sẵn sàng giao món</h2><p>' + esc(recipe.name) + ' · món ' + ((active.orderIndex || 0) + 1) + '/' + active.totalOrders + ' trong ca.</p><button class="button button-gold" type="button" data-career-action="deliver">Giao món ' + ((active.orderIndex || 0) + 1) + '/' + active.totalOrders + '</button>';
    } else {
      body = '<h2>Đã hoàn thành ' + active.totalOrders + ' đơn bếp</h2><p>Độ chính xác ' + active.score + '/' + (active.totalOrders * 3) + '. Bàn giao ca để NPC trả lương ' + money(active.basePay) + '–' + money(active.basePay + active.bonusPay) + '.</p><button class="button button-gold" type="button" data-career-action="finish">Bàn giao ca và nhận lương</button>';
    }
    return header + '<section class="career-chef-layout">' + recipePanel + '<article class="panel career-task-card career-chef-task"><span class="eyebrow">ĐƠN BẾP #' + (410 + active.seed) + '</span>' + body + '</article></section>' + cookbook() + '<button class="button career-quit" type="button" data-career-action="quit">Bỏ ca · không nhận lương</button>';
  }
  function saveAndRender(message) {
    if (window.APXGame) {
      window.APXGame.save();
      window.APXGame.render();
      if (message) window.APXGame.toast(message);
    }
  }
  function resolveShiftEvent(active, choiceIndex, state) {
    var play = active.gameplay, event = play && play.pendingEvent, choice = event && event.choices[Number(choiceIndex)];
    if (!choice) return;
    var effects = choice.effects || {}, metrics = play.metrics;
    ["speed", "satisfactionBonus", "accuracyBonus", "qualityBonus"].forEach(function (key) {
      var source = key === "satisfactionBonus" ? "satisfaction" : key === "accuracyBonus" ? "accuracy" : key === "qualityBonus" ? "quality" : key;
      if (effects[source]) metrics[key] = (Number(metrics[key]) || 0) + Number(effects[source]);
    });
    metrics.revenue += Number(effects.revenue) || 0;
    play.eventsDone.push(event.id);
    var career = ensureState(state);
    career.recentEvents.push(event.id);
    career.recentEvents = career.recentEvents.slice(-4);
    play.pendingEvent = null;
    saveAndRender("Đã ghi nhận quyết định: " + choice.label + ".");
  }
  function settleSalesCustomer(active, customer, tactic, state) {
    var play = active.gameplay, metrics = play.metrics, product = customer.proposed;
    if (!product) return;
    var fitsNeed = product.id === customer.preferred, withinBudget = product.price <= customer.budget;
    var chance = 42 + (fitsNeed ? 19 : 0) + (withinBudget ? 14 : -20) + (customer.asked ? 10 : -7) - customer.difficulty * 0.22;
    if (window.APXCharacter && window.APXCharacter.getPhysicalState) {
      var physical = window.APXCharacter.getPhysicalState(state);
      chance -= Math.max(0, 60 - physical.energy) * 0.08;
      chance -= Math.max(0, 60 - physical.focus) * 0.12;
      chance -= Math.max(0, 40 - physical.fullness) * 0.1;
      if (physical.mood >= 85) chance += 2;
    }
    if (tactic === "value") chance += fitsNeed ? 9 : -2;
    if (tactic === "discount") chance += customer.priceSensitivity * 0.25;
    if (tactic === "accessory") chance += customer.upsell * 0.12;
    if (tactic === "hold") chance += customer.priceSensitivity < 35 ? 7 : -customer.priceSensitivity * 0.12;
    chance = Math.max(12, Math.min(94, chance));
    var won = Math.random() * 100 < chance, satisfaction = 57 + (fitsNeed ? 18 : 0) + (withinBudget ? 9 : -16) + (customer.asked ? 9 : -6);
    if (tactic === "value") satisfaction += fitsNeed ? 9 : -2;
    if (tactic === "discount") satisfaction += customer.priceSensitivity >= 55 ? 11 : 3;
    if (tactic === "accessory") satisfaction += customer.upsell >= 55 ? 9 : -4;
    if (tactic === "hold" && customer.priceSensitivity >= 65) satisfaction -= 9;
    satisfaction = Math.max(20, Math.min(100, satisfaction + Math.round(Math.random() * 10 - 5)));
    var multiplier = tactic === "discount" ? 0.95 : 1;
    var revenue = won ? Math.round(product.price * customer.orderUnits * multiplier + (tactic === "accessory" && customer.upsell >= 50 ? 75000 : 0)) : 0;
    metrics.customers += 1;
    metrics.customersServed += 1;
    metrics.responseMs += Math.max(0, Date.now() - Number(customer.createdAt || Date.now()));
    metrics.responseCount += 1;
    if (won) metrics.customersPurchased += 1;
    metrics.satisfactionCount += 1;
    metrics.satisfaction += satisfaction;
    metrics.qualityCount += 1;
    metrics.quality += satisfaction + (fitsNeed ? 8 : 0);
    metrics.accuracyCount += customer.orderUnits;
    if (play.version !== 2) metrics.units += customer.orderUnits;
    metrics.orders += won ? customer.orderUnits : 0;
    if (play.version === 2) {
      if (won) metrics.ordersCompleted += 1;
      else metrics.ordersFailed += 1;
    }
    metrics.revenue += revenue;
    metrics.speed += customer.asked ? -1 : 3;
    if (!fitsNeed || !withinBudget) metrics.mistakes += won ? Math.max(0, Math.ceil(customer.orderUnits * 0.15)) : Math.ceil(customer.orderUnits * 0.3);
    customer.outcome = { won: won, revenue: revenue, satisfaction: satisfaction, message: won ? (fitsNeed ? "Khách thấy sản phẩm khớp nhu cầu." : "Khách chấp nhận phương án thay thế sau khi cân nhắc.") : (withinBudget ? "Khách muốn tham khảo thêm trước khi quyết định." : "Mức giá vượt khả năng chi trả của khách.") };
    customer.stage = "feedback";
    play.workDone += 1;
    active.round = play.workDone;
    nextEvent(active);
    saveAndRender(won ? "Khách đã chốt đơn." : "Khách chưa mua; ghi nhận phản hồi.");
  }
  function selectNextLiveOrder(play) {
    var next = play.queue.find(function (item) { return item.status === "pending"; });
    if (next) { next.status = "processing"; play.currentId = next.id; }
    else play.currentId = null;
    return next;
  }
  function liveGameplayAction(action, button, active, state) {
    var play = active.gameplay, metrics = play.metrics;
    if (action === "resolve-event") return resolveShiftEvent(active, button.dataset.choice, state);
    if (play.pendingEvent) return;
    var order = play.queue.find(function (item) { return item.id === play.currentId; });
    if (action === "sales-select" || action === "warehouse-select" || action === "chef-ticket") {
      if (active.type === "sales" && order && order.stage === "feedback") return;
      var selected = play.queue.find(function (item) { return item.id === button.dataset.id && (item.status === "pending" || item.status === "processing"); });
      if (!selected) return;
      selected.status = "processing"; play.currentId = selected.id;
      return saveAndRender("Đã ưu tiên " + (selected.customer || selected.recipeId || ("đơn #" + selected.number)) + ".");
    }
    if (!order) return;
    if (active.type === "sales") {
      if (action === "sales-ask" || action === "sales-quick") { order.asked = action === "sales-ask"; order.stage = "product"; return saveAndRender(order.asked ? "Đã hỏi thêm nhu cầu khách." : "Bắt đầu tư vấn nhanh."); }
      if (action === "sales-product") { order.proposed = order.choices.find(function (item) { return item.id === button.dataset.id; }); if (!order.proposed) return; order.stage = "strategy"; return saveAndRender("Đã đề xuất " + order.proposed.name + "."); }
      if (action === "sales-strategy") return settleSalesCustomer(active, order, button.dataset.id, state);
      if (action === "sales-next" && order.stage === "feedback") { order.status = order.outcome.won ? "completed" : "failed"; order.servedAt = Date.now(); play.workDone += 1; active.round = play.workDone; selectNextLiveOrder(play); nextEvent(active); return saveAndRender("Đã hoàn tất phục vụ khách."); }
      return;
    }
    if (active.type === "warehouse") {
      if (action === "warehouse-pick" && order.stage === "pick") {
        var item = order.items[order.itemIndex || 0];
        metrics.accuracyCount += 1;
        if (button.dataset.bin === item.bin) order.pickAccuracy = (Number(order.pickAccuracy) || 0) + 1; else metrics.mistakes += 1;
        order.itemIndex = (Number(order.itemIndex) || 0) + 1;
        if (order.itemIndex >= order.items.length) order.stage = "inspect";
        return saveAndRender(button.dataset.bin === item.bin ? "Đã lấy đủ số lượng mặt hàng." : "Lấy sai vị trí; ghi nhận sai sót trong đơn.");
      }
      if (action === "warehouse-inspect" && order.stage === "inspect") {
        order.checked = button.dataset.id === "careful";
        if (order.checked) { if (order.condition !== "Nguyên vẹn") order.condition = "Đã thay kiện lỗi"; metrics.speed -= 2; metrics.quality += 12; }
        else { metrics.speed += 6; if (order.condition !== "Nguyên vẹn") { metrics.mistakes += 1; metrics.returns += 1; } }
        order.stage = "pack"; return saveAndRender(order.checked ? "Đã kiểm số lượng và tình trạng." : "Đã bỏ qua bước kiểm tra chi tiết.");
      }
      if (action === "warehouse-pack" && order.stage === "pack") {
        order.packedCarefully = button.dataset.id === "careful";
        if (order.packedCarefully) { metrics.speed -= 2; metrics.quality += order.fragile ? 12 : 5; }
        else { metrics.speed += 5; if (order.fragile) { metrics.mistakes += 1; metrics.returns += 1; } }
        order.stage = "dispatch"; return saveAndRender("Đơn đã đóng gói; sẵn sàng bàn giao.");
      }
      if (action === "warehouse-dispatch" && order.stage === "dispatch") {
        order.status = "completed"; order.delivered = true; order.completedAt = Date.now(); play.workDone += 1; active.round = play.workDone;
        metrics.orders += 1; metrics.ordersCompleted += 1; metrics.customersServed += 1;
        metrics.satisfactionCount += 1; metrics.customers += 1;
        metrics.satisfaction += order.pickAccuracy === order.items.length && order.checked ? 95 : 74;
        metrics.qualityCount += 1; metrics.quality += order.packedCarefully || order.checked ? 92 : 75;
        metrics.responseMs += Math.max(0, Date.now() - order.createdAt); metrics.responseCount += 1;
        if (order.urgent) metrics.speed += 2;
        selectNextLiveOrder(play); nextEvent(active);
        return saveAndRender("Đã giao đơn kho #" + order.number + ".");
      }
      return;
    }
    if (active.type === "chef") {
      var recipe = RECIPES.find(function (item) { return item.id === order.recipeId; }) || RECIPES[0];
      if (action === "chef-toggle" && order.stage === "ingredients") {
        var selectedIndex = order.selectedIngredients.indexOf(button.dataset.ingredient);
        if (selectedIndex >= 0) order.selectedIngredients.splice(selectedIndex, 1); else order.selectedIngredients.push(button.dataset.ingredient);
        return saveAndRender();
      }
      if (action === "chef-confirm-ingredients" && order.stage === "ingredients") {
        var removed = order.noteHandled && noteIngredient(order.note), expectedIngredients = recipe.ingredients.slice();
        if (removed && expectedIngredients.indexOf(removed) >= 0) expectedIngredients.splice(expectedIngredients.indexOf(removed), 1);
        order.ingredientCorrect = order.selectedIngredients.slice().sort().join("|") === expectedIngredients.sort().join("|");
        if (!order.ingredientCorrect) metrics.mistakes += 1;
        metrics.accuracyCount += 1; order.qualityScore = order.ingredientCorrect ? 78 : 45; order.stage = "method";
        return saveAndRender(order.ingredientCorrect ? "Nguyên liệu đã khớp yêu cầu." : "Thiếu hoặc thừa nguyên liệu.");
      }
      if (action === "chef-note" && order.stage === "note") {
        order.noteHandled = button.dataset.id === "follow"; order.qualityScore = 70 + (order.noteHandled ? 12 : -18);
        if (!order.noteHandled) metrics.mistakes += 1; order.stage = "ingredients";
        return saveAndRender(order.noteHandled ? "Đã áp dụng ghi chú khách." : "Đã bỏ qua ghi chú khách.");
      }
      if (action === "chef-method" && order.stage === "method") {
        order.methodCorrect = button.dataset.id === recipe.method; if (!order.methodCorrect) metrics.mistakes += 1;
        metrics.accuracyCount += 1; order.qualityScore += order.methodCorrect ? 12 : -15; order.stage = "time";
        return saveAndRender(order.methodCorrect ? "Đúng phương pháp chế biến." : "Phương pháp chưa khớp món.");
      }
      if (action === "chef-time" && order.stage === "time") {
        if (button.dataset.id === "fast") { order.qualityScore -= 12; metrics.speed += 8; }
        else if (button.dataset.id === "careful") { order.qualityScore += 15; metrics.speed -= 7; }
        else order.qualityScore += 6;
        order.stage = "delivery"; return saveAndRender("Đã hoàn tất chế biến.");
      }
      if (action === "chef-deliver" && order.stage === "delivery") {
        order.status = "completed"; order.delivered = true; order.completedAt = Date.now(); play.workDone += 1; active.round = play.workDone;
        metrics.orders += 1; metrics.ordersCompleted += 1; metrics.customersServed += 1; metrics.customers += 1;
        metrics.satisfactionCount += 1; metrics.satisfaction += Math.max(25, Math.min(100, 70 + (order.noteHandled ? 12 : 0) + (order.methodCorrect ? 6 : -7) + Math.round(Math.random() * 8 - 4)));
        metrics.qualityCount += 1; metrics.quality += Math.max(0, Math.min(100, order.qualityScore));
        metrics.revenue += Number(order.revenue) || 0; metrics.operatingCosts += Number(order.cost) || 0; metrics.responseMs += Math.max(0, Date.now() - order.createdAt); metrics.responseCount += 1;
        if (order.urgent) metrics.speed += 2; selectNextLiveOrder(play); nextEvent(active);
        return saveAndRender("Đã giao món cho bàn " + order.table + ".");
      }
    }
  }
  function gameplayAction(action, button, active, state) {
    var play = active.gameplay, metrics = play.metrics, order;
    if (play.version === 2) return liveGameplayAction(action, button, active, state);
    if (action === "resolve-event") return resolveShiftEvent(active, button.dataset.choice, state);
    if (play.pendingEvent) return;
    if (Date.now() > play.deadlineAt) { metrics.speed = Math.max(0, metrics.speed - 0.5); metrics.timePressureActions = (Number(metrics.timePressureActions) || 0) + 1; }
    if (action === "sales-ask" || action === "sales-quick" || action === "sales-product" || action === "sales-strategy" || action === "sales-next") {
      var customer = play.queue[play.customerAt || 0];
      if (!customer) return;
      if (action === "sales-ask" || action === "sales-quick") {
        customer.asked = action === "sales-ask";
        customer.stage = "product";
        return saveAndRender(customer.asked ? "Khách đã chia sẻ thêm thông tin." : "Bạn bắt đầu tư vấn với thông tin hiện có.");
      }
      if (action === "sales-product") {
        customer.proposed = customer.choices.find(function (item) { return item.id === button.dataset.id; });
        if (!customer.proposed) return;
        customer.stage = "strategy";
        return saveAndRender("Đã giới thiệu " + customer.proposed.name + ".");
      }
      if (action === "sales-strategy") return settleSalesCustomer(active, customer, button.dataset.id, state);
      if (customer.stage !== "feedback") return;
      play.customerAt += 1;
      if (play.customerAt >= play.queue.length) active.round = active.totalOrders;
      return saveAndRender(play.customerAt >= play.queue.length ? "Đã phục vụ hết khách trong ca." : "Khách tiếp theo đang chờ.");
    }
    if (action.indexOf("warehouse-") === 0) {
      order = play.queue.find(function (item) { return item.id === play.currentId; });
      if (action === "warehouse-select") { if (play.queue.some(function (item) { return item.id === button.dataset.id && !item.delivered; })) play.currentId = button.dataset.id; return saveAndRender(); }
      if (!order) return;
      if (action === "warehouse-pick" && order.stage === "pick") {
        var needed = order.items[order.itemIndex || 0];
        if (button.dataset.bin === needed.bin) order.pickAccuracy = (Number(order.pickAccuracy) || 0) + 1;
        else metrics.mistakes += 1;
        order.itemIndex = (Number(order.itemIndex) || 0) + 1;
        if (order.itemIndex >= order.items.length) order.stage = "inspect";
        return saveAndRender(button.dataset.bin === needed.bin ? "Đã quét vị trí hàng." : "Lấy nhầm vị trí; đơn vẫn có thể kiểm tra lại.");
      }
      if (action === "warehouse-inspect" && order.stage === "inspect") {
        order.checked = button.dataset.id === "careful";
        if (order.checked) {
          if (order.condition !== "Nguyên vẹn") { order.condition = "Đã thay kiện lỗi"; metrics.returns = Math.max(0, metrics.returns - 1); }
          metrics.speed -= 2; metrics.quality += 12;
        } else {
          metrics.speed += 6;
          if (order.condition !== "Nguyên vẹn") { metrics.mistakes += 1; metrics.returns += 1; }
        }
        order.stage = "pack";
        return saveAndRender(order.checked ? "Đã kiểm đếm và rà tình trạng." : "Đã bỏ qua bước kiểm tra kỹ.");
      }
      if (action === "warehouse-pack" && order.stage === "pack") {
        order.packedCarefully = button.dataset.id === "careful";
        if (order.packedCarefully) { metrics.speed -= 2; metrics.quality += order.fragile ? 12 : 5; }
        else { metrics.speed += 5; if (order.fragile) { metrics.mistakes += 1; metrics.returns += 1; } }
        order.stage = "dispatch";
        return saveAndRender(order.packedCarefully ? "Đã gia cố kiện hàng." : "Đã đóng gói tiêu chuẩn.");
      }
      if (action === "warehouse-dispatch" && order.stage === "dispatch") {
        order.delivered = true; play.workDone += 1; active.round = play.workDone;
        metrics.orders += 1; metrics.units += order.items.length; metrics.accuracyCount += order.items.length;
        metrics.satisfactionCount += 1; metrics.customers += 1;
        metrics.satisfaction += order.pickAccuracy === order.items.length && order.checked ? 95 : 74;
        metrics.qualityCount += 1; metrics.quality += order.packedCarefully || order.checked ? 92 : 75;
        if (order.urgent) metrics.speed += 2;
        var next = play.queue.find(function (item) { return !item.delivered; });
        play.currentId = next && next.id;
        nextEvent(active);
        return saveAndRender("Đã xác nhận giao đơn kho #" + order.number + ".");
      }
    }
    if (action.indexOf("chef-") === 0) {
      order = play.queue.find(function (item) { return item.id === play.currentId; });
      if (action === "chef-ticket") { if (play.queue.some(function (item) { return item.id === button.dataset.id && !item.delivered; })) play.currentId = button.dataset.id; return saveAndRender(); }
      if (!order) return;
      var recipe = RECIPES.find(function (item) { return item.id === order.recipeId; }) || RECIPES[0];
      if (action === "chef-toggle" && order.stage === "ingredients") {
        var selectedIndex = order.selectedIngredients.indexOf(button.dataset.ingredient);
        if (selectedIndex >= 0) order.selectedIngredients.splice(selectedIndex, 1); else order.selectedIngredients.push(button.dataset.ingredient);
        return saveAndRender();
      }
      if (action === "chef-confirm-ingredients" && order.stage === "ingredients") {
        var removedIngredient = noteIngredient(order.note);
        var expectedIngredients = recipe.ingredients.slice();
        if (order.noteHandled && removedIngredient && expectedIngredients.indexOf(removedIngredient) >= 0) {
          var expectedIndex = expectedIngredients.indexOf(removedIngredient);
          expectedIngredients.splice(expectedIndex, 1);
          order.noteIngredientApplied = true;
        }
        var expected = expectedIngredients.sort().join("|");
        var chosen = order.selectedIngredients.slice().sort().join("|");
        order.ingredientCorrect = chosen === expected;
        if (!order.ingredientCorrect) metrics.mistakes += 1;
        metrics.accuracyCount += 1;
        order.qualityScore = order.ingredientCorrect ? 78 : 45;
        order.stage = "method";
        return saveAndRender(order.ingredientCorrect ? "Đã sơ chế đúng công thức." : "Bếp ghi nhận thiếu hoặc thừa nguyên liệu.");
      }
      if (action === "chef-note" && order.stage === "note") {
        order.noteHandled = button.dataset.id === "follow";
        order.qualityScore += order.noteHandled ? 12 : -18;
        if (!order.noteHandled) metrics.mistakes += 1;
        order.stage = "ingredients";
        return saveAndRender(order.noteHandled ? "Đã đánh dấu yêu cầu riêng của khách." : "Đã giữ công thức chuẩn, bỏ qua ghi chú.");
      }
      if (action === "chef-method" && order.stage === "method") {
        order.methodCorrect = button.dataset.id === recipe.method;
        if (!order.methodCorrect) metrics.mistakes += 1;
        metrics.accuracyCount += 1;
        order.qualityScore += order.methodCorrect ? 12 : -15;
        order.stage = "time";
        return saveAndRender(order.methodCorrect ? "Đã chọn đúng phương pháp chế biến." : "Cách chế biến chưa khớp công thức.");
      }
      if (action === "chef-time" && order.stage === "time") {
        if (button.dataset.id === "fast") { order.qualityScore -= 12; metrics.speed += 8; }
        else if (button.dataset.id === "careful") { order.qualityScore += 15; metrics.speed -= 7; }
        else order.qualityScore += 6;
        order.stage = "delivery";
        return saveAndRender("Đã ghi nhận nhịp nấu cho ticket.");
      }
      if (action === "chef-deliver" && order.stage === "delivery") {
        order.delivered = true; play.workDone += 1; active.round = play.workDone;
        metrics.orders += 1; metrics.units += 1; metrics.customers += 1; metrics.satisfactionCount += 1;
        metrics.satisfaction += Math.max(25, Math.min(100, 70 + (order.noteHandled ? 12 : 0) + (order.methodCorrect ? 6 : -7) + Math.round(Math.random() * 8 - 4)));
        metrics.qualityCount += 1; metrics.quality += Math.max(0, Math.min(100, order.qualityScore));
        if (order.urgent) metrics.speed += 2;
        var ticket = play.queue.find(function (item) { return !item.delivered; });
        play.currentId = ticket && ticket.id;
        nextEvent(active);
        return saveAndRender("Đã giao món cho bàn " + order.table + ".");
      }
    }
  }
  function beginJob(type, state, shiftCode) {
    var career = ensureState(state);
    if (career.activeJob || !JOBS[type]) return;
    var contract = career.employment.current;
    if (!contract || contract.status !== "active" || contract.type !== type) return window.APXGame.toast("Bạn cần ký hợp đồng đúng nghề trước khi nhận ca.", "warning");
    if (Number(career.lastPaidDay) === Number(state.day)) return window.APXGame.toast("Bạn đã nhận lương một ca hôm nay rồi.", "warning");
    if (career.restDays[String(state.day)]) return window.APXGame.toast("Bạn đã nghỉ hoặc bỏ ca hôm nay; có thể đi làm từ ngày game tiếp theo.", "warning");
    var shift = SHIFT_OPTIONS[shiftCode] || SHIFT_OPTIONS.full;
    var clock = gameClockAt(state, Date.now()), hour = clock.hour + clock.minute / 60;
    if (hour < shift.startHour || hour >= shift.endHour) return window.APXGame.toast(shift.label + " chỉ có thể bắt đầu trong khoảng " + String(shift.startHour).padStart(2, "0") + ":00–" + String(shift.endHour).padStart(2, "0") + ":00 theo giờ game.", "warning");
    var role = roleFor(contract.roleId) || roleFor(ROOT_ROLES[type]);
    var seed = Math.floor(Math.random() * 2147483646) + 1;
    var offer = { type: type, roleId: contract.roleId, title: contract.jobName, employer: contract.employer, basePay: contract.salary, bonusPay: 1000000 - contract.salary, skill: JOBS[type].skill, seed: seed };
    career.activeJob = Object.assign({
      id: "career-" + type + "-" + Date.now(),
      round: 0,
      orderIndex: 0,
      totalOrders: 0,
      score: 0,
      specialRound: 0,
      specialScore: 0,
      rankTasks: (roleFor(contract.roleId).advancedTasks || []).slice(),
      day: Number(state.day) || 1,
      selectedIngredients: [],
      recipeId: type === "chef" ? RECIPES[(Number(state.day) + career.completedJobs) % RECIPES.length].id : null,
      stage: type === "chef" ? "ingredients" : "playing"
    }, offer);
    if (type === "lawyer") {
      career.activeJob.totalOrders = 100;
      career.activeJob.gameplay = { version: 3, caseMode: true };
      if (!window.APXLawyerCases || !window.APXLawyerCases.startCareerCase(state)) {
        career.activeJob = null;
        return;
      }
      return saveAndRender("Đã bắt đầu ca trợ lý luật sư tại " + offer.employer + ". Hãy xử lý hồ sơ để hoàn thành ca.");
    }
    career.activeJob.gameplay = createShiftGameplay(type, Math.max(career.professions[type].level, role.careerLevel), seed, career, state, shiftCode);
    saveAndRender("Đã nhận " + shift.label.toLowerCase() + " tại " + offer.employer + ".");
  }
  function scoreSales(choice, state) {
    var active = ensureState(state).activeJob;
    if (!active || active.type !== "sales") return;
    var scenario = SALES_SCENARIOS[(active.seed + active.round) % SALES_SCENARIOS.length];
    if (choice === scenario.correct) active.score += 1;
    active.round += 1;
    saveAndRender(active.round >= active.totalOrders ? "Đã tư vấn xong toàn bộ đơn trong ca." : (choice === scenario.correct ? "Chốt đơn phù hợp." : "Khách chưa chọn sản phẩm này."));
  }
  function pickBin(bin, state) {
    var active = ensureState(state).activeJob;
    if (!active || active.type !== "warehouse") return;
    var target = warehouseTarget(active);
    if (bin === target.bin) active.score += 1;
    active.round += 1;
    saveAndRender(bin === target.bin ? "Đã lấy đúng mặt hàng." : "Vị trí chưa đúng, chuyển sang mặt hàng tiếp theo.");
  }
  function chefChoiceCorrect(correct, state, successMessage, failMessage) {
    var active = ensureState(state).activeJob;
    if (correct) active.score += 1;
    saveAndRender(correct ? successMessage : failMessage);
  }
  function closeShiftEarly(state) {
    var career = ensureState(state), active = career.activeJob, play = active && active.gameplay;
    if (!active || !play || play.version !== 2) return;
    play.queue.forEach(function (order) {
      if (order.status !== "pending" && order.status !== "processing") return;
      order.status = "expired"; order.delivered = true; order.failedAt = Date.now();
      play.metrics.ordersFailed += 1;
      if (active.type === "sales") play.metrics.customersLeft += 1;
      play.workDone += 1;
    });
    play.currentId = null;
    play.shiftClosed = true;
    play.earlyClosed = true;
    active.totalOrders = play.workDone;
    active.round = play.workDone;
    finishJob(state);
  }
  function finishJob(state, deferRender) {
    var career = ensureState(state), active = career.activeJob;
    if (!active) return;
    if (active.gameplay && active.gameplay.version === 2) {
      if (!active.gameplay.shiftClosed && !active.gameplay.dayClosed) return;
      active.round = active.totalOrders;
      active.specialRound = (active.rankTasks || []).length;
    } else if (active.gameplay) {
      if (active.gameplay.workDone < active.gameplay.workCount) return;
      active.round = active.totalOrders;
    } else if (active.round < active.totalOrders || (active.type === "chef" && active.stage !== "done")) return;
    var rankTasks = active.rankTasks || [], specialRound = Number(active.specialRound) || 0;
    if (specialRound < rankTasks.length && !(active.gameplay && active.gameplay.version === 2)) return;
    var job = JOBS[active.type];
    var caseMode = Boolean(active.gameplay && active.gameplay.caseMode);
    var stats = active.gameplay && !caseMode ? playStats(active.gameplay) : null;
    var coreTotal = active.gameplay && !caseMode ? 100 : (active.type === "chef" ? active.totalOrders * 3 : active.totalOrders);
    var total = coreTotal + rankTasks.length;
    var correct = active.gameplay && !caseMode ? Math.round(stats.performance) : (Number(active.score) || 0);
    correct += Number(active.specialScore) || 0;
    var ratio = Math.max(0, Math.min(1, correct / total));
    if (active.gameplay && active.gameplay.version === 2) {
      var arrivals = Number(active.gameplay.metrics.ordersAppeared) + Number(active.gameplay.metrics.customersAppeared);
      var completionRate = arrivals > 0 ? Number(active.gameplay.metrics.ordersCompleted) / arrivals : 0;
      ratio *= 0.55 + 0.45 * Math.max(0, Math.min(1, completionRate));
    }
    var timeRatio = 1;
    if (active.gameplay && active.gameplay.version === 2 && active.gameplay.earlyClosed) {
      var planned = Math.max(1, Number(active.gameplay.shift.durationMs) || (active.gameplay.shift.endHour - active.gameplay.shift.startHour) * GAME_DAY_MS / 24);
      timeRatio = Math.max(0.05, Math.min(1, (Date.now() - Number(active.gameplay.startedAt)) / planned));
    }
    if (window.APXCharacter && typeof window.APXCharacter.updatePhysicalState === "function") {
      window.APXCharacter.updatePhysicalState(state, Date.now());
    }
    var conditionEfficiency = window.APXCharacter && window.APXCharacter.getWorkEfficiency
      ? window.APXCharacter.getWorkEfficiency(state)
      : 1;
    var paidPerformance = Math.max(0, Math.min(1, ratio * conditionEfficiency));
    var pay = Math.round((active.basePay + active.bonusPay * paidPerformance) * timeRatio);
    var earnedXP = Math.round((110 + 40 * ratio) * timeRatio);
    var profession = career.professions[active.type];
    profession.xp += 100 + Math.round(100 * ratio);
    profession.level = Math.max(1, 1 + Math.floor(profession.xp / 350));
    profession.shifts += 1;
    profession.correct += correct;
    profession.total += total;
    profession.performance = Math.round(profession.correct / profession.total * 100);
    profession.reputation = Math.max(0, profession.reputation + (ratio >= 0.8 ? 2 : ratio >= 0.55 ? 1 : ratio < 0.3 ? -1 : 0));
    profession.tenureDays += 1;
    career.xp += earnedXP;
    career.level = levelForXP(career.xp);
    career.completedJobs += 1;
    career.completedWorkShifts += 1;
    career.totalSalaryEarned += pay;
    career.lastPaidDay = Math.max(1, Number(state.day) || Number(active.day) || 1);
    var kpi = active.gameplay && active.gameplay.version === 2 ? active.gameplay.metrics.ordersAppeared + active.gameplay.metrics.customersAppeared > 0 && Math.round(ratio * 100) >= 60 && active.gameplay.metrics.ordersFailed <= Math.max(1, active.gameplay.metrics.ordersCompleted * 0.35) : active.gameplay && !caseMode ? active.gameplay.workDone >= active.gameplay.workCount && stats.performance >= 60 : ratio >= 0.6;
    var metrics = active.gameplay && active.gameplay.metrics || {};
    var result = { title: active.title, employer: active.employer, score: correct, total: total, pay: pay, salaryEarned: pay, salaryReceived: 0, salaryStatus: "pending", xp: earnedXP, day: career.lastPaidDay, id: active.id, jobId: active.roleId, shift: active.gameplay && active.gameplay.shift && active.gameplay.shift.code, earlyClosed: Boolean(active.gameplay && active.gameplay.earlyClosed), performance: Math.round(ratio * 100), conditionEfficiency: Math.round(conditionEfficiency * 100), accuracy: stats && stats.accuracy, satisfaction: stats && stats.satisfaction, quality: stats && stats.quality, orders: active.gameplay ? active.gameplay.workDone : null, units: metrics.units, closedUnits: metrics.ordersCompleted, revenue: stats && stats.revenue, operatingCosts: metrics.operatingCosts || 0, customersAppeared: metrics.customersAppeared || 0, customersServed: metrics.customersServed || 0, customersPurchased: metrics.customersPurchased || 0, customersLeft: metrics.customersLeft || 0, ordersAppeared: metrics.ordersAppeared || 0, ordersCompleted: metrics.ordersCompleted || 0, ordersFailed: metrics.ordersFailed || 0, averageResponse: metrics.responseCount ? Math.round((Number(metrics.responseMs) || 0) / Number(metrics.responseCount) / 1000) : 0, mistakes: stats && metrics.mistakes, returns: stats && metrics.returns, timePressureActions: metrics.timePressureActions || 0, kpi: kpi, grade: ratio >= 0.9 ? "Xuất sắc" : ratio >= 0.78 ? "Tốt" : ratio >= 0.6 ? "Đạt" : "Chưa đạt", bonus: Math.max(0, pay - active.basePay) };
    career.history.unshift(result);
    career.history = career.history.slice(0, 20);
    if (window.APXQuest && typeof window.APXQuest.onWorkShiftPaid === "function") {
      window.APXQuest.onWorkShiftPaid(state, result);
    }
    if (career.employment.current && career.employment.current.status === "active") {
      career.employment.current.lastShiftDay = career.lastPaidDay;
      career.employment.current.lastPerformance = Math.round(ratio * 100);
      updatePromotionOffer(state, career.employment.current);
    }
    career.activeJob = null;
    if (window.APXCharacter) {
      window.APXCharacter.addCharacterXP(180 + Math.round(180 * ratio), "Hoàn thành ca: " + job.title);
      window.APXCharacter.increaseSkill(job.skill, 18 + Math.round(22 * ratio));
    } else if (window.APXGame) {
      window.APXGame.save();
    }
    if (window.APXGame && !deferRender) {
      window.APXGame.save();
      window.APXGame.render();
    }
    settleCareerSalary(state, result).then(function () {
      if (window.APXGame && !deferRender) {
        window.APXGame.save();
        window.APXGame.render();
        window.APXGame.toast((result.earlyClosed ? "Đã chốt ca sớm · " : "Hoàn thành ca làm · ") + money(pay) + " đã vào tài khoản APXBank và nhận " + earnedXP + " XP sự nghiệp.");
      }
    }).catch(function (error) {
      if (window.APXGame && !deferRender) {
        window.APXGame.save();
        window.APXGame.render();
        window.APXGame.toast("Ca đã hoàn thành nhưng lương chưa vào APXBank. Mở lại kết quả ca và chọn “Thử nhận lương lại”. " + (error && error.message ? error.message : ""), "warning");
      }
    });
  }
  function finishLawyerCase(state, score) {
    var career = ensureState(state), active = career.activeJob;
    if (!active || active.type !== "lawyer" || !active.gameplay || !active.gameplay.caseMode) {
      window.APXGame.toast("Không có ca Luật sư đang hoạt động để bàn giao.", "warning");
      return null;
    }
    active.score = Math.max(0, Math.min(100, Number(score) || 0));
    active.round = 100;
    active.totalOrders = 100;
    active.stage = "done";
    finishJob(state, true);
    return career.history[0] || null;
  }
  function onCareerAction(button) {
    var action = button.dataset.careerAction;
    var state = window.APXGame && window.APXGame.state;
    if (!state) return;
    var career = ensureState(state), active = career.activeJob;
    if (action === "retry-salary") {
      var pendingSalary = career.history.find(function (item) { return String(item.id) === String(button.dataset.shiftId); });
      if (!pendingSalary || pendingSalary.salaryStatus === "paid") return;
      button.disabled = true;
      settleCareerSalary(state, pendingSalary).then(function () {
        window.APXGame.save();
        window.APXGame.render();
        window.APXGame.toast(money(pendingSalary.salaryReceived) + " đã vào tài khoản APXBank.");
      }).catch(function (error) {
        button.disabled = false;
        window.APXGame.toast("Chưa thể chuyển lương vào APXBank: " + (error && error.message ? error.message : "lỗi đồng bộ"), "warning");
      });
      return;
    }
    if (action === "buy-food") {
      if (!window.APXCharacter || !window.APXCharacter.buyFood) return window.APXGame.toast("Hệ thống ăn uống chưa sẵn sàng.", "warning");
      var purchase = window.APXCharacter.buyFood(state, button.dataset.food);
      if (!purchase.ok) return window.APXGame.toast(purchase.message, "warning");
      return saveAndRender("Bạn đã mua và ăn " + purchase.food.name + ".");
    }
    if (action === "apply") {
      if (career.employment.current || career.activeJob) return window.APXGame.toast("Bạn cần nghỉ hoặc kết thúc công việc hiện tại trước khi ứng tuyển nghề khác.", "warning");
      var offer = offerList(state).find(function (item) { return item.type === button.dataset.job; });
      if (!offer) return;
      career.employment.pending = { type: offer.type, roleId: offer.roleId, employer: offer.employer, salary: offer.basePay, duration: 3, renewal: false };
      return saveAndRender("NPC đã gửi đề nghị. Hãy xem và ký hợp đồng để bắt đầu.");
    }
    if (action === "sign") {
      var pending = career.employment.pending;
      if (!pending || CONTRACT_OPTIONS.indexOf(Number(pending.duration)) < 0) return window.APXGame.toast("Hãy chọn thời hạn hợp đồng hợp lệ.", "warning");
      var signed = createContract(state, pending, pending.duration, "active");
      if (pending.renewal && career.employment.current) appendEmploymentEvent(career, { type: "renewed", jobId: signed.jobId, employer: signed.employer, day: Number(state.day), duration: signed.duration });
      else appendEmploymentEvent(career, { type: "signed", jobId: signed.jobId, employer: signed.employer, day: Number(state.day), duration: signed.duration });
      career.employment.current = signed;
      career.employment.pending = null;
      career.resignConfirmation = false;
      return saveAndRender("Đã ký hợp đồng tại " + signed.employer + ".");
    }
    if (action === "cancel-application") {
      career.employment.pending = null;
      return saveAndRender("Đã hủy đề nghị công việc.");
    }
    if (action === "start-shift") {
      var shiftSelect = document.querySelector("[data-career-shift]");
      if (window.APXCharacter && window.APXCharacter.canStartWork) {
        var readiness = window.APXCharacter.canStartWork(state);
        if (!readiness.ok) {
          window.APXGame.toast(readiness.message, "warning");
          return saveAndRender();
        }
        if (readiness.warning) window.APXGame.toast(readiness.warning, "warning");
      }
      return career.employment.current && beginJob(career.employment.current.type, state, shiftSelect ? shiftSelect.value : "full");
    }
    if (action === "renew") {
      var expired = career.employment.current;
      if (!expired || expired.status !== "expired") return;
      career.employment.pending = { type: expired.type, roleId: expired.roleId, employer: expired.employer, salary: expired.salary, duration: 3, renewal: true };
      return saveAndRender("Chọn thời hạn và ký đề nghị gia hạn.");
    }
    if (action === "no-renew") {
      var ended = career.employment.current;
      if (!ended || ended.status !== "expired") return;
      appendEmploymentEvent(career, { type: "not-renewed", jobId: ended.jobId, employer: ended.employer, day: Number(state.day) });
      career.employment.current = null;
      career.promotionOffer = null;
      return saveAndRender("Đã kết thúc hợp đồng. Bạn có thể tìm công việc khác.");
    }
    if (action === "find-other") {
      var oldContract = career.employment.current;
      if (!oldContract || oldContract.status !== "expired") return;
      appendEmploymentEvent(career, { type: "not-renewed", jobId: oldContract.jobId, employer: oldContract.employer, day: Number(state.day), choice: "find-other" });
      career.employment.current = null;
      career.promotionOffer = null;
      if (window.APXGame) window.APXGame.save();
      if (window.APXNav && window.APXNav.go) window.APXNav.go("career", "jobs");
      if (window.APXGame) window.APXGame.toast("Hợp đồng đã kết thúc. Chọn một công việc mới.");
      return;
    }
    if (action === "rest-day") {
      if (career.activeJob) return window.APXGame.toast("Hãy chốt hoặc bỏ ca đang làm trước.", "warning");
      career.restDays[String(state.day)] = true;
      if (window.APXCharacter && window.APXCharacter.restPhysicalState) window.APXCharacter.restPhysicalState(state);
      return saveAndRender("Đã nghỉ ca hôm nay; năng lượng, tập trung và tinh thần được hồi phục.");
    }
    if (action === "resign-request") {
      career.resignConfirmation = true;
      return saveAndRender();
    }
    if (action === "resign-cancel") {
      career.resignConfirmation = false;
      return saveAndRender();
    }
    if (action === "resign-confirm") {
      var current = career.employment.current;
      if (!current || current.status !== "active" || career.activeJob) return window.APXGame.toast("Hãy kết thúc ca hiện tại trước khi nghỉ việc.", "warning");
      var fee = compensation(current);
      if ((Number(state.cash) || 0) < fee) return window.APXGame.toast("Bạn không đủ tiền bồi thường hợp đồng: " + money(fee) + ".", "warning");
      state.cash = Math.max(0, Number(state.cash) - fee);
      appendEmploymentEvent(career, { type: "terminated-early", jobId: current.jobId, employer: current.employer, day: Number(state.day), compensation: fee, remainingMs: Math.max(0, current.endAt - Date.now()) });
      career.employment.current = null;
      career.resignConfirmation = false;
      career.promotionOffer = null;
      return saveAndRender("Đã nghỉ việc và bồi thường " + money(fee) + ".");
    }
    if (action === "promote") {
      var employed = career.employment.current, nextRole = roleFor(button.dataset.role);
      if (!employed || !nextRole || !career.promotionOffer || career.promotionOffer.roleId !== employed.roleId || career.promotionOffer.jobIds.indexOf(nextRole.jobId) < 0) return;
      var oldRole = roleFor(employed.roleId);
      employed.roleId = nextRole.jobId;
      employed.jobId = nextRole.jobId;
      employed.jobName = nextRole.jobName;
      employed.salary = Math.max(employed.salary, nextRole.salary);
      appendEmploymentEvent(career, { type: "promoted", from: oldRole.jobId, jobId: nextRole.jobId, employer: employed.employer, day: Number(state.day), salary: employed.salary });
      career.promotionOffer = null;
      return saveAndRender("Thăng tiến lên " + nextRole.jobName + ". Ca tiếp theo có thêm thử thách vị trí.");
    }
    if (action === "promotion-stay") {
      var currentRole = career.employment.current && career.employment.current.roleId;
      if (!currentRole) return;
      career.professions[career.employment.current.type].promotionDeclinedAtXP = career.professions[career.employment.current.type].xp;
      career.promotionOffer = null;
      return saveAndRender("Bạn tiếp tục vị trí hiện tại; cơ hội mới xuất hiện khi XP tăng thêm.");
    }
    if (action === "close-early") return closeShiftEarly(state);
    if (action === "quit") {
      career.restDays[String(state.day)] = true;
      career.activeJob = null;
      return saveAndRender("Đã bỏ ca. Ca này không có lương và bạn không thể nhận ca khác trong ngày hôm nay.");
    }
    if (action === "rank-choice") {
      if (!active || active.round < active.totalOrders) return;
      var tasks = active.rankTasks || [], task = tasks[Number(active.specialRound) || 0];
      if (!task) return;
      if (Number(button.dataset.choice) === Number(task.correct)) active.specialScore = (Number(active.specialScore) || 0) + 1;
      active.specialRound = (Number(active.specialRound) || 0) + 1;
      return saveAndRender(active.specialRound >= tasks.length ? "Đã hoàn thành trách nhiệm vị trí. Bàn giao ca để nhận lương." : "Đã ghi nhận quyết định công việc.");
    }
    if (!active) return;
    if (active.gameplay) {
      if (action === "finish") return finishJob(state);
      return gameplayAction(action, button, active, state);
    }
    if (action === "sales-choice") return scoreSales(button.dataset.choice, state);
    if (action === "pick-bin") return pickBin(button.dataset.bin, state);
    if (action === "finish") return finishJob(state);
    if (action === "deliver") {
      if (active.type !== "chef" || active.stage !== "delivery") return;
      active.orderIndex += 1;
      if (active.orderIndex >= active.totalOrders) {
        active.round = active.totalOrders;
        active.stage = "done";
        return saveAndRender("Đã giao hết món trong ca. Bàn giao ca để nhận lương NPC.");
      }
      active.recipeId = RECIPES[(Number(active.seed) + active.orderIndex * 7) % RECIPES.length].id;
      active.selectedIngredients = [];
      active.stage = "ingredients";
      return saveAndRender("Món đã giao. Bắt đầu đơn " + (active.orderIndex + 1) + "/" + active.totalOrders + ".");
    }
    if (action === "toggle-ingredient") {
      var ingredient = button.dataset.ingredient;
      var index = active.selectedIngredients.indexOf(ingredient);
      if (index >= 0) active.selectedIngredients.splice(index, 1); else active.selectedIngredients.push(ingredient);
      return saveAndRender();
    }
    var recipe = RECIPES.find(function (item) { return item.id === active.recipeId; }) || RECIPES[0];
    if (action === "submit-ingredients") {
      if (!active.selectedIngredients.length) return window.APXGame.toast("Hãy chọn nguyên liệu trước khi xác nhận.", "warning");
      var expected = recipe.ingredients.slice().sort().join("|");
      var selected = active.selectedIngredients.slice().sort().join("|");
      active.stage = "method";
      return chefChoiceCorrect(expected === selected, state, "Đúng nguyên liệu cho món này.", "Bếp trưởng ghi nhận bộ nguyên liệu chưa chuẩn.");
    }
    if (action === "choose-method") {
      active.stage = "time";
      return chefChoiceCorrect(button.dataset.method === recipe.method, state, "Đúng cách nấu.", "Cách nấu chưa khớp công thức.");
    }
    if (action === "choose-time") {
      active.stage = "delivery";
      return chefChoiceCorrect(Number(button.dataset.minutes) === recipe.minutes, state, "Canh thời gian chính xác.", "Thời gian chưa đúng công thức, nhưng vẫn có thể giao món.");
    }
  }

  window.APXCareer = {
    prepareState: ensureState,
    getGate: getGate,
    renderLocked: renderLocked,
    canFoundCompany: canFoundCompany,
    startScheduler: startScheduler,
    tick: tickScheduler,
    onGameDayClosed: function (state, closedDay, dailyTotals) {
      var career = ensureState(state), current = career.employment.current, active = career.activeJob;
      var play = active && active.gameplay && active.gameplay.version === 2 && Number(active.day) <= Number(closedDay) ? active.gameplay : null;
      if (play) {
        play.queue.forEach(function (order) {
          if (order.status !== "pending" && order.status !== "processing") return;
          if (active.type === "sales" && order.stage === "feedback") {
            order.status = order.outcome && order.outcome.won ? "completed" : "failed";
            return;
          }
          order.status = "expired"; order.delivered = true; order.failedAt = Date.now();
          play.metrics.ordersFailed += 1;
          if (active.type === "sales") play.metrics.customersLeft += 1;
          play.workDone += 1;
        });
        play.dayClosed = true;
        play.shiftClosed = true;
        active.totalOrders = play.workDone;
        active.round = play.workDone;
        finishJob(state);
      } else if (active && active.type !== "lawyer" && Number(active.day) <= Number(closedDay)) {
        career.history.unshift({ title: active.title, employer: active.employer, score: active.score || 0, total: Math.max(0, Number(active.totalOrders) || 0), pay: 0, xp: 0, day: Number(closedDay), abandoned: true });
        career.history = career.history.slice(0, 20);
        career.activeJob = null;
      }
      var result = play && career.history[0] && Number(career.history[0].day) === Number(closedDay) ? career.history[0] : career.history.find(function (item) { return Number(item.day) === Number(closedDay) && !item.abandoned; }) || null;
      var metrics = play ? play.metrics : (result || {});
      var report = {
        day: Number(closedDay),
        revenue: Math.max(0, Number(dailyTotals && dailyTotals.revenue) || 0) + (play ? Number(metrics.revenue) || 0 : Number(result && result.revenue) || 0),
        costs: Math.max(0, Number(dailyTotals && dailyTotals.costs) || 0) + (Number(result && result.pay) || 0) + (Number(metrics.operatingCosts) || 0),
        customers: play ? (active.type === "sales" ? Number(metrics.customersAppeared) || 0 : active.type === "chef" ? Number(metrics.ordersAppeared) || 0 : 0) : Number(metrics.customersAppeared) || Number(metrics.ordersAppeared) || 0,
        served: play ? (active.type === "sales" ? Number(metrics.customersServed) || 0 : Number(metrics.ordersCompleted) || 0) : Number(metrics.customersServed) || Number(metrics.ordersCompleted) || 0,
        purchased: play ? (active.type === "sales" ? Number(metrics.customersPurchased) || 0 : Number(metrics.ordersCompleted) || 0) : Number(metrics.customersPurchased) || Number(metrics.ordersCompleted) || 0,
        left: Number(metrics.customersLeft) || 0,
        orders: play ? (active.type === "sales" ? Number(metrics.customersAppeared) || 0 : Number(metrics.ordersAppeared) || 0) : Number(metrics.customersAppeared) || Number(metrics.ordersAppeared) || 0,
        completed: Number(metrics.ordersCompleted) || 0,
        failed: Number(metrics.ordersFailed) || 0,
        averageResponse: play ? (metrics.responseCount ? Math.round((Number(metrics.responseMs) || 0) / Number(metrics.responseCount) / 1000) : 0) : Number(metrics.averageResponse) || 0,
        quality: play ? playStats(play).quality : Number(result && result.quality) || 0,
        kpi: Boolean(result && result.kpi), bonus: Number(result && result.bonus) || 0,
        salary: Number(result && result.pay) || 0,
        reputation: career.professions[current && current.type] ? career.professions[current.type].reputation : 0
      };
      career.dailyReports.unshift(report);
      career.dailyReports = career.dailyReports.slice(0, 30);
      var closedActivity = career.history[0];
      if (closedActivity && closedActivity.abandoned && Number(closedActivity.day) === Number(closedDay) && play) {
        closedActivity.abandoned = false;
      }
      career.lastDailyReport = report;
      if (current && current.status === "active" && Number(closedDay) >= Number(current.endDay)) {
        current.status = "expired";
        current.expiredAtDay = Number(closedDay);
        appendEmploymentEvent(career, { type: "expired", jobId: current.jobId, employer: current.employer, day: Number(closedDay) });
        career.resignConfirmation = false;
      }
    },
    getLevel: function (state) { return progressFor(state).level; },
    getProgress: function (state) { return progressFor(state); },
    finishLawyerCase: finishLawyerCase,
    recipeCount: RECIPES.length
  };
  window.APXPages.career = function (page, state) {
    ensureState(state);
    if (page === "quests" && window.APXQuest) return window.APXQuest.render(state);
    if (page === "lawyer-cases" && window.APXLawyerCases) return window.APXLawyerCases.render(state);
    if (page === "current") return currentJobPage(state);
    if (page === "contract") {
      var career = ensureState(state), contract = career.employment.pending || career.employment.current;
      return contract ? contractDocument(state, contract, !career.employment.pending) : currentJobPage(state);
    }
    return boardPage(state);
  };
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-career-action]");
    if (button) onCareerAction(button);
  });
  document.addEventListener("change", function (event) {
    if (!event.target.matches("[data-career-term]")) return;
    var state = window.APXGame && window.APXGame.state;
    var pending = state && ensureState(state).employment.pending;
    var duration = Number(event.target.value);
    if (!pending || CONTRACT_OPTIONS.indexOf(duration) < 0) return;
    pending.duration = duration;
    saveAndRender("Đã cập nhật thời hạn hợp đồng.");
  });
})();
