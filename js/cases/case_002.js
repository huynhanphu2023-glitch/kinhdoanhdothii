/*
 * APX BUSINESS WORLD
 * LAWYER CASE #002
 *
 * VỤ ÁN: NHÂN VIÊN BỊ SA THẢI SAU KHI TỐ CÁO SAI PHẠM
 *
 * Thể loại:
 * Tranh chấp lao động
 *
 * Lưu ý:
 * Đây là vụ án hư cấu phục vụ gameplay.
 */

const CASE_002 = {

    id: "case_002",

    meta: {
        title: "Nhân viên bị sa thải sau khi tố cáo sai phạm",
        shortTitle: "Vụ sa thải Minh Quân",
        category: "Lao động",
        difficulty: 4,
        estimatedMinutes: 18,
        reward: 3200000,
        exp: 240,
        reputationMax: 25
    },

    // =========================================================
    // 1. NHÂN VẬT
    // =========================================================

    client: {
        name: "Lê Minh Quân",
        age: 28,
        occupation: "Nhân viên kho",
        company: "Công ty TNHH Thương mại Đại Phát",
        workingTime: "2 năm 7 tháng",

        description:
            "Quân làm nhân viên kho tại Công ty TNHH Thương mại Đại Phát. Sau một thời gian làm việc, Quân phát hiện số lượng hàng trong hệ thống thường xuyên không khớp với hàng thực tế."
    },

    opponent: {
        name: "Phạm Quốc Hùng",
        age: 44,
        occupation: "Giám đốc Công ty TNHH Thương mại Đại Phát"
    },

    company: {
        name: "Công ty TNHH Thương mại Đại Phát",
        field: "Phân phối hàng điện tử",
        employees: 86
    },

    // =========================================================
    // 2. YÊU CẦU CỦA KHÁCH HÀNG
    // =========================================================

    clientRequest: {

        primary:
            "Quân cho rằng quyết định sa thải mình là không hợp lý và muốn được bảo vệ quyền lợi.",

        secondary:
            "Quân muốn được xem xét khoản tiền lương, quyền lợi và các thiệt hại phát sinh nếu có căn cứ."
    },

    // =========================================================
    // 3. DIỄN BIẾN
    // =========================================================

    timeline: [

        {
            date: "03/06",
            title: "Phát hiện chênh lệch kho",
            content:
                "Quân phát hiện một số mã hàng trên hệ thống có số lượng lớn hơn số hàng thực tế trong kho."
        },

        {
            date: "05/06",
            title: "Báo cáo cho quản lý",
            content:
                "Quân thông báo với trưởng kho về tình trạng chênh lệch."
        },

        {
            date: "07/06",
            title: "Kiểm tra nội bộ",
            content:
                "Công ty tiến hành kiểm kê một phần kho."
        },

        {
            date: "09/06",
            title: "Quân gửi email",
            content:
                "Quân gửi email cho phòng nhân sự và ban giám đốc đề nghị kiểm tra lại số liệu."
        },

        {
            date: "12/06",
            title: "Phát sinh tranh cãi",
            content:
                "Quản lý kho cho rằng Quân tự ý truy cập hệ thống ngoài phạm vi công việc."
        },

        {
            date: "14/06",
            title: "Quân nhận cảnh báo",
            content:
                "Quân nhận văn bản yêu cầu giải trình về việc truy cập hệ thống."
        },

        {
            date: "16/06",
            title: "Quân giải trình",
            content:
                "Quân cho rằng mình truy cập hệ thống để đối chiếu số liệu phục vụ công việc."
        },

        {
            date: "19/06",
            title: "Quyết định sa thải",
            content:
                "Công ty ban hành quyết định chấm dứt việc làm đối với Quân với lý do vi phạm quy định sử dụng hệ thống nội bộ."
        },

        {
            date: "22/06",
            title: "Quân tìm luật sư",
            content:
                "Quân cung cấp toàn bộ hồ sơ và yêu cầu luật sư đánh giá."
        }
    ],

    // =========================================================
    // 4. CHỨNG CỨ
    // =========================================================

    evidence: [

        {
            id: "E201",
            title: "Hợp đồng lao động",
            type: "employment_contract",
            availableAtStart: true,
            importance: "critical",

            content:
                "Hợp đồng lao động giữa Quân và Công ty Đại Phát. Chức danh: Nhân viên kho. Công việc bao gồm kiểm tra, đối chiếu và cập nhật số liệu hàng hóa theo phân công."
        },

        {
            id: "E202",
            title: "Quyết định sa thải",
            type: "termination_decision",
            availableAtStart: true,
            importance: "critical",

            content:
                "Công ty cho rằng Quân đã truy cập hệ thống quản lý kho ngoài phạm vi cho phép và vi phạm quy định nội bộ."
        },

        {
            id: "E203",
            title: "Email ngày 09/06",
            type: "email",
            availableAtStart: false,
            unlockCondition: "review_email",
            importance: "high",

            content:
                "Quân gửi email đề nghị công ty kiểm tra chênh lệch số liệu hàng hóa và cho biết việc đối chiếu được thực hiện trong quá trình làm việc."
        },

        {
            id: "E204",
            title: "Nội quy công ty",
            type: "internal_regulation",
            availableAtStart: false,
            unlockCondition: "review_rules",
            importance: "critical",

            content:
                "Nội quy có quy định về việc sử dụng hệ thống máy tính nội bộ. Hồ sơ cần xác định phạm vi áp dụng và thủ tục xử lý vi phạm."
        },

        {
            id: "E205",
            title: "Lịch sử đăng nhập hệ thống",
            type: "system_log",
            availableAtStart: false,
            unlockCondition: "check_system_log",
            importance: "critical",

            content:
                "Lịch sử hệ thống thể hiện tài khoản của Quân đăng nhập trong giờ làm việc vào các ngày 03/06, 05/06, 09/06 và 12/06."
        },

        {
            id: "E206",
            title: "Biên bản kiểm kê kho",
            type: "inventory_report",
            availableAtStart: false,
            unlockCondition: "check_inventory",
            importance: "critical",

            content:
                "Biên bản cho thấy một số mã hàng có sự chênh lệch giữa số liệu trên hệ thống và số lượng thực tế."
        },

        {
            id: "E207",
            title: "Văn bản giải trình của Quân",
            type: "employee_statement",
            availableAtStart: false,
            unlockCondition: "review_explanation",
            importance: "high",

            content:
                "Quân giải thích rằng việc đăng nhập hệ thống được thực hiện trong giờ làm việc nhằm đối chiếu số liệu kho."
        },

        {
            id: "E208",
            title: "Camera khu vực kho",
            type: "camera",
            availableAtStart: false,
            unlockCondition: "check_camera",
            importance: "medium",

            content:
                "Camera cho thấy Quân có mặt tại khu vực kho vào thời điểm một số lần đăng nhập được ghi nhận."
        },

        {
            id: "E209",
            title: "Lời khai của trưởng kho",
            type: "witness",
            availableAtStart: false,
            unlockCondition: "interview_manager",
            importance: "high",

            content:
                "Trưởng kho nói rằng Quân được phép kiểm tra số liệu kho nhưng không nhớ rõ phạm vi quyền truy cập hệ thống."
        },

        {
            id: "E210",
            title: "Thông báo cảnh báo trước sa thải",
            type: "disciplinary_notice",
            availableAtStart: false,
            unlockCondition: "review_discipline",
            importance: "critical",

            content:
                "Hồ sơ cho thấy Quân từng được yêu cầu giải trình trước khi công ty ban hành quyết định sa thải."
        },

        {
            id: "E211",
            title: "Danh sách người có quyền truy cập",
            type: "access_list",
            availableAtStart: false,
            unlockCondition: "check_access",
            importance: "high",

            content:
                "Danh sách tài khoản cho thấy một số nhân viên kho khác cũng có quyền truy cập một phần hệ thống."
        },

        {
            id: "E212",
            title: "Bảng lương",
            type: "salary_record",
            availableAtStart: false,
            unlockCondition: "check_salary",
            importance: "medium",

            content:
                "Bảng lương thể hiện mức lương và các khoản phụ cấp của Quân trong những tháng trước khi nghỉ việc."
        },

        {
            id: "E213",
            title: "Tin nhắn giữa Quân và trưởng kho",
            type: "message",
            availableAtStart: false,
            unlockCondition: "review_messages",
            importance: "high",

            content:
                "Trưởng kho từng nhắn cho Quân: 'Em cứ kiểm tra lại số liệu trên hệ thống rồi báo anh nếu có lệch.'"
        }
    ],

    // =========================================================
    // 5. THƯ VIỆN PHÁP LUẬT
    // =========================================================

    legalLibrary: [

        {
            id: "LABOR_01",
            title: "Quan hệ lao động",
            keywords: [
                "lao động",
                "hợp đồng",
                "người lao động"
            ],

            content:
                "Khi giải quyết tranh chấp lao động cần xác định hợp đồng, quyền và nghĩa vụ của người lao động và người sử dụng lao động."
        },

        {
            id: "LABOR_02",
            title: "Xử lý kỷ luật lao động",
            keywords: [
                "kỷ luật",
                "sa thải",
                "vi phạm"
            ],

            content:
                "Cần xác định hành vi vi phạm, căn cứ áp dụng và trình tự xử lý theo quy định có liên quan."
        },

        {
            id: "LABOR_03",
            title: "Chứng cứ trong tranh chấp lao động",
            keywords: [
                "chứng cứ",
                "email",
                "camera",
                "hệ thống"
            ],

            content:
                "Email, dữ liệu hệ thống, tài liệu nội bộ và lời khai có thể cần được đối chiếu với nhau để đánh giá sự việc."
        },

        {
            id: "LABOR_04",
            title: "Nội quy lao động",
            keywords: [
                "nội quy",
                "quy định công ty",
                "hệ thống"
            ],

            content:
                "Cần kiểm tra nội dung quy định, phạm vi áp dụng và mối liên hệ giữa hành vi bị cho là vi phạm với nội quy."
        },

        {
            id: "LABOR_05",
            title: "Chấm dứt quan hệ lao động",
            keywords: [
                "chấm dứt",
                "sa thải",
                "nghỉ việc"
            ],

            content:
                "Việc đánh giá quyết định chấm dứt cần xem xét căn cứ, tình tiết và thủ tục được thực hiện."
        }
    ],

    // =========================================================
    // 6. ĐIỂM ẨN
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
        }
    },

    // =========================================================
    // 7. CÂU HỎI
    // =========================================================

    questions: [

        {
            id: "Q201",

            title: "Đọc quyết định sa thải",

            situation:
                "Quyết định của công ty cho rằng Quân vi phạm quy định sử dụng hệ thống. Luật sư phải xác định việc cần kiểm tra trước.",

            choices: [

                {
                    id: "A",
                    text:
                        "Ngay lập tức kết luận công ty sa thải trái quy định.",
                    effects: {
                        legalAnalysis: -12,
                        procedure: -10,
                        argument: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Chỉ cần hỏi Quân có cho rằng mình bị oan hay không.",
                    effects: {
                        evidence: -8,
                        legalAnalysis: -6
                    }
                },

                {
                    id: "C",
                    text:
                        "Kiểm tra hợp đồng, nội quy, hành vi bị cáo buộc và trình tự công ty đã thực hiện.",
                    effects: {
                        legalAnalysis: 12,
                        procedure: 12,
                        caseUnderstanding: 10
                    },
                    unlocks: [
                        "review_rules",
                        "review_discipline"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Cho rằng công ty có quyền sa thải bất kỳ nhân viên nào nếu mất niềm tin.",
                    effects: {
                        legalAnalysis: -15,
                        argument: -12
                    }
                }
            ]
        },

        {
            id: "Q202",

            title: "Email tố cáo",

            situation:
                "E203 cho thấy Quân đã gửi email về chênh lệch kho trước khi bị xử lý.",

            choices: [

                {
                    id: "A",
                    text:
                        "Cho rằng email này tự động chứng minh Quân vô tội.",
                    effects: {
                        legalAnalysis: -5,
                        evidence: -4
                    }
                },

                {
                    id: "B",
                    text:
                        "Bỏ qua email vì đây chỉ là trao đổi nội bộ.",
                    effects: {
                        evidence: -10,
                        caseUnderstanding: -8
                    }
                },

                {
                    id: "C",
                    text:
                        "Kiểm tra nội dung email và thời điểm gửi để xác định mối liên hệ với các sự kiện sau đó.",
                    effects: {
                        evidence: 12,
                        legalAnalysis: 10,
                        caseUnderstanding: 10
                    },
                    unlocks: [
                        "review_email"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Dùng email làm căn cứ duy nhất để yêu cầu hủy quyết định.",
                    effects: {
                        argument: -8,
                        legalAnalysis: -6
                    }
                }
            ]
        },

        {
            id: "Q203",

            title: "Kiểm tra quyền truy cập",

            situation:
                "Luật sư phát hiện cần xác định Quân có thực sự truy cập trái phép hay không.",

            choices: [

                {
                    id: "A",
                    text:
                        "Tin lời công ty rằng Quân truy cập trái phép.",
                    effects: {
                        evidence: -12,
                        legalAnalysis: -10
                    }
                },

                {
                    id: "B",
                    text:
                        "Kiểm tra lịch sử đăng nhập và danh sách người có quyền truy cập.",
                    effects: {
                        evidence: 15,
                        legalAnalysis: 12,
                        caseUnderstanding: 12
                    },
                    unlocks: [
                        "check_system_log",
                        "check_access"
                    ]
                },

                {
                    id: "C",
                    text:
                        "Cho rằng đăng nhập trong giờ làm việc chắc chắn là hợp pháp.",
                    effects: {
                        legalAnalysis: -8,
                        evidence: -5
                    }
                },

                {
                    id: "D",
                    text:
                        "Không cần kiểm tra vì vấn đề chính là quyết định sa thải.",
                    effects: {
                        evidence: -12,
                        caseUnderstanding: -10
                    }
                }
            ]
        },

        {
            id: "Q204",

            title: "Số liệu kho",

            situation:
                "E206 cho thấy thực tế có chênh lệch giữa hàng hóa và số liệu hệ thống.",

            choices: [

                {
                    id: "A",
                    text:
                        "Kết luận Quân chắc chắn phát hiện ra người làm thất thoát hàng.",
                    effects: {
                        legalAnalysis: -8,
                        argument: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Bỏ qua chênh lệch vì đây là vấn đề của bộ phận kho.",
                    effects: {
                        evidence: -10,
                        caseUnderstanding: -10
                    }
                },

                {
                    id: "C",
                    text:
                        "Xác định chênh lệch là một tình tiết cần đối chiếu với thời điểm Quân truy cập hệ thống.",
                    effects: {
                        evidence: 12,
                        caseUnderstanding: 14,
                        argument: 8
                    },
                    unlocks: [
                        "check_inventory"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Dùng chênh lệch kho để cáo buộc ngược lại công ty.",
                    effects: {
                        legalAnalysis: -5,
                        procedure: -6
                    }
                }
            ]
        },

        {
            id: "Q205",

            title: "Lời khai trưởng kho",

            situation:
                "Trưởng kho thừa nhận Quân được phép kiểm tra số liệu nhưng không nhớ rõ phạm vi quyền truy cập.",

            choices: [

                {
                    id: "A",
                    text:
                        "Xem đây là bằng chứng tuyệt đối rằng Quân được phép làm mọi thứ.",
                    effects: {
                        legalAnalysis: -8,
                        evidence: -6
                    }
                },

                {
                    id: "B",
                    text:
                        "Bỏ lời khai vì nhân chứng là quản lý của Quân.",
                    effects: {
                        evidence: -6
                    }
                },

                {
                    id: "C",
                    text:
                        "Đối chiếu lời khai với quyền truy cập thực tế, lịch sử hệ thống và nội quy.",
                    effects: {
                        evidence: 12,
                        legalAnalysis: 12,
                        argument: 10
                    },
                    unlocks: [
                        "interview_manager"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Cho rằng trưởng kho phải chịu trách nhiệm thay cho Quân.",
                    effects: {
                        legalAnalysis: -10,
                        argument: -8
                    }
                }
            ]
        },

        {
            id: "Q206",

            title: "Camera kho",

            situation:
                "Camera cho thấy Quân có mặt tại kho vào thời điểm tài khoản của Quân đăng nhập.",

            choices: [

                {
                    id: "A",
                    text:
                        "Camera chứng minh chắc chắn Quân thực hiện mọi thao tác trên máy.",
                    effects: {
                        legalAnalysis: -7,
                        evidence: -5
                    }
                },

                {
                    id: "B",
                    text:
                        "Camera không có giá trị gì.",
                    effects: {
                        evidence: -8
                    }
                },

                {
                    id: "C",
                    text:
                        "Dùng camera để đối chiếu thời gian với log hệ thống và các chứng cứ khác.",
                    effects: {
                        evidence: 10,
                        caseUnderstanding: 10,
                        argument: 8
                    },
                    unlocks: [
                        "check_camera"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Dùng camera làm căn cứ duy nhất.",
                    effects: {
                        evidence: -10,
                        argument: -5
                    }
                }
            ]
        },

        {
            id: "Q207",

            title: "Thủ tục kỷ luật",

            situation:
                "Hồ sơ cho thấy Quân đã được yêu cầu giải trình trước khi có quyết định sa thải.",

            choices: [

                {
                    id: "A",
                    text:
                        "Có giải trình nghĩa là thủ tục chắc chắn hợp lệ.",
                    effects: {
                        legalAnalysis: -10,
                        procedure: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Không cần xem thủ tục vì chỉ cần chứng minh Quân không sai.",
                    effects: {
                        procedure: -12
                    }
                },

                {
                    id: "C",
                    text:
                        "Kiểm tra đầy đủ quá trình từ thông báo, giải trình đến quyết định và căn cứ áp dụng.",
                    effects: {
                        procedure: 15,
                        legalAnalysis: 12,
                        caseUnderstanding: 10
                    },
                    unlocks: [
                        "review_discipline"
                    ]
                },

                {
                    id: "D",
                    text:
                        "Kết luận công ty sai chỉ vì Quân đã bị sa thải.",
                    effects: {
                        legalAnalysis: -12,
                        argument: -8
                    }
                }
            ]
        },

        {
            id: "Q208",

            title: "Tin nhắn của trưởng kho",

            situation:
                "E213 cho thấy trưởng kho từng yêu cầu Quân kiểm tra số liệu trên hệ thống.",

            choices: [

                {
                    id: "A",
                    text:
                        "Đây là bằng chứng duy nhất chứng minh công ty sai.",
                    effects: {
                        evidence: -5,
                        argument: -5
                    }
                },

                {
                    id: "B",
                    text:
                        "Đây là tình tiết quan trọng cần đối chiếu với quyền truy cập và nội quy.",
                    effects: {
                        evidence: 12,
                        legalAnalysis: 12,
                        argument: 10
                    },
                    unlocks: [
                        "review_messages"
                    ]
                },

                {
                    id: "C",
                    text:
                        "Bỏ qua vì tin nhắn chỉ là giao tiếp giữa nhân viên.",
                    effects: {
                        evidence: -10
                    }
                },

                {
                    id: "D",
                    text:
                        "Dùng tin nhắn để kết luận trưởng kho phải chịu toàn bộ trách nhiệm.",
                    effects: {
                        legalAnalysis: -8,
                        argument: -8
                    }
                }
            ]
        },

        {
            id: "Q209",

            title: "Xác định thiệt hại",

            situation:
                "Quân muốn yêu cầu các khoản tiền phát sinh sau khi mất việc.",

            choices: [

                {
                    id: "A",
                    text:
                        "Yêu cầu công ty trả bất kỳ khoản tiền nào Quân đưa ra.",
                    effects: {
                        legalAnalysis: -12,
                        argument: -10
                    }
                },

                {
                    id: "B",
                    text:
                        "Kiểm tra bảng lương, thời gian làm việc và căn cứ của từng khoản trước khi yêu cầu.",
                    effects: {
                        legalAnalysis: 12,
                        evidence: 10,
                        argument: 10
                    },
                    unlocks: [
                        "check_salary"
                    ]
                },

                {
                    id: "C",
                    text:
                        "Không cần quan tâm tiền vì vụ án chỉ liên quan đến việc sa thải.",
                    effects: {
                        caseUnderstanding: -8
                    }
                },

                {
                    id: "D",
                    text:
                        "Tự ước tính một khoản tiền lớn để gây áp lực.",
                    effects: {
                        argument: -12,
                        legalAnalysis: -10
                    }
                }
            ]
        },

        {
            id: "Q210",

            title: "Lập luận cuối cùng",

            situation:
                "Toàn bộ hồ sơ đã được kiểm tra. Đây là lựa chọn cuối cùng trước khi kết thúc vụ án.",

            choices: [

                {
                    id: "A",
                    text:
                        "Chỉ tập trung nói rằng Quân là người tố cáo sai phạm nên công ty không được sa thải.",
                    effects: {
                        legalAnalysis: -8,
                        argument: -8
                    }
                },

                {
                    id: "B",
                    text:
                        "Tập trung vào toàn bộ hồ sơ: hành vi bị cáo buộc, quyền truy cập, nội quy, chứng cứ hệ thống và trình tự xử lý.",
                    effects: {
                        legalAnalysis: 16,
                        evidence: 14,
                        procedure: 16,
                        argument: 16,
                        caseUnderstanding: 16
                    }
                },

                {
                    id: "C",
                    text:
                        "Yêu cầu công ty nhận lỗi hoàn toàn mà không cần phân tích chứng cứ.",
                    effects: {
                        argument: -12,
                        procedure: -8
                    }
                },

                {
                    id: "D",
                    text:
                        "Khuyên Quân bỏ tranh chấp vì công ty có nhiều nhân viên hơn.",
                    effects: {
                        clientTrust: -20,
                        argument: -15
                    }
                }
            ]
        }
    ],

    // =========================================================
    // 8. NHÁNH MỞ CHỨNG CỨ
    // =========================================================

    branches: {

        review_email: {
            unlocks: ["E203"]
        },

        review_rules: {
            unlocks: ["E204"]
        },

        check_system_log: {
            unlocks: ["E205"]
        },

        check_inventory: {
            unlocks: ["E206"]
        },

        review_explanation: {
            unlocks: ["E207"]
        },

        check_camera: {
            unlocks: ["E208"]
        },

        interview_manager: {
            unlocks: ["E209"]
        },

        review_discipline: {
            unlocks: ["E210"]
        },

        check_access: {
            unlocks: ["E211"]
        },

        check_salary: {
            unlocks: ["E212"]
        },

        review_messages: {
            unlocks: ["E213"]
        }
    },

    // =========================================================
    // 9. KẾT CỤC
    // =========================================================

    endings: [

        {
            id: "E201_END",
            range: [90, 100],
            title: "Bảo vệ thành công quyền lợi người lao động",
            type: "WIN",
            description:
                "Luật sư đã xây dựng hồ sơ dựa trên chứng cứ và xử lý được các vấn đề trọng tâm của tranh chấp.",
            rewardMultiplier: 1.25,
            reputation: 25
        },

        {
            id: "E202_END",
            range: [80, 89],
            title: "Thắng với một số hạn chế",
            type: "WIN_PARTIAL",
            description:
                "Hướng xử lý chính có cơ sở nhưng một số vấn đề trong hồ sơ vẫn chưa được làm rõ hoàn toàn.",
            rewardMultiplier: 1,
            reputation: 18
        },

        {
            id: "E203_END",
            range: [70, 79],
            title: "Bảo vệ được một phần quyền lợi",
            type: "PARTIAL",
            description:
                "Khách hàng đạt được một phần mục tiêu nhưng kết quả không hoàn toàn như mong muốn.",
            rewardMultiplier: 0.8,
            reputation: 10
        },

        {
            id: "E204_END",
            range: [60, 69],
            title: "Tranh chấp kéo dài",
            type: "UNCERTAIN",
            description:
                "Hồ sơ có những điểm có lợi nhưng vẫn còn nhiều vấn đề cần được xác minh.",
            rewardMultiplier: 0.5,
            reputation: 3
        },

        {
            id: "E205_END",
            range: [50, 59],
            title: "Kết quả không rõ ràng",
            type: "UNCERTAIN",
            description:
                "Hai bên đều có những lập luận và chứng cứ nhất định.",
            rewardMultiplier: 0.4,
            reputation: 0
        },

        {
            id: "E206_END",
            range: [30, 49],
            title: "Thất bại trong tranh chấp",
            type: "LOSE",
            description:
                "Hồ sơ chưa đủ mạnh để bảo vệ yêu cầu của khách hàng.",
            rewardMultiplier: 0,
            reputation: -10
        },

        {
            id: "E207_END",
            range: [10, 29],
            title: "Sai lầm nghiêm trọng",
            type: "LOSE_BAD",
            description:
                "Luật sư bỏ qua nhiều tình tiết quan trọng hoặc lựa chọn chiến lược không phù hợp.",
            rewardMultiplier: 0,
            reputation: -17
        },

        {
            id: "E208_END",
            range: [0, 9],
            title: "Thua vụ án",
            type: "LOSE_ALWAYS",
            description:
                "Phân tích hồ sơ có sai sót nghiêm trọng.",
            rewardMultiplier: 0,
            reputation: -25
        }
    ],

    // =========================================================
    // 10. TÍNH ĐIỂM
    // =========================================================

    calculateScore(stats) {

        const normalize = (value, base = 50) => {

            const result = base + value;

            return Math.max(
                0,
                Math.min(100, result)
            );
        };

        const values = {

            legalAnalysis:
                normalize(stats.legalAnalysis),

            evidence:
                normalize(stats.evidence),

            procedure:
                normalize(stats.procedure),

            argument:
                normalize(stats.argument),

            caseUnderstanding:
                normalize(stats.caseUnderstanding),

            clientTrust:
                normalize(
                    stats.clientTrust - 50
                )
        };

        const score =
            values.legalAnalysis * 0.25 +
            values.evidence * 0.20 +
            values.procedure * 0.15 +
            values.argument * 0.20 +
            values.caseUnderstanding * 0.15 +
            values.clientTrust * 0.05;

        return Math.round(
            Math.max(
                0,
                Math.min(100, score)
            )
        );
    },

    // =========================================================
    // 11. RESOLVE KẾT QUẢ
    // =========================================================

    resolveEnding(score, random = Math.random()) {

        /*
         * Dưới 10:
         * Thua luôn.
         */

        if (score < 10) {

            return this.endings.find(
                e => e.id === "E208_END"
            );
        }

        /*
         * 10-49:
         * Tỷ lệ thua cao.
         */

        if (score < 50) {

            return this.endings.find(
                e => e.id === "E206_END"
            );
        }

        /*
         * >=90:
         * Thắng chắc.
         */

        if (score >= 90) {

            return this.endings.find(
                e => e.id === "E201_END"
            );
        }

        /*
         * 50-89:
         * Không công bố trước.
         * Có yếu tố ngẫu nhiên.
         */

        const winChance = score / 100;

        if (random < winChance) {

            if (score >= 80) {

                return this.endings.find(
                    e => e.id === "E202_END"
                );
            }

            if (score >= 70) {

                return this.endings.find(
                    e => e.id === "E203_END"
                );
            }

            return this.endings.find(
                e => e.id === "E204_END"
            );
        }

        return this.endings.find(
            e => e.id === "E205_END"
        );
    }
};

window.APX_LAW_CASES = window.APX_LAW_CASES || [];
window.APX_LAW_CASES.push(CASE_002);
