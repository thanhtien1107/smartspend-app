<template>
  <section id="dashboard" class="screen active">
    <div class="panel summary-panel">
      <h2>Dashboard</h2>

      <div class="summary-grid">
        <div class="card">
          <span>Tổng chi tiêu</span>
          <strong id="total-expense">{{
            formatMoney(finance.total_expense)
          }}</strong>
        </div>
        <div class="card">
          <span>Số dư còn lại</span>
          <strong id="remaining-balance">{{
            formatMoney(finance.remaining_balance)
          }}</strong>
        </div>
        <div class="card">
          <span>Tổng thu vào</span>
          <strong id="total-income">Thu: {{ formatMoney(finance.total_income) }}</strong>
        </div>
        <div class="card">
          <span>Dòng tiền tháng</span>
          <strong id="net-cash-flow">{{ formatMoney(finance.net_cash_flow) }}</strong>
        </div>
        <div class="card">
          <span>Ngân sách khả dụng</span>
          <strong id="budget-amount">{{
            formatMoney(finance.budget_amount)
          }}</strong>
        </div>
        <div class="card">
          <span>Đã dùng ngân sách</span>
          <strong id="budget-usage">{{ finance.budget_usage }}%</strong>
        </div>
        <div class="card">
          <span>Nợ kỳ trước</span>
          <strong class="amount-expense">{{ formatMoney(finance.debt_carried_from_previous) }}</strong>
        </div>
        <div class="card">
          <span>Nợ chuyển kỳ sau</span>
          <strong class="amount-expense">{{ formatMoney(finance.debt_to_carry_next_period) }}</strong>
        </div>
        <div class="card">
          <span>Trạng thái</span>
          <strong id="budget-status">{{ finance.status }}</strong>
        </div>
        <div class="card">
          <span>Hạng mục lớn nhất</span>
          <strong id="top-category">{{ finance.top_category }}</strong>
        </div>
      </div>

      <div class="budget-progress" aria-label="Phần trăm ngân sách đã dùng">
        <div class="budget-progress-meta">
          <span>{{ finance.status }}</span>
          <strong>{{ finance.budget_usage }}%</strong>
        </div>
        <div class="budget-progress-track">
          <span
            :class="`level-${finance.budget_level}`"
            :style="{ width: `${progressWidth}%` }"
          ></span>
        </div>
      </div>

      <div class="debt-carryover-box compact-dashboard-debt">
        <h3>Debt carry-over</h3>
        <p>
          Ngân sách trước nợ: <strong>{{ formatMoney(finance.budget_before_debt) }}</strong> ·
          Khả dụng sau nợ: <strong>{{ formatMoney(finance.available_budget_after_debt) }}</strong>
        </p>
        <p v-if="finance.debt_to_carry_next_period > 0" class="amount-expense">
          Cảnh báo: {{ formatMoney(finance.debt_to_carry_next_period) }} sẽ bị chuyển sang kỳ tiếp theo.
        </p>
        <p v-else-if="finance.surplus_to_carry_next_period > 0" class="amount-income">
          Cuối kỳ đang dư {{ formatMoney(finance.surplus_to_carry_next_period) }}. Hãy chọn cách xử lý cho kỳ sau.
        </p>

        <div v-if="finance.debt_to_carry_next_period > 0" class="carryover-decision-panel">
          <p v-if="finance.debt_repayment_limited" class="notification-box expense-error">
            {{ finance.debt_repayment_warning }}
          </p>
          <p>
            Dự kiến kỳ sau trừ nợ:
            <strong class="amount-expense">{{ formatMoney(finance.debt_repayment_amount) }}</strong>
          </p>
          <button type="button" class="btn-action" :disabled="carryoverLoading" @click="applyDebtDecision">
            Áp dụng trừ nợ vào budget kỳ sau
          </button>
        </div>

        <div
          v-else-if="finance.surplus_to_carry_next_period > 0 && !activeSavingGoals.length"
          class="carryover-decision-panel"
        >
          <p>Không có saving goal nên tiền dư sẽ được cộng vào budget kỳ sau.</p>
          <button type="button" class="btn-action" :disabled="carryoverLoading" @click="applyNoSavingDecision">
            Cộng {{ formatMoney(finance.surplus_to_carry_next_period) }} vào budget kỳ sau
          </button>
        </div>

        <form
          v-else-if="finance.surplus_to_carry_next_period > 0 && activeSavingGoals.length"
          class="dashboard-controls carryover-decision-form"
          @submit.prevent="applySavingDecision"
        >
          <select v-model="carryoverForm.strategy">
            <option value="keep_for_next_budget">Giữ hết tiền dư cho budget tháng sau</option>
            <option value="split_saving_and_budget">Gửi một phần vào saving goal, phần còn lại cộng budget</option>
            <option value="send_all_to_saving">Gửi hết tiền dư vào saving goal</option>
          </select>
          <select
            v-if="carryoverForm.strategy !== 'keep_for_next_budget'"
            v-model="carryoverForm.goalId"
          >
            <option v-for="goal in activeSavingGoals" :key="goal.id" :value="goal.id">
              {{ goal.name }} · còn thiếu {{ formatMoney(goal.remaining) }}
            </option>
          </select>
          <input
            v-if="carryoverForm.strategy === 'split_saving_and_budget'"
            v-model.number="carryoverForm.savingAmount"
            type="number"
            min="1"
            :max="finance.surplus_to_carry_next_period - 1"
            placeholder="Số tiền gửi saving goal"
          />
          <button type="submit" class="primary-btn" :disabled="carryoverLoading">
            Áp dụng lựa chọn
          </button>
        </form>
        <p v-if="carryoverMessage" class="notification-box" :class="{ 'expense-error': carryoverError }">
          {{ carryoverMessage }}
        </p>
      </div>

      <form class="dashboard-controls transaction-search-form" @submit.prevent="searchTransactions">
        <input
          id="expense-search"
          v-model.trim="searchText"
          type="text"
          placeholder="Tìm theo ghi chú, địa điểm..."
        />
        <select id="expense-filter-category" v-model="selectedCategory">
          <option value="">Tất cả danh mục</option>
          <option
            v-for="category in allCategories"
            :key="category"
            :value="category"
          >
            {{ getCategoryIcon(category) }} {{ category }}
          </option>
        </select>
        <input
          v-model="selectedDate"
          type="date"
          aria-label="Tìm theo ngày"
        />
        <select v-model="selectedMonth" aria-label="Tìm theo tháng">
          <option value="">Tất cả tháng</option>
          <option
            v-for="month in availableTransactionMonths"
            :key="month.value"
            :value="month.value"
          >
            {{ month.label }}
          </option>
        </select>
        <button type="submit" class="primary-btn transaction-search-btn">
          Tìm
        </button>
        <button
          type="button"
          class="btn-action show-all-transactions-btn"
          @click="showAllTransactions"
        >
          Hiển thị toàn bộ
        </button>
      </form>

      <div
        v-if="finance.alerts.length"
        id="notification-box"
        class="notification-box expense-error alert-list"
      >
        <strong>Cảnh báo tài chính</strong>
        <p
          v-for="alert in finance.alerts"
          :key="alert.message"
          :class="`alert-${alert.priority}`"
        >
          {{ alert.message }}
        </p>
      </div>

      <div
        v-if="customerNotifications.length"
        class="notification-box customer-notification-box"
      >
        <div class="notification-heading-row">
          <strong>Thông báo cho khách hàng</strong>
          <button type="button" class="btn-action" @click="markRead">
            Đánh dấu đã đọc
          </button>
        </div>
        <p
          v-for="notification in customerNotifications"
          :key="notification.id"
          :class="`alert-${notification.priority || 'medium'}`"
        >
          {{ notification.message }}
        </p>
      </div>

      <div class="badge-panel">
        <h3>Sức khỏe tài chính</h3>
        <div class="health-score-row">
          <strong>{{ finance.financial_health_score }}/100</strong>
          <span>Rủi ro: {{ riskText }}</span>
        </div>
      </div>

      <div class="insight-box">
        <h3>Gợi ý tiết kiệm</h3>
        <ul v-if="finance.recommendations.length" class="insight-list">
          <li v-for="item in finance.recommendations" :key="item">
            {{ item }}
          </li>
        </ul>
        <p v-else>Chưa có đủ dữ liệu để đưa ra gợi ý.</p>
      </div>

      <div class="place-search-panel">
        <div class="place-search-heading">
          <div>
            <h3>Tìm địa điểm quanh bạn</h3>
            <p>Gõ cafe, nhà hàng, siêu thị... rồi chọn phạm vi tìm kiếm.</p>
          </div>
          <span class="place-search-icon">⌖</span>
        </div>

        <form class="place-search-form" @submit.prevent="searchDashboardPlaces">
          <input
            v-model.trim="placeSearchText"
            type="text"
            placeholder="Ví dụ: cafe, Highlands, quán ăn..."
            autocomplete="off"
          />
          <select v-model.number="placeRadius">
            <option
              v-for="radius in placeRadiusOptions"
              :key="radius"
              :value="radius"
            >
              {{ formatDistance(radius) }}
            </option>
          </select>
          <button
            type="submit"
            class="primary-btn"
            :disabled="placeLoading || !placeSearchText"
          >
            {{ placeLoading ? "Đang tìm..." : "Tìm quanh tôi" }}
          </button>
        </form>

        <p v-if="placeError" class="notification-box expense-error">
          {{ placeError }}
        </p>

        <div v-if="placeResults.length" class="dashboard-place-list">
          <article
            v-for="place in placeResults"
            :key="place.id"
            class="dashboard-place-card"
          >
            <div class="dashboard-place-top">
              <div>
                <h4>{{ place.name }}</h4>
                <p>{{ place.address || "Chưa có địa chỉ chi tiết" }}</p>
              </div>
              <span v-if="place.rating" class="dashboard-place-rating"
                >⭐ {{ place.rating }}</span
              >
            </div>

            <div class="dashboard-place-meta">
              <span v-if="place.distanceText">{{ place.distanceText }}</span>
              <span v-if="place.userRatingCount"
                >{{ place.userRatingCount }} đánh giá</span
              >
              <span v-if="place.phone">{{ place.phone }}</span>
              <span v-if="place.openState">{{ place.openState }}</span>
            </div>

            <p v-if="place.hoursSummary" class="dashboard-place-hours">
              {{ place.hoursSummary }}
            </p>

            <div class="dashboard-price-suggestion">
              <strong>{{ place.priceSuggestion.label }}</strong>
              <span>{{ place.priceSuggestion.reason }}</span>
            </div>

            <div v-if="place.reviews.length" class="dashboard-place-reviews">
              <article v-for="review in place.reviews" :key="review.key">
                <strong>{{ review.authorName }}</strong>
                <span>⭐ {{ review.rating || "-" }}</span>
                <p>{{ review.text }}</p>
              </article>
            </div>

            <div class="dashboard-place-actions">
              <a
                v-if="place.website"
                :href="place.website"
                target="_blank"
                rel="noopener"
                >Website</a
              >
              <a
                v-if="place.menuUrl"
                :href="place.menuUrl"
                target="_blank"
                rel="noopener"
                >Menu</a
              >
              <a
                v-if="place.googleMapsUrl"
                :href="place.googleMapsUrl"
                target="_blank"
                rel="noopener"
                >Google Maps</a
              >
            </div>
          </article>
        </div>

        <p v-else-if="placeSearched && !placeLoading" class="place-empty-state">
          Chưa tìm thấy địa điểm phù hợp trong phạm vi đã chọn.
        </p>
      </div>
    </div>

    <div class="panel list-panel">
      <h2>{{ transactionListTitle }}</h2>
      <p v-if="expenseError" class="notification-box expense-error">
        {{ expenseError }}
      </p>
      <div id="expense-list" class="expense-list">
        <p v-if="!recentExpenses.length">Không có chi tiêu/thu nhập</p>
        <div
          v-for="expense in recentExpenses"
          :key="expense.id"
          class="expense-item"
        >
          <div class="expense-main">
            <span class="category-icon">{{
              getCategoryIcon(expense.category)
            }}</span>
            <strong>{{ expense.title }}</strong>
            <span>{{ expense.category }} · {{ formatDate(expense.date) }}</span>
            <p>{{ expense.note || expense.location || "" }}</p>
          </div>
          <div class="expense-actions">
            <span :class="isIncomeTransaction(expense) ? 'amount-income' : 'amount-expense'">
              {{ isIncomeTransaction(expense) ? '+' : '-' }}{{ formatMoney(expense.amount) }}
            </span>
            <button
              type="button"
              class="btn-action"
              @click="editExpense(expense)"
            >
              Sửa
            </button>
            <button
              type="button"
              class="btn-delete"
              @click="removeExpense(expense.id)"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "../stores/useAppStore";
