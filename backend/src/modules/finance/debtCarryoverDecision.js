const { v4: uuidv4 } = require('uuid');
const { buildDebtCarryover, SAVING_STRATEGIES, calculateDebtRepayment } = require('./debtCarryover');

function roundMoney(value) {
  return Math.max(Math.round(Number(value || 0)), 0);
}

function getGoalSavedAmount(goal = {}) {
  return roundMoney(goal.currentAmount ?? goal.savedAmount ?? goal.saved ?? 0);
}

function getGoalRemainingAmount(goal = {}) {
  return Math.max(roundMoney(goal.target) - getGoalSavedAmount(goal), 0);
}

function getActiveSavingGoals(goals = []) {
  return goals.filter((goal) => Number(goal.target || 0) > 0 && getGoalRemainingAmount(goal) > 0);
}

function getUserBudgetRecord(data = {}, userId = '') {
  data.budgets = Array.isArray(data.budgets) ? data.budgets : [];
  let budget = data.budgets.find((item) => item.userId === userId);
  if (!budget) {
    budget = {
      id: uuidv4(),
      userId,
      amount: 0,
      period: 'Tháng',
      createdAt: new Date().toISOString()
    };
    data.budgets.unshift(budget);
  }
  return budget;
}

function revertPreviousDecision(data = {}, userId = '', decision = null) {
  if (!decision) return;
  const budget = getUserBudgetRecord(data, userId);
  const previousBudgetAdjustment = Number(decision.budgetAdjustmentAmount || 0);
  if (previousBudgetAdjustment !== 0) {
    budget.amount = Math.max(Number(budget.amount || 0) - previousBudgetAdjustment, 0);
    budget.updatedAt = new Date().toISOString();
  }

  const previousSavingAmount = roundMoney(decision.savingGoalContributionAmount);
  if (decision.goalId && previousSavingAmount > 0) {
    const goal = (data.goals || []).find((item) => item.id === decision.goalId && item.userId === userId);
    if (goal) {
      goal.currentAmount = Math.max(getGoalSavedAmount(goal) - previousSavingAmount, 0);
      goal.updatedAt = new Date().toISOString();
    }
  }
}

function buildDecisionFromPayload({ current, budget, goals, body }) {
  const totalDebt = roundMoney(current.debtToCarryNextPeriod);
  const surplus = roundMoney(current.surplusAmount);
  const activeGoals = getActiveSavingGoals(goals);
  const baseBudgetAmount = roundMoney(budget.amount);

  if (totalDebt > 0) {
    const repayment = calculateDebtRepayment(totalDebt, baseBudgetAmount);
    return {
      strategy: SAVING_STRATEGIES.DEBT_REPAYMENT,
      goalId: '',
      savingGoalContributionAmount: 0,
      budgetCarryAmount: 0,
      debtAmount: totalDebt,
      debtRepaymentAmount: repayment.repaymentAmount,
      remainingDebtAmount: repayment.remainingDebt,
      budgetAdjustmentAmount: -repayment.repaymentAmount,
      warning: repayment.warning,
      isLimitedDebtRepayment: repayment.isLimited
    };
  }

  if (surplus <= 0) {
    return {
      strategy: 'no_surplus',
      goalId: '',
      savingGoalContributionAmount: 0,
      budgetCarryAmount: 0,
      debtAmount: 0,
      debtRepaymentAmount: 0,
      remainingDebtAmount: 0,
      budgetAdjustmentAmount: 0,
      warning: 'Kỳ này không có tiền dư để chuyển sang budget hoặc saving goal.',
      isLimitedDebtRepayment: false
    };
  }

  if (!activeGoals.length) {
    return {
      strategy: SAVING_STRATEGIES.NO_SAVING_AUTO_CARRY,
      goalId: '',
      savingGoalContributionAmount: 0,
      budgetCarryAmount: surplus,
      debtAmount: 0,
      debtRepaymentAmount: 0,
      remainingDebtAmount: 0,
      budgetAdjustmentAmount: surplus,
      warning: '',
      isLimitedDebtRepayment: false
    };
  }

  const requestedStrategy = String(body.strategy || SAVING_STRATEGIES.KEEP_FOR_NEXT_BUDGET);
  let goalId = String(body.goalId || '').trim();
  let savingAmount = 0;
  let budgetCarryAmount = 0;

  if (requestedStrategy === SAVING_STRATEGIES.KEEP_FOR_NEXT_BUDGET) {
    budgetCarryAmount = surplus;
  } else if (requestedStrategy === SAVING_STRATEGIES.SEND_ALL_TO_SAVING) {
    savingAmount = surplus;
  } else if (requestedStrategy === SAVING_STRATEGIES.SPLIT_SAVING_AND_BUDGET) {
    savingAmount = roundMoney(body.savingAmount);
    if (savingAmount <= 0 || savingAmount >= surplus) {
      throw new Error('Số tiền gửi vào saving goal phải lớn hơn 0 và nhỏ hơn tiền dư khi chọn chia tiền.');
    }
    budgetCarryAmount = surplus - savingAmount;
  } else {
    throw new Error('Lựa chọn debt carry-over không hợp lệ.');
  }

  if (savingAmount > 0) {
    const goal = activeGoals.find((item) => item.id === goalId) || activeGoals[0];
    if (!goal) throw new Error('Không tìm thấy saving goal để cộng tiền.');
    goalId = goal.id;
  }

  return {
    strategy: requestedStrategy,
    goalId: savingAmount > 0 ? goalId : '',
    savingGoalContributionAmount: savingAmount,
    budgetCarryAmount,
    debtAmount: 0,
    debtRepaymentAmount: 0,
    remainingDebtAmount: 0,
    budgetAdjustmentAmount: budgetCarryAmount,
    warning: '',
    isLimitedDebtRepayment: false
  };
}

