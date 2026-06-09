const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WALLET = 0;
const SMALL_TRANSACTION_LIMIT = 50000;
const INCOME_CATEGORY_SET = new Set([
  'Lương',
  'Thưởng',
  'Phụ cấp',
  'Làm thêm',
  'Kinh doanh',
  'Đầu tư sinh lời',
  'Quà tặng nhận được',
  'Hoàn tiền',
  'Thu nhập khác'
]);

export function analyzeFinance({ expenses = [], budget = null, categoryBudgets = [], wallet = DEFAULT_WALLET } = {}) {
  const today = startOfDay(new Date());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekStart = getWeekStart(today);
  const budgetPeriod = getBudgetPeriodContext(budget?.period, today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.max(today.getDate(), 1);
  const normalizedTransactions = expenses.map(normalizeExpense).filter((expense) => expense.amount > 0);
  const normalizedExpenses = normalizedTransactions.filter(isExpenseTransaction);
  const normalizedIncomes = normalizedTransactions.filter(isIncomeTransaction);

  const totalExpense = sumAmounts(normalizedExpenses);
  const totalIncome = sumAmounts(normalizedIncomes);
  const dailyExpenses = normalizedExpenses.filter((expense) => sameDay(expense.dateObject, today));
  const weeklyExpenses = normalizedExpenses.filter((expense) => expense.dateObject >= weekStart && expense.dateObject <= today);
  const monthlyExpenses = normalizedExpenses.filter((expense) => expense.dateObject >= monthStart && expense.dateObject <= today);
  const dailyIncomes = normalizedIncomes.filter((income) => sameDay(income.dateObject, today));
  const weeklyIncomes = normalizedIncomes.filter((income) => income.dateObject >= weekStart && income.dateObject <= today);
  const monthlyIncomes = normalizedIncomes.filter((income) => income.dateObject >= monthStart && income.dateObject <= today);
  const periodExpenses = normalizedExpenses.filter(
    (expense) => expense.dateObject >= budgetPeriod.start && expense.dateObject <= today
  );
  const periodIncomes = normalizedIncomes.filter(
    (income) => income.dateObject >= budgetPeriod.start && income.dateObject <= today
  );
  const totalDailySpending = sumAmounts(dailyExpenses);
  const weeklySpending = sumAmounts(weeklyExpenses);
  const monthlySpending = sumAmounts(monthlyExpenses);
  const totalDailyIncome = sumAmounts(dailyIncomes);
  const weeklyIncome = sumAmounts(weeklyIncomes);
  const monthlyIncome = sumAmounts(monthlyIncomes);
  const periodSpending = sumAmounts(periodExpenses);
  const periodIncome = sumAmounts(periodIncomes);
  const averageDailySpending = periodSpending / Math.max(budgetPeriod.elapsedDays, 1);
  const balanceBase = Number(wallet || 0);
  const rawRemainingBalance = balanceBase + periodIncome - periodSpending;
  const remainingBalance = Math.max(rawRemainingBalance, 0);
  const cashShortfall = Math.max(-rawRemainingBalance, 0);
  const netCashFlow = monthlyIncome - monthlySpending;
  const predictedDaysRemaining = averageDailySpending > 0
    ? Math.max(Math.floor(remainingBalance / averageDailySpending), 0)
    : null;
  const monthlySpendingForecast = Math.round(averageDailySpending * budgetPeriod.totalDays);
  const baseBudgetAmount = Number(budget?.amount || 0);
  const budgetAmount = getEffectiveBudgetAmount(baseBudgetAmount);
  const budgetUsage = budgetAmount > 0 ? Math.round((periodSpending / budgetAmount) * 100) : 0;
  const budgetLevel = getBudgetLevel(budgetUsage);
  const categoryTotals = getCategoryTotals(periodExpenses);
  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategoryShare = topCategoryEntry && periodSpending > 0
    ? Math.round((topCategoryEntry[1] / periodSpending) * 100)
    : 0;
  const categoryBudgetSummaries = buildCategoryBudgetSummaries(periodExpenses, categoryBudgets);
  const dailySeries = buildDailySeries(periodExpenses, budgetPeriod.start, today);
  const continuousIncreaseDays = getTrailingIncreaseDays(dailySeries);
  const abnormalDays = dailySeries.filter((item) => averageDailySpending > 0 && item.amount > averageDailySpending * 1.3);
  const repeatedSmallTransactions = detectRepeatedSmallTransactions(periodExpenses);
  const nightSpending = detectNightSpending(periodExpenses);
  const categorySpikes = detectCategorySpikes(periodExpenses, today);
  const burnRateTrend = continuousIncreaseDays >= 3 ? 'accelerating' : monthlySpendingForecast > monthlySpending ? 'stable' : 'low';
  const overspendingProbability = getOverspendingProbability({
    budgetUsage,
    continuousIncreaseDays,
    abnormalDays,
    categorySpikes,
    monthlySpendingForecast,
    budgetAmount
  });
  const financialHealthScore = getFinancialHealthScore({
    budgetUsage,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    remainingBalance,
    averageDailySpending,
    cashShortfall,
    periodIncome,
    periodSpending,
    topCategoryShare,
    monthlySpendingForecast,
    budgetAmount
  });
  const riskLevel = getRiskLevel(financialHealthScore, budgetLevel, overspendingProbability);
  const overallStatus = riskLevel === 'critical'
    ? 'Cần hành động ngay'
    : riskLevel === 'high'
      ? 'Rủi ro cao'
      : riskLevel === 'medium'
        ? 'Cần theo dõi'
        : budgetLevel.status;
  const alerts = buildAlerts({
    budgetLevel,
    budgetUsage,
    monthlySpending: periodSpending,
    budgetAmount,
    categoryBudgetSummaries,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    predictedDaysRemaining
  });
  const recommendations = buildRecommendations({
    topCategoryEntry,
    categoryTotals,
    budgetLevel,
    budgetUsage,
    continuousIncreaseDays,
    repeatedSmallTransactions,
    nightSpending,
    predictedDaysRemaining,
    monthlySpending: periodSpending,
    budgetAmount
  });
  const insights = buildInsights({
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    monthlySpendingForecast,
    budgetAmount,
    cashShortfall,
    periodSpending,
    periodIncome,
    topCategoryEntry,
    topCategoryShare,
    periodLabel: budgetPeriod.label
  });

  return {
    status: overallStatus,
    risk_level: riskLevel,
    budget_level: budgetLevel.key,
    budget_usage: budgetUsage,
    budget_amount: budgetAmount,
    base_budget_amount: baseBudgetAmount,
    remaining_balance: Math.round(remainingBalance),
    cash_shortfall: Math.round(cashShortfall),
    budget_period: budgetPeriod.key,
    budget_period_label: budgetPeriod.label,
    period_spending: Math.round(periodSpending),
    period_income: Math.round(periodIncome),
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
    monthly_spending_forecast: monthlySpendingForecast,
    overspending_probability: overspendingProbability,
    burn_rate_trend: burnRateTrend,
    financial_health_score: financialHealthScore,
    alerts,
    recommendations,
    insights,
    category_budget_summaries: categoryBudgetSummaries,
    category_totals: categoryTotals,
    daily_series: dailySeries,
    top_category: topCategoryEntry?.[0] || '-',
    top_category_amount: Math.round(topCategoryEntry?.[1] || 0)
  };
}

export function validateExpenseData(expense = {}) {
  const errors = [];
  const amount = Number(expense.amount);
  const today = startOfDay(new Date());
  const expenseDate = parseDate(expense.date);

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Số tiền phải lớn hơn 0.');
  }
  if (amount > 1000000000) {
    errors.push('Số tiền quá lớn so với một giao dịch cá nhân thông thường.');
  }
  if (!String(expense.category || '').trim()) {
    errors.push('Danh mục không được để trống.');
  }
  if (!expense.date || !expenseDate) {
    errors.push('Ngày giao dịch không hợp lệ.');
  }
  if (expenseDate && expenseDate > today) {
    errors.push('Không được nhập giao dịch trong tương lai.');
  }

  return errors;
}