import {
  analyzeFinance,
  validateExpenseData,
} from "../utils/financialAnalysis";
import { apiFetch } from "../services/api";
import { fetchNotifications, markNotificationsRead } from "../services/notification";
import { applyDebtCarryoverDecision } from "../services/debtCarryover";
import { getCategoryIcon } from "../utils/categoryIcons";
import { createCacheKey, fetchWithCache } from "../utils/cache";
import { INCOME_CATEGORIES } from "../utils/transactionCategories";

const appStore = useAppStore();
const { expenses, budgets, categories, categoryBudgets, goals, user } =
  storeToRefs(appStore);
const expenseError = ref("");
const searchText = ref("");
const selectedCategory = ref("");
const selectedDate = ref("");
const selectedMonth = ref("");
const transactionSearchApplied = ref(false);
const showingAllTransactions = ref(false);
const activeTransactionFilters = ref({
  keyword: "",
  category: "",
  date: "",
  month: "",
});
const placeSearchText = ref("cafe");
const placeRadius = ref(2000);
const placeLoading = ref(false);
const placeError = ref("");
const placeResults = ref([]);
const placeSearched = ref(false);
const placeCoordinates = ref(null);
const placeRadiusOptions = [500, 1000, 2000, 5000, 10000, 25000, 50000];
const customerNotifications = ref([]);
const carryoverLoading = ref(false);
const carryoverMessage = ref('');
const carryoverError = ref(false);
const carryoverForm = ref({
  strategy: 'keep_for_next_budget',
  goalId: '',
  savingAmount: null
});

