const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createFinancialHealthEngine,
  getFinancialIntelligenceCatalogStats,
} = require("../dist/financial-intelligence");

const snapshot = {
  userId: "test-user",
  asOf: "2026-06-09T12:00:00.000Z",
  walletBalance: 500000,
  transactions: [
    {
      id: "income-1",
      userId: "test-user",
      type: "income",
      amount: 5000000,
      category: "Salary",
      date: "2026-06-01",
    },
    {
      id: "expense-1",
      userId: "test-user",
      type: "expense",
      amount: 3000000,
      category: "Entertainment",
      title: "Weekend trip",
      date: "2026-06-07",
      time: "23:15",
    },
    {
      id: "expense-2",
      userId: "test-user",
      type: "expense",
      amount: 500000,
      category: "Food",
      title: "Groceries",
      date: "2026-06-08",
    },
  ],
  budgets: [{ amount: 4000000, period: "monthly" }],
  goals: [
    {
      id: "goal-1",
      name: "Emergency fund",
      target: 10000000,
      saved: 2500000,
    },
  ],
};

test("catalog contains 120 executable rules and required template counts", () => {
  const stats = getFinancialIntelligenceCatalogStats();
  assert.equal(stats.ruleCount, 120);
  assert.deepEqual(stats.templates, {
    warning: 100,
    insight: 100,
    recommendation: 100,
    forecast: 50,
    achievement: 30,
  });
});

test("FHI dimensions sum to 100 and all periods are generated", () => {
  const report = createFinancialHealthEngine().analyze(snapshot, "monthly");
  const maxScore = Object.values(report.scoreBreakdown).reduce(
    (total, dimension) => total + dimension.maxScore,
    0,
  );
  assert.equal(maxScore, 100);
  assert.deepEqual(Object.keys(report.analyses).sort(), [
    "monthly",
    "quarterly",
    "weekly",
    "yearly",
  ]);
  assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
  assert.equal(report.engine.evaluatedRules, 120);
});

test("every AI message has observation, root cause, impact, recommendation", () => {
  const report = createFinancialHealthEngine().analyze(snapshot, "monthly");
  const messages = [
    ...report.warnings,
    ...report.insights,
    ...report.recommendations,
    ...report.forecasts,
    ...report.achievements,
  ];
  assert.ok(messages.length > 0);
  for (const message of messages) {
    assert.ok(message.observation);
    assert.ok(message.rootCause);
    assert.ok(message.impact);
    assert.ok(message.recommendation);
  }
});

test("financial personality belongs to the supported taxonomy", () => {
  const report = createFinancialHealthEngine().analyze(snapshot, "monthly");
  assert.ok(
    [
      "Saver",
      "Balanced Planner",
      "Impulsive Spender",
      "Lifestyle Spender",
      "Risk Taker",
      "Goal Driven",
      "Budget Master",
      "Financial Beginner",
    ].includes(report.financialPersonality),
  );
});

test("reports keep interface labels and generated content in the requested locale", () => {
  const engine = createFinancialHealthEngine();
  const viReport = engine.analyze(snapshot, "monthly", "vi");
  const enReport = engine.analyze(snapshot, "monthly", "en");
  const viMessage = [...viReport.warnings, ...viReport.insights][0];
  const enMessage = [...enReport.warnings, ...enReport.insights][0];

  assert.equal(viReport.locale, "vi");
  assert.equal(enReport.locale, "en");
  assert.doesNotMatch(viMessage.observation, /\(mức \d+\)/);
  assert.match(
    viMessage.observation,
    /Bạn|Theo tốc độ|Thu |Có |Tiến độ|Mức ổn định/,
  );
  assert.match(
    viMessage.rootCause,
    /Chi|Tổng|Khoản|Số|Dữ liệu|Phần lớn|Chưa|Các/,
  );
  assert.match(enMessage.observation, /Current value|level/);
  assert.match(enMessage.rootCause, /The |Income/);
});

test("only the highest triggered level is shown for each financial issue", () => {
  const report = createFinancialHealthEngine().analyze(snapshot, "monthly", "vi");
  const messages = [
    ...report.warnings,
    ...report.insights,
    ...report.recommendations,
    ...report.forecasts,
  ];
  const issueKeys = messages.map((message) =>
    String(message.metadata?.metric),
  );

  assert.equal(issueKeys.length, new Set(issueKeys).size);
  assert.ok(messages.every((message) => !message.title.includes("mức 4")));
});