export function getCategoryBudgetUsage(expenses = [], categoryBudgets = []) {
  const monthlyExpenses = expenses.map(normalizeExpense).filter((expense) => {
    const today = startOfDay(new Date());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return expense.type !== 'income' && expense.amount > 0 && expense.dateObject >= monthStart && expense.dateObject <= today;
  });

  return buildCategoryBudgetSummaries(monthlyExpenses, categoryBudgets);
}

function normalizeExpense(expense = {}) {
  const category = String(expense.category || 'Khác').trim() || 'Khác';
  const type = expense.type === 'income' || (!expense.type && INCOME_CATEGORY_SET.has(category)) ? 'income' : 'expense';
  return {
    ...expense,
    type,
    amount: Number(expense.amount || 0),
    category,
    title: String(expense.title || expense.note || '').trim(),
    date: String(expense.date || '').slice(0, 10),
    dateObject: parseDate(expense.date) || startOfDay(new Date()),
    time: String(expense.time || '')
  };
}

function isIncomeTransaction(transaction) {
  return transaction.type === 'income';
}

function isExpenseTransaction(transaction) {
  return transaction.type !== 'income';
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getWeekStart(date) {
  const day = date.getDay() || 7;
  const result = new Date(date);
  result.setDate(date.getDate() - day + 1);
  return startOfDay(result);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function sumAmounts(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function getEffectiveBudgetAmount(baseBudgetAmount) {
  return Number(baseBudgetAmount || 0);
}

function normalizeVietnameseKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
}

function getBudgetPeriodContext(period, today) {
  const normalized = normalizeVietnameseKey(period);
  if (normalized.includes('tuan') || normalized === 'week') {
    const start = getWeekStart(today);
    return {
      key: 'week',
      label: 'tuần này',
      start,
      totalDays: 7,
      elapsedDays: Math.max(Math.floor((today - start) / DAY_MS) + 1, 1)
    };
  }
  if (normalized.includes('nam') || normalized === 'year') {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return {
      key: 'year',
      label: 'năm nay',
      start,
      totalDays: Math.floor((end - start) / DAY_MS) + 1,
      elapsedDays: Math.max(Math.floor((today - start) / DAY_MS) + 1, 1)
    };
  }
  return {
    key: 'month',
    label: 'tháng này',
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    totalDays: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
    elapsedDays: Math.max(today.getDate(), 1)
  };
}

function getBudgetLevel(usage) {
  if (usage > 100) return { key: 'exceeded', status: 'Vượt ngân sách', priority: 'critical' };
  if (usage > 90) return { key: 'critical', status: 'Nguy cấp', priority: 'high' };
  if (usage >= 70) return { key: 'warning', status: 'Cảnh báo', priority: 'medium' };
  return { key: 'safe', status: 'An toàn', priority: 'low' };
}

function getCategoryTotals(expenses) {
  return expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amount;
    return result;
  }, {});
}