const currentBudget = computed(() => budgets.value[0] || null);
const finance = computed(() =>
  analyzeFinance({
    expenses: expenses.value,
    budget: currentBudget.value,
    categoryBudgets: categoryBudgets.value,
    goals: goals.value,
    wallet: user.value?.wallet || 0,
  }),
);
const progressWidth = computed(() => Math.min(finance.value.budget_usage, 100));
const riskText = computed(
  () =>
    ({
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      critical: "Rất cao",
    })[finance.value.risk_level] || "-",
);

const activeSavingGoals = computed(() => {
  return (goals.value || [])
    .map((goal) => {
      const target = Math.max(Number(goal.target || 0), 0);
      const savedAmount = Math.max(Number(goal.currentAmount ?? goal.savedAmount ?? goal.saved ?? 0), 0);
      return {
        ...goal,
        target,
        savedAmount,
        remaining: Math.max(target - savedAmount, 0),
      };
    })
    .filter((goal) => goal.target > 0 && goal.remaining > 0);
});

const allCategories = computed(() => {
  return [...new Set([...(categories.value || []), ...INCOME_CATEGORIES])];
});

const incomeCategorySet = new Set(INCOME_CATEGORIES);

function isIncomeTransaction(expense = {}) {
  return expense.type === "income" || (!expense.type && incomeCategorySet.has(expense.category));
}

