"use strict";

var CASE_008 = {
  id: "CASE_008",
  mechanicsVersion: 1,
  title: "Kho hàng 1,8 tỷ và lô hàng “biến mất”",
  type: "Dân sự - Tranh chấp hợp đồng mua bán",
  difficulty: 7,
  reward: 5600000,
  exp: 450,
  evidenceCountBonusPerItem: 5,
  completionBonuses: [
    { evidenceIds: ["warehouse", "message", "gps"], points: 8 },
    { evidenceIds: ["authority"], points: 6 }
  ],

  meta: {
    title: "Kho hàng 1,8 tỷ và lô hàng “biến mất”",
    shortTitle: "Kho hàng 1,8 tỷ",
    category: "Dân sự - Tranh chấp hợp đồng mua bán",
    difficulty: 7,
    reward: 5600000,
    exp: 450
  },

  description: "Phạm Gia Huy, giám đốc một công ty phân phối thiết bị điện, tìm đến văn phòng luật sư sau khi nhận được yêu cầu thanh toán 1,8 tỷ đồng từ Công ty Nam Việt. Nam Việt cho rằng công ty Huy đã nhận đủ 1.200 thiết bị điện nhưng cố tình không thanh toán. Huy khẳng định công ty chưa bao giờ nhận đủ số hàng này.",
  meetingDialogue: [
    { speaker: "Huy", text: "Nam Việt đang đòi tôi 1,8 tỷ. Họ nói công ty tôi đã nhận đủ 1.200 thiết bị." },
    { speaker: "Bạn", text: "Anh có ký biên bản nhận hàng không?" },
    { speaker: "Huy", text: "Tôi không. Tôi không có mặt ở kho hôm đó." },
    { speaker: "Bạn", text: "Vậy ai ký?" },
    { speaker: "Huy", text: "Khang. Cậu ấy là nhân viên kho." },
    { speaker: "Bạn", text: "Anh có biết công ty thực tế nhận bao nhiêu hàng không?" },
    { speaker: "Huy", text: "Trong hệ thống tôi thấy chỉ có 760 thiết bị được nhập." },
    { speaker: "Bạn", text: "Nam Việt có nói họ giao phần còn lại sau đó không?" },
    { speaker: "Huy", text: "Họ nói đã giao đủ một lần. Nhưng tôi chưa thấy bằng chứng xe quay lại." }
  ],
  meetingNotes: [
    "Giá trị tranh chấp: 1,8 tỷ đồng.",
    "Nam Việt nói đã giao 1.200 thiết bị.",
    "Hồ sơ có chữ ký của Đỗ Minh Khang.",
    "Dữ liệu kho của Huy chỉ ghi nhận 760 thiết bị."
  ],
  meetingQuestions: [
    {
      id: "quantity",
      title: "📦 Hỏi kỹ về số lượng",
      quote: "“Anh dựa vào đâu để nói công ty chỉ nhận 760?”",
      response: "Huy nói thêm: “Tôi kiểm tra trực tiếp hệ thống kho. Chỉ có 760 thiết bị được ghi nhận ngày hôm đó.”",
      effects: { caseUnderstanding: 8 }
    },
    {
      id: "khang",
      title: "✍️ Hỏi về Khang",
      quote: "“Khang có quyền ký nhận hàng đến mức nào?”",
      response: "Huy nói: “Khang được phép ký xác nhận hàng được đưa vào kho. Nhưng tôi không cho phép cậu ấy tự xác nhận rằng toàn bộ hợp đồng đã hoàn thành.”",
      effects: { caseUnderstanding: 11, clientTrust: 3 }
    },
    {
      id: "second",
      title: "🚚 Hỏi về chuyến giao thứ hai",
      quote: "“Có ai xác nhận xe quay lại công ty không?”",
      response: "Huy nói: “Quản lý kho nói không thấy xe quay lại. Nhưng tôi muốn luật sư kiểm tra GPS chứ không muốn kết luận chỉ từ lời nói.”",
      effects: { caseUnderstanding: 10, clientTrust: 3 }
    }
  ],

  investigationInstruction: "Mỗi hành động điều tra tiêu tốn một số lượt. Không phải chứng cứ nào cũng chứng minh trực tiếp số lượng hàng đã được giao. Đọc tài liệu và đối chiếu các nguồn chứng cứ trước khi kết luận.",
  investigationTurns: 9,
  minimumEvidence: 3,

  clientRequest: {
    primary: "Xác định công ty Huy thực sự đã nhận bao nhiêu thiết bị và liệu Nam Việt có chứng minh được việc giao đủ 1.200 thiết bị hay không.",
    secondary: "Đánh giá giá trị chữ ký của Đỗ Minh Khang trên biên bản giao nhận."
  },
  client: {
    name: "Phạm Gia Huy",
    age: 40,
    occupation: "Giám đốc công ty phân phối thiết bị điện",
    role: "Khách hàng",
    description: "Huy cho biết dữ liệu kho của công ty chỉ ghi nhận 760 thiết bị và muốn xác minh Nam Việt đã thực sự giao bao nhiêu hàng."
  },
  opponent: {
    name: "Công ty Nam Việt",
    occupation: "Nhà cung cấp thiết bị điện",
    role: "Bên yêu cầu thanh toán",
    description: "Nam Việt cho rằng công ty Huy đã nhận đủ 1.200 thiết bị theo hợp đồng và yêu cầu thanh toán 1,8 tỷ đồng."
  },

  timeline: [
    { date: "09:15", title: "Nam Việt xuất kho", content: "Lô thiết bị được đưa lên xe vận chuyển." },
    { date: "10:56", title: "Xe Nam Việt đến công ty Huy", content: "Xe tiến vào khu vực kho của công ty Huy." },
    { date: "11:08", title: "Bắt đầu dỡ hàng", content: "Camera ghi nhận quá trình dỡ hàng nhưng không đếm chính xác từng thiết bị." },
    { date: "11:42", title: "Khang rời khu vực kho", content: "Hệ thống kho ghi nhận 760 thiết bị được nhập." },
    { date: "12:03", title: "Xe rời công ty", content: "Xe Nam Việt rời công ty Huy." },
    { date: "12:17", title: "Khang nhắn hàng chưa đủ", content: "Khang báo quản lý kho: “Hàng hôm nay chưa đủ, bên tài xế nói chiều quay lại.”" },
    { date: "13:05", title: "Xe đến một kho khác", content: "GPS ghi nhận xe đến một kho khác; hệ thống kho công ty Huy chỉ ghi nhận 760 thiết bị." },
    { date: "20/09", title: "Nam Việt yêu cầu thanh toán", content: "Nam Việt yêu cầu công ty Huy thanh toán 1,8 tỷ đồng." }
  ],

  evidence: [
    {
      id: "E801",
      icon: "📄",
      status: "Đã thu thập",
      title: "Hợp đồng mua bán",
      type: "Hợp đồng",
      content: "HỢP ĐỒNG MUA BÁN THIẾT BỊ. Bên bán: Công ty Nam Việt. Bên mua: Công ty của Phạm Gia Huy. Giá trị hợp đồng: 1.800.000.000 VNĐ. Theo hợp đồng, Nam Việt phải giao 1.200 thiết bị điện. Thanh toán được thực hiện sau khi bên mua xác nhận việc giao hàng. Hợp đồng quy định phải có chứng từ giao nhận để xác định việc bàn giao hàng hóa."
    },
    {
      id: "E804",
      icon: "📦",
      status: "Đã xác minh",
      title: "Dữ liệu nhập kho",
      type: "Dữ liệu kho",
      content: "HỆ THỐNG QUẢN LÝ KHO. Ngày 18/09 lúc 11:42, hệ thống kho ghi nhận 760 thiết bị điện được nhập kho. Không có giao dịch nhập kho nào khác của Nam Việt được ghi nhận trong ngày 18/09. Hệ thống được quản lý bằng tài khoản riêng của bộ phận kho. Dữ liệu này không tự chứng minh 440 thiết bị còn lại không được giao ở một địa điểm khác."
    },
    {
      id: "E803",
      icon: "🧾",
      status: "Đã thu thập",
      title: "Biên bản giao nhận",
      type: "Biên bản",
      content: "BIÊN BẢN GIAO NHẬN HÀNG HÓA ngày 18/09. Bên bán: Công ty Nam Việt. Bên nhận: Công ty của Phạm Gia Huy. Số lượng ghi nhận: 1.200 thiết bị điện. Người ký nhận: Đỗ Minh Khang — nhân viên kho. Biên bản có chữ ký của đại diện bên giao và người nhận. Chưa có tài liệu riêng chứng minh Khang được Huy ủy quyền ký xác nhận đủ 1.200 thiết bị."
    },
    {
      id: "E805",
      icon: "🎥",
      status: "Đã xác minh",
      title: "Camera kho",
      type: "Video",
      content: "TRÍCH XUẤT CAMERA KHO. 10:56 — Xe Nam Việt tiến vào kho. 11:08 — Bắt đầu dỡ hàng. 11:42 — Khang rời khu vực kho. 12:03 — Xe Nam Việt rời khỏi công ty. Camera cho thấy hoạt động giao hàng, nhưng góc quay không đủ để đếm chính xác từng thiết bị. Không thể chỉ dựa vào camera để kết luận chính xác 760 hay 1.200 thiết bị đã được dỡ xuống."
    },
    {
      id: "E806",
      icon: "💬",
      status: "Đã thu thập",
      title: "Tin nhắn của Khang",
      type: "Tin nhắn",
      content: "TIN NHẮN NỘI BỘ — ĐỖ MINH KHANG. Ngày 18/09 lúc 12:17, Khang nhắn cho quản lý kho: “Hàng hôm nay chưa đủ, bên tài xế nói chiều quay lại.” Không có tin nhắn nào sau đó xác nhận xe Nam Việt đã quay lại. Lời nhắn được gửi chỉ khoảng 14 phút sau khi xe rời khỏi công ty."
    },
    {
      id: "E807",
      icon: "📍",
      status: "Đã xác minh",
      title: "GPS xe vận chuyển",
      type: "Dữ liệu định vị",
      content: "DỮ LIỆU ĐỊNH VỊ XE NAM VIỆT. 12:03 — Xe rời công ty Huy. 12:17 — Xe di chuyển trên tuyến đường phía Nam. 13:05 — Xe đến một kho khác. Dữ liệu GPS không ghi nhận xe quay lại công ty Huy trong ngày 18/09. Không có dấu hiệu về chuyến giao hàng thứ hai tại công ty Huy trong cùng ngày. GPS không cho biết chính xác số lượng hàng trên xe."
    },
    {
      id: "E808",
      icon: "⚖️",
      status: "Đã phân tích",
      title: "Phiếu cân xe",
      type: "Chứng từ vận chuyển",
      content: "PHIẾU CÂN XE VẬN CHUYỂN. Khối lượng xe trước khi giao: 4.820 kg. Khối lượng xe sau khi rời công ty Huy: 3.110 kg. Chênh lệch khoảng 1.710 kg. Số liệu cho thấy xe đã giảm tải đáng kể. Tuy nhiên không thể dùng riêng trọng lượng để xác định chính xác số lượng thiết bị."
    },
    {
      id: "E809",
      icon: "🚚",
      status: "Đã thu thập",
      title: "Lời khai tài xế",
      type: "Lời khai",
      content: "BIÊN BẢN LỜI KHAI — LÊ QUỐC THÀNH. Thành xác nhận đã lái xe giao hàng cho Nam Việt ngày 18/09. Theo lời khai: “Bên kho bảo tôi cứ dỡ hàng theo danh sách. Tôi không trực tiếp đếm từng cái.” Thành nhớ rằng sau khi rời công ty Huy, anh được điều đến một kho khác. Lời khai không xác định được chính xác số lượng đã giao cho Huy."
    },
    {
      id: "E810",
      icon: "✍️",
      status: "Đã xác minh",
      title: "Quyền ký của Khang",
      type: "Quy định nội bộ",
      content: "QUY ĐỊNH NỘI BỘ VỀ QUYỀN KÝ. Nhân viên kho có quyền ký xác nhận việc tiếp nhận thực tế hàng hóa. Tuy nhiên việc xác nhận giá trị thanh toán hoặc xác nhận hoàn tất toàn bộ hợp đồng thuộc thẩm quyền của quản lý hoặc giám đốc. Khang có quyền xác nhận hàng thực tế được đưa vào kho, nhưng không có quyền tự xác nhận nghĩa vụ thanh toán 1,8 tỷ đồng."
    }
  ],

  investigationActions: [
    { id: "contract", title: "📄 Kiểm tra hợp đồng", description: "Xác định nghĩa vụ giao hàng và thanh toán.", cost: 1, unlocksEvidence: ["E801"], discoveries: ["Hợp đồng yêu cầu Nam Việt giao 1.200 thiết bị.", "Thanh toán gắn với việc xác nhận giao hàng."], effects: { legalAnalysis: 10, evidence: 8, argument: 5, caseUnderstanding: 10, clientTrust: 1 } },
    { id: "warehouse", title: "📦 Kiểm tra dữ liệu nhập kho", description: "Đối chiếu số lượng thực tế được ghi nhận.", cost: 1, unlocksEvidence: ["E804"], discoveries: ["Hệ thống kho chỉ ghi nhận 760 thiết bị.", "Không có lần nhập kho thứ hai từ Nam Việt trong ngày."], effects: { legalAnalysis: 14, evidence: 12, argument: 7, caseUnderstanding: 14, clientTrust: 2 } },
    { id: "receipt", title: "🧾 Kiểm tra biên bản giao nhận", description: "Phân tích chữ ký và số lượng ghi trên biên bản.", cost: 1, unlocksEvidence: ["E803"], discoveries: ["Biên bản ghi nhận đủ 1.200 thiết bị.", "Khang là người ký xác nhận bên nhận."], effects: { legalAnalysis: 12, evidence: 10, argument: 8, caseUnderstanding: 11, clientTrust: 1 } },
    { id: "camera", title: "🎥 Xem camera kho", description: "Kiểm tra quá trình giao hàng.", cost: 1, unlocksEvidence: ["E805"], discoveries: ["Xe đến lúc 10:56 và rời lúc 12:03.", "Camera không đủ rõ để đếm chính xác số hàng."], effects: { legalAnalysis: 12, evidence: 9, argument: 7, caseUnderstanding: 12, clientTrust: 2 } },
    { id: "message", title: "💬 Truy xuất tin nhắn Khang", description: "Tìm hiểu tình trạng hàng ngay sau khi giao.", cost: 1, unlocksEvidence: ["E806"], discoveries: ["Khang báo hàng chưa đủ.", "Tin nhắn được gửi 14 phút sau khi xe rời đi."], effects: { legalAnalysis: 15, evidence: 12, argument: 10, caseUnderstanding: 15, clientTrust: 3 } },
    { id: "gps", title: "📍 Kiểm tra GPS xe", description: "Xác định xe có quay lại giao hàng hay không.", cost: 1, unlocksEvidence: ["E807"], discoveries: ["Xe không quay lại công ty Huy trong ngày.", "Xe đi thẳng đến một kho khác."], effects: { legalAnalysis: 14, evidence: 12, argument: 10, caseUnderstanding: 14, clientTrust: 2 } },
    { id: "weight", title: "⚖️ Kiểm tra phiếu cân", description: "Đối chiếu khối lượng trước và sau giao hàng.", cost: 2, unlocksEvidence: ["E808"], discoveries: ["Xe giảm khoảng 1.710 kg.", "Trọng lượng không đủ để xác định chính xác số lượng."], effects: { legalAnalysis: 11, evidence: 10, argument: 8, caseUnderstanding: 10, clientTrust: 1 } },
    { id: "driver", title: "🚚 Lấy lời khai tài xế", description: "Xác định tài xế biết gì về số lượng hàng.", cost: 1, unlocksEvidence: ["E809"], discoveries: ["Tài xế không trực tiếp đếm từng thiết bị.", "Sau khi rời công ty Huy, xe đi đến kho khác."], effects: { legalAnalysis: 12, evidence: 11, argument: 9, caseUnderstanding: 13, clientTrust: 2 } },
    { id: "authority", title: "✍️ Kiểm tra quyền ký của Khang", description: "Xác định chữ ký của Khang có giá trị đến đâu.", cost: 2, unlocksEvidence: ["E810"], discoveries: ["Khang có quyền xác nhận hàng thực tế.", "Khang không có quyền tự xác nhận nghĩa vụ thanh toán 1,8 tỷ."], effects: { legalAnalysis: 18, evidence: 13, argument: 12, caseUnderstanding: 17, clientTrust: 4 } }
  ],
  investigationEvents: [
    {
      id: "warehouse-manager-account",
      title: "Quản lý kho vừa nhớ ra một chi tiết",
      text: "Nguyễn Thảo Vy gọi lại cho văn phòng luật sư: “Tôi nhớ hôm đó hàng chưa được kiểm đủ. Khang có bảo tôi ký xác nhận trước, nhưng tôi không đồng ý.” Sau đó Khang tự ký vào biên bản. Chi tiết mới đặt ra câu hỏi: Khang có đang xác nhận số hàng thực tế, hay đang ký một biên bản ghi nhận số lượng mà chưa được kiểm tra?",
      triggerActions: 2,
      choices: [
        {
          id: "verify",
          text: "🔎 Yêu cầu Vy mô tả chính xác những gì cô đã nhìn thấy. Không tự kết luận Khang gian dối.",
          effects: { caseUnderstanding: 12, clientTrust: 5 },
          discoveries: ["Thảo Vy xác nhận cô không trực tiếp xác nhận đủ số lượng hàng."]
        },
        {
          id: "accuse",
          text: "⚠️ Kết luận ngay Khang đã gian dối. Có thể khiến hồ sơ suy diễn quá mức.",
          effects: { caseUnderstanding: -10, clientTrust: -3 },
          discoveries: ["Luật sư vội kết luận Khang gian dối khi chưa có chứng cứ trực tiếp."]
        }
      ]
    }
  ],

  scoring: {
    maxScore: 100,
    hiddenStats: ["legalAnalysis", "evidence", "argument", "caseUnderstanding", "clientTrust"],
    initial: { legalAnalysis: 0, evidence: 0, procedure: 0, argument: 0, caseUnderstanding: 0, clientTrust: 0 }
  },
  finalDefense: {
    title: "Xây dựng lập luận",
    instruction: "Chọn tối đa 4 luận điểm. Không phải lập luận nào nghe có vẻ có lợi cũng đủ sức chứng minh toàn bộ vụ việc.",
    minimumSelection: 0,
    selectionLimit: 4,
    selectionScoring: {
      positiveIds: ["A", "D", "E", "F", "H", "I", "J"],
      negativeIds: ["C", "G"],
      positiveBonus: 7,
      negativePenalty: 16,
      neutralIds: ["B"]
    },
    arguments: [
      { id: "A", text: "Hợp đồng mua bán tồn tại và công ty Huy thực sự có đặt hàng.", tags: ["Hợp đồng"], effects: {} },
      { id: "B", text: "Phiếu xuất kho chứng minh Nam Việt đã xuất hàng.", tags: ["Chứng từ"], effects: {} },
      { id: "C", text: "Có chữ ký của Khang nên mặc nhiên chứng minh Huy đã nhận đủ 1.200 thiết bị.", tags: ["Kết luận tuyệt đối"], effects: {} },
      { id: "D", text: "Dữ liệu nhập kho của Huy chỉ ghi nhận 760 thiết bị.", tags: ["Dữ liệu kho"], effects: {} },
      { id: "E", text: "Tin nhắn của Khang cho thấy tại thời điểm giao hàng vẫn có vấn đề về số lượng.", tags: ["Tin nhắn"], effects: {} },
      { id: "F", text: "GPS cho thấy xe Nam Việt không quay lại công ty Huy để giao phần hàng còn thiếu.", tags: ["GPS"], effects: {} },
      { id: "G", text: "Camera chứng minh chính xác chỉ có 760 thiết bị được giao.", tags: ["Suy diễn"], effects: {} },
      { id: "H", text: "Camera không đủ để xác định chính xác số lượng nên không nên suy diễn quá mức.", tags: ["Đánh giá chứng cứ"], effects: {} },
      { id: "I", text: "Cần xác định Khang có thẩm quyền ký xác nhận đủ hàng hay không.", tags: ["Thẩm quyền"], effects: {} },
      { id: "J", text: "Cần đối chiếu biên bản với dữ liệu kho, camera, GPS và chứng từ vận chuyển.", tags: ["Đối chiếu chứng cứ"], effects: {} }
    ]
  },
  calculateScore: function (stats) {
    var score =
      (Number(stats.legalAnalysis) || 0) * 0.20 +
      (Number(stats.evidence) || 0) * 0.25 +
      (Number(stats.argument) || 0) * 0.16 +
      (Number(stats.caseUnderstanding) || 0) * 0.19 +
      (Number(stats.clientTrust) || 0) * 0.05 +
      (Number(stats.evidenceCountScore) || 0) * 0.15;
    return Math.round(Math.max(0, Math.min(100, score)));
  },
  resolveEnding: function (score) {
    if (score < 45) return "ENDING_801";
    if (score < 75) return "ENDING_802";
    if (score < 90) return "ENDING_803";
    return "ENDING_804";
  },
  endings: [
    {
      id: "ENDING_801", range: [0, 44], title: "Hồ sơ chưa đủ sức thuyết phục", type: "LOSE",
      description: "Bạn chưa chứng minh được sự khác biệt giữa việc Nam Việt xuất hàng và việc công ty Huy thực sự nhận đủ 1.200 thiết bị. Một số kết luận còn dựa quá nhiều vào suy đoán.",
      rewardMultiplier: 0, reputation: -10
    },
    {
      id: "ENDING_802", range: [45, 74], title: "Hồ sơ còn nhiều điểm có thể bị phản bác", type: "SETTLEMENT",
      description: "Bạn đã tìm được dữ liệu kho và một số chứng cứ quan trọng, nhưng vẫn cần xử lý tốt hơn giá trị của chữ ký Khang và sự khác biệt giữa số hàng xuất kho với số hàng thực tế được giao.",
      rewardMultiplier: 0.5, reputation: 0
    },
    {
      id: "ENDING_803", range: [75, 89], title: "Lập luận khá chắc", type: "SETTLEMENT",
      description: "Bạn đã không chỉ nhìn vào chữ ký trên biên bản. Bạn đối chiếu dữ liệu kho, tin nhắn, GPS và quyền ký để đặt câu hỏi về việc Nam Việt có chứng minh được giao đủ 1.200 thiết bị hay không.",
      rewardMultiplier: 0.8, reputation: 10
    },
    {
      id: "ENDING_804", range: [90, 100], title: "Bảo vệ hồ sơ thành công", type: "WIN",
      description: "Bạn đã xác định đúng trọng tâm tranh chấp: hợp đồng có tồn tại nhưng điều đó chưa tự chứng minh hàng đã được giao đủ. Bạn phân biệt được chứng cứ chứng minh việc xuất hàng, việc vận chuyển, việc nhập kho và thẩm quyền của người ký nhận.",
      rewardMultiplier: 1.2, reputation: 20
    }
  ]
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_008);
