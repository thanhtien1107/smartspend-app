import {
  AnalysisPeriod,
  FinancialSnapshot,
  PeriodMetrics,
  Transaction,
} from "../domain/types";
import {
  DISCRETIONARY_CATEGORY_KEYS,
  ESSENTIAL_CATEGORY_KEYS,
} from "../domain/constants";
import { MetricsProvider } from "../application/ports";

const DAY_MS = 86_400_000;

function normalizeKey(value = ""): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim();
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function periodRange(period: AnalysisPeriod, asOf: Date): {
  start: Date;
  end: Date;
  totalDays: number;
  elapsedDays: number;
} {
  const end = startOfDay(asOf);
  let start: Date;
  if (period === "weekly") {
    const day = end.getDay() || 7;
    start = new Date(end);
    start.setDate(end.getDate() - day + 1);
  } else if (period === "quarterly") {
    start = new Date(end.getFullYear(), Math.floor(end.getMonth() / 3) * 3, 1);
  } else if (period === "yearly") {
    start = new Date(end.getFullYear(), 0, 1);
  } else {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }
  const periodEnd =
    period === "weekly"
      ? new Date(start.getTime() + 6 * DAY_MS)
      : period === "quarterly"
        ? new Date(start.getFullYear(), start.getMonth() + 3, 0)
        : period === "yearly"
          ? new Date(start.getFullYear(), 11, 31)
          : new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return {
    start: startOfDay(start),
    end,
    totalDays: Math.floor((startOfDay(periodEnd).getTime() - start.getTime()) / DAY_MS) + 1,
    elapsedDays: Math.max(Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1, 1),
  };
}

