"use strict";

var CASE_004 = {
  id: "CASE_004",
  title: "Tranh chấp hợp đồng cung cấp thiết bị cho chuỗi cửa hàng",
  type: "Thương mại - Hợp đồng",
  difficulty: 6,
  reward: 5200000,
  exp: 380,

  description: `
Khách hàng là chủ một doanh nghiệp chuyên phân phối thiết bị điện tử.
Công ty đã ký hợp đồng cung cấp 300 bộ thiết bị cho một chuỗi cửa hàng.

Sau khi giao hàng, bên mua cho rằng một phần hàng hóa không đạt yêu cầu
và từ chối thanh toán số tiền còn lại.

Bên bán cho rằng hàng hóa đã được kiểm tra khi nhận và bên mua chỉ đưa ra
khiếu nại sau khi đã sử dụng một thời gian.

Nhiệm vụ của luật sư là xác định:
- Nghĩa vụ của mỗi bên theo hợp đồng.
- Hàng hóa có thực sự không phù hợp hay không.
- Thời điểm và cách thức khiếu nại.
- Giá trị của biên bản giao nhận, kiểm định và email trao đổi.
- Bên nào có cơ sở yêu cầu thanh toán hoặc bồi thường.
`,

  client: {
    name: "Trần Hoàng Nam",
    age: 36,
    occupation: "Giám đốc Công ty TNHH Thiết bị Minh Phát",
    role: "Bên bán"
  },

  opponent: {
    name: "Võ Thanh Hà",
    age: 42,
    occupation: "Giám đốc Công ty CP Retail Home",
    role: "Bên mua"
  },

  company: {
    name: "Công ty TNHH Thiết bị Minh Phát",
    business: "Phân phối thiết bị điện tử",
    employees: 47
  },

  timeline: [
    { date: "03/07", event: "Minh Phát và Retail Home ký hợp đồng cung cấp 300 bộ thiết bị điện tử." },
    { date: "05/07", event: "Retail Home chuyển khoản tiền đặt cọc 30% giá trị hợp đồng." },
    { date: "18/07", event: "Minh Phát giao đợt hàng đầu tiên gồm 150 bộ thiết bị." },
    { date: "19/07", event: "Hai bên ký biên bản giao nhận. Retail Home xác nhận đã nhận đủ số lượng." },
    { date: "25/07", event: "150 bộ còn lại được giao." },
    { date: "26/07", event: "Retail Home tiếp tục ký biên bản xác nhận số lượng hàng hóa." },
    { date: "02/08", event: "Retail Home bắt đầu đưa thiết bị vào sử dụng tại các cửa hàng." },
    { date: "14/08", event: "Retail Home thông báo một số thiết bị hoạt động không ổn định." },
    { date: "16/08", event: "Minh Phát cử kỹ thuật viên đến kiểm tra." },
    { date: "18/08", event: "Kỹ thuật viên ghi nhận 11 thiết bị có lỗi." },
    { date: "20/08", event: "Retail Home tuyên bố tạm ngừng thanh toán phần tiền còn lại." },
    { date: "22/08", event: "Minh Phát yêu cầu Retail Home thanh toán theo hợp đồng." },
    { date: "25/08", event: "Retail Home gửi văn bản yêu cầu giảm giá và bồi thường chi phí." },
    { date: "29/08", event: "Hai bên không đạt được thỏa thuận." },
    { date: "02/09", event: "Minh Phát thuê luật sư." }
  ],

  evidence: [
    { id: "E401", name: "Hợp đồng cung cấp thiết bị", description: "Quy định số lượng, tiêu chuẩn hàng hóa, thanh toán, kiểm tra và xử lý vi phạm." },
    { id: "E402", name: "Phụ lục kỹ thuật", description: "Quy định thông số kỹ thuật của 300 bộ thiết bị." },
    { id: "E403", name: "Ủy nhiệm chi tiền đặt cọc", description: "Thể hiện Retail Home đã thanh toán 30% giá trị hợp đồng." },
    { id: "E404", name: "Biên bản giao nhận đợt 1", description: "Retail Home xác nhận đã nhận đủ 150 bộ thiết bị." },
    { id: "E405", name: "Biên bản giao nhận đợt 2", description: "Retail Home tiếp tục xác nhận số lượng hàng hóa." },
    { id: "E406", name: "Biên bản kiểm tra ngày 18/08", description: "Ghi nhận 11 thiết bị có lỗi trong tổng số thiết bị được kiểm tra." },
    { id: "E407", name: "Báo cáo kỹ thuật của Minh Phát", description: "Kết quả kiểm tra nguyên nhân lỗi của thiết bị." },
    { id: "E408", name: "Email khiếu nại của Retail Home", description: "Thông báo lỗi và yêu cầu tạm ngừng thanh toán." },
    { id: "E409", name: "Hình ảnh thiết bị lỗi", description: "Hình ảnh do Retail Home cung cấp." },
    { id: "E410", name: "Biên bản kiểm định độc lập", description: "Kết quả kiểm tra của đơn vị kiểm định độc lập." },
    { id: "E411", name: "Email trao đổi giữa hai bên", description: "Trao đổi về việc xử lý các thiết bị bị lỗi." },
    { id: "E412", name: "Hóa đơn bán hàng", description: "Chứng từ thể hiện giá trị hàng hóa được giao." },
    { id: "E413", name: "Điều khoản bảo hành", description: "Quy định trách nhiệm xử lý lỗi kỹ thuật trong thời gian bảo hành." },
    { id: "E414", name: "Báo cáo sử dụng thiết bị", description: "Thể hiện thời gian và tình trạng sử dụng thiết bị tại các cửa hàng." }
  ],

  legalLibrary: [
    {
      id: "LAW401",
      title: "Nghĩa vụ giao hàng",
      content: `
Bên bán phải giao hàng phù hợp với thỏa thuận về số lượng,
chất lượng và các tiêu chuẩn được xác định trong hợp đồng.
`
    },
    {
      id: "LAW402",
      title: "Kiểm tra hàng hóa",
      content: `
Việc kiểm tra và xác nhận hàng hóa khi giao nhận là một căn cứ
quan trọng để đánh giá quá trình thực hiện hợp đồng.
`
    },
    {
      id: "LAW403",
      title: "Khiếu nại về hàng hóa",
      content: `
Việc khiếu nại cần được xem xét cùng với thời điểm phát hiện lỗi,
thỏa thuận trong hợp đồng và các chứng cứ liên quan.
`
    },
    {
      id: "LAW404",
      title: "Bảo hành",
      content: `
Nếu hợp đồng có điều khoản bảo hành, cần phân biệt lỗi thuộc
phạm vi bảo hành với lỗi do sử dụng hoặc nguyên nhân khác.
`
    },
    {
      id: "LAW405",
      title: "Biên bản giao nhận",
      content: `
Biên bản giao nhận là một nguồn chứng cứ quan trọng để xác định
số lượng, tình trạng và việc tiếp nhận hàng hóa.
`
    },
    {
      id: "LAW406",
      title: "Kiểm định độc lập",
      content: `
Kết quả kiểm định độc lập có thể được sử dụng để đánh giá nguyên nhân
và mức độ lỗi, nhưng cần xem xét phương pháp và phạm vi kiểm định.
`
    }
  ],

  mechanicsVersion: 3,

  finalArguments: [
    {
      id: "claim-undisputed-balance",
      title: "Yêu cầu thanh toán phần hàng phù hợp, xử lý riêng hàng lỗi",
      rationale: "Đối chiếu số lượng đã nhận, phạm vi 11 thiết bị và kết quả kiểm định để xác định khoản thanh toán không tranh chấp.",
      tradeoff: "Lập luận cân bằng và bám chứng cứ nhưng không bảo đảm thu ngay toàn bộ phần tiền còn lại.",
      requiresEvidence: ["E401", "E404", "E405", "E406", "E410", "E412"],
      requiresLaw: ["LAW402", "LAW403", "LAW406"],
      effects: { legalAnalysis: 9, evidence: 10, procedure: 7, argument: 8, caseUnderstanding: 9, clientTrust: 3 }
    },
    {
      id: "warranty-and-settlement",
      title: "Đề xuất bảo hành/đổi thiết bị và chốt phần còn lại",
      rationale: "Dùng điều khoản bảo hành, email hai bên và dữ liệu sử dụng để khắc phục thiết bị lỗi, đồng thời thương lượng thanh toán phần hàng đạt chuẩn.",
      tradeoff: "Có thể giữ quan hệ thương mại và rút ngắn tranh chấp nhưng công ty phải nhận chi phí xử lý một phần hàng.",
      requiresEvidence: ["E408", "E410", "E411", "E413", "E414"],
      requiresLaw: ["LAW403", "LAW404"],
      effects: { legalAnalysis: 7, evidence: 8, procedure: 8, argument: 6, caseUnderstanding: 8, clientTrust: 7 }
    },
    {
      id: "reject-broad-damages",
      title: "Phản đối yêu cầu bồi thường vượt quá lỗi đã chứng minh",
      rationale: "Phân biệt phần hàng có lỗi và không lỗi; yêu cầu Retail Home chứng minh thiệt hại, nguyên nhân và quan hệ với từng thiết bị.",
      tradeoff: "Bảo vệ nghĩa vụ thanh toán của bên mua nhưng nếu báo cáo kỹ thuật của bên bán thiếu độc lập, lập luận có thể phản tác dụng.",
      requiresEvidence: ["E406", "E407", "E409", "E410"],
      requiresLaw: ["LAW401", "LAW406"],
      effects: { legalAnalysis: 8, evidence: 8, procedure: 6, argument: 9, caseUnderstanding: 7, clientTrust: 1 }
    },
    {
      id: "defer-conclusion",
      title: "Chưa đủ căn cứ để chốt yêu cầu thanh toán",
      rationale: "Thừa nhận rằng hồ sơ hiện chưa đủ chứng cứ để khẳng định phạm vi hàng đạt chuẩn hoặc mức thiệt hại; đề nghị bổ sung tài liệu trước khi chốt yêu cầu.",
      tradeoff: "Tránh yêu cầu vượt quá căn cứ nhưng chưa bảo vệ được quyền thu hồi công nợ của Minh Phát.",
      effects: { legalAnalysis: -8, evidence: -8, procedure: -8, argument: -8, caseUnderstanding: -8, clientTrust: -5 }
    }
  ],

  questions: [
    {
      id: "Q401",
      text: `
Trước tiên luật sư cần xác định điều gì trong tranh chấp này?
`,
      choices: [
        { id: "A", text: "Retail Home có đủ tiền để thanh toán hay không.", effects: { caseUnderstanding: 3 } },
        {
          id: "B",
          text: "Nghĩa vụ giao hàng, tiêu chuẩn hàng hóa và cơ chế xử lý lỗi trong hợp đồng.",
          effects: { legalAnalysis: 13, caseUnderstanding: 12 },
          unlock: ["E401", "E402"]
        },
        { id: "C", text: "Yêu cầu Retail Home thanh toán ngay toàn bộ.", effects: { argument: 4 } },
        { id: "D", text: "Tập trung vào việc có bao nhiêu cửa hàng đang sử dụng thiết bị.", effects: { evidence: 3 } }
      ]
    },
    {
      id: "Q402",
      text: `
Retail Home đã ký biên bản nhận đủ số lượng hàng.
Điều này có ý nghĩa gì?
`,
      choices: [
        { id: "A", text: "Chứng minh chắc chắn toàn bộ hàng hóa không có lỗi.", effects: { argument: 4 } },
        {
          id: "B",
          text: "Là chứng cứ quan trọng về việc giao nhận và số lượng, nhưng cần xem xét riêng vấn đề chất lượng.",
          effects: { evidence: 13, legalAnalysis: 9 },
          unlock: ["E404", "E405"]
        },
        { id: "C", text: "Khi đã ký thì bên mua không thể khiếu nại nữa.", effects: { legalAnalysis: 2 } },
        { id: "D", text: "Biên bản giao nhận không có giá trị.", effects: { evidence: 1 } }
      ]
    },
    {
      id: "Q403",
      text: `
Retail Home báo có 11 thiết bị lỗi.
Luật sư nên làm gì?
`,
      choices: [
        { id: "A", text: "Bác bỏ toàn bộ khiếu nại.", effects: { argument: 3 } },
        {
          id: "B",
          text: "Xác định lỗi, nguyên nhân lỗi và phạm vi thiết bị bị ảnh hưởng.",
          effects: { evidence: 13, legalAnalysis: 11, caseUnderstanding: 9 },
          unlock: ["E406", "E407", "E409"]
        },
        { id: "C", text: "Yêu cầu khách hàng nhận lại toàn bộ hàng.", effects: { argument: 3 } },
        { id: "D", text: "Chỉ quan tâm đến giá trị 11 thiết bị.", effects: { evidence: 5 } }
      ]
    },
    {
      id: "Q404",
      text: `
Một báo cáo kỹ thuật cho rằng lỗi có thể xuất phát từ điều kiện
vận hành tại cửa hàng.
Cách xử lý phù hợp nhất là gì?
`,
      choices: [
        { id: "A", text: "Sử dụng báo cáo ngay làm bằng chứng quyết định.", effects: { evidence: 6 } },
        {
          id: "B",
          text: "Đối chiếu báo cáo với điều kiện bảo hành, dữ liệu sử dụng và kiểm định độc lập.",
          effects: { evidence: 14, legalAnalysis: 12, argument: 9 },
          unlock: ["E410", "E413", "E414"]
        },
        { id: "C", text: "Bỏ qua vì báo cáo do bên bán lập.", effects: { evidence: 2 } },
        { id: "D", text: "Cho rằng Retail Home cố tình làm hỏng thiết bị.", effects: { argument: 2 } }
      ]
    },
    {
      id: "Q405",
      text: `
Retail Home tạm ngừng thanh toán phần tiền còn lại.
Luật sư cần kiểm tra gì?
`,
      choices: [
        { id: "A", text: "Chỉ kiểm tra số tiền còn thiếu.", effects: { evidence: 3 } },
        {
          id: "B",
          text: "Kiểm tra điều khoản thanh toán và quyền của mỗi bên khi xảy ra vi phạm.",
          effects: { legalAnalysis: 13, procedure: 9 },
          unlock: ["E401", "E412"]
        },
        { id: "C", text: "Cho rằng bên mua chắc chắn vi phạm.", effects: { argument: 3 } },
        { id: "D", text: "Yêu cầu phạt ngay lập tức.", effects: { procedure: 3 } }
      ]
    },
    {
      id: "Q406",
      text: `
Kiểm định độc lập cho thấy 7 thiết bị có lỗi kỹ thuật,
4 thiết bị còn lại không phát hiện lỗi.
Điều này ảnh hưởng thế nào đến hồ sơ?
`,
      choices: [
        { id: "A", text: "Retail Home chắc chắn đúng toàn bộ.", effects: { argument: 4 } },
        {
          id: "B",
          text: "Cần phân biệt phần hàng có lỗi và phần hàng không có lỗi khi xác định trách nhiệm.",
          effects: { evidence: 14, legalAnalysis: 12, caseUnderstanding: 11 },
          unlock: ["E410"]
        },
        { id: "C", text: "Minh Phát chắc chắn không phải chịu trách nhiệm.", effects: { argument: 3 } },
        { id: "D", text: "Hủy toàn bộ hợp đồng ngay.", effects: { procedure: 2 } }
      ]
    },
    {
      id: "Q407",
      text: `
Điều khoản bảo hành quy định bên bán phải sửa chữa hoặc thay thế
thiết bị lỗi trong thời hạn nhất định.
Luật sư nên đánh giá thế nào?
`,
      choices: [
        { id: "A", text: "Bảo hành đồng nghĩa bên mua được ngừng mọi khoản thanh toán.", effects: { legalAnalysis: 3 } },
        {
          id: "B",
          text: "Cần xác định lỗi có thuộc phạm vi bảo hành và nghĩa vụ thanh toán có được điều chỉnh hay không.",
          effects: { legalAnalysis: 14, argument: 11, caseUnderstanding: 10 },
          unlock: ["E411", "E413"]
        },
        { id: "C", text: "Điều khoản bảo hành không liên quan.", effects: { legalAnalysis: 1 } },
        { id: "D", text: "Bên bán phải hoàn tiền toàn bộ.", effects: { argument: 3 } }
      ]
    },
    {
      id: "Q408",
      text: `
Retail Home gửi email khiếu nại ngày 14/08,
trong khi thiết bị được đưa vào sử dụng từ ngày 02/08.
Luật sư cần làm gì?
`,
      choices: [
        { id: "A", text: "Cho rằng khiếu nại chắc chắn hợp lệ.", effects: { argument: 3 } },
        {
          id: "B",
          text: "Đối chiếu thời điểm phát hiện lỗi với điều khoản kiểm tra và khiếu nại trong hợp đồng.",
          effects: { legalAnalysis: 13, procedure: 12, evidence: 10 },
          unlock: ["E408", "E401"]
        },
        { id: "C", text: "Bỏ qua vì thời gian chỉ chênh lệch 12 ngày.", effects: { procedure: 2 } },
        { id: "D", text: "Yêu cầu Retail Home hủy khiếu nại.", effects: { argument: 2 } }
      ]
    },
    {
      id: "Q409",
      text: `
Sau khi tổng hợp hồ sơ, hướng lập luận nào phù hợp nhất để bảo vệ Minh Phát?
`,
      choices: [
        { id: "A", text: "Chỉ dựa vào biên bản giao nhận.", effects: { argument: 5 } },
        {
          id: "B",
          text: `Kết hợp hợp đồng, biên bản giao nhận, kiểm định, điều khoản bảo hành,
thời điểm khiếu nại và phạm vi thiết bị thực sự có lỗi.`,
          effects: { legalAnalysis: 15, evidence: 15, argument: 14, caseUnderstanding: 14 }
        },
        { id: "C", text: "Cho rằng Retail Home cố tình không trả tiền.", effects: { argument: 3 } },
        { id: "D", text: "Yêu cầu thanh toán toàn bộ mà không cần xét lỗi.", effects: { argument: 2 } }
      ]
    }
  ],

  endings: [
    { id: "ENDING_401", range: [0, 9], title: "Hồ sơ thất bại", result: "THUA", description: "Luật sư không xác định được trọng tâm của tranh chấp." },
    { id: "ENDING_402", range: [10, 29], title: "Chứng cứ yếu", result: "THUA", description: "Hồ sơ còn thiếu các chứng cứ quan trọng về chất lượng hàng hóa." },
    { id: "ENDING_403", range: [30, 49], title: "Lập luận chưa đủ", result: "THUA", description: "Một số lập luận có cơ sở nhưng chưa đủ sức bảo vệ khách hàng." },
    { id: "ENDING_404", range: [50, 59], title: "Kết quả khó đoán", result: "RANDOM", description: "Hai bên đều có những chứng cứ có giá trị." },
    { id: "ENDING_405", range: [60, 69], title: "Có lợi thế", result: "RANDOM", description: "Hồ sơ có nhiều điểm thuận lợi nhưng vẫn còn tranh chấp về trách nhiệm." },
    { id: "ENDING_406", range: [70, 79], title: "Chiếm ưu thế", result: "RANDOM", description: "Chiến lược pháp lý và chứng cứ tương đối chặt chẽ." },
    { id: "ENDING_407", range: [80, 89], title: "Bảo vệ tốt quyền lợi", result: "RANDOM", description: "Luật sư xử lý tốt vấn đề hợp đồng, chứng cứ và trách nhiệm bảo hành." },
    { id: "ENDING_408", range: [90, 100], title: "Thắng kiện", result: "WIN", description: "Luật sư xây dựng được lập luận toàn diện dựa trên hợp đồng và chứng cứ." }
  ],

  calculateScore(stats) {
    const weights = {
      legalAnalysis: 0.25,
      evidence: 0.20,
      procedure: 0.20,
      argument: 0.15,
      caseUnderstanding: 0.15,
      clientTrust: 0.05
    };

    let score = 0;
    for (const key in weights) {
      const value = Math.max(0, Math.min(stats[key] || 0, 100));
      score += value * weights[key];
    }
    return Math.round(Math.max(0, Math.min(score, 100)));
  },

  resolveEnding(score, random = Math.random()) {
    if (score < 10) return "ENDING_401";
    if (score < 50) return "ENDING_402";
    if (score >= 90) return "ENDING_408";

    const winChance = score / 100;
    if (random <= winChance) {
      if (score >= 80) return "ENDING_407";
      if (score >= 70) return "ENDING_406";
      return "ENDING_405";
    }
    if (score >= 60) return "ENDING_404";
    return "ENDING_403";
  }
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_004);
