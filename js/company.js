/* =========================================================
   APX BUSINESS WORLD — KHU VỰC CÔNG TY
   Gồm tổng quan tập đoàn, danh sách công ty, tài chính
   và thị trường.
   ========================================================= */

window.APXPages = window.APXPages || {};

(function () {
  function pageHeading(title, description) {
    return (
      '<header class="page-heading">' +
        '<span class="eyebrow">APX GROUP · ĐIỀU HÀNH TẬP ĐOÀN</span>' +
        "<h1>" + title + "</h1>" +
        "<p>" + description + "</p>" +
      "</header>"
    );
  }

  function totalActiveProjectRevenue(state) {
    return state.projects
      .filter(function (project) {
        return project.status === "Đang hoạt động";
      })
      .reduce(function (sum, project) {
        return sum + (Number(project.monthlyRevenue) || 0);
      }, 0);
  }

  function totalMonthlyRevenue(state) {
    var companyRevenue = window.APX_DATA.companies.reduce(function (sum, company) {
      return sum + company.revenue;
    }, 0);

    return companyRevenue + totalActiveProjectRevenue(state);
  }

  function totalMonthlyPayroll(state) {
    return state.hired.reduce(function (sum, candidateId) {
      var person = window.APX_DATA.candidates.find(function (candidate) {
        return candidate.id === candidateId;
      });

      return sum + (person ? person.salary : 0);
    }, 0);
  }

  function metric(label, value, note, extraClass) {
    return (
      '<article class="metric ' + (extraClass || "") + '">' +
        "<small>" + label + "</small>" +
        "<strong>" + value + "</strong>" +
        (note ? '<span class="metric-detail">' + note + "</span>" : "") +
      "</article>"
    );
  }

  function companyCard(company) {
    return (
      '<article class="company-card panel" style="--company-color:' + company.color + '">' +
        '<div class="company-card-heading">' +
          '<span class="company-brand-mark" aria-hidden="true">' + company.symbol + "</span>" +
          '<span class="company-heading-copy">' +
            '<span class="company-sector">' + company.shortField + "</span>" +
            "<h2>" + company.name + "</h2>" +
          "</span>" +
          '<span class="company-growth">+' + company.growth + "%</span>" +
        "</div>" +

        '<p class="company-description">' + company.description + "</p>" +

        '<div class="company-card-image company-image-' + company.id + '">' +
          '<span>' + company.name.toUpperCase() + "</span>" +
          '<i aria-hidden="true"></i>' +
        "</div>" +

        '<div class="company-card-stats">' +
          '<div><small>DOANH THU / THÁNG</small><strong>' +
            window.APXUI.money(company.revenue) + "</strong></div>" +
          '<div><small>LỢI NHUẬN MẪU</small><strong>' +
            window.APXUI.money(company.profit) + "</strong></div>" +
          '<div><small>NHÂN SỰ</small><strong>' +
            company.staff + " người</strong></div>" +
        "</div>" +

        '<div class="company-card-detail">' +
          '<span><small>CHI NHÁNH</small><strong>' + company.branches.length + "</strong></span>" +
          '<span><small>SẢN PHẨM / DỰ ÁN</small><strong>' + company.products.length + "</strong></span>" +
          '<span><small>THÀNH LẬP</small><strong>' + company.founded + "</strong></span>" +
        "</div>" +
      "</article>"
    );
  }

  function overviewPage(state) {
    var companies = window.APX_DATA.companies;
    var revenue = totalMonthlyRevenue(state);
    var monthlyPayroll = totalMonthlyPayroll(state);
    var estimatedCosts = Math.round(revenue * 0.7) + monthlyPayroll;
    var estimatedProfit = revenue - estimatedCosts;
    var baseEmployees = companies.reduce(function (sum, company) {
      return sum + company.staff;
    }, 0);
    var totalEmployees = baseEmployees + state.hired.length;

    return (
      pageHeading(
        "APX Group",
        "Trung tâm điều hành các công ty, dự án và dòng tiền của tập đoàn."
      ) +

      '<section class="group-hero panel">' +
        '<div class="group-hero-brand">' +
          '<div class="group-emblem" aria-hidden="true"><span>A</span><i>PX</i></div>' +
          '<span class="group-est">EST. 2021 · VIETNAM</span>' +
        "</div>" +

        '<div class="group-hero-copy">' +
          '<span class="eyebrow">MỘT TẦM NHÌN · NHIỀU KHẢ NĂNG</span>' +
          "<h2>Xây dựng một hệ sinh thái bền vững.</h2>" +
          "<p>APX kết nối công nghệ, phong cách sống và không gian đô thị trong cùng một tập đoàn.</p>" +
          '<div class="group-hero-actions">' +
            '<button class="button button-gold" type="button" data-action="page" data-page="companies">Xem công ty</button>' +
            '<button class="button" type="button" data-action="page" data-page="finance">Mở tài chính</button>' +
          "</div>" +
        "</div>" +

        '<div class="group-hero-art" aria-hidden="true">' +
          '<span class="hero-moon"></span>' +
          '<span class="hero-tower tower-a"></span>' +
          '<span class="hero-tower tower-b"></span>' +
          '<span class="hero-tower tower-c"></span>' +
          '<span class="hero-ground"></span>' +
        "</div>" +
      "</section>" +

      '<section class="group-metrics grid four" aria-label="Chỉ số tập đoàn">' +
        metric("DOANH THU ƯỚC TÍNH / THÁNG", window.APXUI.money(revenue), "Có cộng doanh thu dự án đang chạy", "revenue-stat") +
        metric("LỢI NHUẬN ƯỚC TÍNH / THÁNG", window.APXUI.money(estimatedProfit), "Sau chi phí vận hành và tuyển dụng", "profit-stat") +
        metric("NHÂN SỰ TOÀN TẬP ĐOÀN", totalEmployees, "Gồm " + state.hired.length + " người tuyển thêm", "staff-stat") +
        metric("NGÂN QUỸ TẬP ĐOÀN", window.APXUI.money(state.treasury), "Cập nhật khi đóng ngày hoặc xây dựng", "treasury-stat") +
      "</section>" +

      '<section class="company-overview-grid grid two">' +
        '<article class="panel company-overview-list">' +
          '<div class="section-title-row">' +
            "<div><span class=\"eyebrow\">HỆ SINH THÁI APX</span><h2>Công ty thành viên</h2></div>" +
            '<button class="button" type="button" data-action="page" data-page="companies">Danh mục</button>' +
          "</div>" +
          companies.map(function (company) {
            return (
              '<div class="company-overview-row">' +
                '<span class="company-mini-mark" style="--company-color:' + company.color + '">' +
                  company.symbol + "</span>" +
                '<span class="company-overview-copy">' +
                  "<strong>" + company.name + "</strong>" +
                  "<small>" + company.field + "</small>" +
                "</span>" +
                '<span class="company-overview-revenue">' +
                  "<strong>" + window.APXUI.money(company.revenue) + "</strong>" +
                  "<small>DOANH THU / THÁNG</small>" +
                "</span>" +
              "</div>"
            );
          }).join("") +
        "</article>" +

        '<article class="panel company-finance-preview">' +
          '<div class="section-title-row">' +
            "<div><span class=\"eyebrow\">VẬN HÀNH</span><h2>Ngày kinh doanh gần nhất</h2></div>" +
            '<span class="finance-status-dot" aria-label="Đang theo dõi"></span>' +
          "</div>" +
          (state.ledger.length
            ? latestDaySummary(state.ledger[0])
            : '<div class="finance-empty"><span class="finance-empty-mark">01</span>' +
              "<strong>Chưa có ngày nào được khóa sổ</strong>" +
              "<p>Bấm Đóng ngày để ghi nhận doanh thu, chi phí và lợi nhuận đầu tiên.</p></div>") +
          '<button class="button" type="button" data-action="page" data-page="finance">Xem sổ tài chính</button>' +
        "</article>" +
      "</section>"
    );
  }

  function latestDaySummary(day) {
    return (
      '<div class="latest-day-number"><small>NGÀY ' + day.day + "</small>" +
        '<strong class="' + (day.profit >= 0 ? "positive" : "negative") + '">' +
          window.APXUI.money(day.profit) + "</strong>" +
        "<span>Lợi nhuận ròng</span></div>" +
      '<div class="latest-day-flow">' +
        '<div class="data-row"><span>Doanh thu</span><strong>' +
          window.APXUI.money(day.revenue) + "</strong></div>" +
        '<div class="data-row"><span>Chi phí</span><strong>' +
          window.APXUI.money(day.cost) + "</strong></div>" +
      "</div>"
    );
  }

  function companiesPage() {
    var companies = window.APX_DATA.companies;

    return (
      pageHeading(
        "Công ty thành viên",
        "Ba đơn vị hoạt động trong các lĩnh vực khác nhau của hệ sinh thái APX."
      ) +

      '<section class="company-portfolio-summary panel">' +
        '<span class="portfolio-emblem" aria-hidden="true">A</span>' +
        "<span><small>TẬP ĐOÀN MẸ</small><strong>APX Group</strong>" +
          "<i>Công nghệ · Phong cách sống · Bất động sản</i></span>" +
        '<span class="portfolio-count">' + companies.length + "<small>CÔNG TY</small></span>" +
      "</section>" +

      '<section class="company-card-grid grid three" aria-label="Danh sách công ty">' +
        companies.map(companyCard).join("") +
      "</section>" +

      '<section class="company-note panel">' +
        "<strong>Thông tin công ty</strong>" +
        "<p>Doanh thu, lợi nhuận và tốc độ tăng trưởng ban đầu là dữ liệu mô phỏng. " +
        "Những trang quản lý riêng cho từng công ty có thể được bổ sung ở phần tiếp theo.</p>" +
      "</section>"
    );
  }

  function financePage(state) {
    var revenue = totalMonthlyRevenue(state);
    var extraPayroll = totalMonthlyPayroll(state);
    var operatingCosts = Math.round(revenue * 0.7) + extraPayroll;
    var estimatedProfit = revenue - operatingCosts;

    var totalRecordedRevenue = state.ledger.reduce(function (sum, row) {
      return sum + row.revenue;
    }, 0);

    var totalRecordedCost = state.ledger.reduce(function (sum, row) {
      return sum + row.cost;
    }, 0);

    var totalRecordedProfit = state.ledger.reduce(function (sum, row) {
      return sum + row.profit;
    }, 0);

    var ledgerRows = state.ledger.slice(0, 12).map(function (row) {
      return (
        '<div class="transaction-row">' +
          '<span class="transaction-icon ' + (row.profit >= 0 ? "positive" : "negative") + '">' +
            (row.profit >= 0 ? "↗" : "↓") +
          "</span>" +
          '<span class="transaction-description">' +
            "<strong>Hoạt động tập đoàn · Ngày " + row.day + "</strong>" +
            "<small>Doanh thu " + window.APXUI.money(row.revenue) +
              " · Chi phí " + window.APXUI.money(row.cost) + "</small>" +
          "</span>" +
          '<strong class="transaction-profit ' + (row.profit >= 0 ? "positive" : "negative") + '">' +
            window.APXUI.money(row.profit) +
          "</strong>" +
        "</div>"
      );
    }).join("");

    return (
      pageHeading(
        "Tài chính tập đoàn",
        "Theo dõi ngân quỹ, doanh thu, chi phí và sổ giao dịch APX."
      ) +

      '<section class="finance-summary-grid grid four">' +
        metric("NGÂN QUỸ HIỆN TẠI", window.APXUI.money(state.treasury), "Có thể đầu tư cho dự án") +
        metric("DOANH THU ĐÃ GHI NHẬN", window.APXUI.money(totalRecordedRevenue), "Tổng các ngày đã khóa sổ") +
        metric("CHI PHÍ ĐÃ GHI NHẬN", window.APXUI.money(totalRecordedCost), "Tổng các ngày đã khóa sổ") +
        metric("LỢI NHUẬN LŨY KẾ", window.APXUI.money(totalRecordedProfit), state.ledger.length + " ngày đã ghi sổ") +
      "</section>" +

      '<section class="finance-current-estimate panel">' +
        '<div class="finance-estimate-heading">' +
          '<span class="eyebrow">ƯỚC TÍNH THEO QUY MÔ HIỆN TẠI</span>' +
          "<h2>Dòng tiền kinh doanh</h2>" +
          "<p>Ước tính tháng được tính từ doanh thu công ty, dự án đang chạy và lương tuyển thêm.</p>" +
        "</div>" +

        '<div class="finance-estimate-grid">' +
          '<div><small>DOANH THU / THÁNG</small><strong>' +
            window.APXUI.money(revenue) + "</strong></div>" +
          '<div><small>CHI PHÍ / THÁNG</small><strong>' +
            window.APXUI.money(operatingCosts) + "</strong></div>" +
          '<div><small>LỢI NHUẬN ƯỚC TÍNH</small><strong class="' +
            (estimatedProfit >= 0 ? "positive" : "negative") + '">' +
            window.APXUI.money(estimatedProfit) + "</strong></div>" +
        "</div>" +
      "</section>" +

      '<section class="finance-lower-grid grid two">' +
        '<article class="panel finance-ledger-panel">' +
          '<div class="section-title-row">' +
            "<div><span class=\"eyebrow\">GIAO DỊCH GẦN ĐÂY</span><h2>Sổ tài chính</h2></div>" +
            '<span class="ledger-count">' + state.ledger.length + " NGÀY</span>" +
          "</div>" +
          (ledgerRows ||
            '<div class="empty-state"><span class="empty-state-mark">—</span>' +
            "<strong>Sổ chưa có giao dịch</strong>" +
            "<p>Bấm Đóng ngày để bắt đầu ghi nhận hoạt động kinh doanh.</p></div>") +
        "</article>" +

        '<article class="panel finance-reference-panel">' +
          '<span class="eyebrow">CƠ CẤU CHI PHÍ</span>' +
          "<h2>Nguyên tắc mô phỏng</h2>" +
          '<div class="cost-breakdown">' +
            '<div class="cost-breakdown-row"><span>Vận hành cơ bản</span><strong>70% doanh thu</strong></div>' +
            '<div class="cost-breakdown-row"><span>Lương tuyển thêm</span><strong>Theo ứng viên</strong></div>' +
            '<div class="cost-breakdown-row"><span>Cổ tức cá nhân</span><strong>8% lợi nhuận ngày</strong></div>' +
          "</div>" +
          '<div class="finance-reference-note">' +
            "<strong>Đây là mô phỏng</strong>" +
            "<p>Các tỷ lệ có thể được cân chỉnh khi hoàn thiện hệ thống kinh tế.</p>" +
          "</div>" +
        "</article>" +
      "</section>"
    );
  }

  function marketPage() {
    var competitors = [
      {
        name: "Northstar Living",
        sector: "Phong cách sống",
        strength: 82,
        description: "Chuỗi bán lẻ cao cấp có độ nhận diện tốt."
      },
      {
        name: "Vela Urban",
        sector: "Bất động sản",
        strength: 76,
        description: "Nhà phát triển khu thương mại và căn hộ đô thị."
      },
      {
        name: "Nexa Systems",
        sector: "Công nghệ",
        strength: 71,
        description: "Đơn vị cung cấp nền tảng dữ liệu cho doanh nghiệp."
      }
    ];

    var sectors = window.APX_DATA.market || [];

    return (
      pageHeading(
        "Thị trường",
        "Theo dõi lĩnh vực kinh doanh, đối thủ mô phỏng và triển vọng đầu tư."
      ) +

      '<section class="market-banner panel">' +
        '<div><span class="eyebrow">BẢN TIN KINH DOANH</span>' +
          "<h2>Cơ hội và chuyển động thị trường</h2>" +
          "<p>Số liệu trên trang này dùng để xây dựng bối cảnh cho thế giới chơi thử.</p></div>" +
        '<span class="market-banner-mark" aria-hidden="true">APX<br>INSIGHT</span>' +
      "</section>" +

      '<section class="market-sector-grid grid three">' +
        sectors.map(function (sector, index) {
          return (
            '<article class="market-sector-card panel">' +
              '<div class="market-sector-top">' +
                '<span class="market-sector-index">0' + (index + 1) + "</span>" +
                '<span class="market-outlook">' + sector.outlook + "</span>" +
              "</div>" +
              '<span class="eyebrow">NGÀNH NGHỀ</span>' +
              "<h3>" + sector.name + "</h3>" +
              "<p>" + sector.description + "</p>" +
            "</article>"
          );
        }).join("") +
      "</section>" +

      '<section class="market-competitors-section">' +
        '<div class="section-title-row">' +
          "<div><span class=\"eyebrow\">DOANH NGHIỆP THAM CHIẾU</span><h2>Đối thủ mô phỏng</h2></div>" +
          '<span class="sample-data-label">DỮ LIỆU MẪU</span>' +
        "</div>" +

        '<div class="market-competitor-grid grid three">' +
          competitors.map(function (competitor) {
            return (
              '<article class="market-competitor panel">' +
                '<span class="competitor-symbol" aria-hidden="true">' +
                  competitor.name.slice(0, 1) +
                "</span>" +
                '<span class="eyebrow">' + competitor.sector + "</span>" +
                "<h3>" + competitor.name + "</h3>" +
                "<p>" + competitor.description + "</p>" +
                '<div class="competitor-strength-row">' +
                  "<span>Vị thế thị trường</span><strong>" + competitor.strength + " / 100</strong>" +
                "</div>" +
                '<div class="progress" role="progressbar" aria-label="Vị thế ' +
                  competitor.name + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
                  competitor.strength + '">' +
                  '<span style="width:' + competitor.strength + '%"></span>' +
                "</div>" +
              "</article>"
            );
          }).join("") +
        "</div>" +
      "</section>" +

      '<section class="market-note panel">' +
        "<strong>Lưu ý</strong>" +
        "<p>Đối thủ và triển vọng ngành hiện chưa tác động đến doanh thu hoặc giá bất động sản trong game.</p>" +
      "</section>"
    );
  }

  window.APXPages.company = function (page, state) {
    if (page === "companies") {
      return companiesPage();
    }

    if (page === "finance") {
      return financePage(state);
    }

    if (page === "market") {
      return marketPage();
    }

    return overviewPage(state);
  };
})();