"use strict";

var CASE_005 = {
  id: "CASE_005",
  title: "Vụ tai nạn tại tầng hầm chung cư An Bình",
  type: "Dân sự - Bồi thường thiệt hại",
  difficulty: 6,
  reward: 5200000,
  exp: 400,
  mechanicsVersion: 3,

  description: "Nguyễn Hoài Nam bị xe của Lê Văn Thành va chạm tại tầng hầm chung cư. Nam muốn yêu cầu bồi thường, nhưng camera có góc chết, nhân chứng đưa ra thông tin bất lợi và một phần thiệt hại chưa được chứng minh rõ. Nhiệm vụ của luật sư là xác minh lỗi của cả hai bên, mối liên hệ với thiệt hại và xây dựng hồ sơ từ ba luận điểm có căn cứ.",

  meta: {
    title: "Vụ tai nạn tại tầng hầm chung cư An Bình",
    shortTitle: "Tai nạn tầng hầm An Bình",
    category: "Dân sự - Bồi thường thiệt hại",
    difficulty: 6,
    reward: 5200000,
    exp: 400
  },

  clientRequest: {
    primary: "Nam muốn yêu cầu Thành bồi thường các thiệt hại phát sinh từ vụ tai nạn.",
    secondary: "Nam chưa chắc mình hoàn toàn không có lỗi; cần đánh giá trung thực chứng cứ và chỉ yêu cầu phần thiệt hại chứng minh được."
  },

  client: {
    name: "Nguyễn Hoài Nam",
    age: 29,
    occupation: "Nhân viên thiết kế",
    role: "Người yêu cầu bồi thường",
    description: "Nam bị chấn thương ở chân sau va chạm tại tầng hầm. Lời kể ban đầu chưa đề cập một người quen đứng gần lối ra."
  },

  opponent: {
    name: "Lê Văn Thành",
    age: 37,
    occupation: "Nhân viên giao hàng",
    role: "Người điều khiển xe",
    description: "Thành thừa nhận điều khiển xe nhưng cho rằng đã giảm tốc và Nam bất ngờ đi vào hướng xe."
  },

  timeline: [
    { date: "18:30", title: "Nam tìm luật sư", content: "Nam cho biết bị tai nạn ở tầng hầm chung cư An Bình và muốn yêu cầu bồi thường." },
    { date: "Ngày xảy ra tai nạn", title: "Va chạm tại tầng hầm", content: "Nam bị thương; bảo vệ chạy tới sau khi nghe tiếng phanh và tiếng va chạm." },
    { date: "Sau tai nạn", title: "Điều trị tại bệnh viện", content: "Hồ sơ y tế ghi nhận chấn thương ở chân. Một khoản trong hóa đơn chưa rõ liên quan trực tiếp đến tai nạn." },
    { date: "Sau khi thu thập lời khai", title: "Xuất hiện tình tiết bất lợi", content: "Nhân chứng cho biết Nam có thể đã đi chếch vào khu vực xe chạy; một góc camera khác cũng cần được kiểm tra." },
    { date: "Hiện tại", title: "Hai bên chưa thống nhất", content: "Thành đề nghị giảm mức bồi thường và hai bên chưa đạt thỏa thuận." }
  ],

  evidence: [
    {
      id: "E501",
      title: "Bản ghi camera tầng hầm",
      type: "Video",
      availableAtStart: true,
      importance: "high",
      content: "Camera ghi nhận Nam đi gần khu vực phương tiện di chuyển. Khoảng 4 giây sau xe của Thành xuất hiện. Góc quay không cho thấy chính xác vị trí của Nam đúng lúc va chạm; Thành dường như giảm tốc."
    },
    {
      id: "E502",
      title: "Hồ sơ y tế và hóa đơn điều trị",
      type: "Hồ sơ y tế",
      importance: "high",
      content: "Nam bị chấn thương ở chân và phải điều trị. Thời điểm nhập viện phù hợp với thời điểm tai nạn, nhưng một khoản chi phí chưa xác định rõ có liên quan trực tiếp hay không."
    },
    {
      id: "E503",
      title: "Lời khai của bảo vệ Phạm Minh Tuấn",
      type: "Lời khai",
      importance: "normal",
      content: "Tuấn nghe tiếng phanh trước tiếng va chạm. Anh đứng cách hiện trường hơn 20 mét nên lời khai cần được đối chiếu với camera."
    },
    {
      id: "E504",
      title: "Lời khai của cư dân Trần Thị Hạnh",
      type: "Lời khai",
      importance: "high",
      content: "Hạnh nói đã thấy Nam đi hơi chếch vào khu vực xe chạy. Đây là thông tin Nam không kể trong buổi gặp đầu tiên."
    },
    {
      id: "E505",
      title: "Báo cáo kỹ thuật camera",
      type: "Báo cáo kỹ thuật",
      importance: "high",
      content: "Kỹ thuật viên Võ Minh Khoa không phát hiện dấu hiệu video bị chỉnh sửa, nhưng xác nhận có vùng góc chết do cột bê tông che gần vị trí va chạm."
    },
    {
      id: "E506",
      title: "Bản giải trình của Lê Văn Thành",
      type: "Lời khai",
      importance: "normal",
      content: "Thành thừa nhận điều khiển xe và cho rằng đã giảm tốc, bóp phanh trước khi Nam bất ngờ đi vào hướng xe."
    },
    {
      id: "E507",
      title: "Đoạn camera tại lối ra",
      type: "Video",
      importance: "high",
      content: "Một góc quay khác cho thấy Nam bước ra khỏi khu vực an toàn dành cho người đi bộ. Cần đánh giá cùng vị trí góc chết và diễn biến va chạm, không thể dùng riêng đoạn này để kết luận toàn bộ lỗi."
    },
    {
      id: "E508",
      title: "Giấy xác nhận nghỉ việc và thu nhập",
      type: "Chứng từ",
      importance: "normal",
      content: "Nam nghỉ việc 12 ngày nhưng giấy xác nhận hiện chỉ chứng minh được 8 ngày. Phần còn lại cần tài liệu bổ sung."
    },
    {
      id: "E509",
      title: "Các hóa đơn điều trị",
      type: "Chứng từ",
      importance: "normal",
      content: "Hồ sơ có nhiều hóa đơn; cần phân loại từng khoản và xác minh mối liên hệ trực tiếp với chấn thương do tai nạn."
    },
    {
      id: "E510",
      title: "Biên bản phỏng vấn bổ sung với Nam",
      type: "Biên bản",
      importance: "normal",
      content: "Nam nhớ ra trước tai nạn đã thấy một người quen đứng gần lối ra nhưng ban đầu không đề cập vì nghĩ chi tiết đó không liên quan."
    }
  ],

  legalLibrary: [
    {
      id: "LAW501",
      title: "Đánh giá hành vi và mức độ lỗi",
      keywords: ["hành vi", "lỗi", "trách nhiệm"],
      content: "Cần xem xét hành vi của mỗi bên, điều kiện xảy ra sự việc và mức độ đóng góp của từng hành vi vào thiệt hại."
    },
    {
      id: "LAW502",
      title: "Thiệt hại và mối liên hệ",
      keywords: ["thiệt hại", "y tế", "thu nhập", "nhân quả"],
      content: "Từng khoản yêu cầu cần có căn cứ chứng minh và mối liên hệ phù hợp với sự việc; không mặc nhiên chấp nhận khoản chưa được xác minh."
    },
    {
      id: "LAW503",
      title: "Thương lượng trên cơ sở chứng cứ",
      keywords: ["thương lượng", "hòa giải", "chứng cứ"],
      content: "Có thể phân tách từng khoản thiệt hại và thương lượng dựa trên mức độ chứng minh, phần trách nhiệm của mỗi bên và hồ sơ hiện có."
    }
  ],

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

  questions: [
    {
      id: "Q501",
      title: "Xác định vấn đề cần chứng minh",
      situation: "Nam bị thương nhưng chưa chắc Thành chịu toàn bộ lỗi. Luật sư cần định hướng hồ sơ thế nào?",
      choices: [
        { id: "A", text: "Mặc định Thành phải chịu toàn bộ lỗi.", effects: { legalAnalysis: 2, argument: 2 } },
        { id: "B", text: "Xác định hành vi của mỗi bên và mức độ liên quan đến thiệt hại.", effects: { legalAnalysis: 10, caseUnderstanding: 10 } },
        { id: "C", text: "Nam bị thương nên Thành phải trả mọi khoản.", effects: { legalAnalysis: 1 } },
        { id: "D", text: "Chỉ cần xác định ai điều khiển xe.", effects: { legalAnalysis: 3, caseUnderstanding: 2 } }
      ]
    },
    {
      id: "Q502",
      title: "Khoảnh khắc va chạm",
      situation: "Camera không ghi rõ vị trí của hai người đúng lúc va chạm.",
      choices: [
        { id: "A", text: "Kết luận Thành có lỗi chỉ từ việc xe xuất hiện.", effects: { legalAnalysis: 1 } },
        { id: "B", text: "Đối chiếu camera với lời khai nhân chứng và lời giải trình của Thành.", effects: { evidence: 10, caseUnderstanding: 10 }, unlocks: ["E503", "E506"] },
        { id: "C", text: "Bỏ qua camera vì hình ảnh không đầy đủ.", effects: { evidence: -3 } },
        { id: "D", text: "Chỉ tin lời kể ban đầu của Nam.", effects: { clientTrust: 2, evidence: -2 } }
      ]
    },
    {
      id: "Q503",
      title: "Thông tin bất lợi từ nhân chứng",
      situation: "Hạnh cho biết Nam có thể đã đi chếch vào khu vực xe chạy, trái với bức tranh ban đầu của khách hàng.",
      choices: [
        { id: "A", text: "Bỏ lời khai vì bất lợi cho khách hàng.", effects: { legalAnalysis: -5, evidence: -5 } },
        { id: "B", text: "Xác minh lời khai và đánh giá phần lỗi có thể thuộc về Nam.", effects: { legalAnalysis: 10, evidence: 10 }, unlocks: ["E504", "E507"] },
        { id: "C", text: "Cho rằng nhân chứng chắc chắn nói sai.", effects: { evidence: -3 } },
        { id: "D", text: "Nhận toàn bộ lỗi thay Nam để kết thúc nhanh.", effects: { argument: -5, clientTrust: -2 } }
      ]
    },
    {
      id: "Q504",
      title: "Thiệt hại sức khỏe",
      situation: "Nam đưa nhiều hóa đơn điều trị, nhưng một số khoản chưa rõ nguyên nhân.",
      choices: [
        { id: "A", text: "Đưa toàn bộ hóa đơn vào yêu cầu mà không phân loại.", effects: { evidence: 2 } },
        { id: "B", text: "Phân loại từng khoản và xác minh mối liên hệ với tai nạn.", effects: { evidence: 10, legalAnalysis: 8 }, unlocks: ["E502", "E509"] },
        { id: "C", text: "Bỏ toàn bộ hóa đơn vì khó xác minh.", effects: { evidence: -5 } },
        { id: "D", text: "Tự ước tính một con số thay cho chứng từ.", effects: { evidence: -3, argument: -3 } }
      ]
    },
    {
      id: "Q505",
      title: "Mất thu nhập",
      situation: "Nam nghỉ việc 12 ngày nhưng giấy xác nhận hiện mới chứng minh được 8 ngày.",
      choices: [
        { id: "A", text: "Yêu cầu bồi thường đủ 12 ngày dù thiếu chứng cứ.", effects: { argument: 2, evidence: -3 } },
        { id: "B", text: "Yêu cầu phần đã chứng minh và tìm thêm tài liệu cho phần còn lại.", effects: { evidence: 10, argument: 8 }, unlocks: ["E508"] },
        { id: "C", text: "Bỏ toàn bộ yêu cầu mất thu nhập.", effects: { argument: -3 } },
        { id: "D", text: "Tự lập giấy xác nhận cho đủ 12 ngày.", effects: { evidence: -10, procedure: -10 } }
      ]
    },
    {
      id: "Q506",
      title: "Đánh giá lời khai của bảo vệ",
      situation: "Tuấn nghe tiếng phanh trước va chạm nhưng đứng cách hiện trường hơn 20 mét.",
      choices: [
        { id: "A", text: "Tin lời khai tuyệt đối.", effects: { evidence: 2 } },
        { id: "B", text: "Dùng lời khai như chứng cứ hỗ trợ và đối chiếu với dữ liệu khác.", effects: { evidence: 10, legalAnalysis: 8 }, unlocks: ["E503"] },
        { id: "C", text: "Cho rằng lời khai không có giá trị vì đứng xa.", effects: { evidence: -3 } },
        { id: "D", text: "Cáo buộc bảo vệ nói dối khi chưa xác minh.", effects: { argument: -2, procedure: -2 } }
      ]
    },
    {
      id: "Q507",
      title: "Góc chết camera",
      situation: "Kỹ thuật viên xác nhận có góc chết gần vị trí va chạm, dù video không bị chỉnh sửa.",
      choices: [
        { id: "A", text: "Loại bỏ toàn bộ camera khỏi hồ sơ.", effects: { evidence: -3 } },
        { id: "B", text: "Dùng camera để xác định phần nhìn thấy được và bổ sung bằng chứng cứ khác cho vùng khuất.", effects: { evidence: 10, legalAnalysis: 8 }, unlocks: ["E505"] },
        { id: "C", text: "Cho rằng góc chết chứng minh Thành có lỗi.", effects: { legalAnalysis: 1 } },
        { id: "D", text: "Cho rằng góc chết chứng minh Nam có lỗi.", effects: { legalAnalysis: 1 } }
      ]
    },
    {
      id: "Q508",
      title: "Nam tiết lộ tình tiết còn thiếu",
      situation: "Nam nhớ ra đã thấy một người quen gần lối ra trước tai nạn, nhưng không kể trong buổi gặp đầu tiên.",
      choices: [
        { id: "A", text: "Yêu cầu Nam kể đầy đủ và xác minh người đó có liên quan không.", effects: { caseUnderstanding: 10, clientTrust: 5, procedure: 4 }, unlocks: ["E510"] },
        { id: "B", text: "Bỏ qua vì Nam cho rằng chuyện đó không liên quan.", effects: { caseUnderstanding: -5 } },
        { id: "C", text: "Tự suy đoán người quen đó là nguyên nhân vụ tai nạn.", effects: { legalAnalysis: -4, argument: -3 } },
        { id: "D", text: "Trách Nam đã không nói sớm và dừng trao đổi.", effects: { clientTrust: -8, caseUnderstanding: -3 } }
      ]
    },
    {
      id: "Q509",
      title: "Chứng cứ bất lợi xuất hiện",
      situation: "Đoạn camera tại lối ra cho thấy Nam có thể đã bước khỏi khu vực an toàn. Nam hỏi liệu mình còn cơ hội hay không.",
      choices: [
        { id: "A", text: "Nói rõ phần rủi ro và xây dựng yêu cầu trên cơ sở toàn bộ chứng cứ.", effects: { legalAnalysis: 8, argument: 8, clientTrust: 10 }, unlocks: ["E507"] },
        { id: "B", text: "Giấu đoạn video để Nam không lo lắng.", effects: { clientTrust: -10, legalAnalysis: -5, procedure: -5 } },
        { id: "C", text: "Nói Nam chắc chắn thua vì có thể có lỗi.", effects: { clientTrust: -8, argument: -5 } },
        { id: "D", text: "Bỏ qua video vì nó làm yếu yêu cầu.", effects: { evidence: -6, legalAnalysis: -4 } }
      ]
    },
    {
      id: "Q510",
      title: "Phản biện và thương lượng",
      situation: "Thành nói đã giảm tốc và Nam bất ngờ đi vào hướng xe; Thành chỉ muốn trả một phần chi phí điều trị.",
      choices: [
        { id: "A", text: "Phủ nhận toàn bộ lời giải trình và từ chối mọi thương lượng.", effects: { argument: 2, procedure: -3 } },
        { id: "B", text: "Đối chiếu hành vi hai bên, phân tách thiệt hại có căn cứ và thương lượng theo chứng cứ.", effects: { argument: 10, legalAnalysis: 10, procedure: 10 },         unlocks: [] },
        { id: "C", text: "Chấp nhận mọi điều kiện dù chưa biết khoản nào được thanh toán.", effects: { clientTrust: -3, argument: -3 } },
        { id: "D", text: "Đe dọa Thành để buộc chấp nhận toàn bộ yêu cầu.", effects: { procedure: -10, argument: -5 } }
      ]
    }
  ],

  finalDefense: {
    title: "Chọn 3 luận điểm mạnh nhất",
    instruction: "Không có đáp án hiện ngay. Sau khi kết thúc, hệ thống mới đánh giá toàn bộ cách bạn xử lý vụ án.",
    minimumSelection: 0,
    selectionLimit: 3,
    selectionScoring: {
      positiveIds: ["ARG_1", "ARG_2", "ARG_4", "ARG_5", "ARG_7", "ARG_8"],
      negativeIds: ["ARG_3", "ARG_6"],
      positiveBonus: 8,
      negativePenalty: 12
    },
    arguments: [
      {
        id: "ARG_1",
        text: "Thành có hành vi điều khiển phương tiện và đã xảy ra va chạm.",
        tags: ["Trách nhiệm"],
        effects: { legalAnalysis: 5, evidence: 5, argument: 5 }
      },
      {
        id: "ARG_2",
        text: "Nam có thiệt hại sức khỏe được hồ sơ y tế chứng minh.",
        tags: ["Thiệt hại"],
        effects: { evidence: 7, legalAnalysis: 5, caseUnderstanding: 4 }
      },
      {
        id: "ARG_3",
        text: "Nam chắc chắn không có bất kỳ lỗi nào.",
        tags: ["Kết luận tuyệt đối"],
        effects: { legalAnalysis: -6, evidence: -5, argument: -6 }
      },
      {
        id: "ARG_4",
        text: "Camera có góc chết nên phải được đánh giá cùng chứng cứ khác.",
        tags: ["Đánh giá chứng cứ"],
        effects: { evidence: 7, legalAnalysis: 5, caseUnderstanding: 5 }
      },
      {
        id: "ARG_5",
        text: "Lời khai nhân chứng cần được đối chiếu với vị trí và camera.",
        tags: ["Đánh giá chứng cứ"],
        effects: { evidence: 7, legalAnalysis: 5, caseUnderstanding: 5 }
      },
      {
        id: "ARG_6",
        text: "Tất cả các khoản chi phí Nam yêu cầu đều đương nhiên hợp lệ.",
        tags: ["Yêu cầu thiếu căn cứ"],
        effects: { legalAnalysis: -5, evidence: -6, argument: -5 }
      },
      {
        id: "ARG_7",
        text: "Cần đánh giá cả phần lỗi có thể thuộc về Nam.",
        tags: ["Phân tích lỗi"],
        effects: { legalAnalysis: 7, evidence: 5, argument: 5, clientTrust: 2 }
      },
      {
        id: "ARG_8",
        text: "Thiệt hại phải được chứng minh và phân loại từng khoản.",
        tags: ["Thiệt hại"],
        effects: { legalAnalysis: 6, evidence: 7, procedure: 4, argument: 4 }
      }
    ]
  },

  endings: [
    { id: "ENDING_501", range: [0, 9], title: "Hồ sơ thất bại", type: "LOSE", description: "Hồ sơ bỏ qua nhiều chứng cứ quan trọng và không xác định được mối liên hệ giữa hành vi với thiệt hại.", rewardMultiplier: 0, reputation: -20 },
    { id: "ENDING_502", range: [10, 49], title: "Yêu cầu không được chấp nhận", type: "LOSE", description: "Lập luận còn điểm yếu; việc không xử lý phần lỗi có thể thuộc về Nam khiến yêu cầu bị phản bác.", rewardMultiplier: 0, reputation: -10 },
    { id: "ENDING_503", range: [50, 89], title: "Thỏa thuận một phần", type: "SETTLEMENT", description: "Hai bên đạt phương án giải quyết một phần tranh chấp; mức trách nhiệm và thiệt hại còn phụ thuộc chất lượng chứng cứ.", rewardMultiplier: 0.6, reputation: 5 },
    { id: "ENDING_504", range: [90, 100], title: "Bảo vệ thành công quyền lợi khách hàng", type: "WIN", description: "Hồ sơ chứng minh thiệt hại có căn cứ và chủ động xử lý các điểm bất lợi, giúp xác định trách nhiệm dựa trên toàn bộ chứng cứ.", rewardMultiplier: 1.2, reputation: 20 }
  ],

  calculateScore(stats) {
    var weights = {
      legalAnalysis: 0.25,
      evidence: 0.25,
      procedure: 0.15,
      argument: 0.15,
      caseUnderstanding: 0.15,
      clientTrust: 0.05
    };
    var score = 0;
    Object.keys(weights).forEach(function (key) {
      score += Math.max(0, Math.min(100, Number(stats[key]) || 0)) * weights[key];
    });
    return Math.round(Math.max(0, Math.min(100, score)));
  },

  resolveEnding(score, random) {
    if (score < 10) return "ENDING_501";
    if (score < 50) return "ENDING_502";
    if (score >= 90) return "ENDING_504";
    return random < score / 100 ? "ENDING_504" : "ENDING_503";
  }
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_005);