function buildCategoryBudgetSummaries(expenses, categoryBudgets) {
  return categoryBudgets.map((budget) => {
    const spent = expenses
      .filter((expense) => expense.category === budget.category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const amount = Number(budget.amount || 0);
    const usage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    const level = getBudgetLevel(usage);

    return {
      ...budget,
      spent: Math.round(spent),
      usage,
      usedRatio: usage / 100,
      status: level.status,
      priority: level.priority
    };
  });
}

function buildDailySeries(expenses, startDate, endDate) {
  const totalsByDate = expenses.reduce((result, expense) => {
    result[expense.date] = (result[expense.date] || 0) + expense.amount;
    return result;
  }, {});
  const series = [];
  for (let current = new Date(startDate); current <= endDate; current = new Date(current.getTime() + DAY_MS)) {
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
    if (active[index].amount > active[index - 1].amount) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak >= 3 ? streak : 0;
}

function detectRepeatedSmallTransactions(expenses) {
  const groups = expenses.reduce((result, expense) => {
    if (expense.amount > SMALL_TRANSACTION_LIMIT) return result;
    const key = `${expense.date}:${expense.category}`;
    result[key] = result[key] || { date: expense.date, category: expense.category, count: 0, amount: 0 };
    result[key].count += 1;
    result[key].amount += expense.amount;
    return result;
  }, {});

  return Object.values(groups).filter((group) => group.count >= 3);
}

function detectNightSpending(expenses) {
  return expenses.filter((expense) => {
    const hour = Number(String(expense.time || '').split(':')[0]);
    return Number.isFinite(hour) && (hour >= 22 || hour <= 5);
  });
}

function detectCategorySpikes(expenses, today) {
  const currentWeekStart = getWeekStart(today);
  const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * DAY_MS);
  const previousWeekEnd = new Date(currentWeekStart.getTime() - DAY_MS);
  const currentTotals = getCategoryTotals(expenses.filter((expense) => expense.dateObject >= currentWeekStart));
  const previousTotals = getCategoryTotals(expenses.filter((expense) => expense.dateObject >= previousWeekStart && expense.dateObject <= previousWeekEnd));

  return Object.entries(currentTotals)
    .map(([category, amount]) => {
      const previousAmount = previousTotals[category] || 0;
      const ratio = previousAmount > 0 ? amount / previousAmount : amount > 0 ? 2 : 0;
      return { category, amount: Math.round(amount), previousAmount: Math.round(previousAmount), ratio };
    })
    .filter((item) => item.amount >= 100000 && item.ratio >= 1.5)
    .sort((a, b) => b.ratio - a.ratio);
}

function getOverspendingProbability({ budgetUsage, continuousIncreaseDays, abnormalDays, categorySpikes, monthlySpendingForecast, budgetAmount }) {
  let probability = budgetUsage;
  if (continuousIncreaseDays >= 3) probability += 15;
  if (abnormalDays.length) probability += 10;
  if (categorySpikes.length) probability += 10;
  if (budgetAmount > 0 && monthlySpendingForecast > budgetAmount) probability += 15;
  return Math.max(0, Math.min(Math.round(probability), 100));
}

function getFinancialHealthScore({
  budgetUsage,
  continuousIncreaseDays,
  abnormalDays,
  repeatedSmallTransactions,
  nightSpending,
  categorySpikes,
  cashShortfall,
  periodIncome,
  periodSpending,
  topCategoryShare,
  monthlySpendingForecast,
  budgetAmount
}) {
  let score = 100;
  if (budgetUsage > 100) score -= 35;
  else if (budgetUsage > 90) score -= 25;
  else if (budgetUsage >= 70) score -= 12;
  if (continuousIncreaseDays >= 3) score -= 10;
  score -= Math.min(abnormalDays.length * 4, 12);
  score -= Math.min(repeatedSmallTransactions.length * 4, 10);
  if (nightSpending.length >= 2) score -= 8;
  score -= Math.min(categorySpikes.length * 6, 12);
  if (cashShortfall > 0) score -= 30;
  if (periodIncome > 0 && periodSpending > periodIncome) score -= 15;
  else if (periodIncome === 0 && periodSpending > 0) score -= 10;
  if (topCategoryShare >= 70) score -= 15;
  else if (topCategoryShare >= 50) score -= 8;
  if (budgetAmount > 0 && monthlySpendingForecast > budgetAmount) score -= 15;
  return Math.max(0, Math.min(Math.round(score), 100));
}

function getRiskLevel(score, budgetLevel, overspendingProbability) {
  if (budgetLevel.key === 'exceeded' || score < 45 || overspendingProbability >= 85) return 'critical';
  if (budgetLevel.key === 'critical' || score < 65 || overspendingProbability >= 70) return 'high';
  if (budgetLevel.key === 'warning' || score < 80 || overspendingProbability >= 50) return 'medium';
  return 'low';
}

function buildAlerts(context) {
  const alerts = [];
  const {
    budgetLevel,
    budgetUsage,
    monthlySpending,
    budgetAmount,
    categoryBudgetSummaries,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    predictedDaysRemaining
  } = context;

  if (budgetAmount > 0 && budgetLevel.key === 'exceeded') {
    alerts.push({
      priority: 'critical',
      message: `Bạn đã vượt ngân sách ${formatMoney(monthlySpending - budgetAmount)}.`
    });
  } else if (budgetAmount > 0 && budgetLevel.key === 'critical') {
    alerts.push({ priority: 'high', message: `Bạn đã dùng ${budgetUsage}% ngân sách tháng này.` });
  } else if (budgetAmount > 0 && budgetLevel.key === 'warning') {
    alerts.push({ priority: 'medium', message: `Bạn đã dùng ${budgetUsage}% ngân sách, cần giảm chi tiêu trước khi vượt hạn mức.` });
  }

  categoryBudgetSummaries
    .filter((item) => item.usage >= 70)
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        priority: item.usage > 100 ? 'critical' : item.usage > 90 ? 'high' : 'medium',
        message: `Ngân sách ${item.category} đã dùng ${item.usage}%.`
      });
    });

  if (continuousIncreaseDays >= 3) {
    alerts.push({ priority: 'high', message: `Chi tiêu tăng liên tục ${continuousIncreaseDays} ngày gần đây.` });
  }
  if (abnormalDays.length) {
    alerts.push({ priority: 'medium', message: `${abnormalDays.length} ngày có chi tiêu cao hơn trung bình ít nhất 30%.` });
  }
  if (repeatedSmallTransactions.length) {
    alerts.push({ priority: 'medium', message: 'Có nhiều giao dịch nhỏ lặp lại trong cùng một ngày, nên kiểm tra các khoản phát sinh.' });
  }
  if (nightSpending.length >= 2) {
    alerts.push({ priority: 'medium', message: `Có ${nightSpending.length} giao dịch ban đêm trong tháng này.` });
  }
  if (categorySpikes.length) {
    alerts.push({ priority: 'high', message: `Chi tiêu ${categorySpikes[0].category} tăng mạnh so với tuần trước.` });
  }
  if (predictedDaysRemaining !== null && predictedDaysRemaining <= 7) {
    alerts.push({ priority: 'critical', message: `Với tốc độ hiện tại, số dư có thể hết trong ${predictedDaysRemaining} ngày.` });
  }

  return dedupeAlerts(alerts).slice(0, 5);
}