const sortedExpenses = computed(() => {
  return [...expenses.value].sort(
    (a, b) =>
      new Date(`${b.date || b.createdAt || ""}T${b.time || "00:00"}`) -
      new Date(`${a.date || a.createdAt || ""}T${a.time || "00:00"}`),
  );
});

const filteredExpenses = computed(() => {
  const filters = activeTransactionFilters.value;
  return sortedExpenses.value.filter((expense) => matchesTransactionFilters(expense, filters));
});

const recentExpenses = computed(() => {
  if (transactionSearchApplied.value) return filteredExpenses.value;
  if (showingAllTransactions.value) return sortedExpenses.value;
  return sortedExpenses.value.slice(0, 6);
});

const transactionListTitle = computed(() => {
  if (transactionSearchApplied.value) return "Kết quả tìm kiếm";
  if (showingAllTransactions.value) return "Tất cả chi tiêu/thu nhập";
  return "Chi tiêu gần đây";
});

const availableTransactionMonths = computed(() => {
  const months = new Set();
  expenses.value.forEach((expense) => {
    const month = String(expense.date || expense.createdAt || "").slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month)) months.add(month);
  });

  return [...months]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => {
      const [year, month] = value.split("-");
      return {
        value,
        label: `${month}/${year}`,
      };
    });
});

