import {
  FinancialHealthDimension,
  RuleCategory,
} from "./types";

export const ENGINE_VERSION = "1.0.0";

export const DIMENSION_WEIGHTS: Record<FinancialHealthDimension, number> = {
  financialDiscipline: 15,
  budgetManagement: 15,
  savingsAbility: 15,
  spendingEfficiency: 15,
  riskManagement: 10,
  goalAchievement: 10,
  financialStability: 10,
  behaviorConsistency: 10,
};

export const RULE_DIMENSION_MAP: Record<
  RuleCategory,
  FinancialHealthDimension
> = {
  budget: "budgetManagement",
  spending: "spendingEfficiency",
  savings: "savingsAbility",
  risk: "riskManagement",
  goal: "goalAchievement",
  forecast: "financialStability",
  behavioral: "behaviorConsistency",
  subscription: "financialDiscipline",
  lifestyle: "spendingEfficiency",
  stability: "financialStability",
};

export const PERIODS = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export const ESSENTIAL_CATEGORY_KEYS = new Set([
  "housing",
  "rent",
  "utilities",
  "health",
  "healthcare",
  "education",
  "transport",
  "food",
  "groceries",
  "an uong",
  "nha o",
  "y te",
  "giao duc",
  "di lai",
]);

export const DISCRETIONARY_CATEGORY_KEYS = new Set([
  "entertainment",
  "shopping",
  "travel",
  "gaming",
  "dining",
  "giai tri",
  "mua sam",
  "du lich",
  "an vat",
]);