function buildRecommendations(context) {
  const {
    topCategoryEntry,
    categoryTotals,
    budgetLevel,
    budgetUsage,
    continuousIncreaseDays,
    repeatedSmallTransactions,
    nightSpending,
    predictedDaysRemaining,
    monthlySpending,
    budgetAmount
  } = context;
  const recommendations = [];

  if (topCategoryEntry) {
    const [category, amount] = topCategoryEntry;
    const percent = monthlySpending > 0 ? Math.round((amount / monthlySpending) * 100) : 0;
    recommendations.push(`Bạn chi ${percent}% cho ${category}. Giảm 15%-20% nhóm này sẽ tạo hiệu quả tiết kiệm rõ nhất.`);
  }
  if (budgetAmount > 0 && budgetUsage >= 70) {
    recommendations.push('Đặt hạn mức chi tiêu theo ngày cho phần ngân sách còn lại của tháng.');
  }
  if (budgetLevel.key === 'exceeded') {
    recommendations.push('Tạm dừng các khoản không thiết yếu và rà soát nhóm chi lớn nhất trong 7 ngày gần nhất.');
  }
  if (continuousIncreaseDays >= 3) {
    recommendations.push('Dùng mục tiêu chi tiêu cố định trong 3 ngày tới để ngắt đà tăng chi phí.');
  }
  if (repeatedSmallTransactions.length) {
    recommendations.push('Gộp các khoản mua nhỏ và đặt giới hạn cho đồ uống, ăn vặt hoặc giao hàng.');
  }
  if (nightSpending.length >= 2) {
    recommendations.push('Kiểm tra các khoản chi ban đêm, vì đây thường là nhóm dễ phát sinh ngoài kế hoạch.');
  }
  if (predictedDaysRemaining !== null && predictedDaysRemaining <= 10) {
    recommendations.push('Ưu tiên giữ lại tiền cho hóa đơn cố định trước khi chi cho giải trí hoặc mua sắm.');
  }
  if (!Object.keys(categoryTotals).length) {
    recommendations.push('Thêm giao dịch thường xuyên để SmartSpend dự báo chính xác hơn.');
  }

  return [...new Set(recommendations)].slice(0, 5);
}

