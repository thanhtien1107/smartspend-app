<template>
  <section id="report" class="screen active">
    <div class="panel report-panel">
      <div class="report-header">
        <div>
          <h2>Báo cáo</h2>
          <p>{{ periodLabel }}</p>
        </div>
        <div class="report-period-tabs" role="group" aria-label="Chọn kỳ báo cáo">
          <button
            v-for="option in periodOptions"
            :key="option.value"
            type="button"
            :class="{ active: reportMode === option.value }"
            @click="setReportMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="report-period-nav">
        <button type="button" class="btn-action" @click="shiftPeriod(-1)">
          &lt;
        </button>
        <strong>{{ periodLabel }}</strong>
        <button type="button" class="btn-action" @click="shiftPeriod(1)">
          &gt;
        </button>
        <button type="button" class="btn-action" @click="resetPeriod">
          Hiện tại
        </button>
      </div>

<<<<<<< HEAD
      <div class="report-kpi-grid">
=======
      <div class="report-export-actions">
        <button type="button" class="primary-btn" :disabled="exporting" @click="exportReport('pdf')">
          Xuất PDF
        </button>
        <button type="button" class="btn-action" :disabled="exporting" @click="exportReport('excel')">
          Xuất Excel
        </button>
        <button type="button" class="btn-action" :disabled="exporting" @click="exportReport('csv')">
          Xuất CSV
        </button>
      </div>
      <p v-if="exportMessage" class="notification-box" :class="{ 'expense-error': exportError }">
        {{ exportMessage }}
      </p>

