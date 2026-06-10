import {
  FinancialHealthReport,
  FinancialSnapshot,
  PeriodMetrics,
  RuleDefinition,
  RuleEvaluation,
  ScoreBreakdown,
  StructuredFinancialMessage,
  AnalysisPeriod,
  FinancialPersonality,
  SupportedLocale,
} from "../domain/types";

export interface MetricsProvider {
  calculate(
    snapshot: FinancialSnapshot,
    period: AnalysisPeriod,
  ): PeriodMetrics;
}

export interface RuleProvider {
  getRules(): RuleDefinition[];
}

export interface RuleEvaluator {
  evaluate(
    rules: RuleDefinition[],
    metrics: PeriodMetrics,
  ): RuleEvaluation[];
}

export interface ScoreProvider {
  score(evaluations: RuleEvaluation[]): {
    overallScore: number;
    scoreBreakdown: ScoreBreakdown;
  };
}

export interface MessageProvider {
  generate(
    evaluations: RuleEvaluation[],
    metrics: PeriodMetrics,
    locale: SupportedLocale,
  ): {
    warnings: StructuredFinancialMessage[];
    insights: StructuredFinancialMessage[];
    recommendations: StructuredFinancialMessage[];
    forecasts: StructuredFinancialMessage[];
    achievements: StructuredFinancialMessage[];
  };
}

export interface PersonalityProvider {
  detect(
    metrics: PeriodMetrics,
    scoreBreakdown: ScoreBreakdown,
  ): FinancialPersonality;
}

export interface FinancialIntelligenceEngine {
  analyze(
    snapshot: FinancialSnapshot,
    period?: AnalysisPeriod,
    locale?: SupportedLocale,
  ): FinancialHealthReport;
}
