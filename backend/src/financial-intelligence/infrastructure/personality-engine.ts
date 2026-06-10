import { PersonalityProvider } from "../application/ports";
import {
  FinancialPersonality,
  PeriodMetrics,
  ScoreBreakdown,
} from "../domain/types";

export class DefaultPersonalityProvider implements PersonalityProvider {
  detect(
    metrics: PeriodMetrics,
    scores: ScoreBreakdown,
  ): FinancialPersonality {
    if (metrics.dataCompleteness < 0.5 || metrics.transactionCount < 5) {
      return "Financial Beginner";
    }
    if (
      metrics.goalCount > 0 &&
      metrics.goalProgress >= 0.65 &&
      scores.goalAchievement.percentage >= 75
    ) {
      return "Goal Driven";
    }
    if (
      metrics.budgetUsage <= 0.9 &&
      scores.budgetManagement.percentage >= 85 &&
      metrics.dataCompleteness >= 0.8
    ) {
      return "Budget Master";
    }
    if (
      metrics.savingsRate >= 0.25 &&
      metrics.emergencyFundMonths >= 3
    ) {
      return "Saver";
    }
    if (
      metrics.discretionaryRatio >= 0.55 &&
      metrics.topCategoryShare >= 0.45
    ) {
      return "Lifestyle Spender";
    }
    if (
      metrics.impulseTransactions >= 8 ||
      metrics.spendingConsistency < 0.35
    ) {
      return "Impulsive Spender";
    }
    if (
      metrics.expenseVolatility >= 1 ||
      metrics.projectedNetCashFlow < 0
    ) {
      return "Risk Taker";
    }
    return "Balanced Planner";
  }
}
