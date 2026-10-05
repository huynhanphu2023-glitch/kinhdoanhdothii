"use strict";

var CASE_006 = {
  id: "CASE_006",
  mechanicsVersion: 5,
  title: "Vụ tai nạn tại tầng hầm chung cư An Bình",
  type: "Dân sự - Bồi thường thiệt hại",
  difficulty: 6,
  reward: 5200000,
  exp: 400,

  meta: {
    title: "Vụ tai nạn tại tầng hầm chung cư An Bình",
    shortTitle: "Tai nạn tầng hầm An Bình",
    category: "Dân sự - Bồi thường thiệt hại",
    difficulty: 6,
    reward: 5200000,
    exp: 400
  },

  description: "Nguyễn Hoài Nam tìm đến văn phòng sau một vụ va chạm tại tầng hầm. Anh cho rằng Lê Văn Thành là người gây tai nạn và yêu cầu bồi thường. Nhưng hồ sơ ban đầu chưa đủ để biết ai chịu bao nhiêu trách nhiệm.",
  meetingDialogue: [
    { speaker: "Nam", text: "Tôi bị tai nạn ở tầng hầm chung cư. Tôi muốn yêu cầu người kia bồi thường." },
    { speaker: "Bạn", text: "Anh kể lại toàn bộ sự việc từ đầu." },
    { speaker: "Nam", text: "Tôi xuống tầng hầm lấy xe. Tôi nghe tiếng xe phía sau rồi bị va vào." },
    { speaker: "Bạn", text: "Anh có nhìn thấy chiếc xe trước khi va chạm không?" },
    { speaker: "Nam", text: "Không. Mọi chuyện xảy ra rất nhanh." },
    { speaker: "Bạn", text: "Sau đó thì sao?" },
    { speaker: "Nam", text: "Tôi ngã xuống. Bảo vệ chạy tới. Người lái xe là Lê Văn Thành." }
  ],
  meetingNotes: ["Tai nạn xảy ra tại tầng hầm B1.", "Nam bị thương ở chân.", "Thành là người điều khiển xe.", "Hai bên chưa thống nhất bồi thường."],
  investigationInstruction: "Không phải chứng cứ nào cũng cho sẵn đáp án. Chọn hành động điều tra, đọc tài liệu và ghép các mảnh thông tin. Mỗi hành động chỉ làm một lần và có chi phí lượt.",
  investigationTurns: 8,
  minimumEvidence: 3,

  clientRequest: {
    primary: "Tìm hiểu sự thật, xác minh chứng cứ và xây dựng hồ sơ bảo vệ quyền lợi của Nam.",
    secondary: "Chỉ yêu cầu phần thiệt hại có thể chứng minh; đánh giá cả khả năng Nam có một phần lỗi."
  },

  client: {
    name: "Nguyễn Hoài Nam",
    age: 29,
    occupation: "Nhân viên thiết kế",
    role: "Người yêu cầu bồi thường",
    description: "Nam bị chấn thương ở chân và muốn biết có thể yêu cầu Thành bồi thường hay không."
  },

  opponent: {
    name: "Lê Văn Thành",
    age: 37,
    occupation: "Nhân viên giao hàng",
    role: "Người điều khiển xe",
    description: "Thành thừa nhận điều khiển xe nhưng cho rằng đã giảm tốc và Nam bất ngờ đi vào hướng xe."
  },

  timeline: [
    { date: "18:39", title: "Nam rời thang máy", content: "Nam đi về phía lối xe chạy tại tầng hầm B1." },
    { date: "18:42:09", title: "Nam xuất hiện trên camera", content: "Nam đi gần khu vực phương tiện di chuyển." },
    { date: "18:42:15", title: "Xe Thành xuất hiện", content: "Xe của Thành đi vào khung hình." },
    { date: "18:42:17", title: "Thành giảm tốc", content: "Camera cho thấy Thành dường như giảm tốc." },
    { date: "18:42:21", title: "Hai bên vào góc khuất", content: "Cả hai đi vào khu vực bị cột bê tông che khuất; camera không ghi trực tiếp khoảnh khắc va chạm." },
    { date: "18:42+", title: "Xảy ra va chạm", content: "Bảo vệ nghe tiếng phanh rồi tiếng va chạm." },
    { date: "18:59", title: "Nam nhập viện", content: "Hồ sơ ghi nhận thời điểm điều trị phù hợp với ngày xảy ra tai nạn." }
  ],

  evidence: [
    {
      id: "E601",
      icon: "🎥",
      status: "Đã xác minh",
      title: "Bản trích xuất camera tầng hầm B1",
      type: "Video",
      importance: "high",
      content: "Ngày 14/09, khung giờ 18:42:09–18:42:21, camera tại lối xuống tầng B1 ghi nhận: 18:42:09 — Nguyễn Hoài Nam rời khu vực thang máy và đi về phía lối xe chạy. 18:42:15 — Xe của Lê Văn Thành xuất hiện từ phía bên phải khung hình. 18:42:17 — Thành giảm tốc. 18:42:21 — Hai người tiến vào khu vực bị cột bê tông che khuất. Điểm hạn chế: camera không ghi trực tiếp khoảnh khắc va chạm. Có thể dùng để xác định sự xuất hiện, trình tự và vị trí tương đối của hai bên."
    },
    {
      id: "E602",
      icon: "🏥",
      status: "Đã xác minh",
      title: "Hồ sơ khám chữa bệnh của Nguyễn Hoài Nam",
      type: "Hồ sơ y tế",
      importance: "high",
      content: "Thời điểm nhập viện: 18:59 cùng ngày xảy ra tai nạn. Chẩn đoán: chấn thương phần mềm và tổn thương vùng chân. Bác sĩ ghi nhận tình trạng phù hợp với việc điều trị sau một sự cố va chạm. Nam nghỉ làm sau vụ việc; hồ sơ xác nhận một phần thời gian nghỉ. Điểm cần xác minh: một số khoản chi phí trong bảng kê chưa thể hiện rõ mối liên hệ trực tiếp với vụ tai nạn."
    },
    {
      id: "E603",
      icon: "🛡️",
      status: "Đã thu thập",
      title: "Biên bản lời khai của bảo vệ Phạm Minh Tuấn",
      type: "Lời khai",
      importance: "normal",
      content: "Người khai: Phạm Minh Tuấn, nhân viên bảo vệ tại chốt tầng B1. “Tôi nghe tiếng phanh trước, sau đó mới nghe tiếng va chạm.” Tuấn cho biết sau tiếng va chạm anh chạy về phía hiện trường. Điểm cần lưu ý: Tuấn đứng cách vị trí va chạm hơn 20 mét và không nhìn thấy trực tiếp toàn bộ diễn biến."
    },
    {
      id: "E604",
      icon: "👩",
      status: "Đã thu thập",
      title: "Biên bản nhân chứng Trần Thị Hạnh",
      type: "Lời khai",
      importance: "high",
      content: "Người khai: Trần Thị Hạnh, cư dân chung cư. Hạnh đứng gần khu vực thang máy và nhìn thấy Nam đi về phía làn xe. Cô không nhìn thấy chính xác khoảnh khắc va chạm vì một cột bê tông che khuất. Thông tin đáng chú ý: Nam có thể đã đi vào khu vực dành cho xe. Mâu thuẫn cần kiểm tra: Nam ban đầu nói mình chỉ đi bộ ở khu vực dành cho người đi bộ."
    },
    {
      id: "E605",
      icon: "💾",
      status: "Đã xác minh",
      title: "Báo cáo kỹ thuật hệ thống camera",
      type: "Báo cáo kỹ thuật",
      importance: "high",
      content: "Kỹ thuật viên Võ Minh Khoa kiểm tra dữ liệu gốc và không phát hiện dấu hiệu chỉnh sửa hoặc cắt ghép. Camera hoạt động bình thường trước và sau vụ việc. Một cột bê tông tạo góc chết khoảng 2,5 mét, đúng khu vực gần điểm va chạm. Kết luận: dữ liệu camera có giá trị xác định trình tự sự kiện nhưng không đủ một mình để xác định toàn bộ hành vi tại thời điểm va chạm."
    },
    {
      id: "E606",
      icon: "🕒",
      status: "Đã dựng",
      title: "Bảng dòng thời gian tổng hợp",
      type: "Tài liệu điều tra",
      importance: "normal",
      content: "18:39 — Nam rời thang máy. 18:42:09 — Nam xuất hiện trên camera. 18:42:15 — Xe Thành xuất hiện. 18:42:17 — Thành giảm tốc. 18:42:21 — Hai bên đi vào góc chết camera. 18:42+ — Xảy ra va chạm. 18:59 — Nam nhập viện. Khoảng trống: chưa có chứng cứ trực tiếp mô tả chính xác vị trí và hành vi của hai bên trong vài giây cuối."
    }
  ],

  investigationActions: [
    {
      id: "INV_601",
      title: "🎥 Truy xuất camera tầng hầm",
      description: "Lấy dữ liệu hình ảnh gốc.",
      cost: 1,
      unlocksEvidence: ["E601"],
      discoveries: ["Camera xác nhận Thành có mặt.", "Thành giảm tốc trước khi vào góc khuất."],
      effects: { legalAnalysis: 8, evidence: 10, caseUnderstanding: 8 }
    },
    {
      id: "INV_602",
      title: "🏥 Xin hồ sơ bệnh viện",
      description: "Xác minh thương tích và thiệt hại.",
      cost: 1,
      unlocksEvidence: ["E602"],
      discoveries: ["Nam có thương tích thực tế.", "Một số chi phí cần xác minh thêm."],
      effects: { legalAnalysis: 7, evidence: 10, caseUnderstanding: 7 }
    },
    {
      id: "INV_603",
      title: "🛡️ Lấy lời khai bảo vệ",
      description: "Kiểm tra âm thanh và thời điểm va chạm.",
      cost: 1,
      unlocksEvidence: ["E603"],
      discoveries: ["Bảo vệ nghe tiếng phanh trước va chạm.", "Bảo vệ không nhìn thấy toàn bộ diễn biến."],
      effects: { legalAnalysis: 5, evidence: 8, argument: 2, caseUnderstanding: 8 }
    },
    {
      id: "INV_604",
      title: "👩 Tìm nhân chứng cư dân",
      description: "Tìm người có mặt tại tầng hầm.",
      cost: 1,
      unlocksEvidence: ["E604"],
      discoveries: ["Nam có thể đã đi vào làn xe.", "Lời kể ban đầu của Nam chưa đầy đủ."],
      effects: { legalAnalysis: 10, evidence: 10, caseUnderstanding: 10, clientTrust: -2 }
    },
    {
      id: "INV_605",
      title: "💾 Kiểm định dữ liệu camera",
      description: "Xác minh camera có bị chỉnh sửa.",
      cost: 2,
      unlocksEvidence: ["E605"],
      discoveries: ["Camera không bị chỉnh sửa.", "Có góc chết tại hiện trường.", "Không thể chỉ dựa vào camera để xác định toàn bộ lỗi."],
      effects: { legalAnalysis: 9, evidence: 10, argument: 8, caseUnderstanding: 9 }
    },
    {
      id: "INV_606",
      title: "🕒 Dựng lại dòng thời gian",
      description: "Ghép tất cả mốc thời gian.",
      cost: 1,
      unlocksEvidence: ["E606"],
      discoveries: ["Các mốc lớn khớp nhau.", "Khoảnh khắc va chạm vẫn chưa được nhìn thấy trực tiếp."],
      effects: { legalAnalysis: 10, evidence: 6, argument: 5, caseUnderstanding: 10 }
    }
  ],

  investigationEvents: [
    {
      id: "EVENT_601",
      triggerActions: 2,
      title: "Khách hàng nói thêm một chuyện",
      text: "Nam quay lại văn phòng và nhớ ra trước khi xuống khu vực va chạm, anh đã thấy một người quen đứng gần lối ra. Trong buổi gặp đầu tiên, Nam không nhắc tới người này vì nghĩ chuyện đó không liên quan.",
      choices: [
        {
          id: "A",
          text: "Yêu cầu Nam kể toàn bộ chi tiết và ghi nhận để xác minh.",
          effects: { caseUnderstanding: 10, clientTrust: 5 },
          unlocksEvidence: [],
          discoveries: ["Nam từng nhìn thấy một người quen gần lối ra."]
        },
        {
          id: "B",
          text: "Bỏ qua vì hiện chưa thấy người đó có liên quan.",
          effects: { caseUnderstanding: -5 },
          discoveries: ["Chưa xác minh người quen mà Nam nhìn thấy."]
        }
      ]
    }
  ],

  legalLibrary: [],

  scoring: {
    maxScore: 100,
    hiddenStats: ["legalAnalysis", "evidence", "procedure", "argument", "caseUnderstanding", "clientTrust"],
    initial: {
      legalAnalysis: 0,
      evidence: 0,
      procedure: 0,
      argument: 0,
      caseUnderstanding: 0,
      clientTrust: 0
    }
  },

  finalDefense: {
    title: "Xây dựng lập luận bảo vệ",
    instruction: "Chọn tối đa 3 luận điểm. Hệ thống đánh giá cả quá trình điều tra, không chỉ các luận điểm này.",
    minimumSelection: 0,
    selectionLimit: 3,
    idealCombination: ["A", "B", "D", "E", "G", "H"],
    selectionScoring: {
      positiveIds: ["A", "B", "D", "E", "G", "H"],
      negativeIds: ["C", "F"],
      positiveBonus: 8,
      negativePenalty: 10
    },
    arguments: [
      { id: "A", text: "Thành điều khiển xe và có mặt tại hiện trường.", tags: ["Trách nhiệm"], effects: {} },
      { id: "B", text: "Nam có thiệt hại sức khỏe được hồ sơ y tế xác nhận.", tags: ["Thiệt hại"], effects: {} },
      { id: "C", text: "Nam hoàn toàn không có lỗi trong mọi tình huống.", tags: ["Kết luận tuyệt đối"], effects: {} },
      { id: "D", text: "Camera có góc chết nên phải được đánh giá cùng chứng cứ khác.", tags: ["Đánh giá chứng cứ"], effects: {} },
      { id: "E", text: "Lời khai nhân chứng cần được đối chiếu với vị trí và camera.", tags: ["Đánh giá chứng cứ"], effects: {} },
      { id: "F", text: "Tất cả các khoản chi phí Nam yêu cầu đều đương nhiên hợp lệ.", tags: ["Yêu cầu thiếu căn cứ"], effects: {} },
      { id: "G", text: "Cần đánh giá cả phần lỗi có thể thuộc về Nam.", tags: ["Phân tích lỗi"], effects: {} },
      { id: "H", text: "Thiệt hại phải được chứng minh và phân loại từng khoản.", tags: ["Thiệt hại"], effects: {} }
    ]
  },

  endings: [
    { id: "ENDING_601", range: [0, 49], title: "Hồ sơ chưa đủ sức thuyết phục", type: "LOSE", description: "Quá trình điều tra còn nhiều khoảng trống hoặc lập luận chưa xử lý được các điểm bất lợi.", rewardMultiplier: 0, reputation: -10 },
    { id: "ENDING_602", range: [50, 89], title: "Kết quả chưa chắc chắn", type: "SETTLEMENT", description: "Bạn đã xác minh được nhiều thông tin nhưng hồ sơ vẫn còn điểm có thể bị phản bác.", rewardMultiplier: 0.6, reputation: 5 },
    { id: "ENDING_603", range: [90, 100], title: "Bảo vệ thành công", type: "WIN", description: "Bạn đã ghép được chứng cứ, nhận ra mâu thuẫn và không né tránh điểm bất lợi của khách hàng.", rewardMultiplier: 1.2, reputation: 20 }
  ],

  calculateScore(stats) {
    var weights = {
      legalAnalysis: 0.25,
      evidence: 0.25,
      argument: 0.15,
      caseUnderstanding: 0.15,
      clientTrust: 0.05,
      procedure: 0.15
    };
    var score = 0;
    Object.keys(weights).forEach(function (key) {
      var value = Math.min(100, Number(stats[key]) || 0);
      score += value * weights[key];
    });
    return Math.max(0, Math.min(100, score));
  },

  resolveEnding(score, random) {
    if (score < 50) return "ENDING_601";
    if (score >= 90) return "ENDING_603";
    return Number(random) < score / 100 ? "ENDING_603" : "ENDING_602";
  }
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_006);
