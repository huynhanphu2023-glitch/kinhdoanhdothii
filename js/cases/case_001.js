/*
 * APX BUSINESS WORLD
 * LAWYER CASE #001
 * Tên vụ án: Tranh chấp hợp đồng mua bán nhà An Phú
 *
 * Đây là vụ án HƯ CẤU phục vụ gameplay.
 * Không dùng như tư vấn pháp lý ngoài đời.
 */

const CASE_001 = {
    id: "case_001",

    meta: {
        title: "Tranh chấp hợp đồng mua bán nhà An Phú",
        shortTitle: "Nhà An Phú",
        category: "Dân sự - Hợp đồng",
        difficulty: 3,
        estimatedMinutes: 15,
        reward: 2400000,
        exp: 180,
        reputationMax: 20
    },

    // =========================================================
    // 1. HỒ SƠ CƠ BẢN
    // =========================================================

    client: {
        name: "Nguyễn Minh Khang",
        age: 32,
        occupation: "Quản lý cửa hàng nội thất",
        phone: "09xx xxx 421",
        description:
            "Khang muốn mua một căn nhà tại khu dân cư An Phú để vừa ở vừa mở cửa hàng nội thất nhỏ."
    },

    opponent: {
        name: "Trần Ngọc Lan",
        age: 41,
        occupation: "Kinh doanh bất động sản tự do",
        description:
            "Lan là người đứng tên trên giấy chứng nhận liên quan đến căn nhà đang tranh chấp."
    },

    property: {
        type: "Nhà ở riêng lẻ",
        location: "Khu dân cư An Phú",
        price: 2400000000,
        deposit: 500000000
    },

    clientRequest: {
        primary:
            "Khang muốn tiếp tục thực hiện giao dịch và bảo vệ quyền lợi của mình đối với căn nhà.",
        secondary:
            "Nếu giao dịch không thể tiếp tục thì Khang muốn được xử lý khoản tiền 500 triệu và các thiệt hại liên quan theo căn cứ phù hợp."
    },

    // =========================================================
    // 2. DIỄN BIẾN THỜI GIAN
    // =========================================================

    timeline: [
        {
            date: "12/04",
            title: "Hai bên gặp nhau",
            content:
                "Khang và Lan thống nhất giá căn nhà là 2,4 tỷ APX."
        },

        {
            date: "12/04",
            title: "Ký văn bản",
            content:
                "Hai bên ký văn bản thỏa thuận mua bán. Khang chuyển trước 500 triệu APX."
        },

        {
            date: "13/04",
            title: "Trao đổi về khoản vay",
            content:
                "Khang thông báo sẽ vay ngân hàng để thanh toán phần tiền còn lại."
        },

        {
            date: "18/04",
            title: "Lan thông báo có tranh chấp",
            content:
                "Lan nói căn nhà đang phát sinh vấn đề liên quan đến người thân nên chưa thể bàn giao."
        },

        {
            date: "20/04",
            title: "Khang yêu cầu tiếp tục giao dịch",
            content:
                "Khang yêu cầu Lan tiếp tục thực hiện thỏa thuận."
        },

        {
            date: "23/04",
            title: "Xuất hiện giao dịch thứ hai",
            content:
                "Khang phát hiện Lan đã ký một văn bản khác với một người mua khác."
        },

        {
            date: "25/04",
            title: "Khang tìm luật sư",
            content:
                "Khang yêu cầu luật sư đánh giá hồ sơ và bảo vệ quyền lợi của mình."
        }
    ],

    // =========================================================
    // 3. HỒ SƠ / CHỨNG CỨ
    // =========================================================

    evidence: [

        {
            id: "E01",
            title: "Văn bản thỏa thuận ngày 12/04",
            type: "document",
            availableAtStart: true,
            importance: "high",
            content:
                "Văn bản ghi nhận giá giao dịch là 2,4 tỷ APX. Khang đã thanh toán trước 500 triệu APX. Phần còn lại dự kiến thanh toán khi hoàn tất các thủ tục liên quan và bàn giao căn nhà."
        },

        {
            id: "E02",
            title: "Lịch sử chuyển khoản 500 triệu",
            type: "bank_record",
            availableAtStart: true,
            importance: "high",
            content:
                "Tài khoản của Khang chuyển 500.000.000 APX vào tài khoản do Lan cung cấp vào ngày 12/04. Nội dung chuyển khoản: 'Thanh toán theo thỏa thuận mua nhà An Phú'."
        },

        {
            id: "E03",
            title: "Tin nhắn giữa Khang và Lan",
            type: "message",
            availableAtStart: false,
            unlockCondition: "investigate_messages",
            importance: "high",
            content:
                "Khang: 'Tôi sẽ vay ngân hàng phần còn lại.'\nLan: 'Nếu ngân hàng duyệt thì mình làm tiếp thủ tục.'\nKhang: 'Vậy tôi chuẩn bị hồ sơ vay.'"
        },

        {
            id: "E04",
            title: "Giấy chứng nhận liên quan đến căn nhà",
            type: "property_document",
            availableAtStart: false,
            unlockCondition: "check_property",
            importance: "critical",
            content:
                "Tài liệu thể hiện Lan là người đứng tên trên giấy chứng nhận liên quan đến căn nhà. Tuy nhiên hồ sơ chưa cho biết toàn bộ tình trạng tranh chấp phát sinh sau đó."
        },

        {
            id: "E05",
            title: "Văn bản thỏa thuận với người mua thứ hai",
            type: "contract",
            availableAtStart: false,
            unlockCondition: "check_second_transaction",
            importance: "critical",
            content:
                "Lan có ký một văn bản khác với người mua thứ hai vào ngày 22/04. Hồ sơ hiện tại chưa chứng minh giao dịch thứ hai đã hoàn tất."
        },

        {
            id: "E06",
            title: "Lời khai của người môi giới",
            type: "witness",
            availableAtStart: false,
            unlockCondition: "interview_broker",
            importance: "medium",
            content:
                "Người môi giới khai rằng Lan từng nói Khang sẽ mua căn nhà. Tuy nhiên người này không trực tiếp chứng kiến toàn bộ quá trình ký kết."
        },

        {
            id: "E07",
            title: "Tài liệu tranh chấp quyền thừa kế",
            type: "legal_document",
            availableAtStart: false,
            unlockCondition: "investigate_inheritance",
            importance: "critical",
            content:
                "Một người thân của Lan đang yêu cầu xác định quyền liên quan đến tài sản. Hồ sơ này chưa cho phép kết luận ngay bên nào có quyền cuối cùng."
        },

        {
            id: "E08",
            title: "Lịch sử trao đổi trước ngày ký",
            type: "messages",
            availableAtStart: false,
            unlockCondition: "review_history",
            importance: "medium",
            content:
                "Các tin nhắn trước ngày 12/04 cho thấy hai bên nhiều lần trao đổi về giá, thời điểm thanh toán và việc bàn giao nhà."
        },

        {
            id: "E09",
            title: "Tài liệu ngân hàng của Khang",
            type: "bank_document",
            availableAtStart: false,
            unlockCondition: "verify_financing",
            importance: "medium",
            content:
                "Khang đã nộp hồ sơ vay để chuẩn bị thanh toán phần tiền còn lại. Hồ sơ cho thấy việc vay đang trong quá trình xem xét."
        },

        {
            id: "E10",
            title: "Lời giải thích của Lan",
            type: "statement",
            availableAtStart: false,
            unlockCondition: "hear_opponent",
            importance: "high",
            content:
                "Lan cho rằng 500 triệu chỉ là khoản tiền giữ chỗ và việc mua bán chưa chắc chắn hoàn tất."
        },

        {
            id: "E11",
            title: "Tài liệu xác minh giao dịch thứ hai",
            type: "investigation",
            availableAtStart: false,
            unlockCondition: "verify_second_transaction",
            importance: "critical",
            content:
                "Tài liệu cho thấy giao dịch thứ hai mới dừng ở một thỏa thuận và chưa có đủ tài liệu để kết luận việc chuyển giao quyền đối với căn nhà đã hoàn tất."
        }
    ],

    // =========================================================
    // 4. THƯ VIỆN PHÁP LUẬT TRONG GAME
    // =========================================================

    legalLibrary: [

        {
            id: "LAW_CONTRACT_01",
            title: "Nguyên tắc về giao kết hợp đồng",
            keywords: [
                "hợp đồng",
                "giao kết",
                "thỏa thuận"
            ],
            content:
                "Các bên cần xem xét ý chí thỏa thuận, nội dung cam kết và các điều kiện liên quan để đánh giá giao dịch."
        },

        {
            id: "LAW_CONTRACT_02",
            title: "Thực hiện nghĩa vụ theo hợp đồng",
            keywords: [
                "nghĩa vụ",
                "thực hiện",
                "vi phạm"
            ],
            content:
                "Khi đánh giá tranh chấp cần xác định nghĩa vụ của từng bên, thời điểm thực hiện và hành vi thực tế."
        },

        {
            id: "LAW_EVIDENCE_01",
            title: "Đánh giá chứng cứ",
            keywords: [
                "chứng cứ",
                "tin nhắn",
                "lời khai",
                "tài liệu"
            ],
            content:
                "Một tài liệu nên được đánh giá trong mối liên hệ với các chứng cứ khác thay vì mặc nhiên coi đó là căn cứ duy nhất."
        },

        {
            id: "LAW_PROPERTY_01",
            title: "Tình trạng pháp lý của tài sản",
            keywords: [
                "nhà",
                "đất",
                "tài sản",
                "tranh chấp"
            ],
            content:
                "Khi xử lý giao dịch liên quan đến tài sản cần kiểm tra tình trạng pháp lý và các tranh chấp có thể ảnh hưởng đến giao dịch."
        },

        {
            id: "LAW_REMEDY_01",
            title: "Xử lý khi nghĩa vụ không được thực hiện",
            keywords: [
                "bồi thường",
                "hủy",
                "chấm dứt",
                "vi phạm"
            ],
            content:
                "Phương án xử lý phụ thuộc vào nội dung thỏa thuận, mức độ vi phạm và các chứng cứ xác minh được."
        }
    ],

    // =========================================================
    // 5. CHỈ SỐ ẨN
    // =========================================================

    scoring: {
        maxScore: 100,

        hiddenStats: [
            "legalAnalysis",
            "evidence",
            "procedure",
            "argument",
            "caseUnderstanding",
            "clientTrust"
        ],

        initial: {
            legalAnalysis: 0,
            evidence: 0,
            procedure: 0,
            argument: 0,
            caseUnderstanding: 0,
            clientTrust: 50
        },

        rules: {
            below10: "LOSE_ALWAYS",
            below50: "HIGH_LOSS_RATE",
            between50And89: "UNCERTAIN",
            aboveOrEqual90: "WIN_ALWAYS"
        }
    },

    // =========================================================
    // 6. CÂU HỎI / TÌNH HUỐNG
    // =========================================================

    mechanicsVersion: 3,

    finalArguments: [
        {
            id: "specific-performance",
            title: "Ưu tiên yêu cầu tiếp tục giao dịch",
            rationale: "Đề nghị buộc các bên tiếp tục thực hiện thỏa thuận, đồng thời xin biện pháp bảo toàn hiện trạng căn nhà.",
            tradeoff: "Có thể bảo vệ mục tiêu nhận nhà của Khang nhưng phụ thuộc lớn vào tình trạng tranh chấp quyền và khả năng thực hiện.",
            requiresEvidence: ["E01", "E04", "E07", "E11"],
            requiresLaw: ["LAW_CONTRACT_02", "LAW_PROPERTY_01"],
            effects: { legalAnalysis: 8, evidence: 7, procedure: 5, argument: 7, caseUnderstanding: 6, clientTrust: 3 }
        },
        {
            id: "deposit-remedy",
            title: "Ưu tiên xử lý tiền đã giao và thiệt hại có chứng cứ",
            rationale: "Tập trung vào khoản 500 triệu, nghĩa vụ đã cam kết và thiệt hại chứng minh được nếu giao dịch không thể tiếp tục.",
            tradeoff: "Thực tế hơn khi quyền đối với căn nhà còn bất định nhưng có thể không đạt mục tiêu chính là mua được nhà.",
            requiresEvidence: ["E01", "E02", "E09"],
            requiresLaw: ["LAW_REMEDY_01", "LAW_EVIDENCE_01"],
            effects: { legalAnalysis: 7, evidence: 8, procedure: 7, argument: 6, caseUnderstanding: 7, clientTrust: 2 }
        },
        {
            id: "settlement",
            title: "Đề xuất thương lượng có điều kiện",
            rationale: "Đưa ra thời hạn cuối để hoàn tất giao dịch; nếu không đạt, chuyển sang phương án hoàn trả và bồi hoàn theo chứng cứ.",
            tradeoff: "Có cơ hội giảm thời gian và chi phí tranh chấp nhưng Khang có thể phải nhượng bộ về thời hạn hoặc yêu cầu.",
            requiresEvidence: ["E01", "E05", "E10"],
            requiresLaw: ["LAW_CONTRACT_02", "LAW_REMEDY_01"],
            effects: { legalAnalysis: 5, evidence: 5, procedure: 9, argument: 6, caseUnderstanding: 7, clientTrust: 6 }
        }
    ],

    questions: [

        {
            id: "Q01",
            title: "Bắt đầu phân tích hồ sơ",
            situation:
                "Sau khi đọc E01 và E02, luật sư phải xác định bước điều tra đầu tiên.",

            unlocks: [],

            choices: [

                {
                    id: "A",
                    text:
                        "Ngay lập tức kết luận Lan có hành vi lừa đảo.",
                    effects: {
                        legalAnalysis: -15,
                        evidence: -5,
                        procedure: -15,
                        argument: -5
                    }
                },

                {
                    id: "B",
                    text:
                        "Yêu cầu hủy toàn bộ thỏa thuận và chỉ yêu cầu trả 500 triệu.",
                    effects: {
                        legalAnalysis: -8,
                        procedure: -5,
                        argument: 0
                    }
                },

                {
                    id: "C",
                    text:
                        "Kiểm tra đầy đủ nội dung thỏa thuận và tình trạng pháp lý của căn nhà trước khi kết luận.",
                    effects: {
                        legalAnalysis: 12,
                        evidence: 8,
                        procedure: 10,
                        caseUnderstanding: 10
                    },
                    requiresEvidence: ["E01"],
                    requiresLaw: ["LAW_CONTRACT_01"],
                    unlocks: [
                        "check_property"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Cho rằng việc chuyển 500 triệu đồng đồng nghĩa quyền sở hữu nhà đã chuyển sang Khang.",
                    effects: {
                        legalAnalysis: -12,
                        caseUnderstanding: -10,
                        argument: -8
                    }
                }
            ]
        },

        {
            id: "Q02",
            title: "Tin nhắn về khoản vay",
            situation:
                "E03 được mở. Tin nhắn cho thấy hai bên từng trao đổi về việc Khang vay ngân hàng để thanh toán phần còn lại.",

            unlocks: [
                "investigate_messages"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Đây chắc chắn là bằng chứng duy nhất chứng minh giao dịch đã hoàn thành.",
                    effects: {
                        legalAnalysis: -10,
                        evidence: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Đây là tài liệu có thể hỗ trợ xác định ý chí của các bên nhưng cần xem cùng các chứng cứ khác.",
                    effects: {
                        legalAnalysis: 10,
                        evidence: 12,
                        caseUnderstanding: 8
                    }
                },

                {
                    id: "C",
                    text:
                        "Tin nhắn không có giá trị vì tin nhắn điện thoại không bao giờ được sử dụng làm chứng cứ.",
                    effects: {
                        legalAnalysis: -15,
                        evidence: -12
                    }
                },

                {
                    id: "D",
                    text:
                        "Đây là bằng chứng chắc chắn Lan đã phạm tội.",
                    effects: {
                        legalAnalysis: -15,
                        argument: -10,
                        procedure: -10
                    }
                }
            ]
        },

        {
            id: "Q03",
            title: "Tình trạng căn nhà",
            situation:
                "E04 cho thấy Lan đứng tên giấy chứng nhận, nhưng xuất hiện thông tin về tranh chấp quyền thừa kế.",

            unlocks: [
                "check_property",
                "investigate_inheritance"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Bỏ qua tranh chấp vì giấy chứng nhận đang đứng tên Lan.",
                    effects: {
                        legalAnalysis: -10,
                        evidence: -10,
                        caseUnderstanding: -10
                    }
                },

                {
                    id: "B",
                    text:
                        "Kiểm tra tình trạng tranh chấp và tài liệu liên quan trước khi đưa ra yêu cầu cuối cùng.",
                    effects: {
                        legalAnalysis: 12,
                        evidence: 12,
                        procedure: 10,
                        caseUnderstanding: 12
                    },
                    requiresEvidence: ["E04", "E07"],
                    requiresLaw: ["LAW_PROPERTY_01"]
                },

                {
                    id: "C",
                    text:
                        "Kết luận ngay Lan không có quyền bán căn nhà.",
                    effects: {
                        legalAnalysis: -12,
                        argument: -8
                    }
                },

                {
                    id: "D",
                    text:
                        "Kết luận Khang chắc chắn mất 500 triệu.",
                    effects: {
                        legalAnalysis: -12,
                        clientTrust: -5
                    }
                }
            ]
        },

        {
            id: "Q04",
            title: "Giao dịch với người mua thứ hai",
            situation:
                "E05 cho thấy Lan ký một văn bản khác với người mua thứ hai vào ngày 22/04.",

            unlocks: [
                "check_second_transaction"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Cho rằng căn nhà chắc chắn đã thuộc người mua thứ hai.",
                    effects: {
                        legalAnalysis: -10,
                        evidence: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Không cần quan tâm vì giao dịch của Khang xảy ra trước.",
                    effects: {
                        legalAnalysis: -8,
                        evidence: -10,
                        caseUnderstanding: -8
                    }
                },

                {
                    id: "C",
                    text:
                        "Xác minh thời điểm, nội dung và tình trạng thực hiện giao dịch thứ hai.",
                    effects: {
                        legalAnalysis: 12,
                        evidence: 14,
                        procedure: 8
                    },
                    unlocks: [
                        "verify_second_transaction"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Ngay lập tức yêu cầu xử lý người mua thứ hai vì đã tham gia giao dịch.",
                    effects: {
                        legalAnalysis: -15,
                        procedure: -12,
                        argument: -8
                    }
                }
            ]
        },

        {
            id: "Q05",
            title: "Người môi giới",
            situation:
                "Người môi giới nói rằng Lan từng nói Khang sẽ mua căn nhà nhưng người này không trực tiếp chứng kiến toàn bộ việc ký kết.",

            unlocks: [
                "interview_broker"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Dùng lời khai này làm chứng cứ duy nhất.",
                    effects: {
                        evidence: -12,
                        legalAnalysis: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Loại bỏ hoàn toàn lời khai.",
                    effects: {
                        evidence: -6,
                        caseUnderstanding: -4
                    }
                },

                {
                    id: "C",
                    text:
                        "Dùng lời khai như thông tin hỗ trợ và đối chiếu với các chứng cứ khác.",
                    effects: {
                        evidence: 10,
                        legalAnalysis: 8,
                        argument: 8
                    }
                },

                {
                    id: "D",
                    text:
                        "Kết luận lời khai chứng minh toàn bộ vụ án.",
                    effects: {
                        evidence: -10,
                        argument: -10
                    }
                }
            ]
        },

        {
            id: "Q06",
            title: "Kiểm tra khả năng thanh toán",
            situation:
                "E09 cho thấy Khang thực sự đã chuẩn bị hồ sơ vay để thanh toán phần còn lại.",

            unlocks: [
                "verify_financing"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Bỏ qua vì việc vay ngân hàng không liên quan đến tranh chấp.",
                    effects: {
                        caseUnderstanding: -6,
                        evidence: -5
                    }
                },

                {
                    id: "B",
                    text:
                        "Cho rằng Khang đã có đủ 1,9 tỷ APX dù hồ sơ vay chưa được duyệt.",
                    effects: {
                        legalAnalysis: -10,
                        argument: -8
                    }
                },

                {
                    id: "C",
                    text:
                        "Xem tài liệu vay như một tình tiết cần được đánh giá cùng tiến trình thực hiện giao dịch.",
                    effects: {
                        legalAnalysis: 8,
                        evidence: 8,
                        caseUnderstanding: 10
                    }
                },

                {
                    id: "D",
                    text:
                        "Hủy toàn bộ yêu cầu của Khang vì khoản vay chưa được duyệt.",
                    effects: {
                        legalAnalysis: -12,
                        clientTrust: -8
                    }
                }
            ]
        },

        {
            id: "Q07",
            title: "Lời giải thích của Lan",
            situation:
                "Lan cho rằng 500 triệu chỉ là tiền giữ chỗ và việc mua bán chưa chắc chắn hoàn tất.",

            unlocks: [
                "hear_opponent"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Tin hoàn toàn lời Lan.",
                    effects: {
                        legalAnalysis: -10,
                        evidence: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Tin hoàn toàn lời Khang.",
                    effects: {
                        legalAnalysis: -6,
                        evidence: -6
                    }
                },

                {
                    id: "C",
                    text:
                        "Đối chiếu lời khai với văn bản, chuyển khoản, tin nhắn và các tài liệu khác.",
                    effects: {
                        legalAnalysis: 14,
                        evidence: 12,
                        caseUnderstanding: 12,
                        argument: 8
                    }
                },

                {
                    id: "D",
                    text:
                        "Bỏ toàn bộ văn bản E01 vì lời khai mới quan trọng hơn.",
                    effects: {
                        legalAnalysis: -12,
                        evidence: -15
                    }
                }
            ]
        },

        {
            id: "Q08",
            title: "Xây dựng hồ sơ",
            situation:
                "Luật sư phải quyết định cách chuẩn bị hồ sơ trước khi đưa ra yêu cầu.",

            unlocks: [
                "review_history"
            ],

            choices: [

                {
                    id: "A",
                    text:
                        "Chỉ đưa những chứng cứ có lợi cho Khang.",
                    effects: {
                        argument: -8,
                        evidence: -10,
                        legalAnalysis: -6
                    }
                },

                {
                    id: "B",
                    text:
                        "Đưa toàn bộ chứng cứ cần thiết, kể cả tài liệu bất lợi, và giải thích các điểm mâu thuẫn.",
                    effects: {
                        argument: 14,
                        evidence: 12,
                        legalAnalysis: 10,
                        procedure: 8
                    }
                },

                {
                    id: "C",
                    text:
                        "Bỏ qua tài liệu về tranh chấp thừa kế.",
                    effects: {
                        evidence: -12,
                        caseUnderstanding: -10
                    }
                },

                {
                    id: "D",
                    text:
                        "Chỉ dựa vào lời khai của Khang.",
                    effects: {
                        evidence: -15,
                        argument: -10
                    }
                }
            ]
        },

        {
            id: "Q09",
            title: "Yêu cầu của khách hàng",
            situation:
                "Khang nói: 'Tôi muốn bằng mọi cách lấy được căn nhà.' Luật sư phải xác định cách phản hồi.",

            choices: [

                {
                    id: "A",
                    text:
                        "Cam kết chắc chắn với Khang rằng anh ta sẽ lấy được nhà.",
                    effects: {
                        clientTrust: 5,
                        legalAnalysis: -15,
                        argument: -10
                    }
                },

                {
                    id: "B",
                    text:
                        "Giải thích các khả năng và chỉ đưa ra yêu cầu dựa trên những gì hồ sơ chứng minh được.",
                    effects: {
                        clientTrust: 12,
                        legalAnalysis: 12,
                        argument: 10
                    }
                },

                {
                    id: "C",
                    text:
                        "Bỏ qua yêu cầu của Khang.",
                    effects: {
                        clientTrust: -15,
                        argument: -8
                    }
                },

                {
                    id: "D",
                    text:
                        "Yêu cầu Khang tự tìm thêm chứng cứ rồi mới tiếp tục.",
                    effects: {
                        clientTrust: -8,
                        procedure: -5
                    }
                }
            ]
        }
    ],

    // =========================================================
    // 7. HỆ THỐNG NHÁNH
    // =========================================================

    branches: {

        check_property: {
            description:
                "Người chơi quyết định kiểm tra tình trạng pháp lý của căn nhà.",
            unlocks: [
                "E04",
                "E07"
            ]
        },

        investigate_messages: {
            description:
                "Người chơi kiểm tra lịch sử trao đổi.",
            unlocks: [
                "E03"
            ]
        },

        check_second_transaction: {
            description:
                "Người chơi phát hiện giao dịch với người mua thứ hai.",
            unlocks: [
                "E05"
            ]
        },

        verify_second_transaction: {
            description:
                "Người chơi điều tra sâu hơn giao dịch thứ hai.",
            unlocks: [
                "E11"
            ]
        },

        investigate_inheritance: {
            description:
                "Người chơi kiểm tra tranh chấp quyền thừa kế.",
            unlocks: [
                "E07"
            ]
        },

        interview_broker: {
            description:
                "Người chơi lấy lời khai người môi giới.",
            unlocks: [
                "E06"
            ]
        },

        verify_financing: {
            description:
                "Người chơi xác minh khả năng thanh toán của Khang.",
            unlocks: [
                "E09"
            ]
        },

        hear_opponent: {
            description:
                "Người chơi tiếp nhận lời giải thích từ Lan.",
            unlocks: [
                "E10"
            ]
        },

        review_history: {
            description:
                "Người chơi xem lại lịch sử trao đổi trước khi ký.",
            unlocks: [
                "E08"
            ]
        }
    },

    // =========================================================
    // 8. CÁC KẾT CỤC
    // =========================================================

    endings: [

        {
            id: "ENDING_001",
            range: [90, 100],
            title: "Thắng vụ án",
            type: "WIN",
            description:
                "Hồ sơ được xây dựng chặt chẽ. Người chơi đã xác định được các vấn đề pháp lý trọng tâm, kiểm tra chứng cứ và đưa ra lập luận phù hợp.",
            rewardMultiplier: 1.2,
            reputation: 20
        },

        {
            id: "ENDING_002",
            range: [80, 89],
            title: "Thắng có điều kiện",
            type: "WIN_PARTIAL",
            description:
                "Lập luận chính tương đối vững nhưng vẫn còn một số điểm chưa được chứng minh đầy đủ.",
            rewardMultiplier: 1.0,
            reputation: 14
        },

        {
            id: "ENDING_003",
            range: [70, 79],
            title: "Kết quả có lợi một phần",
            type: "PARTIAL",
            description:
                "Một phần yêu cầu của khách hàng được bảo vệ, nhưng không đạt toàn bộ mục tiêu ban đầu.",
            rewardMultiplier: 0.8,
            reputation: 8
        },

        {
            id: "ENDING_004",
            range: [60, 69],
            title: "Thỏa thuận một phần",
            type: "SETTLEMENT",
            description:
                "Hồ sơ chưa đủ mạnh để đạt toàn bộ yêu cầu nhưng tạo được cơ sở cho một phương án giải quyết một phần tranh chấp.",
            rewardMultiplier: 0.7,
            reputation: 5
        },

        {
            id: "ENDING_005",
            range: [50, 59],
            title: "Kết quả không chắc chắn",
            type: "UNCERTAIN",
            description:
                "Hồ sơ có cả điểm mạnh và điểm yếu. Kết quả cuối cùng phụ thuộc vào các yếu tố ngoài phần phân tích của luật sư.",
            rewardMultiplier: 0.5,
            reputation: 0
        },

        {
            id: "ENDING_006",
            range: [30, 49],
            title: "Thất bại",
            type: "LOSE",
            description:
                "Một số vấn đề quan trọng trong hồ sơ chưa được phát hiện hoặc xử lý đúng hướng.",
            rewardMultiplier: 0,
            reputation: -10
        },

        {
            id: "ENDING_007",
            range: [10, 29],
            title: "Thất bại nghiêm trọng",
            type: "LOSE_BAD",
            description:
                "Chiến lược xử lý có nhiều sai sót và hồ sơ không đủ sức bảo vệ yêu cầu của khách hàng.",
            rewardMultiplier: 0,
            reputation: -16
        },

        {
            id: "ENDING_008",
            range: [0, 9],
            title: "Thua vụ án",
            type: "LOSE_ALWAYS",
            description:
                "Việc phân tích hồ sơ có sai sót nghiêm trọng khiến chiến lược bảo vệ khách hàng thất bại.",
            rewardMultiplier: 0,
            reputation: -20
        }
    ],

    // =========================================================
    // 9. TÍNH ĐIỂM
    // =========================================================

    calculateScore(stats) {

        const weights = {
            legalAnalysis: 0.25,
            evidence: 0.20,
            procedure: 0.15,
            argument: 0.20,
            caseUnderstanding: 0.15,
            clientTrust: 0.05
        };

        const normalize = value => {
            /*
             * Giá trị điểm nội bộ có thể âm/dương.
             * Engine đưa về 0-100.
             */
            const result = 50 + value;

            return Math.max(0, Math.min(100, result));
        };

        const values = {
            legalAnalysis: normalize(stats.legalAnalysis),
            evidence: normalize(stats.evidence),
            procedure: normalize(stats.procedure),
            argument: normalize(stats.argument),
            caseUnderstanding: normalize(stats.caseUnderstanding),
            clientTrust: normalize(stats.clientTrust - 50)
        };

        let score =
            values.legalAnalysis * weights.legalAnalysis +
            values.evidence * weights.evidence +
            values.procedure * weights.procedure +
            values.argument * weights.argument +
            values.caseUnderstanding * weights.caseUnderstanding +
            values.clientTrust * weights.clientTrust;

        return Math.round(
            Math.max(0, Math.min(100, score))
        );
    },

    // =========================================================
    // 10. XÁC ĐỊNH KẾT QUẢ
    // =========================================================

    resolveEnding(score, random = Math.random()) {

        if (score < 10) {
            return this.endings.find(
                ending => ending.id === "ENDING_008"
            );
        }

        if (score < 50) {
            return this.endings.find(
                ending => ending.id === "ENDING_006"
            );
        }

        if (score >= 90) {
            return this.endings.find(
                ending => ending.id === "ENDING_001"
            );
        }

        /*
         * Vùng 50-89:
         * Kết quả không được đảm bảo.
         * Điểm càng cao thì khả năng nhận kết quả có lợi càng lớn.
         */

        const chanceToWin = score / 100;

        if (random < chanceToWin) {

            if (score >= 80) {
                return this.endings.find(
                    ending => ending.id === "ENDING_002"
                );
            }

            if (score >= 70) {
                return this.endings.find(
                    ending => ending.id === "ENDING_003"
                );
            }

            return this.endings.find(
                ending => ending.id === "ENDING_004"
            );
        }

        return this.endings.find(
            ending => ending.id === "ENDING_005"
        );
    }
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_001);