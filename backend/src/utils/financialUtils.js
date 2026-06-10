const { DAY_MS, getWeekStart, parseExpenseDate, sameDay, startOfDay } =
  require("./dateUtils");
const { formatVnd } = require("./money");

const INCOME_CATEGORY_KEYS = new Set([
  "luong",
  "thuong",
  "phu cap",
  "lam them",
  "kinh doanh",
  "dau tu sinh loi",
  "qua tang nhan duoc",
  "hoan tien",
  "thu nhap khac",
]);

function getUserId(user) {
  return user?.id || user?.username || "";
}

function hasUserOwner(record, user) {
  const userId = getUserId(user);
  return Boolean(userId && record?.userId === userId);
}

function getUserExpenses(data, user) {
  return (data.expenses || []).filter((expense) => hasUserOwner(expense, user));
}

function getUserGoals(data, user) {
  return (data.goals || []).filter((goal) => hasUserOwner(goal, user));
}

function getUserCategoryBudgets(data, user) {
  return (data.categoryBudgets || []).filter((budget) =>
    hasUserOwner(budget, user),
  );
}

function getUserBudget(data, user) {
  const userId = getUserId(user);
  const budget = (data.budgets || []).find((item) => item.userId === userId);
  return budget || { userId, amount: 0, period: "Tháng" };
}

function buildUserScopedData(data, user) {
  return {
    ...data,
    expenses: getUserExpenses(data, user),
    budget: getUserBudget(data, user),
    goals: getUserGoals(data, user),
    categoryBudgets: getUserCategoryBudgets(data, user),
  };
}

function getCategorySpent(expenses, category) {
  return expenses
    .filter((expense) => expense.category === category)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function getUniqueDays(expenses) {
  const days = new Set(expenses.map((expense) => expense.date));
  return days.size;
}

function getMonthProjection(expenses) {
  if (expenses.length === 0) return null;
  const today = new Date();
  const daysSoFar = getUniqueDays(expenses);
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const dailyAvg = totalExpense / Math.max(daysSoFar, 1);
  const projectedTotal = Math.round(dailyAvg * daysInMonth);
  return {
    daysSoFar,
    daysInMonth,
    dailyAvg: Math.round(dailyAvg),
    projectedTotal,
    remainingDays: Math.max(daysInMonth - daysSoFar, 0),
  };
}

function identifySpendingPatterns(expenses) {
  const grouped = {};
  expenses.forEach((e) => {
    grouped[e.category] = (grouped[e.category] || 0) + e.amount;
  });
  const categories = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const topCategories = categories
    .slice(0, 2)
    .map(([category, amount]) => ({ category, amount }));
  const average =
    expenses.reduce((sum, item) => sum + item.amount, 0) /
    Math.max(expenses.length, 1);
  const anomalies = expenses.filter((expense) => expense.amount >= average * 3);
  return { topCategories, anomalies };
}

function normalizeVietnameseKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isIncomeCategoryName(category) {
  return INCOME_CATEGORY_KEYS.has(normalizeVietnameseKey(category));
}

function isIncomeTransaction(transaction) {
  return transaction.type === "income";
}

function isExpenseTransaction(transaction) {
  return transaction.type !== "income";
}

function normalizeExpense(expense = {}) {
  const category = String(expense.category || "Khác").trim() || "Khác";
  const type =
    expense.type === "income" ||
    (!expense.type && isIncomeCategoryName(category))
      ? "income"
      : "expense";
  return {
    ...expense,
    type,
    amount: Number(expense.amount || 0),
    category,
    date: String(expense.date || "").slice(0, 10),
    dateObject: parseExpenseDate(expense.date) || startOfDay(new Date()),
    time: String(expense.time || ""),
  };
}

function sumExpenseAmounts(expenses) {
  return expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
}

function getEffectiveBudgetAmount(baseBudgetAmount) {
  return Number(baseBudgetAmount || 0);
}

function getBudgetPeriodContext(period, today) {
  const normalized = normalizeVietnameseKey(period);
  if (normalized.includes("tuan") || normalized === "week") {
    const start = getWeekStart(today);
    return {
      key: "week",
      label: "tuần này",
      start,
      totalDays: 7,
      elapsedDays: Math.max(Math.floor((today - start) / DAY_MS) + 1, 1),
    };
  }
  if (normalized.includes("nam") || normalized === "year") {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return {
      key: "year",
      label: "năm nay",
      start,
      totalDays: Math.floor((end - start) / DAY_MS) + 1,
      elapsedDays: Math.max(Math.floor((today - start) / DAY_MS) + 1, 1),
    };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    key: "month",
    label: "tháng này",
    start,
    totalDays: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
    elapsedDays: Math.max(today.getDate(), 1),
  };
}

function getBudgetLevel(usage) {
  if (usage > 100)
    return { key: "exceeded", status: "Vượt ngân sách", priority: "critical" };
  if (usage > 90)
    return { key: "critical", status: "Nguy cấp", priority: "high" };
  if (usage >= 70)
    return { key: "warning", status: "Cảnh báo", priority: "medium" };
  return { key: "safe", status: "An toàn", priority: "low" };
}

function getCategoryTotals(expenses) {
  return expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amount;
    return result;
  }, {});
}

