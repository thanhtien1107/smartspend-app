import { FinancialHealthService } from "./application/financial-health-service";
import { DefaultMetricsProvider } from "./infrastructure/metrics-calculator";
import { DefaultRuleProvider } from "./infrastructure/rule-catalog";
import { DefaultRuleEvaluator } from "./infrastructure/rule-engine";
import { WeightedScoringEngine } from "./infrastructure/scoring-engine";
import { TemplateCatalog } from "./infrastructure/template-catalog";
import { StructuredInsightEngine } from "./infrastructure/insight-engine";
import { DefaultPersonalityProvider } from "./infrastructure/personality-engine";

export * from "./domain/types";
export { mapLegacyDataToSnapshot } from "./infrastructure/legacy-json-adapter";

export function createFinancialHealthEngine(): FinancialHealthService {
  const templates = new TemplateCatalog();
  return new FinancialHealthService(
    new DefaultMetricsProvider(),
    new DefaultRuleProvider(),
    new DefaultRuleEvaluator(),
    new WeightedScoringEngine(),
    new StructuredInsightEngine(templates),
    new DefaultPersonalityProvider(),
  );
}

export function getFinancialIntelligenceCatalogStats() {
  const ruleProvider = new DefaultRuleProvider();
  const templates = new TemplateCatalog();
  return {
    ruleCount: ruleProvider.getRules().length,
    templates: templates.stats(),
  };
}

export function getFinancialIntelligenceRules() {
  return new DefaultRuleProvider().getRules();
}
