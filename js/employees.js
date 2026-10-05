/* =========================================================
   APX BUSINESS WORLD — KHU VỰC NHÂN VIÊN
   Gồm danh sách nhân viên, tuyển dụng, phòng ban và đào tạo.
   ========================================================= */

window.APXPages = window.APXPages || {};

(function () {
  function safeText(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      var replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[char];
    });
  }

  function pageHeading(title, description) {
    return (
      '<header class="page-heading">' +
        '<span class="eyebrow">APX GROUP · NHÂN SỰ</span>' +
        "<h1>" + title + "</h1>" +
      "</header>"
    );
  }

  function allPeople(state) {
    var hiredPeople = state.hired.map(function (candidateId) {
      var candidate = window.APX_DATA.candidates.find(function (candidate) {
        return candidate.id === candidateId;
      });
      return candidate && window.APXCompanies
        ? window.APXCompanies.hydrateEmployee(state, candidate)
        : candidate;
    }).filter(Boolean);

    return hiredPeople;
  }

  function totalGroupEmployees(state) {
    if (window.APXCompanies) {
      return window.APXCompanies.getCompanySummary(state).employees;
    }
    return state.hired.length;
  }

  function portraitIndexFor(person) {
    var ownIndex = Number(person.portraitIndex);

    if (isFinite(ownIndex) && ownIndex >= 0 && ownIndex < 50) {
      return Math.floor(ownIndex);
    }

    var roster = window.APX_DATA.employees || [];
    var matchingEmployee = roster.find(function (employee) {
      return employee.name === person.name &&
        isFinite(Number(employee.portraitIndex));
    });

    if (matchingEmployee) {
      return Math.floor(Number(matchingEmployee.portraitIndex));
    }

    return -1;
  }

  function portraitMarkup(person, extraClass, size) {
    var portraitIndex = portraitIndexFor(person);
    var initials = person.initials || person.name.slice(0, 1);
    var className = "portrait " + (extraClass || "");

    if (portraitIndex < 0) {
      return (
        '<span class="' + safeText(className) + '">' +
          safeText(initials) +
        "</span>"
      );
    }

    var column = portraitIndex % 10;
    var row = Math.floor(portraitIndex / 10);
    var xPosition = (column / 9) * 100;
    var yPosition = row * (400 / 17);
    var avatarSize = Number(size) || 58;

    var portraitStyle = [
      "display:inline-flex",
      "width:" + avatarSize + "px",
      "height:" + avatarSize + "px",
      "flex:0 0 " + avatarSize + "px",
      "overflow:hidden",
      "background-color:#14262d",
      "background-image:url(assets/portraits/employee-sheet.png)",
      "background-repeat:no-repeat",
      "background-size:1000% auto",
      "background-position:" + xPosition.toFixed(2) + "% " +
        yPosition.toFixed(2) + "%",
      "border:1px solid rgba(216,187,113,.45)",
      "border-radius:14px",
      "box-shadow:0 8px 20px rgba(0,0,0,.22)"
    ].join(";");

    return (
      '<span class="' + safeText(className + " portrait-photo") + '"' +
        ' role="img"' +
        ' aria-label="Chân dung ' + safeText(person.name) + '"' +
        ' title="' + safeText(person.name) + '"' +
        ' style="' + portraitStyle + '">' +
      "</span>"
    );
  }

  function directoryPage(state) {
    var search = String(state.employeeSearch || "").trim().toLowerCase();
    var people = allPeople(state).filter(function (person) {
      var name = person.name.toLowerCase();
      var role = person.role.toLowerCase();
      var department = (person.department || "").toLowerCase();

      return !search ||
        name.includes(search) ||
        role.includes(search) ||
        department.includes(search);
    });

    return (
      pageHeading(
        "Danh sách nhân viên",
        "Danh sách chỉ hiển thị NPC bạn đã chiêu mộ vào doanh nghiệp của mình."
      ) +

      '<section class="employee-summary-grid grid three">' +
        '<article class="metric"><small>NHÂN VIÊN ĐÃ CHIÊU MỘ</small>' +
          "<strong>" + totalGroupEmployees(state) + "</strong>" +
          '<span class="metric-detail">NPC đang thuộc sở hữu của bạn</span></article>' +
        '<article class="metric"><small>HỒ SƠ ĐANG HIỂN THỊ</small>' +
          "<strong>" + people.length + "</strong>" +
          '<span class="metric-detail">Hồ sơ nhân viên của bạn</span></article>' +
        '<article class="metric"><small>ĐÃ TUYỂN THÊM</small>' +
          "<strong>" + state.hired.length + "</strong>" +
          '<span class="metric-detail">Ứng viên tuyển qua trang này</span></article>' +
      "</section>" +

      '<section class="employee-toolbar panel">' +
        '<label for="employeeSearch">' +
          '<span class="eyebrow">TRA CỨU HỒ SƠ</span>' +
          "<strong>Tìm nhân viên theo tên, chức vụ hoặc phòng ban</strong>" +
        "</label>" +
        '<input id="employeeSearch" type="search" autocomplete="off" ' +
          'placeholder="Ví dụ: An Phú, Marketing..." value="' +
          safeText(state.employeeSearch || "") + '">' +
      "</section>" +

      (people.length
        ? '<section class="employee-directory-grid grid two" aria-label="Hồ sơ nhân viên">' +
            people.map(employeeCard).join("") +
          "</section>"
        : '<section class="employee-empty panel">' +
            '<span class="empty-state-mark" aria-hidden="true">—</span>' +
            "<h2>Không tìm thấy nhân viên</h2>" +
            "<p>Thử tên, chức vụ hoặc phòng ban khác.</p>" +
          "</section>")
    );
  }

  function employeeCard(person) {
    var skills = (person.skills || []).map(function (skill) {
      return '<span class="employee-skill-chip">' + safeText(skill) + "</span>";
    }).join("");

    var performance = Math.max(0, Math.min(100, Number(person.performance) || 0));

    return (
      '<article class="employee-card panel">' +
        '<details class="employee-details">' +
          '<summary class="employee-summary">' +
            portraitMarkup(person, "employee-portrait", 58) +

            '<span class="employee-summary-copy">' +
              "<strong>" + safeText(person.name) + "</strong>" +
              "<small>" + safeText(person.role) + "</small>" +
            "</span>" +

            '<span class="employee-level">CẤP ' +
              safeText(person.level || 1) + "</span>" +

            '<span class="employee-expand-mark" aria-hidden="true">+</span>' +
          "</summary>" +

          '<div class="employee-profile-detail">' +
            '<div class="data-row"><span>Phòng ban</span><strong>' +
              safeText(person.department || "Chưa phân công") + "</strong></div>" +
            '<div class="data-row"><span>Công ty</span><strong>' +
              safeText(person.company || "APX Group") + "</strong></div>" +
            '<div class="data-row"><span>Nơi làm việc</span><strong>' +
              safeText(person.branch || "Chưa phân công") + "</strong></div>" +
            '<div class="data-row"><span>Lương tháng</span><strong>' +
              window.APXUI.money(person.salary) + "</strong></div>" +

            '<div class="employee-performance">' +
              '<div class="employee-performance-heading">' +
                "<span>Hiệu suất mẫu</span><strong>" + performance + " / 100</strong>" +
              "</div>" +
              '<div class="progress" role="progressbar" aria-label="Hiệu suất ' +
                safeText(person.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
                performance + '">' +
                '<span style="width:' + performance + '%"></span>' +
              "</div>" +
            "</div>" +

            '<div class="employee-skill-list">' +
              "<small>KỸ NĂNG</small>" +
              (skills || "<span>Chưa có thông tin kỹ năng.</span>") +
            "</div>" +
          "</div>" +
        "</details>" +
      "</article>"
    );
  }

  function hiringPage(state) {
    var availableCandidates = window.APXCompanies
      ? window.APXCompanies.getAvailableCandidates(state)
      : (window.APX_DATA.candidates || []).filter(function (candidate) {
          return !candidate.legacyCandidate && !state.hired.includes(candidate.id);
        });
    var offers = window.APXCompanies && window.APXCompanies.getRecruitmentOffers
      ? window.APXCompanies.getRecruitmentOffers(state)
      : availableCandidates.slice(0, 3);
    var employeeLimit = window.APXCompanies ? window.APXCompanies.getEmployeeLimit(state) : 0;
    var companies = window.APXCompanies ? window.APXCompanies.getCompanies(state) : [];
    var ticketCount = Number(state.inventory && state.inventory["recruitment-ticket"]) || 0;
    var hireLimitReached = !employeeLimit || state.hired.length >= employeeLimit;
    var ticketDefinition = (window.APX_DATA.items || []).find(function (item) {
      return item.id === "recruitment-ticket";
    });
    var ticketPrice = Number(ticketDefinition && ticketDefinition.price);
    var ticketPriceLabel = Number.isSafeInteger(ticketPrice) && ticketPrice > 0
      ? window.APXUI.money(ticketPrice)
      : "chưa cấu hình";
    var canAffordTicket = Number.isSafeInteger(ticketPrice) && ticketPrice > 0 &&
      (Number(state.cash) || 0) >= ticketPrice;
    var canBuyTicket = companies.length > 0 && canAffordTicket;
    var voucherEntry = window.APXInventory && window.APXInventory.voucherEntry
      ? window.APXInventory.voucherEntry()
      : "";
    var ticketMarket = '<section class="hiring-ticket-market panel"><div><span class="eyebrow">VÉ TUYỂN DỤNG</span><h2>' + ticketCount + ' vé đang có</h2><button class="button button-gold" type="button" data-action="buy-recruitment-ticket"' + (canBuyTicket ? '' : ' disabled') + '>' + (!companies.length ? 'Cần thành lập công ty' : !canAffordTicket ? 'Không đủ tiền' : 'Mua 1 vé · ' + ticketPriceLabel) + '</button><p>Chỉ tiêu hao vé khi bạn xác nhận tuyển một ứng viên.</p></div></section>' + voucherEntry;
    var last = state.lastRecruited;
    var lastCard = last ? '<article class="recruit-result panel">' + portraitMarkup(last, "candidate-portrait", 76) + '<div><span class="eyebrow">KẾT QUẢ CHIÊU MỘ GẦN NHẤT · ' + safeText(last.rarity || "Thường") + '</span><h2>' + safeText(last.name) + '</h2><p>' + safeText(last.role) + ' · ' + safeText(last.department) + '</p><small>Cấp ' + safeText(last.level || 1) + ' · Lương tháng ' + window.APXUI.money(last.salary) + '</small></div></article>' : '';

    if (!companies.length) return pageHeading("Tuyển dụng", "Thành lập công ty để xem ứng viên và sử dụng vé tuyển dụng.") + ticketMarket + '<section class="panel employee-empty"><h2>Chưa có công ty để tiếp nhận nhân viên</h2><p>Thành lập công ty trước khi sử dụng vé tuyển dụng.</p><button class="button button-gold" type="button" data-action="section" data-section="company">Thành lập công ty</button></section>';

    return (
      pageHeading(
        "Tuyển dụng",
        "Xem trước lương và năng lực rồi chọn người phù hợp. Ứng viên luân phiên theo ngày trong game."
      ) + ticketMarket +

      '<section class="hiring-intro panel">' +
        '<span class="hiring-intro-mark" aria-hidden="true">HR</span>' +
        "<div><span class=\"eyebrow\">APX TALENT NETWORK</span>" +
          "<h2>Ứng viên đang tìm việc</h2>" +
          "<p>Mỗi ứng viên có mức lương cố định. Hãy cân nhắc khả năng chi trả của công ty trước khi tuyển.</p></div>" +
        '<span class="hiring-candidate-count">' +
          availableCandidates.length + "<small>NPC CHƯA SỞ HỮU · " + state.hired.length + "/" + employeeLimit + " CHỖ</small></span>" +
      "</section>" +
      (hireLimitReached
        ? '<section class="panel employee-empty"><h2>Đã đạt giới hạn nhân viên</h2><p>Nâng cấp công ty hoặc mở thêm chỗ trước khi tuyển.</p></section>'
        : !offers.length
          ? '<section class="panel employee-empty"><h2>Không còn ứng viên mới</h2><p>Đã chiêu mộ hết NPC hiện có trong danh sách.</p></section>'
          : '<section class="recruitment-offers grid three">' + offers.map(function (candidate) {
              var performance = Math.max(0, Math.min(100, Number(candidate.performance) || 0));
              var disabled = ticketCount < 1;
              var skills = (candidate.skills || []).map(function (skill) {
                return '<span class="employee-skill-chip">' + safeText(skill) + '</span>';
              }).join("");
              return '<article class="candidate-card panel">' +
                '<div class="candidate-heading">' + portraitMarkup(candidate, "candidate-portrait", 58) +
                  '<span class="candidate-heading-copy"><span class="eyebrow">ỨNG VIÊN · CẤP ' + safeText(candidate.level || 1) + '</span>' +
                    '<h2>' + safeText(candidate.name) + '</h2><p>' + safeText(candidate.role) + ' · ' + safeText(candidate.department) + '</p></span></div>' +
                '<div class="candidate-facts"><div><small>LƯƠNG THÁNG</small><strong>' + window.APXUI.money(candidate.salary) + '</strong></div>' +
                  '<div><small>HIỆU SUẤT BAN ĐẦU</small><strong>' + performance + ' / 100</strong></div></div>' +
                '<div class="candidate-performance"><div class="employee-performance-heading"><span>Đánh giá hồ sơ</span><strong>' + performance + ' / 100</strong></div>' +
                  '<div class="progress" role="progressbar" aria-label="Đánh giá ' + safeText(candidate.name) +
                    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + performance + '"><span style="width:' + performance + '%"></span></div></div>' +
                '<div class="employee-skill-list"><small>KỸ NĂNG NỔI BẬT</small>' + (skills || '<span>Chưa có thông tin kỹ năng.</span>') + '</div>' +
                '<button class="button button-gold" type="button" data-action="hire-candidate" data-id="' + safeText(candidate.id) + '"' + (disabled ? ' disabled' : '') + '>' +
                  (disabled ? 'Cần vé tuyển dụng' : 'Tuyển ứng viên · 1 vé') + '</button></article>';
            }).join("") + '</section>') +
      lastCard +
      '<section class="hiring-note panel"><strong>Giới hạn nhân viên</strong><p>C1 · 5　C2 · 10　C3 · 20　C4 · 30　C5 · 50</p><p>Ứng viên được tuyển sẽ vào biên chế và phát sinh lương khi công ty đóng sổ ngày.</p></section>'
    );
  }

  function candidateCard(person, hireLimitReached) {
    var performance = Math.max(0, Math.min(100, Number(person.performance) || 0));
    var skills = (person.skills || []).map(function (skill) {
      return '<span class="employee-skill-chip">' + safeText(skill) + "</span>";
    }).join("");

    return (
      '<article class="candidate-card panel">' +
        '<div class="candidate-heading">' +
          portraitMarkup(person, "candidate-portrait", 58) +
          '<span class="candidate-heading-copy">' +
            '<span class="eyebrow">ỨNG VIÊN · CẤP ' + safeText(person.level || 1) + "</span>" +
            "<h2>" + safeText(person.name) + "</h2>" +
            "<p>" + safeText(person.role) + "</p>" +
          "</span>" +
        "</div>" +

        '<div class="candidate-facts">' +
          '<div><small>PHÒNG BAN</small><strong>' +
            safeText(person.department) + "</strong></div>" +
          '<div><small>LƯƠNG THÁNG</small><strong>' +
            window.APXUI.money(person.salary) + "</strong></div>" +
        "</div>" +

        '<div class="candidate-performance">' +
          '<div class="employee-performance-heading">' +
            "<span>Đánh giá hồ sơ</span><strong>" + performance + " / 100</strong>" +
          "</div>" +
          '<div class="progress" role="progressbar" aria-label="Đánh giá ' +
            safeText(person.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            performance + '">' +
            '<span style="width:' + performance + '%"></span>' +
          "</div>" +
        "</div>" +

        '<div class="employee-skill-list">' +
          "<small>KỸ NĂNG NỔI BẬT</small>" +
          skills +
        "</div>" +

        '<div class="candidate-actions">' +
          '<button class="button button-gold" type="button" data-action="hire" data-id="' +
            safeText(person.id) + '"' + (hireLimitReached ? ' disabled title="Tăng cấp hoặc kỹ năng Lãnh đạo để mở thêm chỗ"' : '') + '>' +
            (hireLimitReached ? 'Đã đạt giới hạn nhân sự' : 'Tuyển dụng') + '</button>' +
        "</div>" +
      "</article>"
    );
  }

  function departmentsPage(state) {
    var people = allPeople(state);
    var departments = (window.APX_DATA.departments || []).slice();

    people.forEach(function (person) {
      if (person.department && departments.indexOf(person.department) === -1) {
        departments.push(person.department);
      }
    });

    return (
      pageHeading(
        "Phòng ban",
        "Các bộ phận chuyên môn trong hệ sinh thái APX."
      ) +

      '<section class="department-grid grid three" aria-label="Các phòng ban">' +
        departments.map(function (department, index) {
          var members = people.filter(function (person) {
            return person.department === department;
          });

          var portraits = members.slice(0, 4).map(function (person) {
            return portraitMarkup(person, "department-avatar", 34);
          }).join("");

          return (
            '<article class="department-card panel">' +
              '<div class="department-card-top">' +
                '<span class="department-index">' +
                  String(index + 1).padStart(2, "0") +
                "</span>" +
                '<span class="department-member-count">' +
                  members.length + " hồ sơ</span>" +
              "</div>" +
              "<h3>" + safeText(department) + "</h3>" +
              "<p>" + departmentDescription(department) + "</p>" +
              '<div class="department-team">' +
                (portraits || '<span class="department-empty">Chưa có hồ sơ mẫu</span>') +
              "</div>" +
              (members.length
                ? '<div class="department-member-list">' +
                    members.map(function (person) {
                      return '<div class="data-row"><span>' +
                        safeText(person.name) + "<small>" + safeText(person.role) +
                        "</small></span><strong>" + safeText(person.level || 1) +
                        "</strong></div>";
                    }).join("") +
                  "</div>"
                : "") +
            "</article>"
          );
        }).join("") +
      "</section>"
    );
  }

  function departmentDescription(name) {
    var descriptions = {
      "Ban giám đốc": "Định hướng chiến lược và mục tiêu chung của tập đoàn.",
      "Kinh doanh": "Phát triển quan hệ khách hàng và mở rộng hoạt động thương mại.",
      "Tài chính": "Theo dõi ngân sách, báo cáo và quyết định đầu tư.",
      "Marketing": "Phát triển thương hiệu và kết nối với khách hàng.",
      "Nhân sự": "Tuyển dụng, đào tạo và hỗ trợ đội ngũ.",
      "Công nghệ": "Xây dựng sản phẩm số và hạ tầng công nghệ.",
      "Dự án": "Lập kế hoạch và điều phối các dự án của tập đoàn.",
      "Vận hành": "Đảm bảo công ty và chi nhánh hoạt động ổn định."
    };

    return descriptions[name] || "Bộ phận chuyên môn của APX Group.";
  }

  function trainingPage(state) {
    var course = window.APXCompanies && window.APXCompanies.getEmployeeTrainingCourse
      ? window.APXCompanies.getEmployeeTrainingCourse("service")
      : null;
    var companies = window.APXCompanies && window.APXCompanies.getCompanies
      ? window.APXCompanies.getCompanies(state)
      : [];
    var employees = [];
    companies.forEach(function (company) {
      if (!window.APXCompanies || !window.APXCompanies.getCompanyEmployees) return;
      window.APXCompanies.getCompanyEmployees(company.id, state).forEach(function (employee) {
        if (employee.status !== "Đang làm việc") return;
        var performance = Math.max(0, Number(employee.performance) || 0);
        var companyCash = Math.max(0, Number(company.cash) || 0);
        employees.push({
          id: employee.id || employee.employeeId,
          name: employee.name,
          companyName: company.name,
          performance: performance,
          companyCash: companyCash,
          eligible: performance < (course ? course.performanceCap : 100) && companyCash >= (course ? course.cost : Infinity)
        });
      });
    });
    function escapeTraining(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
      });
    }
    var eligibleEmployees = employees.filter(function (employee) { return employee.eligible; });
    var serviceMarkup = course
      ? '<article class="training-card panel"><div class="training-card-top"><span class="training-index">01</span><span class="training-category">VẬN HÀNH</span></div><h3>' + escapeTraining(course.name) + '</h3><p>Nâng hiệu suất phục vụ của một nhân viên; hiệu suất đội ngũ ảnh hưởng trực tiếp đến nhu cầu và doanh thu công ty.</p><div class="training-duration"><small>CHI PHÍ / NHÂN VIÊN</small><strong>' + window.APXUI.money(course.cost) + '</strong></div><p>+ ' + course.performanceGain + ' điểm hiệu suất, tối đa ' + course.performanceCap + '%. Một buổi đào tạo; công ty của nhân viên thanh toán.</p>' +
        (employees.length
          ? '<form id="employeeTrainingForm"><input type="hidden" name="courseId" value="service"><label class="training-employee-picker">Nhân viên<select name="employeeId" required>' + employees.map(function (employee) {
              var availability = employee.performance >= course.performanceCap
                ? " · đã đạt trần"
                : employee.companyCash < course.cost ? " · quỹ công ty chưa đủ" : "";
              return '<option value="' + escapeTraining(employee.id) + '"' + (!employee.eligible ? " disabled" : "") + '>' + escapeTraining(employee.name) + ' · ' + escapeTraining(employee.companyName) + ' · ' + employee.performance + '% hiệu suất · quỹ ' + window.APXUI.money(employee.companyCash) + availability + '</option>';
            }).join("") + '</select></label><button class="button button-gold" type="submit"' + (eligibleEmployees.length ? "" : " disabled") + '>Đào tạo nhân viên</button></form>'
          : '<p>Chưa có nhân viên được phân công đang làm việc để đào tạo.</p>') +
        '</article>'
      : '<article class="training-card panel"><h3>Trải nghiệm khách hàng</h3><p>Hệ thống vận hành chưa sẵn sàng.</p><button class="button training-disabled" type="button" disabled>CHƯA KHẢ DỤNG</button></article>';
    var lockedPrograms = [
      { id: "leadership", name: "Lãnh đạo đội nhóm", category: "QUẢN LÝ", description: "Kỹ năng giao việc, phản hồi và hỗ trợ đội ngũ." },
      { id: "finance", name: "Phân tích tài chính", category: "TÀI CHÍNH", description: "Đọc báo cáo và đánh giá hiệu quả hoạt động." }
    ];

    return (
      pageHeading(
        "Đào tạo",
        "Đầu tư vào đội ngũ để cải thiện hiệu suất vận hành của công ty."
      ) +

      '<section class="training-intro panel">' +
        '<span class="training-intro-mark" aria-hidden="true">APX</span>' +
        "<div><span class=\"eyebrow\">APX ACADEMY</span>" +
          "<h2>Đào tạo có tác động thật</h2>" +
          "<p>Chi phí trừ vào ngân quỹ công ty, còn hiệu suất mới ảnh hưởng đến nhu cầu và doanh thu những ngày sau.</p></div>" +
      "</section>" +

      '<section class="training-grid grid three" aria-label="Chương trình đào tạo">' +
        serviceMarkup +
        lockedPrograms.map(function (program, index) {
          return (
            '<article class="training-card panel">' +
              '<div class="training-card-top">' +
                '<span class="training-index">0' + (index + 2) + "</span>" +
                '<span class="training-category">' + program.category + "</span>" +
              "</div>" +
              "<h3>" + program.name + "</h3>" +
              "<p>" + program.description + "</p>" +
              '<div class="training-duration"><small>TRẠNG THÁI</small><strong>Chưa mở</strong></div>' +
              '<button class="button training-disabled" type="button" disabled ' +
                'title="Chương trình này chưa được triển khai">CHƯA MỞ</button>' +
            "</article>"
          );
        }).join("") +
      "</section>"
    );
  }

  window.APXPages.employees = function (page, state) {
    if (page === "hiring") {
      return hiringPage(state);
    }

    if (page === "departments") {
      return departmentsPage(state);
    }

    if (page === "training") {
      return trainingPage(state);
    }

    return directoryPage(state);
  };
})();