function searchTransactions() {
  activeTransactionFilters.value = {
    keyword: searchText.value.trim().toLowerCase(),
    category: selectedCategory.value,
    date: selectedDate.value,
    month: selectedMonth.value,
  };
  transactionSearchApplied.value = true;
  showingAllTransactions.value = false;
}

function showAllTransactions() {
  searchText.value = "";
  selectedCategory.value = "";
  selectedDate.value = "";
  selectedMonth.value = "";
  activeTransactionFilters.value = {
    keyword: "",
    category: "",
    date: "",
    month: "",
  };
  transactionSearchApplied.value = false;
  showingAllTransactions.value = true;
}

function matchesTransactionFilters(expense, filters) {
  const transactionDate = String(expense.date || expense.createdAt || "").slice(0, 10);
  const transactionMonth = transactionDate.slice(0, 7);
  const matchesKeyword =
    !filters.keyword ||
    [
      expense.title,
      expense.category,
      expense.note,
      expense.location,
      expense.friends,
      expense.amount,
    ]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(filters.keyword));
  const matchesCategory = !filters.category || expense.category === filters.category;
  const matchesDate = !filters.date || transactionDate === filters.date;
  const matchesMonth = !filters.month || transactionMonth === filters.month;

  return matchesKeyword && matchesCategory && matchesDate && matchesMonth;
}

onMounted(async () => {
  try {
    await Promise.all([
      appStore.fetchExpenses(),
      appStore.fetchBudgets(),
      appStore.fetchCategoryBudgets(),
      appStore.fetchGoals(),
      appStore.fetchCategories(),
    ]);
    customerNotifications.value = await fetchNotifications();
  } catch (error) {
    console.error("Fetch dashboard data failed", error);
    expenseError.value = "Không thể tải dữ liệu Dashboard.";
  }
});

async function markRead() {
  try {
    await markNotificationsRead();
    customerNotifications.value = customerNotifications.value.map((notification) => ({
      ...notification,
      read: true,
    }));
  } catch (error) {
    console.error('Mark notifications read failed', error);
  }
}

async function refreshCarryoverContext() {
  await Promise.allSettled([
    appStore.fetchBudgets(),
    appStore.fetchGoals(),
  ]);
}