>>>>>>> a135e40b5284221842f47107669608b3db4871bc
      <div class="report-card">
        <strong id="category-top">{{ topCategory.name }}</strong>
        <span>Hạng mục chi tiêu nhiều nhất trong kỳ</span>
      </div>
      <div class="report-card">
        <strong id="average-expense">{{ formatMoney(averageExpense) }}</strong>
        <span>Chi tiêu trung bình mỗi khoản</span>
      </div>
      <div class="report-card">
        <strong id="daily-average">{{ formatMoney(reportSummary.averageDailySpending) }}</strong>
        <span>Trung bình chi tiêu mỗi ngày</span>
      </div>
      <div class="report-card">
        <strong id="expense-count">{{ selectedTransactions.length }}</strong>
        <span>Tổng số giao dịch trong kỳ</span>
      </div>
      </div>

      <div class="summary-grid report-summary-grid">
        <div class="card">
          <span>Thu vào</span>
          <strong class="amount-income">{{ formatMoney(reportSummary.income) }}</strong>
        </div>
        <div class="card">
          <span>Chi tiêu</span>
          <strong class="amount-expense">{{ formatMoney(reportSummary.expense) }}</strong>
        </div>
        <div class="card">
          <span>Dòng tiền</span>
          <strong :class="reportSummary.net >= 0 ? 'amount-income' : 'amount-expense'">
            {{ formatMoney(reportSummary.net) }}
          </strong>
        </div>
        <div class="card">
          <span>So với kỳ trước</span>
          <strong :class="comparison.spendingDelta <= 0 ? 'amount-income' : 'amount-expense'">
            {{ comparison.spendingDeltaLabel }}
          </strong>
        </div>
      </div>

      <div class="debt-carryover-box">
        <h3>Debt Carry-over</h3>
        <div class="summary-grid report-summary-grid">
          <div class="card">
            <span>Ngân sách trước khi trừ nợ</span>
            <strong>{{ formatMoney(finance.budget_before_debt) }}</strong>
          </div>
          <div class="card">
            <span>Nợ kỳ trước chuyển sang</span>
            <strong class="amount-expense">{{ formatMoney(finance.debt_carried_from_previous) }}</strong>
          </div>
          <div class="card">
            <span>Ngân sách khả dụng sau nợ</span>
            <strong>{{ formatMoney(finance.available_budget_after_debt) }}</strong>
          </div>
          <div class="card">
            <span>Nợ chuyển sang kỳ sau</span>
            <strong class="amount-expense">{{ formatMoney(finance.debt_to_carry_next_period) }}</strong>
          </div>
          <div class="card">
            <span>Tiền dư cuối kỳ</span>
            <strong class="amount-income">{{ formatMoney(finance.surplus_to_carry_next_period) }}</strong>
          </div>
          <div class="card">
            <span>Budget cộng kỳ sau</span>
            <strong>{{ formatMoney(finance.budget_carry_to_next_period) }}</strong>
          </div>
          <div class="card">
            <span>Trích vào Saving Goal</span>
            <strong class="amount-income">{{ formatMoney(finance.saving_goal_contribution_amount) }}</strong>
          </div>
        </div>
        <p v-if="finance.debt_to_carry_next_period > 0">
          Kỳ sau sẽ bị trừ nợ. Nếu nợ lớn hơn budget, hệ thống chỉ trừ 25% nợ để cảnh báo nhưng không làm mất toàn bộ budget.
        </p>
        <p v-else-if="finance.requires_saving_decision">
          Người dùng đang có saving goal và có tiền dư, cần chọn giữ cho budget kỳ sau, chia vào saving goal, hoặc gửi hết vào saving goal.
        </p>
        <p v-else>
          Hiện không có khoản nợ cần chuyển sang kỳ tiếp theo. Nếu không có saving goal, tiền dư sẽ được cộng vào budget kỳ sau.
        </p>
      </div>

      <div class="report-compare-grid">
        <div class="compare-card">
          <span>Kỳ hiện tại</span>
          <strong>{{ formatMoney(reportSummary.expense) }}</strong>
          <small>{{ reportSummary.expenseCount }} khoản chi</small>
        </div>
        <div class="compare-card">
          <span>Kỳ liền trước</span>
          <strong>{{ formatMoney(previousSummary.expense) }}</strong>
          <small>{{ previousSummary.expenseCount }} khoản chi</small>
        </div>
        <div class="compare-card">
          <span>Chênh lệch chi tiêu</span>
          <strong :class="comparison.spendingDelta <= 0 ? 'amount-income' : 'amount-expense'">
            {{ comparison.spendingDeltaLabel }}
          </strong>
          <small>{{ comparison.spendingPercentLabel }}</small>
        </div>
      </div>

      <div class="report-chart-grid">
      <div class="chart-box report-bar-box">
        <div class="report-chart-heading">
          <div>
            <h3>Biểu đồ cột thu chi</h3>
            <p>{{ barChartDescription }}</p>
          </div>
          <div class="bar-legend">
            <span><i class="legend-income"></i>Thu vào</span>
            <span><i class="legend-expense"></i>Chi tiêu</span>
          </div>
        </div>

        <p v-if="!hasBarData" class="place-empty-state">
          Chưa có dữ liệu để vẽ biểu đồ cột.
        </p>

        <div v-else class="bar-chart-scroll">
          <div class="bar-chart" :class="`mode-${reportMode}`">
            <div
              v-for="item in barSeries"
              :key="item.key"
              class="bar-column"
              :title="`${item.fullLabel}: thu ${formatMoney(item.income)}, chi ${formatMoney(item.expense)}`"
            >
              <div class="bar-pair">
                <span
                  class="bar-fill income"
                  :style="{ height: `${item.incomeHeight}%` }"
                ></span>
                <span
                  class="bar-fill expense"
                  :style="{ height: `${item.expenseHeight}%` }"
                ></span>
              </div>
              <strong>{{ item.label }}</strong>
              <small>{{ formatCompactMoney(item.expense) }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-box">
        <h3>Phân bổ mức chi tiêu</h3>
        <div id="category-chart" class="category-chart">
          <p v-if="!categoryChart.length">Chưa có dữ liệu biểu đồ.</p>

          <div v-else class="spending-chart-layout">
            <div class="spending-donut" :style="{ background: `conic-gradient(${donutGradient})` }">
              <div class="spending-donut-center">
                <span>Chi nhiều nhất</span>
                <strong>{{ topCategory.name }}</strong>
                <em>{{ formatMoney(topCategory.amount) }}</em>
              </div>
            </div>

            <div class="spending-legend">
              <div v-for="item in categoryChart" :key="`legend-${item.category}`" class="legend-item">
                <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
                <div>
                  <strong>{{ item.category }}</strong>
                  <small>{{ formatMoney(item.amount) }} · {{ item.percent }}%</small>
                </div>
              </div>
            </div>
          </div>

          <div
            v-for="item in categoryChart"
            :key="item.category"
            class="chart-row"
            :style="{ '--chart-color': item.color }"
          >
            <span>{{ item.category }}</span>
            <div class="chart-track">
              <strong :style="{ width: `${item.percent}%` }"></strong>
            </div>
            <em>{{ item.percent }}%</em>
          </div>
        </div>
      </div>

      </div>

      <div class="insight-box report-ai-insight">
        <h3>AI Financial Insights</h3>
        <div id="report-insights">
          <p>Điểm sức khỏe tài chính: <strong>{{ finance.financial_health_score }}/100</strong></p>
          <p>Mức rủi ro: <strong>{{ riskText }}</strong></p>
          <p v-if="finance.predicted_days_remaining !== null">
            Dự đoán số dư còn đủ trong <strong>{{ finance.predicted_days_remaining }}</strong> ngày.
          </p>
          <p>Xác suất vượt ngân sách: <strong>{{ finance.overspending_probability }}%</strong></p>
        </div>
        <div id="forecast-summary" class="forecast-summary">
          <ul v-if="finance.insights.length" class="insight-list">
            <li v-for="item in finance.insights" :key="item">{{ item }}</li>
          </ul>
          <p v-else>Chưa phát hiện bất thường đáng kể.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../stores/useAppStore';
import { analyzeFinance } from '../utils/financialAnalysis';
import { downloadFinancialReport } from '../services/report';
import { INCOME_CATEGORIES } from '../utils/transactionCategories';

const DAY_MS = 24 * 60 * 60 * 1000;

const appStore = useAppStore();
const { expenses, budgets, categoryBudgets, goals, user } = storeToRefs(appStore);

const reportMode = ref('month');
const periodAnchor = ref(new Date());
const incomeCategorySet = new Set(INCOME_CATEGORIES);
const exporting = ref(false);
const exportMessage = ref('');
const exportError = ref(false);

const periodOptions = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' }
];

