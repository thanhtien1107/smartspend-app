import { MessageProvider } from "../application/ports";
import {
  MessageType,
  PeriodMetrics,
  RuleEvaluation,
  StructuredFinancialMessage,
  SupportedLocale,
} from "../domain/types";
import { TemplateCatalog } from "./template-catalog";

function money(value: number, locale: SupportedLocale): string {
  return `${Math.round(value).toLocaleString(
    locale === "vi" ? "vi-VN" : "en-US",
  )} ₫`;
}

const VI_DESCRIPTIONS: Record<string, string> = {
  "Budget consumption is elevated": "Mức sử dụng ngân sách đang cao",
  "Projected budget consumption is elevated": "Dự báo sử dụng ngân sách đang cao",
  "Budget variance is negative": "Chênh lệch ngân sách đang âm",
  "Expense-to-income ratio is high": "Tỷ lệ chi tiêu trên thu nhập đang cao",
  "Spending is concentrated in one category": "Chi tiêu đang tập trung vào một hạng mục",
  "Discretionary spending is high": "Chi tiêu không thiết yếu đang cao",
  "Savings rate is below target": "Tỷ lệ tiết kiệm thấp hơn mục tiêu",
  "Emergency fund coverage is low": "Mức bao phủ của quỹ khẩn cấp đang thấp",
  "Net cash flow is weak": "Dòng tiền ròng đang yếu",
  "Cash runway is limited": "Thời gian duy trì tiền mặt còn hạn chế",
  "Expense volatility is elevated": "Biến động chi tiêu đang cao",
  "Projected cash flow is negative": "Dòng tiền dự báo đang âm",
  "Goal progress is behind plan": "Tiến độ mục tiêu đang chậm hơn kế hoạch",
  "Too few goals are on track": "Có quá ít mục tiêu đang đúng tiến độ",
  "Financial goal coverage is limited": "Số lượng mục tiêu tài chính còn hạn chế",
  "Forecast signals budget pressure": "Dự báo cho thấy áp lực ngân sách",
  "Projected expenses are material": "Chi tiêu dự báo ở mức đáng kể",
  "Forecast cash generation is weak": "Khả năng tạo dòng tiền dự báo đang yếu",
  "Impulse transaction frequency is high": "Tần suất giao dịch bốc đồng đang cao",
  "Late-night spending is frequent": "Chi tiêu ban đêm xuất hiện thường xuyên",
  "Spending consistency is low": "Mức nhất quán chi tiêu đang thấp",
  "Subscription count is high": "Số lượng dịch vụ đăng ký đang cao",
  "Recurring expenses consume a large share": "Chi phí định kỳ chiếm tỷ trọng lớn",
  "Potential duplicate subscriptions detected": "Phát hiện dịch vụ đăng ký có khả năng trùng lặp",
  "Lifestyle spending is elevated": "Chi tiêu lối sống đang cao",
  "Lifestyle concentration is high": "Chi tiêu lối sống đang quá tập trung",
  "Daily lifestyle cost is high": "Chi phí lối sống hằng ngày đang cao",
  "Income stability is low": "Độ ổn định thu nhập đang thấp",
  "Financial data completeness is low": "Dữ liệu tài chính chưa đầy đủ",
  "Financial runway is insufficient": "Nguồn lực tài chính dự phòng chưa đủ",
};

function localizedDescription(
  evaluation: RuleEvaluation,
  locale: SupportedLocale,
): string {
  if (locale === "en") return evaluation.description;
  const base = evaluation.description.replace(/ \(level \d+\)$/, "");
  const level = evaluation.description.match(/level (\d+)/)?.[1] || "1";
  return `${VI_DESCRIPTIONS[base] || base} (mức ${level})`;
}

function baseDescription(evaluation: RuleEvaluation): string {
  return evaluation.description.replace(/ \(level \d+\)$/, "");
}