function applyDebtCarryoverDecision({ data, user, getUserId, buildUserScopedData, body = {} }) {
  const userId = getUserId(user);
  if (!userId) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }

  data.debtCarryovers = Array.isArray(data.debtCarryovers) ? data.debtCarryovers : [];
  data.goals = Array.isArray(data.goals) ? data.goals : [];
  const budget = getUserBudgetRecord(data, userId);
  let scopedData = buildUserScopedData(data, user);
  scopedData.debtCarryovers = data.debtCarryovers.filter((item) => item.userId === userId);
  const initialCurrent = buildDebtCarryover(scopedData, new Date()).current;
  const periodKey = initialCurrent.periodKey;
  const existingIndex = data.debtCarryovers.findIndex((item) => item.userId === userId && item.periodKey === periodKey);
  const existing = existingIndex >= 0 ? data.debtCarryovers[existingIndex] : null;

  revertPreviousDecision(data, userId, existing);
  if (existingIndex >= 0) data.debtCarryovers.splice(existingIndex, 1);

  scopedData = buildUserScopedData(data, user);
  scopedData.debtCarryovers = data.debtCarryovers.filter((item) => item.userId === userId);
  const current = buildDebtCarryover(scopedData, new Date()).current;

  const decision = buildDecisionFromPayload({
    current,
    budget,
    goals: data.goals.filter((goal) => goal.userId === userId),
    body
  });

  if (decision.budgetAdjustmentAmount !== 0) {
    budget.amount = Math.max(roundMoney(budget.amount) + Number(decision.budgetAdjustmentAmount || 0), 0);
    budget.updatedAt = new Date().toISOString();
  }

  if (decision.goalId && decision.savingGoalContributionAmount > 0) {
    const goal = data.goals.find((item) => item.id === decision.goalId && item.userId === userId);
    if (!goal) throw new Error('Không tìm thấy saving goal để cập nhật.');
    goal.currentAmount = getGoalSavedAmount(goal) + decision.savingGoalContributionAmount;
    goal.updatedAt = new Date().toISOString();
  }

  const record = {
    id: existing?.id || uuidv4(),
    userId,
    budgetId: budget.id || '',
    periodKey,
    period: periodKey,
    periodLabel: current.periodLabel,
    strategy: decision.strategy,
    goalId: decision.goalId,
    baseBudgetAmount: roundMoney(current.baseBudgetAmount || budget.amount),
    periodIncome: roundMoney(current.periodIncome),
    periodExpense: roundMoney(current.periodExpense),
    grossBudget: roundMoney(current.grossBudget),
    availableBudget: roundMoney(current.availableBudget),
    surplusAmount: roundMoney(current.surplusAmount),
    budgetCarryAmount: roundMoney(decision.budgetCarryAmount),
    savingGoalContributionAmount: roundMoney(decision.savingGoalContributionAmount),
    debtAmount: roundMoney(decision.debtAmount),
    debtRepaymentAmount: roundMoney(decision.debtRepaymentAmount),
    remainingDebtAmount: roundMoney(decision.remainingDebtAmount),
    budgetAdjustmentAmount: Math.round(Number(decision.budgetAdjustmentAmount || 0)),
    nextBudgetAmount: roundMoney(budget.amount),
    warning: decision.warning,
    isLimitedDebtRepayment: decision.isLimitedDebtRepayment,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  data.debtCarryovers.unshift(record);

  return {
    decision: record,
    budget,
    goals: data.goals.filter((goal) => goal.userId === userId)
  };
}

module.exports = {
  applyDebtCarryoverDecision,
  getGoalSavedAmount,
  getGoalRemainingAmount
};