async function submitCarryoverDecision(payload) {
  carryoverLoading.value = true;
  carryoverMessage.value = '';
  carryoverError.value = false;
  try {
    const result = await applyDebtCarryoverDecision(payload);
    await refreshCarryoverContext();
    carryoverMessage.value = result?.decision?.warning
      ? `Đã áp dụng. ${result.decision.warning}`
      : 'Đã áp dụng debt carry-over cho budget kỳ sau.';
  } catch (error) {
    console.error('Apply carry-over decision failed', error);
    carryoverError.value = true;
    carryoverMessage.value = error?.error || error?.message || 'Không thể áp dụng lựa chọn carry-over.';
  } finally {
    carryoverLoading.value = false;
  }
}

async function applyDebtDecision() {
  await submitCarryoverDecision({ strategy: 'debt_repayment' });
}

async function applyNoSavingDecision() {
  await submitCarryoverDecision({ strategy: 'no_saving_auto_carry' });
}

async function applySavingDecision() {
  const payload = {
    strategy: carryoverForm.value.strategy,
    goalId: carryoverForm.value.goalId || activeSavingGoals.value[0]?.id || '',
    savingAmount: Number(carryoverForm.value.savingAmount || 0),
  };
  await submitCarryoverDecision(payload);
}

async function editExpense(expense) {
  expenseError.value = "";
  const rawAmount = window.prompt(
    "Nhập số tiền mới",
    String(expense.amount || ""),
  );
  if (rawAmount === null) return;
  const rawNote =
    window.prompt("Nhập ghi chú mới", expense.note || "") ?? expense.note ?? "";
  const payload = {
    ...expense,
    amount: Number(rawAmount),
    note: rawNote,
  };
  const errors = validateExpenseData(payload);
  if (errors.length) {
    expenseError.value = errors[0];
    return;
  }

  try {
    await appStore.updateExpense(expense.id, payload);
  } catch (error) {
    console.error("Update expense failed", error);
    expenseError.value =
      error?.message || error?.error || "Không thể sửa chi tiêu.";
  }
}

async function removeExpense(id) {
  expenseError.value = "";
  try {
    await appStore.deleteExpense(id);
  } catch (error) {
    console.error("Delete expense failed", error);
    expenseError.value =
      error?.message || error?.error || "Không thể xóa chi tiêu.";
  }
}

async function searchDashboardPlaces() {
  const query = placeSearchText.value.trim();
  placeError.value = "";
  placeSearched.value = true;
  placeResults.value = [];

  if (!query) {
    placeError.value = "Vui lòng nhập từ khóa địa điểm.";
    return;
  }

  placeLoading.value = true;
  try {
    const coordinates =
      placeCoordinates.value || (await getDashboardCoordinates());
    placeCoordinates.value = coordinates;

    const payload = await fetchWithCache(
      createCacheKey("places", "dashboard-search", normalizeText(query), getCoordinateCacheScope(coordinates), placeRadius.value),
      async () => {
        const response = await apiFetch("/api/places/search", {
          method: "POST",
          body: JSON.stringify({
            query,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            radius: placeRadius.value,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(data.details || data.error || "Place search failed");
          error.status = response.status;
          throw error;
        }
        return data;
      },
      { ttl: 10 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 },
    );

    if (payload?.error) {
      throw new Error(
        payload.details || payload.error || "Không thể tìm địa điểm.",
      );
    }

    const basePlaces = (payload.places || [])
      .map((place) => mapDashboardPlace(place, query))
      .filter(Boolean)
      .slice(0, 12);

    placeResults.value = await Promise.all(
      basePlaces.map((place) => enrichDashboardPlace(place, query)),
    );
  } catch (error) {
    console.error("Dashboard place search failed", error);
    placeError.value = error?.message || "Không thể tìm địa điểm quanh bạn.";
  } finally {
    placeLoading.value = false;
  }
}

function getDashboardCoordinates() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Trình duyệt không hỗ trợ định vị GPS."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () =>
        reject(
          new Error(
            "Không thể lấy vị trí hiện tại. Hãy cho phép quyền vị trí rồi thử lại.",
          ),
        ),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  });
}

