import { RuleEvaluator } from "../application/ports";
import {
  PeriodMetrics,
  RuleDefinition,
  RuleEvaluation,
} from "../domain/types";

function compare(
  actual: number,
  operator: RuleDefinition["operator"],
  threshold: number,
): boolean {
  if (operator === "gt") return actual > threshold;
  if (operator === "gte") return actual >= threshold;
  if (operator === "lt") return actual < threshold;
  if (operator === "lte") return actual <= threshold;
  return actual === threshold;
}

export class DefaultRuleEvaluator implements RuleEvaluator {
  evaluate(
    rules: RuleDefinition[],
    metrics: PeriodMetrics,
  ): RuleEvaluation[] {
    return rules.map((rule) => {
      const value = metrics[rule.metric];
      const actual = typeof value === "number" ? value : 0;
      return {
        ruleId: rule.id,
        category: rule.category,
        dimension: rule.dimension,
        severity: rule.severity,
        scoreImpact: rule.scoreImpact,
        metric: rule.metric,
        actual,
        threshold: rule.threshold,
        triggered: compare(actual, rule.operator, rule.threshold),
        description: rule.description,
        messageType: rule.messageType,
        templateIndex: rule.templateIndex,
      };
    });
  }
}
