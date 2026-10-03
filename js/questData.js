window.APX_QUEST_DATA = (function () {
  "use strict";

  var milestones = [
    {
      id: "personal_work_001",
      title: "Ca làm đầu tiên",
      description: "Hoàn thành một ca làm và nhận tiền lương đầu tiên.",
      shifts: 1,
      salary: 200000,
      careerExp: 100
    },
    { id: "personal_work_002", title: "Hoàn thành 3 ca", shifts: 3, salary: 600000, careerExp: 150 },
    { id: "personal_work_003", title: "Hoàn thành 5 ca", shifts: 5, salary: 1000000, careerExp: 200 },
    { id: "personal_work_004", title: "Hoàn thành 10 ca", shifts: 10, salary: 2000000, careerExp: 300 },
    { id: "personal_work_005", title: "Hoàn thành 20 ca", shifts: 20, salary: 4000000, careerExp: 500 }
  ];

  for (var shiftTarget = 30; shiftTarget <= 1000; shiftTarget += 10) {
    var index = milestones.length + 1;
    milestones.push({
      id: "personal_work_" + String(index).padStart(3, "0"),
      title: "Hoàn thành " + shiftTarget + " ca",
      shifts: shiftTarget,
      salary: shiftTarget * 200000,
      careerExp: 500 + Math.floor((shiftTarget - 20) / 10) * 100
    });
  }

  return milestones.map(function (milestone, index) {
    var previous = milestones[index - 1];
    var target = {
      completedWorkShifts: milestone.shifts,
      salaryReceived: milestone.salary,
      currentJob: 1
    };

    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ||
        "Hoàn thành " + milestone.shifts + " ca làm và nhận ít nhất ₫" +
        milestone.salary.toLocaleString("vi-VN") + " tiền lương.",
      category: "PERSONAL",
      type: "CAREER",
      requirements: [
        { type: "work_shifts_completed", target: milestone.shifts },
        { type: "salary_received", target: milestone.salary },
        { type: "current_job_active", target: 1 }
      ],
      progress: {},
      target: target,
      reward: {
        careerExp: milestone.careerExp,
        characterExp: milestone.careerExp
      },
      unlockAfter: previous ? previous.id : null
    };
  });
})();
