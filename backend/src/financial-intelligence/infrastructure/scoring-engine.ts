import { ScoreProvider } from "../application/ports";
import {
  FinancialHealthDimension,
  RuleEvaluation,
  ScoreBreakdown,
} from "../domain/types";
import { DIMENSION_WEIGHTS } from "../domain/constants";

export class WeightedScoringEngine implements ScoreProvider {
  score(evaluations: RuleEvaluation[]): {
    overallScore: number;
    scoreBreakdown: ScoreBreakdown;
  } {
    const scoreBreakdown = Object.entries(DIMENSION_WEIGHTS).reduce(
      (result, [dimension, maxScore]) => {
        const deductions = evaluations
          .filter(
            (evaluation) =>
              evaluation.triggered && evaluation.dimension === dimension,
          )
          .reduce((total, evaluation) => total + evaluation.scoreImpact, 0);
        const score = Math.max(0, maxScore - deductions);
        result[dimension as FinancialHealthDimension] = {
          score: Number(score.toFixed(2)),
          maxScore,
          percentage: Math.round((score / maxScore) * 100),
          deductions: Number(Math.min(deductions, maxScore).toFixed(2)),
          evidence: evaluations
            .filter(
              (evaluation) =>
                evaluation.triggered && evaluation.dimension === dimension,
            )
            .sort((a, b) => b.scoreImpact - a.scoreImpact)
            .slice(0, 5)
            .map((evaluation) => evaluation.description),
        };
        return result;
      },
      {} as ScoreBreakdown,
    );
    const overallScore = Math.round(
      Object.values(scoreBreakdown).reduce(
        (total, dimension) => total + dimension.score,
        0,
      ),
    );
    return { overallScore, scoreBreakdown };
  }
}
