const DAY_MS = 24 * 60 * 60 * 1000;

const INCOME_CATEGORY_KEYS = new Set([
  'luong',
  'thuong',
  'phu cap',
  'lam them',
  'kinh doanh',
  'dau tu sinh loi',
  'qua tang nhan duoc',
  'hoan tien',
  'thu nhap khac'
]);

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function normalizeVietnameseKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isIncomeCategoryName(category) {
  return INCOME_CATEGORY_KEYS.has(normalizeVietnameseKey(category));
}

function normalizeTransaction(transaction = {}) {
  const category = String(transaction.category || 'Khác').trim() || 'Khác';
  const type = transaction.type === 'income' || (!transaction.type && isIncomeCategoryName(category)) ? 'income' : 'expense';
  return {
    ...transaction,
    type,
    amount: Number(transaction.amount || 0),
    category,
    date: String(transaction.date || transaction.createdAt || '').slice(0, 10),
    dateObject: parseDate(transaction.date || transaction.createdAt)
  };
}

function getBudgetPeriodType(budget = {}) {
  const period = normalizeVietnameseKey(budget.period || 'Tháng');
  return period.includes('tuan') || period === 'week' ? 'week' : 'month';
}

function getWeekStart(date) {
  const day = date.getDay() || 7;
  const result = new Date(date);
  result.setDate(date.getDate() - day + 1);
  return startOfDay(result);
}

function getPeriodStart(date, periodType) {
  const base = startOfDay(date);
  if (periodType === 'week') return getWeekStart(base);
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function getPeriodEnd(periodStart, periodType) {
  if (periodType === 'week') {
    const end = new Date(periodStart.getTime() + 6 * DAY_MS);
    end.setHours(23, 59, 59, 999);
    return end;
  }
  const end = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

function addPeriod(periodStart, periodType) {
  if (periodType === 'week') return new Date(periodStart.getTime() + 7 * DAY_MS);
  return new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);
}

function formatPeriodKey(periodStart, periodType) {
  if (periodType === 'week') {
    const weekStart = getWeekStart(periodStart);
    return `WEEK-${weekStart.toISOString().slice(0, 10)}`;
  }
  return `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriodLabel(periodStart, periodType) {
  if (periodType === 'week') {
    const end = getPeriodEnd(periodStart, periodType);
    return `Tuần ${periodStart.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
  }
  return `Tháng ${String(periodStart.getMonth() + 1).padStart(2, '0')}/${periodStart.getFullYear()}`;
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function buildDebtCarryover(data = {}, asOfDate = new Date()) {
  const budget = data.budget || { amount: 0, period: 'Tháng' };
  const baseBudgetAmount = Math.max(Number(budget.amount || 0), 0);
  const periodType = getBudgetPeriodType(budget);
  const normalizedTransactions = (data.expenses || [])
    .map(normalizeTransaction)
    .filter((transaction) => transaction.amount > 0 && transaction.dateObject);

  const currentPeriodStart = getPeriodStart(startOfDay(asOfDate), periodType);
  const earliestDate = normalizedTransactions.length
    ? normalizedTransactions.reduce((min, transaction) => transaction.dateObject < min ? transaction.dateObject : min, normalizedTransactions[0].dateObject)
    : currentPeriodStart;
  const firstPeriodStart = getPeriodStart(earliestDate, periodType);

  const records = [];
  let carriedDebt = 0;

  for (let periodStart = new Date(firstPeriodStart); periodStart <= currentPeriodStart; periodStart = addPeriod(periodStart, periodType)) {
    const periodEnd = getPeriodEnd(periodStart, periodType);
    const periodTransactions = normalizedTransactions.filter((transaction) => transaction.dateObject >= periodStart && transaction.dateObject <= periodEnd);
    const incomes = periodTransactions.filter((transaction) => transaction.type === 'income');
    const expenses = periodTransactions.filter((transaction) => transaction.type !== 'income');
    const periodIncome = sumAmounts(incomes);
    const periodExpense = sumAmounts(expenses);
    const grossBudget = baseBudgetAmount + periodIncome;
    const debtFromPrevious = carriedDebt;
    const unpaidPreviousDebt = Math.max(debtFromPrevious - grossBudget, 0);
    const availableBudget = Math.max(grossBudget - debtFromPrevious, 0);
    const newOverspendingDebt = Math.max(periodExpense - availableBudget, 0);
    const debtToCarryNextPeriod = unpaidPreviousDebt + newOverspendingDebt;
    const usage = availableBudget > 0 ? Math.round((periodExpense / availableBudget) * 100) : (periodExpense > 0 ? 100 : 0);

    const record = {
      periodType,
      periodKey: formatPeriodKey(periodStart, periodType),
      periodLabel: formatPeriodLabel(periodStart, periodType),
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      baseBudgetAmount: Math.round(baseBudgetAmount),
      periodIncome: Math.round(periodIncome),
      periodExpense: Math.round(periodExpense),
      grossBudget: Math.round(grossBudget),
      carriedDebtFromPrevious: Math.round(debtFromPrevious),
      availableBudget: Math.round(availableBudget),
      unpaidPreviousDebt: Math.round(unpaidPreviousDebt),
      newOverspendingDebt: Math.round(newOverspendingDebt),
      debtToCarryNextPeriod: Math.round(debtToCarryNextPeriod),
      usage,
      status: debtToCarryNextPeriod > 0 ? 'Vượt ngân sách' : usage >= 70 ? 'Cảnh báo' : 'An toàn'
    };

    records.push(record);
    carriedDebt = debtToCarryNextPeriod;
  }

  const current = records[records.length - 1] || {
    periodType,
    periodKey: formatPeriodKey(currentPeriodStart, periodType),
    periodLabel: formatPeriodLabel(currentPeriodStart, periodType),
    periodStart: currentPeriodStart.toISOString().slice(0, 10),
    periodEnd: getPeriodEnd(currentPeriodStart, periodType).toISOString().slice(0, 10),
    baseBudgetAmount: Math.round(baseBudgetAmount),
    periodIncome: 0,
    periodExpense: 0,
    grossBudget: Math.round(baseBudgetAmount),
    carriedDebtFromPrevious: 0,
    availableBudget: Math.round(baseBudgetAmount),
    unpaidPreviousDebt: 0,
    newOverspendingDebt: 0,
    debtToCarryNextPeriod: 0,
    usage: 0,
    status: 'An toàn'
  };

  return {
    periodType,
    records,
    current
  };
}

module.exports = {
  buildDebtCarryover,
  getBudgetPeriodType,
  normalizeTransaction
};
