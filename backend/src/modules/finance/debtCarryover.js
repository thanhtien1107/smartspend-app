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

const SAVING_STRATEGIES = {
  KEEP_FOR_NEXT_BUDGET: 'keep_for_next_budget',
  SPLIT_SAVING_AND_BUDGET: 'split_saving_and_budget',
  SEND_ALL_TO_SAVING: 'send_all_to_saving',
  NO_SAVING_AUTO_CARRY: 'no_saving_auto_carry',
  DEBT_REPAYMENT: 'debt_repayment'
};

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

function isGoalCompleted(goal = {}) {
  const target = Number(goal.target || 0);
  const saved = Number(goal.currentAmount ?? goal.savedAmount ?? goal.saved ?? 0);
  return target > 0 && saved >= target;
}

function getActiveSavingGoals(data = {}) {
  return (data.goals || []).filter((goal) => Number(goal.target || 0) > 0 && !isGoalCompleted(goal));
}

function findDecision(data = {}, periodKey = '') {
  return (data.debtCarryovers || []).find((item) => item.periodKey === periodKey) || null;
}

function calculateDebtRepayment(debtAmount, baseBudgetAmount) {
  const debt = Math.max(Number(debtAmount || 0), 0);
  const budget = Math.max(Number(baseBudgetAmount || 0), 0);
  if (debt <= 0) {
    return {
      repaymentAmount: 0,
      remainingDebt: 0,
      isLimited: false,
      warning: ''
    };
  }

  if (debt > budget) {
    const repaymentAmount = Math.min(Math.round(debt * 0.25), budget);
    return {
      repaymentAmount,
      remainingDebt: Math.max(debt - repaymentAmount, 0),
      isLimited: true,
      warning: 'Khoản nợ lớn hơn ngân sách kỳ sau nên hệ thống chỉ trừ 25% nợ để tránh làm ngân sách khả dụng bằng 0.'
    };
  }

  return {
    repaymentAmount: debt,
    remainingDebt: 0,
    isLimited: false,
    warning: ''
  };
}

function getDefaultSurplusDecision({ surplusAmount, activeSavingGoals }) {
  if (surplusAmount <= 0) {
    return {
      strategy: '',
      budgetCarryAmount: 0,
      savingGoalContributionAmount: 0,
      requiresSavingDecision: false
    };
  }

  if (!activeSavingGoals.length) {
    return {
      strategy: SAVING_STRATEGIES.NO_SAVING_AUTO_CARRY,
      budgetCarryAmount: surplusAmount,
      savingGoalContributionAmount: 0,
      requiresSavingDecision: false
    };
  }

  return {
    strategy: '',
    budgetCarryAmount: 0,
    savingGoalContributionAmount: 0,
    requiresSavingDecision: true
  };
}