onMounted(() => Promise.all([
  appStore.fetchExpenses(),
  appStore.fetchBudgets(),
  appStore.fetchCategoryBudgets(),
  appStore.fetchGoals()
]));

const currentBudget = computed(() => budgets.value[0] || null);
const finance = computed(() => analyzeFinance({
  expenses: expenses.value,
  budget: currentBudget.value,
  categoryBudgets: categoryBudgets.value,
  goals: goals.value,
  wallet: user.value?.wallet || 0
}));

const currentRange = computed(() => getPeriodRange(periodAnchor.value, reportMode.value));
const previousRange = computed(() => getPreviousRange(currentRange.value, reportMode.value));
const periodLabel = computed(() => formatPeriodLabel(currentRange.value, reportMode.value));
const previousPeriodLabel = computed(() => formatPeriodLabel(previousRange.value, reportMode.value));

const normalizedTransactions = computed(() => expenses.value
  .map(normalizeTransaction)
  .filter((transaction) => transaction.amount > 0 && transaction.dateObject));

const selectedTransactions = computed(() => filterByRange(normalizedTransactions.value, currentRange.value));
const previousTransactions = computed(() => filterByRange(normalizedTransactions.value, previousRange.value));

const selectedExpenses = computed(() => selectedTransactions.value.filter((transaction) => !transaction.isIncome));
const selectedIncome = computed(() => selectedTransactions.value.filter((transaction) => transaction.isIncome));
const previousExpenses = computed(() => previousTransactions.value.filter((transaction) => !transaction.isIncome));
const previousIncome = computed(() => previousTransactions.value.filter((transaction) => transaction.isIncome));

const reportSummary = computed(() => buildSummary(selectedExpenses.value, selectedIncome.value, currentRange.value));
const previousSummary = computed(() => buildSummary(previousExpenses.value, previousIncome.value, previousRange.value));

const comparison = computed(() => {
  const spendingDelta = reportSummary.value.expense - previousSummary.value.expense;
  const percent = previousSummary.value.expense > 0
    ? Math.round((spendingDelta / previousSummary.value.expense) * 100)
    : reportSummary.value.expense > 0 ? 100 : 0;

  return {
    spendingDelta,
    spendingDeltaLabel: `${spendingDelta > 0 ? '+' : ''}${formatMoney(spendingDelta)}`,
    spendingPercentLabel: previousSummary.value.expense > 0
      ? `${percent > 0 ? '+' : ''}${percent}% so với ${previousPeriodLabel.value}`
      : `Kỳ trước chưa có chi tiêu`
  };
});