function mapDashboardPlace(place, keyword) {
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  const types = Array.isArray(place.types)
    ? place.types
    : [place.types].filter(Boolean);
  const distanceMeters =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    placeCoordinates.value
      ? calculateDistanceMeters(
          placeCoordinates.value.latitude,
          placeCoordinates.value.longitude,
          latitude,
          longitude,
        )
      : null;
  const placeId = place.rawPlaceId || place.placeId || place.id || "";
  const mapped = {
    id: `${place.source || "place"}-${placeId || place.dataId || place.dataCid || place.name}`,
    source: place.source || "",
    placeId,
    dataId: place.dataId || "",
    dataCid: place.dataCid || "",
    name: place.name || "Địa điểm",
    address: place.address || "",
    latitude,
    longitude,
    website: normalizeExternalUrl(place.website || ""),
    googleMapsUrl: normalizeExternalUrl(
      place.googleMapsUrl || buildGoogleMapsSearchUrl(place),
    ),
    menuUrl: normalizeExternalUrl(place.menuUrl || ""),
    phone: place.phone || "",
    rating: place.rating || null,
    userRatingCount: Number(place.userRatingCount || 0),
    price: place.price || "",
    types,
    type: place.type || "",
    openState: place.openState || "",
    hours: place.hours || null,
    reviews: normalizeDashboardReviews(place.reviews || []),
    services: place.services || [],
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
  };

  mapped.hoursSummary = formatHours(mapped.hours);
  mapped.priceSuggestion = estimatePlacePrice(mapped, keyword);
  return mapped;
}

async function enrichDashboardPlace(place, keyword) {
  const payload = buildPlaceDetailPayload(place);
  if (!payload) return place;

  try {
    const data = await fetchWithCache(
      createCacheKey("places", "dashboard-detail", payload),
      async () => {
        const response = await apiFetch("/api/places/detail", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const detailPayload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(detailPayload.error || "Place detail failed");
          error.status = response.status;
          throw error;
        }
        return detailPayload;
      },
      { ttl: 30 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 },
    );
    if (!data.detail) return place;

    const detail = data.detail;
    const enriched = {
      ...place,
      name: detail.name || place.name,
      address: detail.address || place.address,
      website: normalizeExternalUrl(detail.website || place.website),
      googleMapsUrl: normalizeExternalUrl(
        detail.googleMapsUrl || place.googleMapsUrl,
      ),
      menuUrl: normalizeExternalUrl(
        detail.menuUrl || place.menuUrl || detail.website || "",
      ),
      phone: detail.phone || place.phone,
      rating: detail.rating || place.rating,
      userRatingCount: Number(
        detail.userRatingCount || place.userRatingCount || 0,
      ),
      price: detail.price || place.price,
      openState: detail.openState || place.openState,
      hours: detail.hours || place.hours,
      services: detail.services || place.services,
      reviews: normalizeDashboardReviews(
        detail.reviews || place.reviews || [],
      ).slice(0, 3),
    };
    enriched.hoursSummary = formatHours(enriched.hours);
    enriched.priceSuggestion = estimatePlacePrice(enriched, keyword);
    return enriched;
  } catch (error) {
    console.warn("Place detail enrichment failed", error);
    return place;
  }
}

function buildPlaceDetailPayload(place) {
  if (place.source === "google_places" && place.placeId) {
    return {
      source: "google_places",
      placeId: place.placeId,
    };
  }

  if (
    place.source === "serpapi" &&
    (place.placeId || place.dataId || place.dataCid)
  ) {
    return {
      source: "serpapi",
      placeId: place.placeId,
      dataId: place.dataId,
      dataCid: place.dataCid,
      latitude: place.latitude,
      longitude: place.longitude,
    };
  }

  return null;
}

