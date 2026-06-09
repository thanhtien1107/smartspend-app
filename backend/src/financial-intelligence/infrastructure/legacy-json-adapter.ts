import {
  AnalysisPeriod,
  FinancialSnapshot,
  Transaction,
} from "../domain/types";

interface LegacyRecord {
  [key: string]: unknown;
}

function normalize(value = ""): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim();
}

function mapPeriod(value: unknown): AnalysisPeriod {
  const key = normalize(String(value || ""));
  if (key.includes("tuan") || key === "week") return "weekly";
  if (key.includes("quy") || key === "quarter") return "quarterly";
  if (key.includes("nam") || key === "year") return "yearly";
  return "monthly";
}

function isIncome(record: LegacyRecord): boolean {
  if (record.type === "income") return true;
  const category = normalize(String(record.category || ""));
  return [
    "luong",
    "thuong",
    "phu cap",
    "lam them",
    "kinh doanh",
    "dau tu sinh loi",
    "hoan tien",
    "thu nhap khac",
  ].includes(category);
}

export function mapLegacyDataToSnapshot(
  data: LegacyRecord,
  user: LegacyRecord,
  asOf = new Date().toISOString(),
): FinancialSnapshot {
  const userId = String(user.id || user.username || "");
  const transactions = ((data.expenses as LegacyRecord[]) || [])
    .filter((record) => record.userId === userId)
    .map(
      (record): Transaction => ({
        id: String(record.id || ""),
        userId,
        type: isIncome(record) ? "income" : "expense",
        amount: Number(record.amount || 0),
        category: String(record.category || "Uncategorized"),
        merchant: String(record.merchant || record.location || ""),
        title: String(record.title || record.note || ""),
        date: String(record.date || asOf),
        time: String(record.time || ""),
        recurring: Boolean(record.recurring),
      }),
    );
  const budgets = ((data.budgets as LegacyRecord[]) || [])
    .filter((record) => record.userId === userId)
    .map((record) => ({
      amount: Number(record.amount || 0),
      period: mapPeriod(record.period),
    }));
  const categoryBudgets = ((data.categoryBudgets as LegacyRecord[]) || [])
    .filter((record) => record.userId === userId)
    .map((record) => ({
      amount: Number(record.amount || 0),
      period: mapPeriod(record.period),
      category: String(record.category || ""),
    }));
  const goals = ((data.goals as LegacyRecord[]) || [])
    .filter((record) => record.userId === userId)
    .map((record) => ({
      id: String(record.id || ""),
      name: String(record.name || record.title || "Financial goal"),
      target: Number(record.target || record.amount || 0),
      saved: Number(record.saved || record.current || 0),
      deadline: record.deadline ? String(record.deadline) : undefined,
    }));

  return {
    userId,
    asOf,
    walletBalance: Number(user.wallet || 0),
    transactions,
    budgets: [...budgets, ...categoryBudgets],
    goals,
  };
}