const averageExpense = computed(() => {
  if (!selectedExpenses.value.length) return 0;
  return sumAmounts(selectedExpenses.value) / selectedExpenses.value.length;
});

const riskText = computed(() => ({
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Rất cao'
}[finance.value.risk_level] || '-'));

const chartColors = [
  '#4f8f7b',
  '#d6a84f',
  '#7b8fa6',
  '#ef6b68',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#0ea5e9'
];

const categoryChart = computed(() => {
  const totals = selectedExpenses.value.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amount;
    return result;
  }, {});
  const entries = Object.entries(totals);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  if (!total) return [];
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount], index) => ({
      category,
      amount,
      ratio: amount / total,
      percent: Math.round((amount / total) * 100),
      color: chartColors[index % chartColors.length]
    }));
});

const topCategory = computed(() => {
  const first = categoryChart.value[0];
  return {
    name: first?.category || '-',
    amount: first?.amount || 0
  };
});

const donutGradient = computed(() => {
  let cursor = 0;
  return categoryChart.value.map((item) => {
    const start = cursor;
    const end = cursor + item.ratio * 100;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  }).join(', ');
});

const barSeries = computed(() => {
  const buckets = buildBuckets(currentRange.value, reportMode.value);
  selectedTransactions.value.forEach((transaction) => {
    const key = getBucketKey(transaction.dateObject, reportMode.value);
    const bucket = buckets.find((item) => item.key === key);
    if (!bucket) return;
    if (transaction.isIncome) bucket.income += transaction.amount;
    else bucket.expense += transaction.amount;
  });

  const maxValue = Math.max(...buckets.map((item) => Math.max(item.income, item.expense)), 1);
  return buckets.map((item) => ({
    ...item,
    incomeHeight: Math.max((item.income / maxValue) * 100, item.income > 0 ? 5 : 0),
    expenseHeight: Math.max((item.expense / maxValue) * 100, item.expense > 0 ? 5 : 0)
  }));
});

const hasBarData = computed(() => reportSummary.value.income > 0 || reportSummary.value.expense > 0);

const barChartDescription = computed(() => {
  if (reportMode.value === 'week') return 'So sánh thu chi từng ngày trong tuần đang chọn.';
  if (reportMode.value === 'quarter') return 'So sánh thu chi giữa 3 tháng trong quý đang chọn.';
  if (reportMode.value === 'year') return 'So sánh thu chi giữa các tháng trong năm đang chọn.';
  return 'So sánh thu chi từng ngày trong tháng đang chọn.';
});

async function exportReport(format) {
  exporting.value = true;
  exportMessage.value = '';
  exportError.value = false;
  try {
    await downloadFinancialReport(format);
    exportMessage.value = format === 'pdf'
      ? 'Đã tạo file PDF báo cáo.'
      : format === 'excel'
        ? 'Đã tạo file Excel báo cáo.'
        : 'Đã tạo file CSV báo cáo.';
  } catch (error) {
    console.error('Export report failed', error);
    exportError.value = true;
    exportMessage.value = error?.message || 'Không thể xuất báo cáo.';
  } finally {
    exporting.value = false;
  }
}

function setReportMode(mode) {
  reportMode.value = mode;
}

function shiftPeriod(direction) {
  const next = new Date(periodAnchor.value);
  if (reportMode.value === 'week') next.setDate(next.getDate() + direction * 7);
  if (reportMode.value === 'month') next.setMonth(next.getMonth() + direction);
  if (reportMode.value === 'quarter') next.setMonth(next.getMonth() + direction * 3);
  if (reportMode.value === 'year') next.setFullYear(next.getFullYear() + direction);
  periodAnchor.value = next;
}

function resetPeriod() {
  periodAnchor.value = new Date();
}