function buildInsights({
  continuousIncreaseDays,
  abnormalDays,
  repeatedSmallTransactions,
  nightSpending,
  categorySpikes,
  monthlySpendingForecast,
  budgetAmount,
  cashShortfall,
  periodSpending,
  periodIncome,
  topCategoryEntry,
  topCategoryShare,
  periodLabel
}) {
  const insights = [];
  if (cashShortfall > 0) {
    insights.push(`Chi tiêu ${periodLabel} cao hơn số tiền ghi nhận được ${formatMoney(cashShortfall)}.`);
  }
  if (topCategoryEntry && topCategoryShare >= 40) {
    insights.push(`${topCategoryEntry[0]} chiếm ${topCategoryShare}% tổng chi (${formatMoney(topCategoryEntry[1])}), cần ưu tiên cắt giảm.`);
  }
  if (periodIncome > 0 && periodSpending > periodIncome) {
    insights.push(`Dòng tiền ${periodLabel} đang âm ${formatMoney(periodSpending - periodIncome)}.`);
  }
  if (continuousIncreaseDays >= 3) {
    insights.push(`Chi tiêu tăng liên tục ${continuousIncreaseDays} ngày.`);
  }
  if (abnormalDays.length) {
    insights.push(`Phát hiện ${abnormalDays.length} ngày chi tiêu bất thường so với mức trung bình.`);
  }
  if (repeatedSmallTransactions.length) {
    insights.push('Có cụm giao dịch nhỏ lặp lại, có thể là chi tiêu vặt hoặc phí phát sinh.');
  }
  if (nightSpending.length >= 2) {
    insights.push('Chi tiêu ban đêm xuất hiện nhiều lần trong tháng.');
  }
  if (categorySpikes.length) {
    insights.push(`Nhóm ${categorySpikes[0].category} tăng đột biến trong tuần này.`);
  }
  if (budgetAmount > 0 && monthlySpendingForecast > budgetAmount) {
    insights.push(`Dự báo cuối tháng có thể vượt ngân sách ${formatMoney(monthlySpendingForecast - budgetAmount)}.`);
  }
  return insights;
}

function dedupeAlerts(alerts) {
  const seen = new Set();
  return alerts.filter((alert) => {
    if (seen.has(alert.message)) return false;
    seen.add(alert.message);
    return true;
  });
}

function formatMoney(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')} VND`;
}
