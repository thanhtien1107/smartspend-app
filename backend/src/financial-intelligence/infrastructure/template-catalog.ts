import {
  MessageTemplate,
  MessageType,
  SupportedLocale,
} from "../domain/types";

const SUBJECTS = [
  "budget usage", "cash flow", "savings rate", "spending concentration",
  "emergency fund", "goal progress", "subscription cost", "income stability",
  "expense volatility", "lifestyle spending",
];
const OBSERVATIONS = [
  "The measured value is outside the preferred range.",
  "The current trend requires attention.",
  "Recent activity shows a material deviation.",
  "The period result is weaker than the target.",
  "The forecast indicates increasing pressure.",
];
const ROOT_CAUSES = [
  "The pattern is driven by spending growing faster than available resources.",
  "The underlying allocation is concentrated and lacks protective buffers.",
  "Repeated transactions and insufficient limits are reinforcing the trend.",
  "Income, budget, and goal settings are not aligned with actual behavior.",
  "The available data indicates inconsistent planning and execution.",
];
const IMPACTS = [
  "This can reduce liquidity and increase the probability of overspending.",
  "This may delay goals and weaken financial resilience.",
  "This creates a higher risk of negative cash flow.",
  "This limits flexibility for essential or unexpected expenses.",
  "This can make future budget recovery more difficult.",
];
const RECOMMENDATIONS = [
  "Set a measurable cap and review progress every week.",
  "Reduce the largest discretionary category first.",
  "Protect essential expenses and automate a savings transfer.",
  "Remove duplicate commitments and renegotiate recurring costs.",
  "Update balances, budgets, and goals before the next analysis.",
];

function createTemplates(type: MessageType, count: number): MessageTemplate[] {
  return Array.from({ length: count }, (_, index) => {
    const subject = SUBJECTS[index % SUBJECTS.length];
    return {
      id: `${type.toUpperCase()}-T${String(index + 1).padStart(3, "0")}`,
      type,
      title: `${type[0].toUpperCase()}${type.slice(1)}: ${subject}`,
      observation: `${OBSERVATIONS[index % OBSERVATIONS.length]} Focus: ${subject}.`,
      rootCause: ROOT_CAUSES[(index * 3) % ROOT_CAUSES.length],
      impact: IMPACTS[(index * 2) % IMPACTS.length],
      recommendation: RECOMMENDATIONS[(index * 4) % RECOMMENDATIONS.length],
    };
  });
}

const VI_TYPE_LABELS: Record<MessageType, string> = {
  warning: "Cảnh báo",
  insight: "Phân tích",
  recommendation: "Khuyến nghị",
  forecast: "Dự báo",
  achievement: "Thành tựu",
};
const VI_SUBJECTS = [
  "mức sử dụng ngân sách",
  "dòng tiền",
  "tỷ lệ tiết kiệm",
  "mức tập trung chi tiêu",
  "quỹ khẩn cấp",
  "tiến độ mục tiêu",
  "chi phí đăng ký định kỳ",
  "độ ổn định thu nhập",
  "biến động chi tiêu",
  "chi tiêu lối sống",
];
const VI_OBSERVATIONS = [
  "Chỉ số đo được đang nằm ngoài ngưỡng khuyến nghị.",
  "Xu hướng hiện tại cần được theo dõi và điều chỉnh.",
  "Hoạt động gần đây có mức sai lệch đáng kể.",
  "Kết quả trong kỳ thấp hơn mục tiêu đã đặt.",
  "Dự báo cho thấy áp lực tài chính đang tăng.",
];
const VI_ROOT_CAUSES = [
  "Chi tiêu đang tăng nhanh hơn nguồn tiền sẵn có.",
  "Cơ cấu phân bổ tiền quá tập trung và thiếu vùng đệm an toàn.",
  "Các giao dịch lặp lại và giới hạn chi tiêu chưa phù hợp đang củng cố xu hướng này.",
  "Thu nhập, ngân sách và mục tiêu chưa được điều chỉnh theo hành vi thực tế.",
  "Dữ liệu hiện có cho thấy việc lập kế hoạch và thực hiện chưa nhất quán.",
];
const VI_IMPACTS = [
  "Điều này có thể làm giảm thanh khoản và tăng khả năng chi tiêu quá mức.",
  "Điều này có thể làm chậm mục tiêu và giảm khả năng chống chịu tài chính.",
  "Điều này làm tăng nguy cơ dòng tiền âm.",
  "Điều này làm giảm khả năng xử lý chi phí thiết yếu hoặc phát sinh bất ngờ.",
  "Điều này có thể khiến việc khôi phục ngân sách trong tương lai khó khăn hơn.",
];
const VI_RECOMMENDATIONS = [
  "Đặt một hạn mức đo lường được và kiểm tra tiến độ mỗi tuần.",
  "Ưu tiên giảm hạng mục chi tiêu không thiết yếu lớn nhất.",
  "Bảo vệ các khoản thiết yếu và tự động chuyển tiền sang tiết kiệm.",
  "Hủy các cam kết trùng lặp và thương lượng lại chi phí định kỳ.",
  "Cập nhật số dư, ngân sách và mục tiêu trước lần phân tích tiếp theo.",
];

function createVietnameseTemplate(
  type: MessageType,
  index: number,
): MessageTemplate {
  const subject = VI_SUBJECTS[index % VI_SUBJECTS.length];
  return {
    id: `${type.toUpperCase()}-VI-T${String(index + 1).padStart(3, "0")}`,
    type,
    title: `${VI_TYPE_LABELS[type]}: ${subject}`,
    observation: `${VI_OBSERVATIONS[index % VI_OBSERVATIONS.length]} Trọng tâm: ${subject}.`,
    rootCause: VI_ROOT_CAUSES[(index * 3) % VI_ROOT_CAUSES.length],
    impact: VI_IMPACTS[(index * 2) % VI_IMPACTS.length],
    recommendation: VI_RECOMMENDATIONS[(index * 4) % VI_RECOMMENDATIONS.length],
  };
}

export class TemplateCatalog {
  readonly warnings = createTemplates("warning", 100);
  readonly insights = createTemplates("insight", 100);
  readonly recommendations = createTemplates("recommendation", 100);
  readonly forecasts = createTemplates("forecast", 50);
  readonly achievements = createTemplates("achievement", 30);

  get(
    type: MessageType,
    index: number,
    locale: SupportedLocale = "en",
  ): MessageTemplate {
    if (locale === "vi") return createVietnameseTemplate(type, index);
    const catalog =
      type === "warning" ? this.warnings :
      type === "insight" ? this.insights :
      type === "recommendation" ? this.recommendations :
      type === "forecast" ? this.forecasts : this.achievements;
    return catalog[index % catalog.length];
  }

  stats(): Record<MessageType, number> {
    return {
      warning: this.warnings.length,
      insight: this.insights.length,
      recommendation: this.recommendations.length,
      forecast: this.forecasts.length,
      achievement: this.achievements.length,
    };
  }
}