function buildDailySeries(expenses, startDate, endDate) {
  const totalsByDate = expenses.reduce((result, expense) => {
    result[expense.date] = (result[expense.date] || 0) + expense.amount;
    return result;
  }, {});
  const series = [];
  for (
    let current = new Date(startDate);
    current <= endDate;
    current = new Date(current.getTime() + DAY_MS)
  ) {
    const key = current.toISOString().slice(0, 10);
    series.push({ date: key, amount: Math.round(totalsByDate[key] || 0) });
  }
  return series;
}

function getTrailingIncreaseDays(series) {
  const active = series.filter((item) => item.amount > 0);
  if (active.length < 3) return 0;
  let streak = 1;
  for (let index = active.length - 1; index > 0; index -= 1) {
    if (active[index].amount > active[index - 1].amount) streak += 1;
    else break;
  }
  return streak >= 3 ? streak : 0;
}

function detectRepeatedSmallTransactions(expenses) {
  const groups = expenses.reduce((result, expense) => {
    if (expense.amount > 50000) return result;
    const key = `${expense.date}:${expense.category}`;
    result[key] = result[key] || {
      date: expense.date,
      category: expense.category,
      count: 0,
      amount: 0,
    };
    result[key].count += 1;
    result[key].amount += expense.amount;
    return result;
  }, {});
  return Object.values(groups).filter((group) => group.count >= 3);
}

function detectNightSpending(expenses) {
  return expenses.filter((expense) => {
    const hour = Number(String(expense.time || "").split(":")[0]);
    return Number.isFinite(hour) && (hour >= 22 || hour <= 5);
  });
}

function detectCategorySpikes(expenses, today) {
  const currentWeekStart = getWeekStart(today);
  const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * DAY_MS);
  const previousWeekEnd = new Date(currentWeekStart.getTime() - DAY_MS);
  const currentTotals = getCategoryTotals(
    expenses.filter((expense) => expense.dateObject >= currentWeekStart),
  );
  const previousTotals = getCategoryTotals(
    expenses.filter(
      (expense) =>
        expense.dateObject >= previousWeekStart &&
        expense.dateObject <= previousWeekEnd,
    ),
  );

  return Object.entries(currentTotals)
    .map(([category, amount]) => {
      const previousAmount = previousTotals[category] || 0;
      const ratio =
        previousAmount > 0 ? amount / previousAmount : amount > 0 ? 2 : 0;
      return {
        category,
        amount: Math.round(amount),
        previousAmount: Math.round(previousAmount),
        ratio,
      };
    })
    .filter((item) => item.amount >= 100000 && item.ratio >= 1.5)
    .sort((a, b) => b.ratio - a.ratio);
}

