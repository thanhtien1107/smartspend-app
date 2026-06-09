import {
  FinancialIntelligenceEngine,
  MessageProvider,
  MetricsProvider,
  PersonalityProvider,
  RuleEvaluator,
  RuleProvider,
  ScoreProvider,
} from "./ports";
import {
  AnalysisPeriod,
  FinancialHealthReport,
  FinancialSnapshot,
  PeriodAnalysis,
  RiskLevel,
  SupportedLocale,
} from "../domain/types";
import { ENGINE_VERSION, PERIODS } from "../domain/constants";

function riskFromScore(score: number): RiskLevel {
  if (score < 40) return "critical";
  if (score < 60) return "high";
  if (score < 80) return "medium";
  return "low";
}

const DIMENSION_LABELS: Record<
  SupportedLocale,
  Record<string, string>
> = {
  vi: {
    financialDiscipline: "Kỷ luật tài chính",
    budgetManagement: "Quản lý ngân sách",
    savingsAbility: "Khả năng tiết kiệm",
    spendingEfficiency: "Hiệu quả chi tiêu",
    riskManagement: "Quản trị rủi ro",
    goalAchievement: "Hoàn thành mục tiêu",
    financialStability: "Ổn định tài chính",
    behaviorConsistency: "Nhất quán hành vi",
  },
  en: {
    financialDiscipline: "Financial Discipline",
    budgetManagement: "Budget Management",
    savingsAbility: "Savings Ability",
    spendingEfficiency: "Spending Efficiency",
    riskManagement: "Risk Management",
    goalAchievement: "Goal Achievement",
    financialStability: "Financial Stability",
    behaviorConsistency: "Behavior Consistency",
  },
};

export class FinancialHealthService implements FinancialIntelligenceEngine {
  constructor(
    private readonly metricsProvider: MetricsProvider,
    private readonly ruleProvider: RuleProvider,
    private readonly ruleEvaluator: RuleEvaluator,
    private readonly scoreProvider: ScoreProvider,
    private readonly messageProvider: MessageProvider,
    private readonly personalityProvider: PersonalityProvider,
  ) {}

  analyze(
    snapshot: FinancialSnapshot,
    period: AnalysisPeriod = "monthly",
    locale: SupportedLocale = "vi",
  ): FinancialHealthReport {
    const rules = this.ruleProvider.getRules();
    const periodResults = PERIODS.map((analysisPeriod) => {
      const metrics = this.metricsProvider.calculate(snapshot, analysisPeriod);
      const evaluations = this.ruleEvaluator.evaluate(rules, metrics);
      const score = this.scoreProvider.score(evaluations);
      return { analysisPeriod, metrics, evaluations, score };
    });
    const selected =
      periodResults.find((result) => result.analysisPeriod === period) ||
      periodResults[1];
    const messages = this.messageProvider.generate(
      selected.evaluations,
      selected.metrics,
      locale,
    );
    const financialPersonality = this.personalityProvider.detect(
      selected.metrics,
      selected.score.scoreBreakdown,
    );
    const strengths = Object.entries(selected.score.scoreBreakdown)
      .filter(([, dimension]) => dimension.percentage >= 80)
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .map(
        ([name, dimension]) =>
          `${DIMENSION_LABELS[locale][name] || name}: ${dimension.percentage}%`,
      );
    const weaknesses = Object.entries(selected.score.scoreBreakdown)
      .filter(([, dimension]) => dimension.percentage < 65)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(
        ([name, dimension]) =>
          `${DIMENSION_LABELS[locale][name] || name}: ${dimension.percentage}%`,
      );
    const analyses = periodResults.reduce(
      (result, item) => {
        result[item.analysisPeriod] = {
          period: item.analysisPeriod,
          metrics: item.metrics,
          score: item.score.overallScore,
          riskLevel: riskFromScore(item.score.overallScore),
          triggeredRuleCount: item.evaluations.filter(
            (evaluation) => evaluation.triggered,
          ).length,
        };
        return result;
      },
      {} as Record<AnalysisPeriod, PeriodAnalysis>,
    );

    return {
      overallScore: selected.score.overallScore,
      scoreBreakdown: selected.score.scoreBreakdown,
      strengths,
      weaknesses,
      ...messages,
      financialPersonality,
      riskLevel: riskFromScore(selected.score.overallScore),
      period,
      locale,
      generatedAt: new Date().toISOString(),
      analyses,
      engine: {
        version: ENGINE_VERSION,
        mode: "rule-based",
        evaluatedRules: rules.length,
        triggeredRules: selected.evaluations.filter(
          (evaluation) => evaluation.triggered,
        ).length,
        confidence: Math.min(
          0.99,
          0.6 + selected.metrics.dataCompleteness * 0.35,
        ),
      },
    };
  }
}