function messageTypeLabel(
  type: Exclude<MessageType, "achievement">,
  locale: SupportedLocale,
): string {
  if (locale === "en") {
    return {
      warning: "Warning",
      insight: "Insight",
      recommendation: "Recommendation",
      forecast: "Forecast",
    }[type];
  }
  return {
    warning: "Cảnh báo",
    insight: "Phân tích",
    recommendation: "Khuyến nghị",
    forecast: "Dự báo",
  }[type];
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function overBudgetAmount(metrics: PeriodMetrics): number {
  return Math.max(metrics.expenses - metrics.budgetAmount, 0);
}

function buildVietnameseContent(
  evaluation: RuleEvaluation,
  metrics: PeriodMetrics,
): Pick<
  StructuredFinancialMessage,
  "title" | "observation" | "rootCause" | "impact" | "recommendation"
> {
  const metric = evaluation.metric;
  const value = metricText(evaluation, "vi");
  const title = VI_DESCRIPTIONS[baseDescription(evaluation)] || "Cần chú ý";
  const fallback = {
    title,
    observation: `${title}. Chỉ số hiện tại: ${value}.`,
    rootCause: "Dữ liệu trong kỳ cho thấy khoản thu, chi hoặc kế hoạch chưa cân đối.",
    impact: "Nếu không điều chỉnh, số tiền còn lại có thể giảm nhanh hơn dự kiến.",
    recommendation: "Kiểm tra khoản chi lớn nhất và đặt giới hạn cụ thể cho kỳ tiếp theo.",
  };

  if (metric === "budgetUsage") {
    const exceeded = overBudgetAmount(metrics);
    return {
      title: exceeded > 0 ? "Đã vượt ngân sách" : "Ngân sách sắp hết",
      observation:
        metrics.budgetAmount > 0
          ? `Bạn đã chi ${money(metrics.expenses, "vi")} trên ngân sách ${money(metrics.budgetAmount, "vi")} (${percent(metrics.budgetUsage)}).`
          : `Bạn đã chi ${money(metrics.expenses, "vi")} nhưng chưa đặt ngân sách.`,
      rootCause:
        exceeded > 0
          ? `Tổng chi hiện cao hơn ngân sách ${money(exceeded, "vi")}.`
          : "Chi tiêu đang tăng nhanh hơn giới hạn đã đặt.",
      impact: "Bạn sẽ còn ít tiền hơn cho các khoản cần thiết cuối kỳ.",
      recommendation:
        metrics.topCategoryAmount > 0
          ? `Giảm trước khoản ${metrics.topCategory}, hiện đã chi ${money(metrics.topCategoryAmount, "vi")}.`
          : "Tạm dừng các khoản không cần thiết cho đến kỳ ngân sách tiếp theo.",
    };
  }

  if (metric === "projectedBudgetUsage") {
    return {
      title: "Có thể vượt ngân sách cuối kỳ",
      observation: `Theo tốc độ hiện tại, bạn có thể chi ${money(metrics.projectedExpenses, "vi")}, tương đương ${percent(metrics.projectedBudgetUsage)} ngân sách.`,
      rootCause: `Chi trung bình mỗi ngày đang là ${money(metrics.averageDailyExpense, "vi")}.`,
      impact: "Ngân sách có thể hết trước khi kỳ hiện tại kết thúc.",
      recommendation:
        metrics.budgetAmount > 0
          ? metrics.budgetAmount > metrics.expenses
            ? `Giữ tổng chi còn lại dưới ${money(metrics.budgetAmount - metrics.expenses, "vi")}.`
            : "Ngân sách đã hết; chỉ chi thêm cho nhu cầu thực sự cần thiết."
          : "Đặt ngân sách ngay để theo dõi mức chi còn lại.",
    };
  }

  if (metric === "budgetVariance") {
    return {
      title: "Chi tiêu cao hơn ngân sách",
      observation: `Bạn đang vượt ngân sách ${money(Math.abs(metrics.budgetVariance), "vi")}.`,
      rootCause: `Tổng chi là ${money(metrics.expenses, "vi")}, cao hơn mức đã đặt.`,
      impact: "Khoản vượt này sẽ làm giảm số tiền dành cho tiết kiệm hoặc hóa đơn.",
      recommendation: `Cắt ít nhất ${money(Math.abs(metrics.budgetVariance), "vi")} từ các khoản chưa cần thiết.`,
    };
  }

  if (metric === "expenseToIncomeRatio") {
    return {
      title: "Chi nhiều hơn thu",
      observation: `Bạn đã chi ${money(metrics.expenses, "vi")} trong khi thu vào ${money(metrics.income, "vi")} (${percent(metrics.expenseToIncomeRatio)}).`,
      rootCause:
        metrics.income <= 0
          ? "Chưa có khoản thu nào được ghi nhận trong kỳ."
          : "Tổng chi đang cao hơn số tiền thu vào.",
      impact: `Dòng tiền hiện tại là ${money(metrics.netCashFlow, "vi")}.`,
      recommendation:
        metrics.topCategoryAmount > 0
          ? `Ưu tiên giảm chi ở mục ${metrics.topCategory} và chưa thêm khoản lớn mới.`
          : "Bổ sung khoản thu còn thiếu hoặc giảm ngay các khoản không thiết yếu.",
    };
  }

  if (metric === "topCategoryShare") {
    return {
      title: `Chi quá nhiều cho ${metrics.topCategory}`,
      observation: `${metrics.topCategory} chiếm ${percent(metrics.topCategoryShare)} tổng chi, tương đương ${money(metrics.topCategoryAmount, "vi")}.`,
      rootCause: "Phần lớn tiền trong kỳ đang dồn vào một danh mục.",
      impact: "Các nhu cầu khác có thể thiếu ngân sách.",
      recommendation: `Đặt giới hạn cho ${metrics.topCategory} thấp hơn ít nhất 10% trong kỳ tới.`,
    };
  }

  if (metric === "discretionaryRatio") {
    return {
      title: "Chi không thiết yếu đang cao",
      observation: `Khoản chi không thiết yếu chiếm ${percent(metrics.discretionaryRatio)} tổng chi.`,
      rootCause: "Giải trí, mua sắm hoặc dịch vụ không bắt buộc đang chiếm tỷ trọng lớn.",
      impact: "Bạn còn ít tiền hơn cho tiết kiệm và các hóa đơn bắt buộc.",
      recommendation: "Chọn một khoản không thiết yếu để giảm hoặc tạm dừng ngay trong tuần này.",
    };
  }

  if (metric === "savingsRate" || metric === "netCashFlow") {
    return {
      title: metrics.netCashFlow < 0 ? "Tháng này đang âm tiền" : "Tiết kiệm chưa đạt",
      observation: `Thu ${money(metrics.income, "vi")}, chi ${money(metrics.expenses, "vi")}, còn lại ${money(metrics.netCashFlow, "vi")}.`,
      rootCause: "Khoản chi đang chiếm phần lớn hoặc vượt số tiền thu vào.",
      impact: "Bạn khó dành tiền cho mục tiêu và quỹ dự phòng.",
      recommendation: "Chuyển một khoản tiết kiệm ngay khi có thu nhập, sau đó mới phân bổ tiền chi.",
    };
  }

  if (metric === "emergencyFundMonths" || metric === "cashRunwayDays") {
    return {
      title: "Tiền dự phòng còn ít",
      observation: `Với mức chi hiện tại, số dư chỉ đủ khoảng ${Math.max(Math.floor(metrics.cashRunwayDays), 0)} ngày.`,
      rootCause: "Số dư hiện có thấp so với mức chi trung bình mỗi ngày.",
      impact: "Một khoản phát sinh bất ngờ có thể làm bạn thiếu tiền.",
      recommendation: "Ưu tiên tạo quỹ dự phòng bằng ít nhất một tháng chi phí thiết yếu.",
    };
  }

  if (metric === "projectedNetCashFlow") {
    return {
      title: "Cuối kỳ có thể thiếu tiền",
      observation: `Dự kiến cuối kỳ bạn có thể thiếu ${money(Math.abs(metrics.projectedNetCashFlow), "vi")}.`,
      rootCause: `Chi dự kiến là ${money(metrics.projectedExpenses, "vi")}, cao hơn nguồn thu hiện tại.`,
      impact: "Bạn có thể phải dùng tiền tiết kiệm hoặc vay để bù phần thiếu.",
      recommendation: `Giảm chi trung bình mỗi ngày xuống dưới ${money(metrics.income / Math.max(metrics.activeDays || 1, 1), "vi")}.`,
    };
  }

  if (metric === "goalProgress" || metric === "goalsOnTrackRatio") {
    return {
      title: "Mục tiêu tiết kiệm đang chậm",
      observation: `Tiến độ mục tiêu hiện đạt ${percent(metrics.goalProgress)}.`,
      rootCause: "Số tiền chuyển vào mục tiêu chưa theo kịp kế hoạch.",
      impact: "Bạn sẽ cần thêm thời gian để hoàn thành mục tiêu.",
      recommendation: "Chọn mục tiêu quan trọng nhất và đặt số tiền chuyển cố định mỗi tuần.",
    };
  }

  if (metric === "goalCount") {
    return {
      title: "Chưa có mục tiêu tài chính rõ ràng",
      observation: `Bạn hiện có ${metrics.goalCount} mục tiêu tài chính.`,
      rootCause: "Chưa đặt đủ mục tiêu để phân bổ tiền theo ưu tiên.",
      impact: "Tiền dư dễ bị chi vào các khoản không có kế hoạch.",
      recommendation: "Tạo ít nhất một mục tiêu cụ thể, có số tiền và thời hạn hoàn thành.",
    };
  }

  if (metric === "lateNightTransactions") {
    return {
      title: "Có nhiều khoản chi ban đêm",
      observation: `Có ${metrics.lateNightTransactions} giao dịch từ 22 giờ đến 5 giờ.`,
      rootCause: "Các khoản chi muộn thường phát sinh ngoài kế hoạch.",
      impact: "Những khoản nhỏ này có thể làm tổng chi tăng mà khó nhận ra.",
      recommendation: "Kiểm tra lại các giao dịch ban đêm và đặt giới hạn cho nhóm này.",
    };
  }

  if (metric === "impulseTransactions") {
    return {
      title: "Nhiều khoản chi nhỏ phát sinh",
      observation: `Có ${metrics.impulseTransactions} giao dịch nhỏ có dấu hiệu phát sinh nhanh.`,
      rootCause: "Nhiều khoản nhỏ được thực hiện mà không có giới hạn chung.",
      impact: "Tổng các khoản nhỏ có thể làm ngân sách hết sớm.",
      recommendation: "Đặt một hạn mức riêng cho chi tiêu linh hoạt mỗi ngày.",
    };
  }

  if (
    metric === "subscriptionCount" ||
    metric === "recurringExpenseRatio" ||
    metric === "duplicateSubscriptionCount"
  ) {
    return {
      title: "Cần kiểm tra phí đăng ký định kỳ",
      observation: `Có ${metrics.subscriptionCount} nhóm chi định kỳ, chiếm ${percent(metrics.recurringExpenseRatio)} tổng chi.`,
      rootCause: "Một số dịch vụ đang lặp lại hoặc có thể trùng chức năng.",
      impact: "Bạn vẫn mất tiền mỗi kỳ dù không còn sử dụng thường xuyên.",
      recommendation: "Hủy dịch vụ ít dùng và kiểm tra các khoản đăng ký trùng nhau.",
    };
  }

  if (metric === "incomeStability") {
    return {
      title: "Thu nhập chưa ổn định",
      observation: `Mức ổn định thu nhập hiện là ${percent(metrics.incomeStability)}.`,
      rootCause: "Số tiền hoặc thời điểm nhận thu nhập thay đổi nhiều giữa các lần.",
      impact: "Khó xác định chính xác số tiền có thể chi mỗi tháng.",
      recommendation: "Lập ngân sách dựa trên mức thu nhập thấp nhất gần đây, không dựa trên tháng cao nhất.",
    };
  }

  if (metric === "dataCompleteness") {
    return {
      title: "Dữ liệu chưa đủ để phân tích chính xác",
      observation: `Bạn mới cung cấp khoảng ${percent(metrics.dataCompleteness)} dữ liệu cần thiết.`,
      rootCause: "Có thể đang thiếu số dư, ngân sách, thu nhập, giao dịch hoặc mục tiêu.",
      impact: "Một số dự báo và điểm số có thể chưa sát thực tế.",
      recommendation: "Cập nhật số dư, ngân sách và các khoản thu chi còn thiếu.",
    };
  }

  return fallback;
}

function metricText(
  evaluation: RuleEvaluation,
  locale: SupportedLocale,
): string {
  const raw = evaluation.actual;
  if (
    evaluation.metric.toLowerCase().includes("ratio") ||
    evaluation.metric.toLowerCase().includes("usage") ||
    evaluation.metric.toLowerCase().includes("rate") ||
    evaluation.metric.toLowerCase().includes("stability") ||
    evaluation.metric.toLowerCase().includes("consistency") ||
    evaluation.metric.toLowerCase().includes("progress") ||
    evaluation.metric.toLowerCase().includes("completeness")
  ) {
    return `${Math.round(raw * 100)}%`;
  }
  if (
    evaluation.metric.toLowerCase().includes("amount") ||
    evaluation.metric.toLowerCase().includes("expenses") ||
    evaluation.metric.toLowerCase().includes("cashflow") ||
    evaluation.metric.toLowerCase().includes("variance")
  ) {
    return money(raw, locale);
  }
  return Number(raw.toFixed(2)).toLocaleString(
    locale === "vi" ? "vi-VN" : "en-US",
  );
}

export class StructuredInsightEngine implements MessageProvider {
  constructor(private readonly templates: TemplateCatalog) {}

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
  } {
    const triggered = evaluations
      .filter((evaluation) => evaluation.triggered)
      .reduce((highest, evaluation) => {
        const key = String(evaluation.metric);
        const current = highest.get(key);
        if (!current || evaluation.scoreImpact > current.scoreImpact) {
          highest.set(key, evaluation);
        }
        return highest;
      }, new Map<string, RuleEvaluation>());
    const selectedTriggered = [...triggered.values()].sort(
      (a, b) => b.scoreImpact - a.scoreImpact,
    );
    const buckets: Record<
      Exclude<MessageType, "achievement">,
      StructuredFinancialMessage[]
    > = {
      warning: [],
      insight: [],
      recommendation: [],
      forecast: [],
    };

    for (const evaluation of selectedTriggered) {
      const type =
        evaluation.category === "forecast"
          ? "forecast"
          : evaluation.messageType;
      const template = this.templates.get(type, evaluation.templateIndex, locale);
      const description = localizedDescription(evaluation, locale);
      const localizedContent =
        locale === "vi"
          ? buildVietnameseContent(evaluation, metrics)
          : {
              title: baseDescription(evaluation),
              observation: `${description}. Current value: ${metricText(evaluation, locale)}.`,
              rootCause: template.rootCause,
              impact: template.impact,
              recommendation: template.recommendation,
            };
      const message: StructuredFinancialMessage = {
        id: `${metrics.period}-${evaluation.ruleId}-${type}`,
        type,
        severity: evaluation.severity,
        category: evaluation.category,
        title: `${messageTypeLabel(type, locale)}: ${localizedContent.title}`,
        observation: localizedContent.observation,
        rootCause: localizedContent.rootCause,
        impact: localizedContent.impact,
        recommendation: localizedContent.recommendation,
        ruleId: evaluation.ruleId,
        period: metrics.period,
        confidence: Math.min(0.99, 0.65 + metrics.dataCompleteness * 0.3),
        metadata: {
          metric: evaluation.metric,
          actual: evaluation.actual,
          threshold: evaluation.threshold,
        },
      };
      buckets[type].push(message);
    }

    const achievements = this.buildAchievements(metrics, locale);
    return {
      warnings: buckets.warning.slice(0, 12),
      insights: buckets.insight.slice(0, 12),
      recommendations: buckets.recommendation.slice(0, 12),
      forecasts: buckets.forecast.slice(0, 8),
      achievements,
    };
  }

  private buildAchievements(
    metrics: PeriodMetrics,
    locale: SupportedLocale,
  ): StructuredFinancialMessage[] {
    const achievements: Array<[boolean, string, string]> =
      locale === "vi"
        ? [
            [metrics.savingsRate >= 0.2, "Tỷ lệ tiết kiệm tốt", "Tiết kiệm vượt 20% thu nhập."],
            [metrics.budgetUsage <= 0.8, "Ngân sách được kiểm soát", "Mức sử dụng ngân sách dưới 80%."],
            [metrics.emergencyFundMonths >= 3, "Sẵn sàng cho tình huống khẩn cấp", "Dự trữ tiền mặt đủ ít nhất ba tháng."],
            [metrics.goalProgress >= 0.75, "Tiến độ mục tiêu tốt", "Tiến độ mục tiêu trung bình vượt 75%."],
            [metrics.spendingConsistency >= 0.8, "Hành vi nhất quán", "Chi tiêu ổn định giữa các ngày hoạt động."],
            [metrics.projectedNetCashFlow > 0, "Triển vọng tích cực", "Dòng tiền dự báo vẫn dương."],
          ]
        : [
            [metrics.savingsRate >= 0.2, "Healthy savings rate", "Savings exceeded 20% of income."],
            [metrics.budgetUsage <= 0.8, "Budget under control", "Budget usage remained below 80%."],
            [metrics.emergencyFundMonths >= 3, "Emergency-ready", "Cash reserves cover at least three months."],
            [metrics.goalProgress >= 0.75, "Goal momentum", "Average goal progress exceeded 75%."],
            [metrics.spendingConsistency >= 0.8, "Consistent behavior", "Spending remained stable across active days."],
            [metrics.projectedNetCashFlow > 0, "Positive outlook", "Projected cash flow remains positive."],
          ];
    return achievements
      .filter(([condition]) => condition)
      .map(([, title, observation], index) => {
        const template = this.templates.get("achievement", index, locale);
        return {
          id: `${metrics.period}-achievement-${index + 1}`,
          type: "achievement" as const,
          severity: "info" as const,
          category: "achievement" as const,
          title,
          observation,
          rootCause: template.rootCause,
          impact:
            locale === "vi"
              ? "Điều này củng cố khả năng chống chịu tài chính dài hạn."
              : "This strengthens long-term financial resilience.",
          recommendation:
            locale === "vi"
              ? "Duy trì hành vi này và tăng mục tiêu dần theo khả năng."
              : "Maintain the behavior and raise the target gradually.",
          period: metrics.period,
          confidence: Math.min(0.99, 0.7 + metrics.dataCompleteness * 0.25),
        };
      });
  }
}