function buildCategoryBudgetSummary(data, scopedExpenses = null) {
  const expenses = (
    scopedExpenses || (data.expenses || []).map(normalizeExpense)
  ).filter(isExpenseTransaction);
  const { categoryBudgets = [] } = data;
  return categoryBudgets.map((budget) => {
    const spent = expenses
      .filter((expense) => expense.category === budget.category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const amount = Number(budget.amount || 0);
    const usage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    const level = getBudgetLevel(usage);
    const alert =
      usage >= 70 ? `Ngân sách ${budget.category} đã dùng ${usage}%.` : "";
    return {
      ...budget,
      spent: Math.round(spent),
      usage,
      usedRatio: usage / 100,
      status: level.status,
      priority: level.priority,
      alert,
    };
  });
}

function buildBadges(data, insight) {
  const badges = [];
  const { expenses, budget, goals } = data;
  if (insight.status === "Đang trong giới hạn" && expenses.length >= 3) {
    badges.push("Quản lý chi tiêu tốt");
  }
  if (insight.budgetUsed <= 0.3 && expenses.length >= 2) {
    badges.push("Tiết kiệm 30% ngân sách");
  }
  if (goals.length > 0) {
    badges.push("Đã đặt mục tiêu tiết kiệm");
  }
  if (
    insight.futurePrediction &&
    insight.futurePrediction.projectedTotal <= budget.amount
  ) {
    badges.push("Dự báo trong giới hạn ngân sách");
  }
  if (
    insight.patterns &&
    insight.patterns.anomalies.length === 0 &&
    expenses.length >= 5
  ) {
    badges.push("Chi tiêu đều đặn");
  }
  return badges.length
    ? badges
    : ["Chưa có huy hiệu. Hãy tiếp tục duy trì chi tiêu thông minh."];
}

function buildFinancialAlerts(context) {
  const alerts = [];
  const {
    budgetLevel,
    budgetUsage,
    monthlySpending,
    budgetAmount,
    categoryBudgets,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    predictedDaysRemaining,
  } = context;

  if (budgetAmount > 0 && budgetLevel.key === "exceeded") {
    alerts.push({
      priority: "critical",
      message: `Bạn đã vượt ngân sách ${formatVnd(monthlySpending - budgetAmount)}.`,
    });
  } else if (budgetAmount > 0 && budgetLevel.key === "critical") {
    alerts.push({
      priority: "high",
      message: `Bạn đã dùng ${budgetUsage}% ngân sách tháng này.`,
    });
  } else if (budgetAmount > 0 && budgetLevel.key === "warning") {
    alerts.push({
      priority: "medium",
      message: `Bạn đã dùng ${budgetUsage}% ngân sách, cần giảm chi tiêu trước khi vượt hạn mức.`,
    });
  }

  categoryBudgets
    .filter((item) => item.usage >= 70)
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        priority:
          item.usage > 100 ? "critical" : item.usage > 90 ? "high" : "medium",
        message: `Ngân sách ${item.category} đã dùng ${item.usage}%.`,
      });
    });

  if (continuousIncreaseDays >= 3) {
    alerts.push({
      priority: "high",
      message: `Chi tiêu tăng liên tục ${continuousIncreaseDays} ngày gần đây.`,
    });
  }
  if (abnormalDays.length) {
    alerts.push({
      priority: "medium",
      message: `${abnormalDays.length} ngày có chi tiêu cao hơn trung bình ít nhất 30%.`,
    });
  }
  if (repeatedSmallTransactions.length) {
    alerts.push({
      priority: "medium",
      message: "Có nhiều giao dịch nhỏ lặp lại trong cùng một ngày.",
    });
  }
  if (nightSpending.length >= 2) {
    alerts.push({
      priority: "medium",
      message: `Có ${nightSpending.length} giao dịch ban đêm trong tháng này.`,
    });
  }
  if (categorySpikes.length) {
    alerts.push({
      priority: "high",
      message: `Chi tiêu ${categorySpikes[0].category} tăng mạnh so với tuần trước.`,
    });
  }
  if (predictedDaysRemaining !== null && predictedDaysRemaining <= 7) {
    alerts.push({
      priority: "critical",
      message: `Với tốc độ hiện tại, số dư có thể hết trong ${predictedDaysRemaining} ngày.`,
    });
  }

  const seen = new Set();
  return alerts
    .filter((alert) => {
      if (seen.has(alert.message)) return false;
      seen.add(alert.message);
      return true;
    })
    .slice(0, 5);
}