function buildDebtCarryover(data = {}, asOfDate = new Date()) {
  const budget = data.budget || { amount: 0, period: 'Tháng' };
  const baseBudgetAmount = Math.max(Number(budget.amount || 0), 0);
  const periodType = getBudgetPeriodType(budget);
  const activeSavingGoals = getActiveSavingGoals(data);
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
  let carriedBudgetBonus = 0;

  for (let periodStart = new Date(firstPeriodStart); periodStart <= currentPeriodStart; periodStart = addPeriod(periodStart, periodType)) {
    const periodEnd = getPeriodEnd(periodStart, periodType);
    const periodKey = formatPeriodKey(periodStart, periodType);
    const savedDecision = findDecision(data, periodKey);
    const periodTransactions = normalizedTransactions.filter((transaction) => transaction.dateObject >= periodStart && transaction.dateObject <= periodEnd);
    const incomes = periodTransactions.filter((transaction) => transaction.type === 'income');
    const expenses = periodTransactions.filter((transaction) => transaction.type !== 'income');
    const periodIncome = sumAmounts(incomes);
    const periodExpense = sumAmounts(expenses);
    const grossBudget = baseBudgetAmount + periodIncome + carriedBudgetBonus;
    const debtFromPrevious = carriedDebt;
    const previousDebtRepayment = calculateDebtRepayment(debtFromPrevious, grossBudget);
    const availableBudget = Math.max(grossBudget - previousDebtRepayment.repaymentAmount, 0);
    const newOverspendingDebt = Math.max(periodExpense - availableBudget, 0);
    const surplusAmount = Math.max(availableBudget - periodExpense, 0);
    const debtToCarryNextPeriod = previousDebtRepayment.remainingDebt + newOverspendingDebt;
    const savedBudgetCarryAmount = Math.max(Number(savedDecision?.budgetCarryAmount || 0), 0);
    const savedGoalContributionAmount = Math.max(Number(savedDecision?.savingGoalContributionAmount || 0), 0);
    const defaultSurplusDecision = getDefaultSurplusDecision({ surplusAmount, activeSavingGoals });
    const budgetCarryToNextPeriod = debtToCarryNextPeriod > 0
      ? 0
      : savedDecision
        ? Math.min(savedBudgetCarryAmount, surplusAmount)
        : defaultSurplusDecision.budgetCarryAmount;
    const savingGoalContribution = debtToCarryNextPeriod > 0
      ? 0
      : savedDecision
        ? Math.min(savedGoalContributionAmount, surplusAmount)
        : defaultSurplusDecision.savingGoalContributionAmount;
    const strategy = debtToCarryNextPeriod > 0
      ? SAVING_STRATEGIES.DEBT_REPAYMENT
      : savedDecision?.strategy || defaultSurplusDecision.strategy;
    const usage = availableBudget > 0 ? Math.round((periodExpense / availableBudget) * 100) : (periodExpense > 0 ? 100 : 0);

    const record = {
      periodType,
      periodKey,
      periodLabel: formatPeriodLabel(periodStart, periodType),
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      baseBudgetAmount: Math.round(baseBudgetAmount),
      periodIncome: Math.round(periodIncome),
      periodExpense: Math.round(periodExpense),
      carriedBudgetBonusFromPrevious: Math.round(carriedBudgetBonus),
      grossBudget: Math.round(grossBudget),
      carriedDebtFromPrevious: Math.round(debtFromPrevious),
      debtRepaymentAmount: Math.round(previousDebtRepayment.repaymentAmount),
      debtRepaymentLimited: previousDebtRepayment.isLimited,
      debtRepaymentWarning: previousDebtRepayment.warning,
      availableBudget: Math.round(availableBudget),
      unpaidPreviousDebt: Math.round(previousDebtRepayment.remainingDebt),
      newOverspendingDebt: Math.round(newOverspendingDebt),
      debtToCarryNextPeriod: Math.round(debtToCarryNextPeriod),
      surplusAmount: Math.round(surplusAmount),
      hasSavingGoal: activeSavingGoals.length > 0,
      requiresSavingDecision: debtToCarryNextPeriod <= 0 && Boolean(defaultSurplusDecision.requiresSavingDecision) && !savedDecision,
      savingDecisionApplied: Boolean(savedDecision),
      savingDecisionStrategy: strategy,
      savingGoalId: savedDecision?.goalId || '',
      savingGoalContributionAmount: Math.round(savingGoalContribution),
      budgetCarryToNextPeriod: Math.round(budgetCarryToNextPeriod),
      nextBudgetPreviewAmount: Math.max(Math.round(baseBudgetAmount + budgetCarryToNextPeriod - calculateDebtRepayment(debtToCarryNextPeriod, baseBudgetAmount).repaymentAmount), 0),
      usage,
      status: debtToCarryNextPeriod > 0 ? 'Vượt ngân sách' : usage >= 70 ? 'Cảnh báo' : 'An toàn'
    };

    records.push(record);
    carriedDebt = debtToCarryNextPeriod;
    carriedBudgetBonus = budgetCarryToNextPeriod;
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
    debtRepaymentAmount: 0,
    debtRepaymentLimited: false,
    debtRepaymentWarning: '',
    availableBudget: Math.round(baseBudgetAmount),
    unpaidPreviousDebt: 0,
    newOverspendingDebt: 0,
    debtToCarryNextPeriod: 0,
    surplusAmount: 0,
    hasSavingGoal: activeSavingGoals.length > 0,
    requiresSavingDecision: false,
    savingDecisionApplied: false,
    savingDecisionStrategy: '',
    savingGoalId: '',
    savingGoalContributionAmount: 0,
    budgetCarryToNextPeriod: 0,
    nextBudgetPreviewAmount: Math.round(baseBudgetAmount),
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
  SAVING_STRATEGIES,
  buildDebtCarryover,
  calculateDebtRepayment,
  getBudgetPeriodType,
  normalizeTransaction
};
