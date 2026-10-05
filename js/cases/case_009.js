"use strict";

var CASE_009 = {
  id: "CASE_009",
  mechanicsVersion: 5,
  title: "Vụ hợp đồng 3,2 tỷ và chữ ký bị giả",
  type: "Dân sự - Tranh chấp hợp đồng",
  difficulty: 7,
  reward: 5200000,
  exp: 400,
  evidenceCountBonusPerItem: 5,

  meta: {
    title: "Vụ hợp đồng 3,2 tỷ và chữ ký bị giả",
    shortTitle: "Hợp đồng 3,2 tỷ và chữ ký",
    category: "Dân sự - Tranh chấp hợp đồng",
    difficulty: 7,
    reward: 5200000,
    exp: 400
  },

  description: "Trần Minh Quân, giám đốc một công ty nội thất, tìm đến văn phòng luật sư sau khi nhận được yêu cầu thanh toán 2,7 tỷ đồng từ Công ty Đại Phát. Đại Phát đưa ra hợp đồng trị giá 3,2 tỷ đồng có chữ ký mang tên Quân. Quân phủ nhận trực tiếp ký, nhưng công ty đã chuyển trước 500 triệu đồng. Cần xác định giao dịch được xác lập đến đâu, ai có quyền sử dụng chữ ký và tài khoản của Quân, đồng thời đánh giá đúng giá trị từng chứng cứ.",
  meetingDialogue: [
    { speaker: "Quân", text: "Tôi nhận được yêu cầu thanh toán hơn 2,7 tỷ từ Đại Phát. Họ nói tôi đã ký hợp đồng 3,2 tỷ." },
    { speaker: "Bạn", text: "Anh có trực tiếp ký hợp đồng đó không?" },
    { speaker: "Quân", text: "Không. Tôi biết công ty có làm việc với Đại Phát, nhưng tôi không nhớ mình đã ký bản hợp đồng này." },
    { speaker: "Bạn", text: "Vậy tại sao lại có chữ ký của anh?" },
    { speaker: "Quân", text: "Đó chính là vấn đề. Chữ ký đó nhìn rất giống chữ ký của tôi." },
    { speaker: "Bạn", text: "Công ty anh đã chuyển tiền cho Đại Phát chưa?" },
    { speaker: "Quân", text: "Có. Kế toán đã chuyển 500 triệu. Nhưng tôi nghĩ đó chỉ là khoản đặt trước." },
    { speaker: "Bạn", text: "Anh có biết ai phụ trách giao dịch không?" },
    { speaker: "Quân", text: "Long bên kinh doanh. Cậu ấy làm việc trực tiếp với Đại Phát." }
  ],
  meetingNotes: [
    "Hợp đồng trị giá 3,2 tỷ đồng.",
    "Đại Phát yêu cầu thanh toán phần còn lại.",
    "Quân phủ nhận việc trực tiếp ký hợp đồng.",
    "Công ty Quân đã chuyển trước 500 triệu đồng."
  ],
  meetingQuestions: [
    {
      id: "payment",
      title: "💰 Hỏi kỹ về 500 triệu",
      quote: "“Anh có biết chính xác khoản tiền đó dùng để làm gì không?”",
      response: "Quân nói thêm: “Tôi nhớ kế toán báo đã chuyển 500 triệu. Tôi chưa từng nói với kế toán rằng phải thanh toán toàn bộ 3,2 tỷ.”",
      effects: { caseUnderstanding: 8 }
    },
    {
      id: "signature",
      title: "✍️ Hỏi về chữ ký",
      quote: "“Ai trong công ty từng có quyền sử dụng chữ ký của anh?”",
      response: "Quân nói: “Long từng xin file chữ ký của tôi để làm hồ sơ. Nhưng tôi không biết cậu ấy có dùng nó cho Đại Phát hay không.”",
      effects: { caseUnderstanding: 10, clientTrust: 3 }
    },
    {
      id: "employee",
      title: "👨‍💼 Hỏi về Long",
      quote: "“Long được giao quyền đến mức nào trong giao dịch này?”",
      response: "Quân nói: “Long là người phụ trách giao dịch. Tôi cho phép cậu ấy trao đổi với Đại Phát, nhưng tôi không nhớ mình có giao quyền ký hợp đồng hay không.”",
      effects: { caseUnderstanding: 9 }
    }
  ],
  investigationInstruction: "Mỗi hành động điều tra tiêu tốn một số lượt. Không phải chứng cứ nào cũng trực tiếp trả lời câu hỏi “Quân có ký hay không”. Đọc tài liệu và đối chiếu các mốc thời gian trước khi kết luận.",
  investigationTurns: 8,
  minimumEvidence: 3,

  clientRequest: {
    primary: "Xác định công ty có phải thanh toán phần còn lại của hợp đồng 3,2 tỷ đồng hay không.",
    secondary: "Quân phủ nhận trực tiếp ký nhưng thừa nhận công ty đã chuyển trước 500 triệu đồng."
  },
  client: {
    name: "Trần Minh Quân",
    age: 42,
    occupation: "Giám đốc công ty nội thất",
    role: "Khách hàng",
    description: "Quân nhận được yêu cầu thanh toán hơn 2,7 tỷ đồng từ Công ty Đại Phát. Anh phủ nhận trực tiếp ký hợp đồng nhưng thừa nhận công ty đã chuyển trước 500 triệu đồng."
  },
  opponent: {
    name: "Công ty Đại Phát",
    occupation: "Nhà cung cấp nội thất",
    role: "Bên yêu cầu thanh toán",
    description: "Đại Phát cho rằng hợp đồng cung cấp nội thất trị giá 3,2 tỷ đồng đã được xác nhận hợp lệ và yêu cầu thanh toán phần còn lại."
  },

  timeline: [
    { date: "11/09 · 09:17", title: "Email đầu tiên được gửi cho Đại Phát", content: "Tài khoản email công ty của Quân đề nghị triển khai theo báo giá và yêu cầu gửi hợp đồng để kiểm tra." },
    { date: "12/09 · 14:02", title: "Quân rời văn phòng", content: "Camera ghi nhận Quân rời công ty để gặp khách hàng." },
    { date: "12/09 · 14:37", title: "Quân xuất hiện tại nhà hàng", content: "Quân có mặt tại nhà hàng cách công ty khoảng 7 km." },
    { date: "12/09 · 15:26", title: "File PDF được chỉnh sửa", content: "Metadata cho thấy file hợp đồng được chỉnh sửa trên một máy tính thuộc mạng nội bộ công ty Minh Quân." },
    { date: "12/09 · 15:41", title: "Long và Hà nhắn tin về file chữ ký", content: "Long hỏi Hà về file chữ ký của Quân để làm hồ sơ Đại Phát." },
    { date: "12/09 · 16:11", title: "Quân quay lại văn phòng", content: "Camera ghi nhận Quân quay lại công ty." },
    { date: "12/09 · 17:08", title: "Hợp đồng được gửi lại qua email", content: "Email công ty phản hồi Đại Phát rằng có thể tiến hành theo nội dung hợp đồng." },
    { date: "13/09", title: "Công ty Minh Quân chuyển 500 triệu", content: "Nội dung giao dịch ghi “Thanh toán đợt 1 — đơn hàng nội thất”." }
  ],

  evidence: [
    {
      id: "E901",
      icon: "📄",
      status: "Đã thu thập",
      title: "Hợp đồng 3,2 tỷ",
      type: "Hợp đồng",
      content: "HỢP ĐỒNG CUNG CẤP NỘI THẤT — ĐẠI PHÁT. Bên A: Công ty Đại Phát. Bên B: Công ty TNHH Nội thất Minh Quân. Giá trị hợp đồng: 3.200.000.000 VNĐ. Hợp đồng ghi ngày 12/09; theo nội dung văn bản, Bên B đặt mua toàn bộ lô nội thất cho một dự án văn phòng. Cuối hợp đồng có chữ ký mang tên Trần Minh Quân. Chữ ký nhìn bằng mắt thường khá giống mẫu chữ ký của Quân. Tài liệu hiện tại chưa chứng minh được ai là người trực tiếp đặt bút ký."
    },
    {
      id: "E902",
      icon: "📧",
      status: "Đã xác minh",
      title: "Email đặt hàng",
      type: "Email",
      content: "Ngày 11/09 lúc 09:17, tài khoản email công ty của Quân gửi cho Đại Phát: “Có thể triển khai theo báo giá đã trao đổi. Gửi hợp đồng để bên tôi kiểm tra.” Ngày 12/09, Đại Phát gửi bản hợp đồng PDF đến cùng địa chỉ email. Khoảng 17 phút sau, tài khoản này gửi lại: “Đã xem. Tiến hành theo nội dung hợp đồng.” Chưa xác định được chính Quân là người trực tiếp sử dụng tài khoản tại thời điểm gửi email thứ hai. Thông tin đăng nhập của tài khoản công ty được nhiều nhân viên sử dụng trong công việc."
    },
    {
      id: "E903",
      icon: "👨‍💼",
      status: "Đã thu thập",
      title: "Lời khai Nguyễn Hoàng Long",
      type: "Lời khai",
      content: "BIÊN BẢN LỜI KHAI — NGUYỄN HOÀNG LONG. Chức vụ: Nhân viên kinh doanh. Long khai rằng Quân đã biết về giao dịch với Đại Phát: “Anh Quân có nói với tôi là cứ làm việc với bên Đại Phát.” Tuy nhiên Long không nhớ chính xác câu nói được đưa ra vào ngày nào. Long cũng thừa nhận từng nhận một file ảnh chữ ký của Quân để dùng cho hồ sơ nội bộ. Long không trực tiếp nhìn thấy Quân ký vào hợp đồng ngày 12/09."
    },
    {
      id: "E904",
      icon: "🎥",
      status: "Đã xác minh",
      title: "Camera văn phòng",
      type: "Video",
      content: "Camera ghi nhận hoạt động tại phòng giám đốc trong ngày 12/09. 14:02 — Quân rời văn phòng để gặp khách hàng. 14:18 — Quân xuất hiện tại bãi xe. 14:37 — Quân có mặt tại một nhà hàng cách công ty khoảng 7 km. 16:11 — Quân mới quay lại văn phòng. Trong khoảng thời gian 14:02–16:11, Quân không xuất hiện tại phòng giám đốc. Camera không cho biết người nào đã sử dụng máy tính hoặc lấy tài liệu trên bàn Quân trong thời gian này."
    },
    {
      id: "E905",
      icon: "💾",
      status: "Đã kiểm tra",
      title: "Metadata file PDF",
      type: "Báo cáo phân tích",
      content: "BÁO CÁO PHÂN TÍCH FILE HỢP ĐỒNG. File PDF do Đại Phát cung cấp có tên HD_DAIPHAT_1209.pdf. Ngày tạo file ban đầu: 11/09 lúc 21:43. Dữ liệu hệ thống cho thấy file được chỉnh sửa vào 12/09 lúc 15:26 trên một máy tính thuộc mạng nội bộ công ty Minh Quân. Điều này cho thấy file đã từng được mở hoặc chỉnh sửa từ hệ thống công ty Minh Quân. Metadata không tự chứng minh ai là người chỉnh sửa."
    },
    {
      id: "E906",
      icon: "💳",
      status: "Đã xác minh",
      title: "Lịch sử chuyển khoản",
      type: "Sao kê giao dịch",
      content: "Ngày 13/09, Công ty Minh Quân chuyển cho Đại Phát 500.000.000 VNĐ. Nội dung: “Thanh toán đợt 1 — đơn hàng nội thất.” Kế toán xác nhận khoản tiền được chuyển theo yêu cầu của bộ phận kinh doanh. Chưa tìm thấy văn bản riêng xác định 500 triệu này là khoản thanh toán cho toàn bộ hợp đồng 3,2 tỷ."
    },
    {
      id: "E907",
      icon: "💬",
      status: "Đã thu thập",
      title: "Tin nhắn nội bộ",
      type: "Tin nhắn",
      content: "TIN NHẮN NỘI BỘ — LONG & HÀ. Tin nhắn ngày 12/09 lúc 15:41: Long hỏi “File chữ ký của sếp còn không?” Hà trả lời “Còn. Anh cần để làm hồ sơ Đại Phát à?” Long đáp “Ừ, bên đó đang cần gấp.” Đoạn tin nhắn cho thấy Long từng có quyền tiếp cận file chữ ký của Quân, nhưng không chứng minh Long đã dùng file đó để tạo hợp đồng."
    },
    {
      id: "E908",
      icon: "🔎",
      status: "Đã phân tích",
      title: "Đối chiếu chữ ký",
      type: "Báo cáo giám định",
      content: "BÁO CÁO ĐỐI CHIẾU CHỮ KÝ. Chuyên viên đã đối chiếu chữ ký trên hợp đồng với 5 mẫu chữ ký thật của Quân. Kết quả: có nhiều đặc điểm tương đồng. Tuy nhiên chữ ký trên hợp đồng được thể hiện dưới dạng hình ảnh kỹ thuật số trong file PDF. Không có bản gốc giấy để kiểm tra lực bút, mực và trình tự nét ký. Kết luận chuyên môn: “Không đủ cơ sở chỉ từ bản PDF để xác định người trực tiếp tạo ra chữ ký.”"
    }
  ],

  investigationActions: [
    {
      id: "contract",
      title: "📄 Kiểm tra hợp đồng gốc",
      description: "Đọc toàn bộ nội dung và kiểm tra chữ ký.",
      cost: 1,
      unlocksEvidence: ["E901"],
      discoveries: ["Hợp đồng có giá trị 3,2 tỷ.", "Chữ ký trên hợp đồng giống mẫu chữ ký của Quân."],
      effects: { legalAnalysis: 8, evidence: 10, argument: 5, caseUnderstanding: 8 }
    },
    {
      id: "email",
      title: "📧 Truy xuất lịch sử email",
      description: "Xác định quá trình trao đổi với Đại Phát.",
      cost: 1,
      unlocksEvidence: ["E902"],
      discoveries: ["Email công ty từng xác nhận tiến hành giao dịch.", "Nhiều nhân viên có khả năng truy cập tài khoản."],
      effects: { legalAnalysis: 10, evidence: 10, argument: 5, caseUnderstanding: 10 }
    },
    {
      id: "employee",
      title: "👨‍💼 Lấy lời khai Long",
      description: "Kiểm tra người phụ trách giao dịch.",
      cost: 1,
      unlocksEvidence: ["E903"],
      discoveries: ["Long không nhìn thấy Quân trực tiếp ký.", "Long từng có file chữ ký của Quân."],
      effects: { legalAnalysis: 9, evidence: 9, argument: 7, caseUnderstanding: 10, clientTrust: -1 }
    },
    {
      id: "camera",
      title: "🎥 Kiểm tra camera văn phòng",
      description: "Xác định Quân có mặt tại thời điểm ký hay không.",
      cost: 1,
      unlocksEvidence: ["E904"],
      discoveries: ["Quân rời văn phòng từ 14:02 đến 16:11.", "Trong khoảng thời gian này Quân không xuất hiện tại phòng giám đốc."],
      effects: { legalAnalysis: 10, evidence: 10, argument: 7, caseUnderstanding: 10, clientTrust: 2 }
    },
    {
      id: "metadata",
      title: "💾 Phân tích metadata PDF",
      description: "Kiểm tra lịch sử tạo và chỉnh sửa file.",
      cost: 2,
      unlocksEvidence: ["E905"],
      discoveries: ["File được chỉnh sửa lúc 15:26.", "Việc chỉnh sửa xảy ra từ mạng nội bộ công ty."],
      effects: { legalAnalysis: 12, evidence: 10, argument: 10, caseUnderstanding: 12 }
    },
    {
      id: "payment",
      title: "💳 Kiểm tra khoản 500 triệu",
      description: "Xác định mục đích khoản tiền đã chuyển.",
      cost: 1,
      unlocksEvidence: ["E906"],
      discoveries: ["Công ty đã chuyển 500 triệu cho Đại Phát.", "Nội dung giao dịch ghi thanh toán đợt 1."],
      effects: { legalAnalysis: 8, evidence: 10, argument: 5, caseUnderstanding: 9 }
    },
    {
      id: "message",
      title: "💬 Kiểm tra tin nhắn nội bộ",
      description: "Tìm hiểu việc sử dụng file chữ ký.",
      cost: 1,
      unlocksEvidence: ["E907"],
      discoveries: ["Long từng hỏi xin file chữ ký của Quân.", "Chưa có bằng chứng trực tiếp Long dùng file để làm hợp đồng."],
      effects: { legalAnalysis: 11, evidence: 10, argument: 9, caseUnderstanding: 11, clientTrust: -1 }
    },
    {
      id: "signature",
      title: "🔎 Giám định chữ ký",
      description: "Đánh giá giá trị của chữ ký trên PDF.",
      cost: 2,
      unlocksEvidence: ["E908"],
      discoveries: ["Chữ ký có nhiều điểm tương đồng với mẫu thật.", "Không thể xác định người trực tiếp tạo chữ ký chỉ từ PDF."],
      effects: { legalAnalysis: 12, evidence: 10, argument: 10, caseUnderstanding: 12, clientTrust: 1 }
    }
  ],
  investigationEvents: [
    {
      id: "payment-timing",
      title: "Kế toán vừa phát hiện một giao dịch khác",
      text: "Lê Thu Hà gọi lại cho văn phòng: “Tôi vừa kiểm tra lại hệ thống. 500 triệu không được chuyển sau khi Quân ký hợp đồng.” Theo dữ liệu kế toán, yêu cầu chuyển tiền được tạo từ bộ phận kinh doanh trước khi bản hợp đồng cuối cùng xuất hiện. Điều này khiến trình tự thời gian của giao dịch trở nên quan trọng.",
      triggerActions: 2,
      choices: [
        {
          id: "verify",
          text: "🔎 Yêu cầu Hà cung cấp toàn bộ lịch sử giao dịch. Không tự kết luận ý nghĩa của khoản tiền.",
          effects: { caseUnderstanding: 10, clientTrust: 5 },
          discoveries: ["Lịch sử giao dịch cho thấy khoản 500 triệu được tạo trước khi hợp đồng cuối cùng xuất hiện."]
        },
        {
          id: "assume",
          text: "💰 Coi 500 triệu là bằng chứng Quân đã đồng ý hợp đồng. Nhanh nhưng có thể suy luận quá mức.",
          effects: { caseUnderstanding: -8 }
        }
      ]
    }
  ],
  scoring: {
    maxScore: 100,
    hiddenStats: ["legalAnalysis", "evidence", "argument", "caseUnderstanding", "clientTrust"],
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
    title: "Xây dựng lập luận",
    instruction: "Chọn tối đa 4 luận điểm. Hệ thống sẽ đánh giá dựa trên toàn bộ quá trình điều tra.",
    minimumSelection: 0,
    selectionLimit: 4,
    selectionScoring: {
      positiveIds: ["A", "D", "E", "F", "G", "H", "I", "J"],
      negativeIds: ["C"],
      positiveBonus: 6,
      negativePenalty: 15,
      neutralIds: ["B"],
      neutralBonus: 1
    },
    arguments: [
      { id: "A", text: "Công ty Minh Quân thực tế đã có giao dịch với Đại Phát.", tags: ["Giao dịch"], effects: {} },
      { id: "B", text: "Chữ ký trên hợp đồng có nhiều điểm giống chữ ký của Quân.", tags: ["Chữ ký"], effects: {} },
      { id: "C", text: "Vì chữ ký giống mẫu nên chắc chắn Quân trực tiếp ký hợp đồng.", tags: ["Kết luận tuyệt đối"], effects: {} },
      { id: "D", text: "Camera cho thấy Quân không có mặt tại văn phòng trong một khoảng thời gian quan trọng.", tags: ["Thời gian"], effects: {} },
      { id: "E", text: "Email từ tài khoản công ty cần được đối chiếu với người thực sự sử dụng tài khoản.", tags: ["Tài khoản"], effects: {} },
      { id: "F", text: "Metadata cho thấy file hợp đồng từng được chỉnh sửa từ mạng nội bộ công ty.", tags: ["Metadata"], effects: {} },
      { id: "G", text: "Khoản 500 triệu cần được xác định rõ mục đích và căn cứ thanh toán.", tags: ["Thanh toán"], effects: {} },
      { id: "H", text: "Việc một nhân viên có file chữ ký không tự động chứng minh người đó đã giả chữ ký.", tags: ["Chữ ký"], effects: {} },
      { id: "I", text: "Không thể kết luận toàn bộ hợp đồng vô hiệu chỉ vì Quân không trực tiếp có mặt.", tags: ["Hiệu lực hợp đồng"], effects: {} },
      { id: "J", text: "Cần xác định ai có quyền sử dụng chữ ký và hành động thay mặt Quân.", tags: ["Thẩm quyền"], effects: {} }
    ]
  },
  calculateScore: function (stats) {
    return Math.round(
      (Number(stats.legalAnalysis) || 0) * 0.22 +
      (Number(stats.evidence) || 0) * 0.25 +
      (Number(stats.argument) || 0) * 0.15 +
      (Number(stats.caseUnderstanding) || 0) * 0.18 +
      (Number(stats.clientTrust) || 0) * 0.05 +
      (Number(stats.evidenceCountScore) || 0) * 0.15
    );
  },
  resolveEnding: function (score) {
    if (score < 45) return "ENDING_901";
    if (score < 75) return "ENDING_902";
    if (score < 90) return "ENDING_903";
    return "ENDING_904";
  },
  endings: [
    {
      id: "ENDING_901",
      range: [0, 44],
      title: "Hồ sơ chưa đủ sức thuyết phục",
      type: "LOSE",
      description: "Bạn đã bỏ qua quá nhiều điểm cần xác minh. Đặc biệt, hồ sơ chưa phân biệt được giữa việc chữ ký giống chữ ký thật và việc xác định người trực tiếp tạo ra chữ ký.",
      rewardMultiplier: 0,
      reputation: -10
    },
    {
      id: "ENDING_902",
      range: [45, 74],
      title: "Hồ sơ còn nhiều điểm có thể bị phản bác",
      type: "SETTLEMENT",
      description: "Bạn đã tìm được nhiều chứng cứ quan trọng nhưng một số lập luận vẫn suy diễn quá nhanh hoặc chưa xử lý đầy đủ vấn đề về tài khoản, file chữ ký và khoản thanh toán 500 triệu.",
      rewardMultiplier: 0.5,
      reputation: 0
    },
    {
      id: "ENDING_903",
      range: [75, 89],
      title: "Lập luận khá chắc",
      type: "SETTLEMENT",
      description: "Bạn đã nhận ra rằng vụ án không thể giải quyết chỉ bằng việc nhìn vào chữ ký. Các dữ liệu về thời gian, email, metadata và quyền sử dụng chữ ký đều cần được đối chiếu.",
      rewardMultiplier: 0.8,
      reputation: 10
    },
    {
      id: "ENDING_904",
      range: [90, 100],
      title: "Bảo vệ hồ sơ thành công",
      type: "WIN",
      description: "Bạn đã không vội kết luận chữ ký là giả hay Quân hoàn toàn không liên quan. Thay vào đó, bạn xác định đúng các vấn đề cần chứng minh: ai tạo chữ ký, ai sử dụng tài khoản, khoản 500 triệu có ý nghĩa gì và Quân đã trao quyền đến đâu.",
      rewardMultiplier: 1.2,
      reputation: 20
    }
  ]
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_009);