function buildFinancialRecommendations(context) {
  const {
    topCategory,
    monthlySpending,
    budgetAmount,
    budgetUsage,
    budgetLevel,
    continuousIncreaseDays,
    repeatedSmallTransactions,
    nightSpending,
    predictedDaysRemaining,
    goals,
  } = context;
  const recommendations = [];

  if (topCategory) {
    const percent =
      monthlySpending > 0
        ? Math.round((topCategory[1] / monthlySpending) * 100)
        : 0;
    recommendations.push(
      `Bạn chi ${percent}% cho ${topCategory[0]}. Giảm 15%-20% nhóm này sẽ tạo hiệu quả tiết kiệm rõ nhất.`,
    );
  }
  if (budgetAmount > 0 && budgetUsage >= 70) {
    recommendations.push(
      "Đặt hạn mức chi tiêu theo ngày cho phần ngân sách còn lại của tháng.",
    );
  }
  if (budgetLevel.key === "exceeded") {
    recommendations.push(
      "Tạm dừng các khoản không thiết yếu và rà soát nhóm chi lớn nhất trong 7 ngày gần nhất.",
    );
  }
  if (continuousIncreaseDays >= 3) {
    recommendations.push(
      "Dùng mục tiêu chi tiêu cố định trong 3 ngày tới để ngắt đà tăng chi phí.",
    );
  }
  if (repeatedSmallTransactions.length) {
    recommendations.push(
      "Gộp các khoản mua nhỏ và đặt giới hạn cho đồ uống, ăn vặt hoặc giao hàng.",
    );
  }
  if (nightSpending.length >= 2) {
    recommendations.push(
      "Kiểm tra các khoản chi ban đêm, vì đây thường là nhóm dễ phát sinh ngoài kế hoạch.",
    );
  }
  if (predictedDaysRemaining !== null && predictedDaysRemaining <= 10) {
    recommendations.push(
      "Ưu tiên giữ lại tiền cho hóa đơn cố định trước khi chi cho giải trí hoặc mua sắm.",
    );
  }
  if (!goals.length) {
    recommendations.push(
      "Tạo mục tiêu tiết kiệm để theo dõi phần tiền cần giữ lại mỗi tháng.",
    );
  }

  return [...new Set(recommendations)].slice(0, 5);
}

function buildFinancialInsightMessages(context) {
  const {
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    monthlySpendingForecast,
    budgetAmount,
  } = context;
  const insights = [];
  if (continuousIncreaseDays >= 3)
    insights.push(`Chi tiêu tăng liên tục ${continuousIncreaseDays} ngày.`);
  if (abnormalDays.length)
    insights.push(
      `Phát hiện ${abnormalDays.length} ngày chi tiêu bất thường so với mức trung bình.`,
    );
  if (repeatedSmallTransactions.length)
    insights.push(
      "Có cụm giao dịch nhỏ lặp lại, có thể là chi tiêu vặt hoặc phí phát sinh.",
    );
  if (nightSpending.length >= 2)
    insights.push("Chi tiêu ban đêm xuất hiện nhiều lần trong tháng.");
  if (categorySpikes.length)
    insights.push(
      `Nhóm ${categorySpikes[0].category} tăng đột biến trong tuần này.`,
    );
  if (budgetAmount > 0 && monthlySpendingForecast > budgetAmount) {
    insights.push(
      `Dự báo cuối tháng có thể vượt ngân sách ${formatVnd(monthlySpendingForecast - budgetAmount)}.`,
    );
  }
  return insights;
}

