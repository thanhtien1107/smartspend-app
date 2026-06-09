import {
  PeriodMetrics,
  RuleCategory,
  RuleDefinition,
} from "../domain/types";
import { RULE_DIMENSION_MAP } from "../domain/constants";
import { RuleProvider } from "../application/ports";

interface RuleSeed {
  metric: keyof PeriodMetrics;
  operator: RuleDefinition["operator"];
  thresholds: number[];
  description: string;
}

const RULE_SEEDS: Record<RuleCategory, RuleSeed[]> = {
  budget: [
    { metric: "budgetUsage", operator: "gte", thresholds: [0.5, 0.7, 0.85, 1], description: "Budget consumption is elevated" },
    { metric: "projectedBudgetUsage", operator: "gte", thresholds: [0.8, 1, 1.15, 1.35], description: "Projected budget consumption is elevated" },
    { metric: "budgetVariance", operator: "lt", thresholds: [0, -500000, -2000000, -5000000], description: "Budget variance is negative" },
  ],
  spending: [
    { metric: "expenseToIncomeRatio", operator: "gte", thresholds: [0.6, 0.8, 1, 1.2], description: "Expense-to-income ratio is high" },
    { metric: "topCategoryShare", operator: "gte", thresholds: [0.35, 0.5, 0.7, 0.85], description: "Spending is concentrated in one category" },
    { metric: "discretionaryRatio", operator: "gte", thresholds: [0.3, 0.45, 0.6, 0.75], description: "Discretionary spending is high" },
  ],
  savings: [
    { metric: "savingsRate", operator: "lte", thresholds: [0.2, 0.1, 0, -0.1], description: "Savings rate is below target" },
    { metric: "emergencyFundMonths", operator: "lte", thresholds: [6, 3, 1, 0.25], description: "Emergency fund coverage is low" },
    { metric: "netCashFlow", operator: "lt", thresholds: [1, 0, -1000000, -5000000], description: "Net cash flow is weak" },
  ],
  risk: [
    { metric: "cashRunwayDays", operator: "lte", thresholds: [90, 30, 14, 7], description: "Cash runway is limited" },
    { metric: "expenseVolatility", operator: "gte", thresholds: [0.3, 0.6, 1, 1.5], description: "Expense volatility is elevated" },
    { metric: "projectedNetCashFlow", operator: "lt", thresholds: [0, -500000, -2000000, -5000000], description: "Projected cash flow is negative" },
  ],
  goal: [
    { metric: "goalProgress", operator: "lte", thresholds: [0.8, 0.6, 0.4, 0.2], description: "Goal progress is behind plan" },
    { metric: "goalsOnTrackRatio", operator: "lte", thresholds: [0.8, 0.6, 0.4, 0.2], description: "Too few goals are on track" },
    { metric: "goalCount", operator: "lte", thresholds: [3, 2, 1, 0], description: "Financial goal coverage is limited" },
  ],
  forecast: [
    { metric: "projectedBudgetUsage", operator: "gte", thresholds: [0.7, 0.9, 1, 1.25], description: "Forecast signals budget pressure" },
    { metric: "projectedExpenses", operator: "gt", thresholds: [1000000, 5000000, 10000000, 25000000], description: "Projected expenses are material" },
    { metric: "projectedNetCashFlow", operator: "lt", thresholds: [1000000, 0, -1000000, -5000000], description: "Forecast cash generation is weak" },
  ],
  behavioral: [
    { metric: "impulseTransactions", operator: "gte", thresholds: [3, 5, 8, 12], description: "Impulse transaction frequency is high" },
    { metric: "lateNightTransactions", operator: "gte", thresholds: [1, 3, 5, 8], description: "Late-night spending is frequent" },
    { metric: "spendingConsistency", operator: "lte", thresholds: [0.8, 0.6, 0.4, 0.2], description: "Spending consistency is low" },
  ],
  subscription: [
    { metric: "subscriptionCount", operator: "gte", thresholds: [2, 4, 6, 10], description: "Subscription count is high" },
    { metric: "recurringExpenseRatio", operator: "gte", thresholds: [0.1, 0.2, 0.35, 0.5], description: "Recurring expenses consume a large share" },
    { metric: "duplicateSubscriptionCount", operator: "gte", thresholds: [1, 2, 3, 5], description: "Potential duplicate subscriptions detected" },
  ],
  lifestyle: [
    { metric: "discretionaryRatio", operator: "gte", thresholds: [0.25, 0.4, 0.55, 0.7], description: "Lifestyle spending is elevated" },
    { metric: "topCategoryShare", operator: "gte", thresholds: [0.3, 0.45, 0.6, 0.8], description: "Lifestyle concentration is high" },
    { metric: "averageDailyExpense", operator: "gt", thresholds: [100000, 300000, 700000, 1500000], description: "Daily lifestyle cost is high" },
  ],
  stability: [
    { metric: "incomeStability", operator: "lte", thresholds: [0.8, 0.6, 0.4, 0.2], description: "Income stability is low" },
    { metric: "dataCompleteness", operator: "lte", thresholds: [0.8, 0.6, 0.4, 0.2], description: "Financial data completeness is low" },
    { metric: "cashRunwayDays", operator: "lte", thresholds: [120, 60, 30, 14], description: "Financial runway is insufficient" },
  ],
};

const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const MESSAGE_TYPES = ["insight", "recommendation", "warning", "warning"] as const;

export class DefaultRuleProvider implements RuleProvider {
  private readonly rules: RuleDefinition[];

  constructor() {
    this.rules = Object.entries(RULE_SEEDS).flatMap(([category, seeds]) =>
      seeds.flatMap((seed, seedIndex) =>
        seed.thresholds.map((threshold, level) => ({
          id: `${category.toUpperCase()}-${String(seedIndex + 1).padStart(2, "0")}-${level + 1}`,
          category: category as RuleCategory,
          dimension: RULE_DIMENSION_MAP[category as RuleCategory],
          description: `${seed.description} (level ${level + 1})`,
          severity: SEVERITIES[level],
          metric: seed.metric,
          operator: seed.operator,
          threshold,
          scoreImpact: [0.5, 1, 1.75, 2.5][level],
          messageType: MESSAGE_TYPES[level],
          templateIndex: seedIndex * 4 + level,
        })),
      ),
    );
  }

  getRules(): RuleDefinition[] {
    return this.rules;
  }
}