function normalizeTransaction(transaction = {}) {
  const dateObject = parseDate(transaction.date);
  const category = String(transaction.category || 'Khác').trim() || 'Khác';
  return {
    ...transaction,
    amount: Number(transaction.amount || 0),
    category,
    dateObject,
    isIncome: transaction.type === 'income' || (!transaction.type && incomeCategorySet.has(category))
  };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getWeekStart(date) {
  const day = date.getDay() || 7;
  const result = new Date(date);
  result.setDate(date.getDate() - day + 1);
  return startOfDay(result);
}

function getPeriodRange(date, mode) {
  const anchor = new Date(date);
  if (mode === 'week') {
    const start = getWeekStart(anchor);
    const end = endOfDay(new Date(start.getTime() + 6 * DAY_MS));
    return { start, end };
  }
  if (mode === 'year') {
    const start = new Date(anchor.getFullYear(), 0, 1);
    const end = endOfDay(new Date(anchor.getFullYear(), 11, 31));
    return { start, end };
  }
  if (mode === 'quarter') {
    const quarterStartMonth = Math.floor(anchor.getMonth() / 3) * 3;
    const start = new Date(anchor.getFullYear(), quarterStartMonth, 1);
    const end = endOfDay(new Date(anchor.getFullYear(), quarterStartMonth + 3, 0));
    return { start, end };
  }

  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
  return { start, end };
}

function getPreviousRange(range, mode) {
  const anchor = new Date(range.start);
  if (mode === 'week') anchor.setDate(anchor.getDate() - 7);
  if (mode === 'month') anchor.setMonth(anchor.getMonth() - 1);
  if (mode === 'quarter') anchor.setMonth(anchor.getMonth() - 3);
  if (mode === 'year') anchor.setFullYear(anchor.getFullYear() - 1);
  return getPeriodRange(anchor, mode);
}

function filterByRange(items, range) {
  return items.filter((item) => item.dateObject >= range.start && item.dateObject <= range.end);
}

function buildSummary(expenseItems, incomeItems, range) {
  const expense = sumAmounts(expenseItems);
  const income = sumAmounts(incomeItems);
  const days = Math.max(Math.round((startOfDay(range.end) - startOfDay(range.start)) / DAY_MS) + 1, 1);
  return {
    expense,
    income,
    net: income - expense,
    expenseCount: expenseItems.length,
    incomeCount: incomeItems.length,
    averageDailySpending: expense / days
  };
}

function buildBuckets(range, mode) {
  if (mode === 'quarter' || mode === 'year') {
    const monthCount = mode === 'quarter' ? 3 : 12;
    const startMonth = mode === 'quarter' ? range.start.getMonth() : 0;
    return Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(range.start.getFullYear(), startMonth + index, 1);
      return {
        key: getBucketKey(date, mode),
        label: `T${date.getMonth() + 1}`,
        fullLabel: `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
        income: 0,
        expense: 0
      };
    });
  }

  const buckets = [];
  for (let current = new Date(range.start); current <= range.end; current = new Date(current.getTime() + DAY_MS)) {
    buckets.push({
      key: getBucketKey(current, mode),
      label: mode === 'week'
        ? current.toLocaleDateString('vi-VN', { weekday: 'short' })
        : String(current.getDate()).padStart(2, '0'),
      fullLabel: current.toLocaleDateString('vi-VN'),
      income: 0,
      expense: 0
    });
  }
  return buckets;
}

function getBucketKey(date, mode) {
  if (mode === 'quarter' || mode === 'year') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return date.toISOString().slice(0, 10);
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function formatPeriodLabel(range, mode) {
  if (mode === 'week') {
    return `Tuần ${formatDate(range.start)} - ${formatDate(range.end)}`;
  }
  if (mode === 'quarter') {
    const quarter = Math.floor(range.start.getMonth() / 3) + 1;
    return `Quý ${quarter}/${range.start.getFullYear()}`;
  }
  if (mode === 'year') return `Năm ${range.start.getFullYear()}`;
  return `Tháng ${String(range.start.getMonth() + 1).padStart(2, '0')}/${range.start.getFullYear()}`;
}

function formatDate(date) {
  return date.toLocaleDateString('vi-VN');
}

function formatMoney(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`;
}

function formatCompactMoney(value) {
  const amount = Math.round(Number(value || 0));
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}tr`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${amount}đ`;
}
</script>