function buildQuantifiedAdvice(context) {
  const {
    periodLabel,
    periodSpending,
    periodIncome,
    budgetAmount,
    budgetUsage,
    projectedSpending,
    topCategory,
    topCategoryShare,
    remainingPeriodDays,
    dailySpendingLimit,
    cashShortfall,
    walletConfigured,
  } = context;
  const findings = [];
  const actions = [];

  if (cashShortfall > 0) {
    findings.push(
      `Chi tiêu ${periodLabel} đang cao hơn số tiền ghi nhận được ${formatVnd(cashShortfall)}.`,
    );
    actions.push(
      walletConfigured
        ? `Tạm dừng chi không thiết yếu cho đến khi bù được phần thiếu ${formatVnd(cashShortfall)}.`
        : `Cập nhật số dư ví hiện có; nếu số dư thực là 0đ, bạn đang thiếu ${formatVnd(cashShortfall)} so với các khoản đã chi.`,
    );
  }

  if (topCategory && topCategoryShare >= 40) {
    const suggestedCut = Math.max(
      Math.round(topCategory[1] * (topCategoryShare >= 70 ? 0.25 : 0.15)),
      0,
    );
    findings.push(
      `${topCategory[0]} chiếm ${topCategoryShare}% tổng chi ${periodLabel} (${formatVnd(topCategory[1])}), mức tập trung quá cao.`,
    );
    actions.push(
      `Giảm ít nhất ${formatVnd(suggestedCut)} ở ${topCategory[0]} trong kỳ tiếp theo và đặt hạn mức riêng ${formatVnd(Math.max(topCategory[1] - suggestedCut, 0))}.`,
    );
  }

  if (budgetAmount > 0 && projectedSpending > budgetAmount) {
    const projectedOver = projectedSpending - budgetAmount;
    findings.push(
      `Theo tốc độ hiện tại, chi tiêu có thể đạt ${formatVnd(projectedSpending)}, vượt ngân sách ${formatVnd(projectedOver)}.`,
    );
    actions.push(
      remainingPeriodDays > 0
        ? `Trong ${remainingPeriodDays} ngày còn lại, giữ tổng chi không quá ${formatVnd(dailySpendingLimit)} mỗi ngày.`
        : "Không phát sinh thêm khoản chi không thiết yếu trong phần còn lại của kỳ.",
    );
  } else if (budgetAmount > 0) {
    actions.push(
      remainingPeriodDays > 0
        ? `Để không vượt ngân sách, giới hạn chi tiêu ${remainingPeriodDays} ngày còn lại ở mức ${formatVnd(dailySpendingLimit)} mỗi ngày.`
        : `Bạn đã dùng ${budgetUsage}% ngân sách ${periodLabel}; rà soát lại trước khi bắt đầu kỳ mới.`,
    );
  }

  if (periodIncome > 0 && periodSpending > periodIncome) {
    const ratio = Math.round((periodSpending / periodIncome) * 100);
    findings.push(
      `Chi tiêu bằng ${ratio}% thu nhập ghi nhận trong ${periodLabel}; dòng tiền đang âm ${formatVnd(periodSpending - periodIncome)}.`,
    );
  } else if (periodIncome === 0 && periodSpending > 0) {
    findings.push(
      `Chưa có khoản thu nào được ghi nhận trong ${periodLabel}, nên chưa thể xác nhận khả năng chi trả an toàn.`,
    );
    actions.push("Ghi nhận đầy đủ thu nhập và số dư đầu kỳ để điểm sức khỏe phản ánh chính xác hơn.");
  }

  return {
    findings: [...new Set(findings)].slice(0, 5),
    actions: [...new Set(actions)].slice(0, 5),
  };
}

