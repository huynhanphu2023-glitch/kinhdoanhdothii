const CASE_003 = {
  id: "CASE_003",
  title: "Tranh chấp chuyển nhượng phần vốn góp và quyền biểu quyết",
  type: "Doanh nghiệp - Công ty TNHH",
  difficulty: 5,
  reward: 4500000,
  exp: 320,

  description: `
Khách hàng là một thành viên của công ty TNHH hai thành viên.
Sau khi xảy ra mâu thuẫn với thành viên còn lại, khách hàng cho rằng
phần vốn góp của mình đã được chuyển nhượng hợp lệ cho một người khác.

Tuy nhiên, công ty từ chối ghi nhận người nhận chuyển nhượng là thành viên
và vẫn tổ chức các cuộc họp, biểu quyết dựa trên cơ cấu thành viên cũ.

Nhiệm vụ của luật sư là xác định:
- Việc chuyển nhượng có được thực hiện đúng hay không.
- Ai có quyền nhận phần vốn góp.
- Công ty có nghĩa vụ ghi nhận thay đổi hay không.
- Các nghị quyết được thông qua sau đó có bị ảnh hưởng hay không.
`,

  client: {
    name: "Phạm Gia Minh",
    age: 34,
    occupation: "Nhà đầu tư",
    role: "Thành viên công ty"
  },

  opponent: {
    name: "Nguyễn Quốc Thành",
    age: 39,
    occupation: "Giám đốc công ty",
    role: "Thành viên còn lại"
  },

  company: {
    name: "Công ty TNHH Công nghệ Sao Việt",
    members: 2,
    charterCapital: 6000000000,
    business: "Phần mềm và dịch vụ công nghệ"
  },

  timeline: [
    {
      date: "05/06",
      event: "Gia Minh và Quốc Thành thành lập Công ty TNHH Công nghệ Sao Việt."
    },
    {
      date: "05/06",
      event: "Gia Minh góp 2,4 tỷ đồng, tương đương 40% vốn điều lệ. Quốc Thành góp 3,6 tỷ đồng, tương đương 60%."
    },
    {
      date: "18/09",
      event: "Hai bên xảy ra tranh chấp về định hướng kinh doanh và phân chia lợi nhuận."
    },
    {
      date: "25/09",
      event: "Gia Minh thông báo muốn chuyển nhượng toàn bộ phần vốn góp của mình."
    },
    {
      date: "27/09",
      event: "Gia Minh gửi email cho Quốc Thành đề nghị mua lại phần vốn góp trong thời hạn theo thỏa thuận."
    },
    {
      date: "10/10",
      event: "Quốc Thành trả lời rằng chưa đồng ý mua lại vì cho rằng giá chuyển nhượng quá cao."
    },
    {
      date: "12/10",
      event: "Gia Minh ký hợp đồng chuyển nhượng phần vốn góp cho Lê Hoàng Nam với giá 2,7 tỷ đồng."
    },
    {
      date: "13/10",
      event: "Nam chuyển 2,7 tỷ đồng vào tài khoản của Gia Minh."
    },
    {
      date: "15/10",
      event: "Gia Minh gửi hồ sơ đề nghị công ty ghi nhận Nam là thành viên mới."
    },
    {
      date: "17/10",
      event: "Quốc Thành từ chối và cho rằng Gia Minh chưa được quyền bán vốn cho người ngoài."
    },
    {
      date: "20/10",
      event: "Công ty tổ chức cuộc họp thành viên và thông qua nghị quyết tăng vốn."
    },
    {
      date: "23/10",
      event: "Gia Minh phát hiện nghị quyết tăng vốn làm thay đổi đáng kể tỷ lệ sở hữu của mình."
    },
    {
      date: "25/10",
      event: "Gia Minh thuê luật sư."
    }
  ],

  evidence: [
    {
      id: "E301",
      name: "Điều lệ Công ty Sao Việt",
      description: "Quy định về thành viên, chuyển nhượng vốn và quyền biểu quyết."
    },
    {
      id: "E302",
      name: "Giấy chứng nhận đăng ký doanh nghiệp",
      description: "Thể hiện công ty có hai thành viên và vốn điều lệ 6 tỷ đồng."
    },
    {
      id: "E303",
      name: "Sổ đăng ký thành viên",
      description: "Vẫn ghi Gia Minh và Quốc Thành là hai thành viên."
    },
    {
      id: "E304",
      name: "Hợp đồng chuyển nhượng vốn",
      description: "Gia Minh chuyển toàn bộ phần vốn góp cho Lê Hoàng Nam."
    },
    {
      id: "E305",
      name: "Ủy nhiệm chi 2,7 tỷ đồng",
      description: "Thể hiện Nam đã thanh toán cho Gia Minh."
    },
    {
      id: "E306",
      name: "Email đề nghị mua phần vốn góp",
      description: "Gia Minh gửi cho Quốc Thành trước khi bán cho Nam."
    },
    {
      id: "E307",
      name: "Email trả lời của Quốc Thành",
      description: "Quốc Thành không đồng ý mua với mức giá được đề nghị."
    },
    {
      id: "E308",
      name: "Biên bản họp thành viên ngày 20/10",
      description: "Biên bản cuộc họp thông qua nghị quyết tăng vốn."
    },
    {
      id: "E309",
      name: "Nghị quyết tăng vốn",
      description: "Nội dung làm thay đổi tỷ lệ vốn góp của các bên."
    },
    {
      id: "E310",
      name: "Tin nhắn giữa Minh và Thành",
      description: "Hai bên trao đổi về việc Minh muốn rút khỏi công ty."
    },
    {
      id: "E311",
      name: "Báo cáo tài chính nội bộ",
      description: "Thể hiện tình hình tài chính của công ty trước thời điểm tranh chấp."
    },
    {
      id: "E312",
      name: "Danh sách người tham dự cuộc họp",
      description: "Thể hiện ai đã tham dự và biểu quyết tại cuộc họp ngày 20/10."
    },
    {
      id: "E313",
      name: "Email công ty gửi cho Nam",
      description: "Có nội dung trao đổi về việc Nam sẽ trở thành thành viên."
    }
  ],

  legalLibrary: [
    {
      id: "LAW301",
      title: "Phần vốn góp",
      content: `
Phần vốn góp xác định quyền và lợi ích của thành viên trong công ty.
Việc chuyển nhượng phải được xem xét dựa trên điều lệ và quy định
về quyền của các thành viên hiện hữu.
`
    },

    {
      id: "LAW302",
      title: "Chuyển nhượng vốn",
      content: `
Thành viên muốn chuyển nhượng vốn phải tuân thủ trình tự được áp dụng
cho loại hình công ty và điều lệ công ty.
Không phải mọi giao dịch chuyển nhượng đều tự động làm thay đổi
thông tin thành viên trong hồ sơ công ty.
`
    },

    {
      id: "LAW303",
      title: "Điều lệ công ty",
      content: `
Điều lệ là tài liệu quan trọng để xác định quyền, nghĩa vụ,
trình tự biểu quyết và các hạn chế chuyển nhượng vốn giữa các thành viên.
`
    },

    {
      id: "LAW304",
      title: "Nghị quyết thành viên",
      content: `
Tính hợp lệ của nghị quyết phải được xem xét dựa trên thẩm quyền,
trình tự triệu tập, thành phần tham dự và tỷ lệ biểu quyết.
`
    },

    {
      id: "LAW305",
      title: "Tư cách thành viên",
      content: `
Việc một người đã thanh toán tiền theo hợp đồng chuyển nhượng
không đồng nghĩa trong mọi trường hợp người đó lập tức được công nhận
là thành viên trong mọi hồ sơ nội bộ.
`
    },

    {
      id: "LAW306",
      title: "Quyền biểu quyết",
      content: `
Quyền biểu quyết phụ thuộc vào tư cách thành viên và tỷ lệ phần vốn góp
được công ty xác định hợp lệ tại thời điểm biểu quyết.
`
    }
  ],

  mechanicsVersion: 3,

  finalArguments: [
    {
      id: "recognize-transfer",
      title: "Yêu cầu ghi nhận việc chuyển nhượng cho Nam",
      rationale: "Dựa trên điều lệ, trình tự chào bán cho thành viên hiện hữu, hợp đồng và chứng từ thanh toán để yêu cầu cập nhật tư cách thành viên.",
      tradeoff: "Có thể bảo vệ giao dịch đã thực hiện nhưng cần chứng minh thủ tục chuyển nhượng đã hoàn tất theo điều lệ.",
      requiresEvidence: ["E301", "E304", "E305", "E306", "E307"],
      requiresLaw: ["LAW302", "LAW303", "LAW305"],
      effects: { legalAnalysis: 8, evidence: 8, procedure: 7, argument: 8, caseUnderstanding: 8, clientTrust: 3 }
    },
    {
      id: "challenge-capital-vote",
      title: "Tập trung yêu cầu xem xét nghị quyết tăng vốn",
      rationale: "Kiểm tra thành phần dự họp, tỷ lệ biểu quyết và căn cứ của nghị quyết làm thay đổi tỷ lệ sở hữu.",
      tradeoff: "Tấn công được hậu quả cấp bách nhưng chưa tự động giải quyết tư cách thành viên của Nam.",
      requiresEvidence: ["E301", "E308", "E309", "E312"],
      requiresLaw: ["LAW303", "LAW304", "LAW306"],
      effects: { legalAnalysis: 8, evidence: 9, procedure: 9, argument: 8, caseUnderstanding: 7, clientTrust: 2 }
    },
    {
      id: "secure-interim-settlement",
      title: "Đàm phán bảo toàn quyền và kiểm toán giao dịch",
      rationale: "Đề nghị tạm dừng thay đổi vốn, cung cấp hồ sơ thành viên và xác nhận nghĩa vụ của công ty trong khi đối chiếu báo cáo tài chính.",
      tradeoff: "Giảm rủi ro leo thang khi một số chứng cứ chưa đủ nhưng có thể trì hoãn việc xác định tư cách thành viên cuối cùng.",
      requiresEvidence: ["E303", "E311", "E313"],
      requiresLaw: ["LAW301", "LAW305"],
      effects: { legalAnalysis: 6, evidence: 6, procedure: 8, argument: 5, caseUnderstanding: 8, clientTrust: 7 }
    }
  ],

  questions: [

    {
      id: "Q301",
      text: `
Sau khi nhận hồ sơ, việc đầu tiên luật sư nên xác định là gì?
`,
      choices: [
        {
          id: "A",
          text: "Ngay lập tức yêu cầu hủy nghị quyết tăng vốn.",
          effects: {
            legalAnalysis: 4,
            procedure: 2
          }
        },
        {
          id: "B",
          text: "Xác định quyền sở hữu phần vốn góp và trình tự chuyển nhượng.",
          effects: {
            legalAnalysis: 12,
            caseUnderstanding: 10
          },
          unlock: ["E301", "E304"]
        },
        {
          id: "C",
          text: "Chỉ tập trung vào việc Nam đã chuyển tiền hay chưa.",
          effects: {
            evidence: 5,
            caseUnderstanding: 3
          }
        },
        {
          id: "D",
          text: "Yêu cầu công ty trả lại toàn bộ 2,7 tỷ đồng cho Nam.",
          effects: {
            argument: 3,
            procedure: 1
          }
        }
      ]
    },

    {
      id: "Q302",
      text: `
Luật sư cần kiểm tra tài liệu nào để biết công ty quy định thế nào
về việc chuyển nhượng vốn?
`,
      choices: [
        {
          id: "A",
          text: "Báo cáo tài chính.",
          effects: {
            evidence: 3
          }
        },
        {
          id: "B",
          text: "Điều lệ công ty.",
          effects: {
            legalAnalysis: 12,
            evidence: 8
          },
          unlock: ["E301"]
        },
        {
          id: "C",
          text: "Giấy chuyển tiền của Nam.",
          effects: {
            evidence: 4
          }
        },
        {
          id: "D",
          text: "Tin nhắn giữa Minh và Thành.",
          effects: {
            evidence: 5
          }
        }
      ]
    },

    {
      id: "Q303",
      text: `
Quốc Thành cho rằng Minh không được bán vốn cho Nam.
Luật sư cần kiểm tra vấn đề nào trước?
`,
      choices: [
        {
          id: "A",
          text: "Nam có đủ tiền để mua hay không.",
          effects: {
            evidence: 2
          }
        },
        {
          id: "B",
          text: "Minh đã thực hiện đúng trình tự chào bán và quyền ưu tiên theo quy định hay chưa.",
          effects: {
            legalAnalysis: 13,
            procedure: 10,
            caseUnderstanding: 7
          },
          unlock: ["E306", "E307"]
        },
        {
          id: "C",
          text: "Nam có quen biết Quốc Thành hay không.",
          effects: {
            argument: 2
          }
        },
        {
          id: "D",
          text: "Giá 2,7 tỷ có cao hơn giá thị trường hay không.",
          effects: {
            legalAnalysis: 3
          }
        }
      ]
    },

    {
      id: "Q304",
      text: `
Quốc Thành đã trả lời email của Minh.
Tài liệu này có ý nghĩa gì?
`,
      choices: [
        {
          id: "A",
          text: "Chứng minh Quốc Thành chắc chắn mất quyền mua.",
          effects: {
            argument: 4
          }
        },
        {
          id: "B",
          text: "Có thể giúp xác định việc Minh đã thông báo và phản hồi của Thành.",
          effects: {
            evidence: 12,
            legalAnalysis: 8
          },
          unlock: ["E307"]
        },
        {
          id: "C",
          text: "Chứng minh hợp đồng với Nam chắc chắn hợp pháp.",
          effects: {
            argument: 3
          }
        },
        {
          id: "D",
          text: "Không có giá trị vì chỉ là email.",
          effects: {
            evidence: 1
          }
        }
      ]
    },

    {
      id: "Q305",
      text: `
Nam đã chuyển 2,7 tỷ đồng cho Minh.
Luật sư nên đánh giá chứng cứ này như thế nào?
`,
      choices: [
        {
          id: "A",
          text: "Đây là bằng chứng duy nhất cần thiết.",
          effects: {
            evidence: 5,
            caseUnderstanding: 2
          }
        },
        {
          id: "B",
          text: "Nó chứng minh giao dịch thanh toán đã xảy ra nhưng chưa tự mình giải quyết toàn bộ vấn đề tư cách thành viên.",
          effects: {
            evidence: 13,
            legalAnalysis: 10
          },
          unlock: ["E305"]
        },
        {
          id: "C",
          text: "Nó chứng minh công ty bắt buộc phải ghi Nam vào sổ thành viên ngay.",
          effects: {
            argument: 3
          }
        },
        {
          id: "D",
          text: "Không cần quan tâm vì tiền đã chuyển cho Minh.",
          effects: {
            evidence: 1
          }
        }
      ]
    },

    {
      id: "Q306",
      text: `
Công ty tổ chức cuộc họp ngày 20/10 để tăng vốn.
Vấn đề nào cần được kiểm tra trước khi đánh giá nghị quyết?
`,
      choices: [
        {
          id: "A",
          text: "Ai triệu tập, ai tham dự và tỷ lệ biểu quyết.",
          effects: {
            procedure: 13,
            legalAnalysis: 9,
            caseUnderstanding: 8
          },
          unlock: ["E308", "E309", "E311", "E312"]
        },
        {
          id: "B",
          text: "Phòng họp có đủ lớn hay không.",
          effects: {
            evidence: 1
          }
        },
        {
          id: "C",
          text: "Công ty có lợi nhuận năm đó hay không.",
          effects: {
            caseUnderstanding: 3
          }
        },
        {
          id: "D",
          text: "Nam có tham dự cuộc họp hay không là vấn đề duy nhất.",
          effects: {
            procedure: 4
          }
        }
      ]
    },

    {
      id: "Q307",
      text: `
Sau khi xem biên bản họp, luật sư phát hiện Nam không có tên trong danh sách
người tham dự. Điều này gợi ra vấn đề gì?
`,
      choices: [
        {
          id: "A",
          text: "Nghị quyết chắc chắn vô hiệu.",
          effects: {
            argument: 4
          }
        },
        {
          id: "B",
          text: "Cần xác định tại thời điểm họp Nam đã có tư cách thành viên hợp lệ hay chưa.",
          effects: {
            legalAnalysis: 14,
            procedure: 12,
            caseUnderstanding: 10
          },
          unlock: ["E303", "E312"]
        },
        {
          id: "C",
          text: "Nam chắc chắn không có bất kỳ quyền nào.",
          effects: {
            legalAnalysis: 3
          }
        },
        {
          id: "D",
          text: "Bỏ qua vì cuộc họp đã kết thúc.",
          effects: {
            procedure: 1
          }
        }
      ]
    },

    {
      id: "Q308",
      text: `
Luật sư phát hiện email của công ty gửi cho Nam trước cuộc họp,
trong đó có nội dung trao đổi về việc Nam sẽ trở thành thành viên.
Cách xử lý phù hợp nhất là gì?
`,
      choices: [
        {
          id: "A",
          text: "Bỏ qua vì email không nằm trong điều lệ.",
          effects: {
            evidence: 1
          }
        },
        {
          id: "B",
          text: "Đối chiếu email với hợp đồng, thanh toán và sổ thành viên để xác định diễn biến thực tế.",
          effects: {
            evidence: 13,
            caseUnderstanding: 12,
            argument: 8
          },
          unlock: ["E313", "E303"]
        },
        {
          id: "C",
          text: "Dùng email làm bằng chứng duy nhất.",
          effects: {
            evidence: 5
          }
        },
        {
          id: "D",
          text: "Xóa email khỏi hồ sơ vì có thể gây bất lợi.",
          effects: {
            evidence: -8,
            procedure: -4
          }
        }
      ]
    },

    {
      id: "Q309",
      text: `
Sau khi tổng hợp hồ sơ, hướng lập luận nào có cơ sở nhất để bảo vệ Minh?
`,
      choices: [
        {
          id: "A",
          text: "Chỉ dựa vào việc Nam đã trả đủ tiền.",
          effects: {
            argument: 5
          }
        },
        {
          id: "B",
          text: "Kết hợp điều lệ, trình tự chuyển nhượng, thông báo cho thành viên hiện hữu, " +
            "hợp đồng, thanh toán và tư cách thành viên tại thời điểm nghị quyết được thông qua.",
          effects: {
            legalAnalysis: 15,
            evidence: 12,
            procedure: 12,
            argument: 15,
            caseUnderstanding: 12
          }
        },
        {
          id: "C",
          text: "Cho rằng mọi nghị quyết sau khi Minh bán vốn đều đương nhiên vô hiệu.",
          effects: {
            argument: 3,
            legalAnalysis: 2
          }
        },
        {
          id: "D",
          text: "Chỉ tập trung vào việc Quốc Thành không đồng ý bán vốn.",
          effects: {
            argument: 4
          }
        }
      ]
    }
  ],

  endings: [
    {
      id: "ENDING_301",
      range: [0, 9],
      title: "Hồ sơ thất bại",
      result: "THUA",
      description: "Luật sư không xác định được trọng tâm pháp lý của tranh chấp."
    },

    {
      id: "ENDING_302",
      range: [10, 29],
      title: "Bất lợi về chứng cứ",
      result: "THUA",
      description: "Nhiều vấn đề quan trọng chưa được chứng minh đầy đủ."
    },

    {
      id: "ENDING_303",
      range: [30, 49],
      title: "Không đủ cơ sở",
      result: "THUA",
      description: "Một số lập luận có cơ sở nhưng hồ sơ chưa đủ chắc."
    },

    {
      id: "ENDING_304",
      range: [50, 59],
      title: "Kết quả bất ngờ",
      result: "RANDOM",
      description: "Hồ sơ có những điểm mạnh và điểm yếu đan xen."
    },

    {
      id: "ENDING_305",
      range: [60, 69],
      title: "Lợi thế mong manh",
      result: "RANDOM",
      description: "Lập luận tương đối tốt nhưng kết quả vẫn phụ thuộc diễn biến vụ án."
    },

    {
      id: "ENDING_306",
      range: [70, 79],
      title: "Chiếm ưu thế",
      result: "RANDOM",
      description: "Hồ sơ có nhiều chứng cứ và lập luận có sức thuyết phục."
    },

    {
      id: "ENDING_307",
      range: [80, 89],
      title: "Bảo vệ thành công",
      result: "RANDOM",
      description: "Chiến lược pháp lý rất tốt, nhưng vẫn còn yếu tố không chắc chắn."
    },

    {
      id: "ENDING_308",
      range: [90, 100],
      title: "Thắng kiện",
      result: "WIN",
      description: "Luật sư xây dựng được hồ sơ và chiến lược rất chặt chẽ."
    }
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

    const maxStats = {
      legalAnalysis: 100,
      evidence: 100,
      procedure: 100,
      argument: 100,
      caseUnderstanding: 100,
      clientTrust: 100
    };

    let score = 0;

    for (const key in weights) {
      const value = Math.max(
        0,
        Math.min(stats[key] || 0, maxStats[key])
      );

      score += value * weights[key];
    }

    return Math.round(Math.max(0, Math.min(score, 100)));
  },

  resolveEnding(score, random = Math.random()) {
    if (score < 10) {
      return "ENDING_301";
    }

    if (score < 50) {
      return "ENDING_302";
    }

    if (score >= 90) {
      return "ENDING_308";
    }

    const winChance = score / 100;

    if (random <= winChance) {
      if (score >= 80) return "ENDING_307";
      if (score >= 70) return "ENDING_306";
      return "ENDING_305";
    }

    if (score >= 60) return "ENDING_304";

    return "ENDING_303";
  }
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_003);
