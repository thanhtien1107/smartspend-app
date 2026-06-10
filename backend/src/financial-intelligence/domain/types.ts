export type AnalysisPeriod = "weekly" | "monthly" | "quarterly" | "yearly";
export type SupportedLocale = "vi" | "en";

export type RuleCategory =
  | "budget"
  | "spending"
  | "savings"
  | "risk"
  | "goal"
  | "forecast"
  | "behavioral"
  | "subscription"
  | "lifestyle"
  | "stability";

export type FinancialPersonality =
  | "Saver"
  | "Balanced Planner"
  | "Impulsive Spender"
  | "Lifestyle Spender"
  | "Risk Taker"
  | "Goal Driven"
  | "Budget Master"
  | "Financial Beginner";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type MessageType =
  | "warning"
  | "insight"
  | "recommendation"
  | "forecast"
  | "achievement";
export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface Transaction {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  merchant?: string;
  title?: string;
  date: string;
  time?: string;
  recurring?: boolean;
}

export interface Budget {
  amount: number;
  period: AnalysisPeriod;
  category?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
}

export interface FinancialSnapshot {
  userId: string;
  asOf: string;
  walletBalance: number;
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
}

export interface PeriodMetrics {
  period: AnalysisPeriod;
  startDate: string;
  endDate: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  budgetAmount: number;
  budgetUsage: number;
  budgetVariance: number;
  expenseToIncomeRatio: number;
  discretionaryRatio: number;
  essentialRatio: number;
  topCategory: string;
  topCategoryAmount: number;
  topCategoryShare: number;
  transactionCount: number;
  activeDays: number;
  averageDailyExpense: number;
  expenseVolatility: number;
  lateNightTransactions: number;
  impulseTransactions: number;
  recurringExpenseAmount: number;
  recurringExpenseRatio: number;
  subscriptionCount: number;
  duplicateSubscriptionCount: number;
  goalCount: number;
  goalProgress: number;
  goalsOnTrackRatio: number;
  emergencyFundMonths: number;
  cashRunwayDays: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
  projectedBudgetUsage: number;
  incomeStability: number;
  spendingConsistency: number;
  dataCompleteness: number;
}

export interface RuleDefinition {
  id: string;
  category: RuleCategory;
  dimension: FinancialHealthDimension;
  description: string;
  severity: Severity;
  metric: keyof PeriodMetrics;
  operator: "gt" | "gte" | "lt" | "lte" | "eq";
  threshold: number;
  scoreImpact: number;
  messageType: Exclude<MessageType, "achievement">;
  templateIndex: number;
}

export interface RuleEvaluation {
  ruleId: string;
  category: RuleCategory;
  dimension: FinancialHealthDimension;
  severity: Severity;
  scoreImpact: number;
  metric: keyof PeriodMetrics;
  actual: number;
  threshold: number;
  triggered: boolean;
  description: string;
  messageType: Exclude<MessageType, "achievement">;
  templateIndex: number;
}

export type FinancialHealthDimension =
  | "financialDiscipline"
  | "budgetManagement"
  | "savingsAbility"
  | "spendingEfficiency"
  | "riskManagement"
  | "goalAchievement"
  | "financialStability"
  | "behaviorConsistency";

export interface DimensionScore {
  score: number;
  maxScore: number;
  percentage: number;
  deductions: number;
  evidence: string[];
}

export type ScoreBreakdown = Record<FinancialHealthDimension, DimensionScore>;

export interface StructuredFinancialMessage {
  id: string;
  type: MessageType;
  severity: Severity;
  category: RuleCategory | "achievement";
  title: string;
  observation: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  ruleId?: string;
  period: AnalysisPeriod;
  confidence: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface PeriodAnalysis {
  period: AnalysisPeriod;
  metrics: PeriodMetrics;
  score: number;
  riskLevel: RiskLevel;
  triggeredRuleCount: number;
}

export interface FinancialHealthReport {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  warnings: StructuredFinancialMessage[];
  insights: StructuredFinancialMessage[];
  recommendations: StructuredFinancialMessage[];
  forecasts: StructuredFinancialMessage[];
  achievements: StructuredFinancialMessage[];
  financialPersonality: FinancialPersonality;
  riskLevel: RiskLevel;
  period: AnalysisPeriod;
  locale: SupportedLocale;
  generatedAt: string;
  analyses: Record<AnalysisPeriod, PeriodAnalysis>;
  engine: {
    version: string;
    mode: "rule-based" | "hybrid" | "machine-learning";
    evaluatedRules: number;
    triggeredRules: number;
    confidence: number;
  };
}

export interface MessageTemplate {
  id: string;
  type: MessageType;
  title: string;
  observation: string;
  rootCause: string;
  impact: string;
  recommendation: string;
}