function buildInsight(data, currentUser = null) {
  const normalizedTransactions = (data.expenses || [])
    .map(normalizeExpense)
    .filter((expense) => expense.amount > 0);
  const normalizedExpenses =
    normalizedTransactions.filter(isExpenseTransaction);
  const normalizedIncomes = normalizedTransactions.filter(isIncomeTransaction);
  const budget = data.budget || { amount: 0 };
  const today = startOfDay(new Date());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekStart = getWeekStart(today);
  const budgetPeriod = getBudgetPeriodContext(budget.period, today);
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysElapsed = Math.max(today.getDate(), 1);
  const monthlyExpenses = normalizedExpenses.filter(
    (expense) =>
      expense.dateObject >= monthStart && expense.dateObject <= today,
  );
  const weeklyExpenses = normalizedExpenses.filter(
    (expense) => expense.dateObject >= weekStart && expense.dateObject <= today,
  );
  const dailyExpenses = normalizedExpenses.filter((expense) =>
    sameDay(expense.dateObject, today),
  );
  const monthlyIncomes = normalizedIncomes.filter(
    (income) => income.dateObject >= monthStart && income.dateObject <= today,
  );
  const weeklyIncomes = normalizedIncomes.filter(
    (income) => income.dateObject >= weekStart && income.dateObject <= today,
  );
  const dailyIncomes = normalizedIncomes.filter((income) =>
    sameDay(income.dateObject, today),
  );
  const periodExpenses = normalizedExpenses.filter(
    (expense) =>
      expense.dateObject >= budgetPeriod.start && expense.dateObject <= today,
  );
  const periodIncomes = normalizedIncomes.filter(
    (income) =>
      income.dateObject >= budgetPeriod.start && income.dateObject <= today,
  );
  const totalExpense = sumExpenseAmounts(normalizedExpenses);
  const totalIncome = sumExpenseAmounts(normalizedIncomes);
  const monthlySpending = sumExpenseAmounts(monthlyExpenses);
  const weeklySpending = sumExpenseAmounts(weeklyExpenses);
  const totalDailySpending = sumExpenseAmounts(dailyExpenses);
  const monthlyIncome = sumExpenseAmounts(monthlyIncomes);
  const weeklyIncome = sumExpenseAmounts(weeklyIncomes);
  const totalDailyIncome = sumExpenseAmounts(dailyIncomes);
  const periodSpending = sumExpenseAmounts(periodExpenses);
  const periodIncome = sumExpenseAmounts(periodIncomes);
  const averageDailySpending =
    periodSpending / Math.max(budgetPeriod.elapsedDays, 1);
  const baseBudgetAmount = Number(budget.amount || 0);
  const budgetAmount = getEffectiveBudgetAmount(baseBudgetAmount);
  const budgetUsage =
    budgetAmount > 0 ? Math.round((periodSpending / budgetAmount) * 100) : 0;
  const budgetLevel = getBudgetLevel(budgetUsage);
  const categoryTotals = getCategoryTotals(periodExpenses);
  const topCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const categoryBudgets = buildCategoryBudgetSummary(data, periodExpenses);
  const dailySeries = buildDailySeries(
    periodExpenses,
    budgetPeriod.start,
    today,
  );
  const continuousIncreaseDays = getTrailingIncreaseDays(dailySeries);
  const abnormalDays = dailySeries.filter(
    (item) =>
      averageDailySpending > 0 && item.amount > averageDailySpending * 1.3,
  );
  const repeatedSmallTransactions =
    detectRepeatedSmallTransactions(periodExpenses);
  const nightSpending = detectNightSpending(periodExpenses);
  const categorySpikes = detectCategorySpikes(periodExpenses, today);
  const periodSpendingForecast = Math.round(
    averageDailySpending * budgetPeriod.totalDays,
  );
  const activeUserWallet = Number(currentUser?.wallet || 0);
  const walletConfigured = Object.prototype.hasOwnProperty.call(
    currentUser || {},
    "wallet",
  );
  const rawRemainingBalance = activeUserWallet + periodIncome - periodSpending;
  const remainingBalance = Math.max(rawRemainingBalance, 0);
  const cashShortfall = Math.max(-rawRemainingBalance, 0);
  const netCashFlow = monthlyIncome - monthlySpending;
  const predictedDaysRemaining =
    averageDailySpending > 0
      ? Math.max(Math.floor(remainingBalance / averageDailySpending), 0)
      : null;
  const overspendingProbability = Math.min(
    100,
    Math.round(
      budgetUsage +
        (continuousIncreaseDays >= 3 ? 15 : 0) +
        (abnormalDays.length ? 10 : 0) +
        (categorySpikes.length ? 10 : 0) +
        (budgetAmount > 0 && periodSpendingForecast > budgetAmount ? 20 : 0) +
        (cashShortfall > 0 ? 25 : 0),
    ),
  );
  const topCategoryShare =
    topCategory && periodSpending > 0
      ? Math.round((topCategory[1] / periodSpending) * 100)
      : 0;
  const scoreBreakdown = [];
  let financialHealthScore = 100;
  function deductScore(points, reason) {
    if (points <= 0) return;
    financialHealthScore -= points;
    scoreBreakdown.push({ points: -points, reason });
  }
  if (budgetUsage > 100) deductScore(35, "Đã vượt ngân sách");
  else if (budgetUsage > 90) deductScore(25, "Ngân sách gần cạn");
  else if (budgetUsage >= 70) deductScore(12, "Đã dùng trên 70% ngân sách");
  if (cashShortfall > 0)
    deductScore(30, `Thiếu ${formatVnd(cashShortfall)} theo dữ liệu đã ghi nhận`);
  if (periodIncome > 0 && periodSpending > periodIncome)
    deductScore(15, "Chi tiêu cao hơn thu nhập trong kỳ");
  else if (periodIncome === 0 && periodSpending > 0)
    deductScore(10, "Chưa ghi nhận thu nhập trong kỳ");
  if (topCategoryShare >= 70)
    deductScore(15, `Chi tiêu tập trung ${topCategoryShare}% vào một hạng mục`);
  else if (topCategoryShare >= 50)
    deductScore(8, `Chi tiêu tập trung ${topCategoryShare}% vào một hạng mục`);
  if (budgetAmount > 0 && periodSpendingForecast > budgetAmount)
    deductScore(15, "Tốc độ chi dự kiến vượt ngân sách");
  if (continuousIncreaseDays >= 3) deductScore(10, "Chi tiêu tăng liên tục");
  deductScore(Math.min(abnormalDays.length * 4, 12), "Có ngày chi tiêu bất thường");
  deductScore(
    Math.min(repeatedSmallTransactions.length * 4, 10),
    "Nhiều giao dịch nhỏ lặp lại",
  );
  if (nightSpending.length >= 2) deductScore(8, "Nhiều giao dịch ban đêm");
  deductScore(Math.min(categorySpikes.length * 6, 12), "Hạng mục chi tăng đột biến");
  financialHealthScore = Math.max(
    0,
    Math.min(Math.round(financialHealthScore), 100),
  );
  const riskLevel =
    budgetLevel.key === "exceeded" ||
    financialHealthScore < 45 ||
    overspendingProbability >= 85
      ? "critical"
      : budgetLevel.key === "critical" ||
          financialHealthScore < 65 ||
          overspendingProbability >= 70
        ? "high"
        : budgetLevel.key === "warning" ||
            financialHealthScore < 80 ||
            overspendingProbability >= 50
          ? "medium"
          : "low";
  const overallStatus =
    riskLevel === "critical"
      ? "Cần hành động ngay"
      : riskLevel === "high"
        ? "Rủi ro cao"
        : riskLevel === "medium"
          ? "Cần theo dõi"
          : budgetLevel.status;
  const alerts = buildFinancialAlerts({
    budgetLevel,
    budgetUsage,
    monthlySpending: periodSpending,
    budgetAmount,
    categoryBudgets,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    predictedDaysRemaining,
  });
  const recommendations = buildFinancialRecommendations({
    topCategory,
    monthlySpending: periodSpending,
    budgetAmount,
    budgetUsage,
    budgetLevel,
    continuousIncreaseDays,
    repeatedSmallTransactions,
    nightSpending,
    predictedDaysRemaining,
    goals: data.goals || [],
  });
  const insights = buildFinancialInsightMessages({
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    monthlySpendingForecast: periodSpendingForecast,
    budgetAmount,
  });
  const remainingPeriodDays = Math.max(
    budgetPeriod.totalDays - budgetPeriod.elapsedDays,
    0,
  );
  const remainingBudget = Math.max(budgetAmount - periodSpending, 0);
  const spendableRemaining = Math.min(remainingBudget, remainingBalance);
  const dailySpendingLimit =
    remainingPeriodDays > 0
      ? Math.floor(spendableRemaining / remainingPeriodDays)
      : 0;
  const quantifiedAdvice = buildQuantifiedAdvice({
    periodLabel: budgetPeriod.label,
    periodSpending,
    periodIncome,
    budgetAmount,
    budgetUsage,
    projectedSpending: periodSpendingForecast,
    topCategory,
    topCategoryShare,
    remainingPeriodDays,
    dailySpendingLimit,
    cashShortfall,
    walletConfigured,
  });
  const detailedRecommendations = [
    ...quantifiedAdvice.actions,
    ...recommendations,
  ].filter((item, index, items) => items.indexOf(item) === index).slice(0, 6);
  const detailedInsights = [
    ...quantifiedAdvice.findings,
    ...insights,
  ].filter((item, index, items) => items.indexOf(item) === index).slice(0, 6);
  const projection = getMonthProjection(normalizedExpenses);
  const patterns = identifySpendingPatterns(normalizedExpenses);

  const insight = {
    status: overallStatus,
    budget_level: budgetLevel.key,
    budget_usage: budgetUsage,
    budget_amount: budgetAmount,
    base_budget_amount: baseBudgetAmount,
    budget_period: budgetPeriod.key,
    budget_period_label: budgetPeriod.label,
    period_spending: Math.round(periodSpending),
    period_income: Math.round(periodIncome),
    remaining_budget: Math.round(remainingBudget),
    remaining_period_days: remainingPeriodDays,
    daily_spending_limit: Math.round(dailySpendingLimit),
    remaining_balance: Math.round(remainingBalance),
    cash_shortfall: Math.round(cashShortfall),
    wallet_configured: walletConfigured,
    total_expense: Math.round(totalExpense),
    total_income: Math.round(totalIncome),
    total_daily_income: Math.round(totalDailyIncome),
    weekly_income: Math.round(weeklyIncome),
    monthly_income: Math.round(monthlyIncome),
    net_cash_flow: Math.round(netCashFlow),
    total_daily_spending: Math.round(totalDailySpending),
    weekly_spending: Math.round(weeklySpending),
    monthly_spending: Math.round(monthlySpending),
    average_daily_spending: Math.round(averageDailySpending),
    predicted_days_remaining: predictedDaysRemaining,
    monthly_spending_forecast: periodSpendingForecast,
    projected_period_spending: periodSpendingForecast,
    overspending_probability: overspendingProbability,
    burn_rate_trend: continuousIncreaseDays >= 3 ? "accelerating" : "stable",
    risk_level: riskLevel,
    financial_health_score: financialHealthScore,
    score_breakdown: scoreBreakdown,
    alerts,
    recommendations: detailedRecommendations,
    action_plan: detailedRecommendations,
    insights: detailedInsights,
    key_findings: detailedInsights,
    category_budget_summaries: categoryBudgets,
    category_totals: categoryTotals,
    daily_series: dailySeries,
    top_category: topCategory ? topCategory[0] : "Chưa có",
    top_category_amount: Math.round(topCategory ? topCategory[1] : 0),
    totalExpense: Math.round(totalExpense),
    topCategory: topCategory ? topCategory[0] : "Chưa có",
    progress: Math.min(budgetUsage, 100),
    budgetUsed: budgetUsage / 100,
    alert: alerts[0]?.message || "",
    categoryBudgets,
    personalizedRecommendations: detailedRecommendations,
    futurePrediction: projection
      ? {
          projectedTotal: projection.projectedTotal,
          currentTotal: totalExpense,
          dailyAvg: projection.dailyAvg,
          remainingDays: projection.remainingDays,
          message:
            projection.projectedTotal > budgetAmount
              ? `Nếu tiếp tục chi tiêu hiện tại, bạn có thể chi ${formatVnd(projection.projectedTotal)} trong tháng, vượt ngân sách.`
              : `Dự kiến tháng này bạn sẽ chi ${formatVnd(projection.projectedTotal)}, nằm trong giới hạn ngân sách.`,
        }
      : null,
    patterns,
    projection,
    reportType: normalizedExpenses.length >= 6 ? "advanced" : "basic",
  };
  insight.badges = buildBadges(data, insight);
  return insight;
}