function sum(items: Transaction[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

function periodBudget(
  snapshot: FinancialSnapshot,
  period: AnalysisPeriod,
): number {
  const exact = snapshot.budgets
    .filter((budget) => !budget.category && budget.period === period)
    .reduce((total, budget) => total + budget.amount, 0);
  if (exact > 0) return exact;
  const monthly = snapshot.budgets
    .filter((budget) => !budget.category && budget.period === "monthly")
    .reduce((total, budget) => total + budget.amount, 0);
  if (monthly <= 0) return 0;
  if (period === "weekly") return (monthly * 12) / 52;
  if (period === "quarterly") return monthly * 3;
  if (period === "yearly") return monthly * 12;
  return monthly;
}

function recurringSignature(transaction: Transaction): string {
  return `${normalizeKey(transaction.merchant || transaction.title)}:${Math.round(transaction.amount / 1000)}`;
}

export class DefaultMetricsProvider implements MetricsProvider {
  calculate(snapshot: FinancialSnapshot, period: AnalysisPeriod): PeriodMetrics {
    const asOf = startOfDay(new Date(snapshot.asOf));
    const range = periodRange(period, asOf);
    const transactions = snapshot.transactions.filter((transaction) => {
      const date = startOfDay(new Date(transaction.date));
      return date >= range.start && date <= range.end;
    });
    const incomes = transactions.filter((item) => item.type === "income");
    const expenses = transactions.filter((item) => item.type === "expense");
    const income = sum(incomes);
    const expenseTotal = sum(expenses);
    const categoryTotals = new Map<string, number>();
    const dailyTotals = new Map<string, number>();
    const recurringGroups = new Map<string, Transaction[]>();
    let essentialAmount = 0;
    let discretionaryAmount = 0;
    let lateNightTransactions = 0;
    let impulseTransactions = 0;

    for (const expense of expenses) {
      const categoryKey = normalizeKey(expense.category);
      categoryTotals.set(
        expense.category,
        (categoryTotals.get(expense.category) || 0) + expense.amount,
      );
      dailyTotals.set(
        expense.date.slice(0, 10),
        (dailyTotals.get(expense.date.slice(0, 10)) || 0) + expense.amount,
      );
      if (ESSENTIAL_CATEGORY_KEYS.has(categoryKey)) essentialAmount += expense.amount;
      if (DISCRETIONARY_CATEGORY_KEYS.has(categoryKey)) discretionaryAmount += expense.amount;
      const hour = Number((expense.time || "").split(":")[0]);
      if (Number.isFinite(hour) && (hour >= 22 || hour <= 5)) lateNightTransactions += 1;
      if (expense.amount <= Math.max(income * 0.02, 100_000)) impulseTransactions += 1;
      const signature = recurringSignature(expense);
      if (signature.split(":")[0]) {
        const group = recurringGroups.get(signature) || [];
        group.push(expense);
        recurringGroups.set(signature, group);
      }
    }

    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];
    const budgetAmount = periodBudget(snapshot, period);
    const averageDailyExpense = expenseTotal / range.elapsedDays;
    const projectedExpenses = averageDailyExpense * range.totalDays;
    const dailyValues = [...dailyTotals.values()];
    const volatility =
      averageDailyExpense > 0
        ? standardDeviation(dailyValues) / averageDailyExpense
        : 0;
    const recurring = [...recurringGroups.values()].filter(
      (group) => group.length >= 2 || group.some((item) => item.recurring),
    );
    const recurringExpenseAmount = recurring.reduce(
      (total, group) => total + sum(group),
      0,
    );
    const duplicateSubscriptionCount = recurring.filter((group) => group.length >= 3).length;
    const goalProgressValues = snapshot.goals.map((goal) =>
      goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0,
    );
    const goalProgress =
      goalProgressValues.length > 0
        ? goalProgressValues.reduce((total, value) => total + value, 0) /
          goalProgressValues.length
        : 0;
    const remainingCash = Math.max(snapshot.walletBalance + income - expenseTotal, 0);
    const netCashFlow = income - expenseTotal;
    const savingsRate = income > 0 ? netCashFlow / income : expenseTotal > 0 ? -1 : 0;
    const expenseToIncomeRatio =
      income > 0 ? expenseTotal / income : expenseTotal > 0 ? 2 : 0;
    const incomeDaily = incomes.map((item) => item.amount);
    const incomeMean = incomeDaily.length ? income / incomeDaily.length : 0;
    const incomeStability =
      incomeMean > 0
        ? Math.max(0, 1 - standardDeviation(incomeDaily) / incomeMean)
        : 0;
    const spendingConsistency = Math.max(0, 1 - Math.min(volatility, 1));
    const completenessSignals = [
      snapshot.walletBalance > 0,
      snapshot.budgets.length > 0,
      transactions.length >= 3,
      incomes.length > 0,
      snapshot.goals.length > 0,
    ];

    return {
      period,
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      income,
      expenses: expenseTotal,
      netCashFlow,
      savingsRate,
      budgetAmount,
      budgetUsage: budgetAmount > 0 ? expenseTotal / budgetAmount : expenseTotal > 0 ? 2 : 0,
      budgetVariance: budgetAmount - expenseTotal,
      expenseToIncomeRatio,
      discretionaryRatio: expenseTotal > 0 ? discretionaryAmount / expenseTotal : 0,
      essentialRatio: expenseTotal > 0 ? essentialAmount / expenseTotal : 0,
      topCategory: topCategory?.[0] || "Uncategorized",
      topCategoryAmount: topCategory?.[1] || 0,
      topCategoryShare: expenseTotal > 0 ? (topCategory?.[1] || 0) / expenseTotal : 0,
      transactionCount: transactions.length,
      activeDays: dailyTotals.size,
      averageDailyExpense,
      expenseVolatility: volatility,
      lateNightTransactions,
      impulseTransactions,
      recurringExpenseAmount,
      recurringExpenseRatio: expenseTotal > 0 ? recurringExpenseAmount / expenseTotal : 0,
      subscriptionCount: recurring.length,
      duplicateSubscriptionCount,
      goalCount: snapshot.goals.length,
      goalProgress,
      goalsOnTrackRatio: goalProgressValues.length
        ? goalProgressValues.filter((value) => value >= 0.5).length /
          goalProgressValues.length
        : 0,
      emergencyFundMonths:
        averageDailyExpense > 0 ? remainingCash / (averageDailyExpense * 30) : 0,
      cashRunwayDays:
        averageDailyExpense > 0 ? remainingCash / averageDailyExpense : remainingCash > 0 ? 365 : 0,
      projectedExpenses,
      projectedNetCashFlow: income - projectedExpenses,
      projectedBudgetUsage: budgetAmount > 0 ? projectedExpenses / budgetAmount : projectedExpenses > 0 ? 2 : 0,
      incomeStability,
      spendingConsistency,
      dataCompleteness:
        completenessSignals.filter(Boolean).length / completenessSignals.length,
    };
  }
}