function estimatePlacePrice(place, keyword = "") {
  const types = Array.isArray(place.types)
    ? place.types
    : [place.types].filter(Boolean);
  const text = normalizeText(
    `${place.name} ${place.type} ${types.join(" ")} ${keyword}`,
  );
  const rating = Number(place.rating || 0);
  const reviews = Number(place.userRatingCount || 0);

  if (
    text.includes("highlands") ||
    text.includes("the coffee house") ||
    text.includes("phuc long") ||
    text.includes("starbucks")
  ) {
    return {
      label: "Khoảng 35.000 - 100.000đ/người",
      reason: buildPriceReason(rating, reviews, "chuỗi cafe thương hiệu"),
    };
  }

  if (
    text.includes("cafe") ||
    text.includes("coffee") ||
    text.includes("ca phe")
  ) {
    const premium = rating >= 4.2 && reviews >= 100;
    return {
      label: premium
        ? "Khoảng 30.000 - 70.000đ/người"
        : "Khoảng 15.000 - 45.000đ/người",
      reason: buildPriceReason(
        rating,
        reviews,
        premium ? "đánh giá tốt và nhiều review" : "quán cafe phổ thông",
      ),
    };
  }

  if (
    text.includes("restaurant") ||
    text.includes("nha hang") ||
    text.includes("food") ||
    text.includes("quan an")
  ) {
    const premium = rating >= 4.3 && reviews >= 150;
    return {
      label: premium
        ? "Khoảng 80.000 - 180.000đ/người"
        : "Khoảng 40.000 - 100.000đ/người",
      reason: buildPriceReason(
        rating,
        reviews,
        premium ? "nhà hàng có độ tin cậy cao" : "mức ăn uống thông thường",
      ),
    };
  }

  if (
    text.includes("store") ||
    text.includes("shop") ||
    text.includes("sieu thi")
  ) {
    return {
      label: "Phụ thuộc sản phẩm mua",
      reason: buildPriceReason(rating, reviews, "cửa hàng bán lẻ"),
    };
  }

  return {
    label: "Cần xem menu hoặc website",
    reason: buildPriceReason(rating, reviews, "chưa đủ dữ liệu giá"),
  };
}

function buildPriceReason(rating, reviews, baseReason) {
  const trust =
    rating && reviews
      ? `Dựa trên ${rating} sao và ${reviews} đánh giá`
      : "Dựa trên loại địa điểm";
  return `${trust}; ${baseReason}.`;
}

function normalizeDashboardReviews(reviews = []) {
  return reviews
    .map((review, index) => ({
      key: `${review.authorName || review.author_name || review.username || "review"}-${index}`,
      authorName:
        review.authorName ||
        review.author_name ||
        review.username ||
        "Khách hàng",
      rating: review.rating || "",
      text:
        typeof review.text === "object"
          ? review.text.text || ""
          : review.text || review.description || review.snippet || "",
    }))
    .filter((review) => review.text)
    .slice(0, 3);
}

function formatHours(hours) {
  if (!hours) return "";

  const rows = Array.isArray(hours)
    ? hours
    : Object.entries(hours).map(([day, value]) => {
        const text = Array.isArray(value) ? value.join(", ") : value;
        return `${day}: ${text}`;
      });

  return rows.filter(Boolean).slice(0, 2).join(" · ");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getCoordinateCacheScope(coordinates) {
  if (!coordinates) return "no-location";
  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "no-location";
  }
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function normalizeExternalUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function buildGoogleMapsSearchUrl(place) {
  const query = [place.name, place.address].filter(Boolean).join(", ");
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : "";
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  return Math.round(
    earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
  );
}

function formatDistance(distanceMeters) {
  const meters = Number(distanceMeters);
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)}km`;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "";
}
</script>