function findSimilarExpense(expenses, item) {
  return expenses.find((expense) => {
    return (
      expense.amount === item.amount &&
      expense.category === item.category &&
      (expense.type || "expense") === (item.type || "expense") &&
      expense.date === item.date
    );
  });
}

function detectUnusualExpense(data, item) {
  if (item.type === "income") return [];
  const { expenses, budget } = data;
  const categoryExpenses = expenses.filter(
    (expense) =>
      (expense.type || "expense") !== "income" &&
      expense.category === item.category,
  );
  const average = categoryExpenses.length
    ? categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0) /
      categoryExpenses.length
    : 0;
  const warnings = [];
  if (budget.amount > 0 && item.amount >= budget.amount * 0.25) {
    warnings.push("Giao dịch lớn: chi tiêu này chiếm hơn 25% ngân sách.");
  }
  if (average > 0 && item.amount >= average * 3) {
    warnings.push(
      "Giao dịch bất thường: lớn hơn trung bình hạng mục gấp 3 lần.",
    );
  }
  return warnings;
}

module.exports = {
  buildUserScopedData,
  hasUserOwner,
  getUserExpenses,
  getUserGoals,
  getUserCategoryBudgets,
  getUserBudget,
  buildInsight,
  findSimilarExpense,
  detectUnusualExpense,
  getUserId,
};
