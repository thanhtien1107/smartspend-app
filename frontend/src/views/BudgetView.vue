<template>
  <section id="budget" class="screen active">
    <div class="panel budget-panel">
      <h2>Ngân sách & Mục tiêu</h2>
      <p v-if="message" class="notification-box is-visible">{{ message }}</p>

      <div class="budget-summary">
        <div>
          <span>Budget hiện tại</span>
          <strong id="current-budget">{{ formatMoney(currentBudgetAmount) }}</strong>
        </div>
        <div>
          <span>Chu kỳ</span>
          <strong id="budget-period">{{ currentBudgetPeriod }}</strong>
        </div>
      </div>

      <form id="budget-form" class="budget-form" @submit.prevent="submitBudget">
        <label>
          Số tiền ngân sách
          <input v-model.number="budgetForm.amount" type="number" id="budget-input" placeholder="10000000" required />
        </label>
        <label>
          Hạng mục ngân sách (tùy chọn)
          <select v-model="budgetForm.category" id="budget-category-select">
            <option value="">Tổng chung</option>
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <label>
          Chu kỳ
          <select v-model="budgetForm.period" id="budget-period-select">
            <option>Tháng</option>
            <option>Tuần</option>
          </select>
        </label>
        <button type="submit" class="primary-btn" :disabled="loading">
          {{ loading ? 'Đang lưu...' : 'Cập nhật ngân sách' }}
        </button>
      </form>

      <div class="category-budget-box">
        <h3>Budget theo hạng mục</h3>
        <div id="category-budget-list" class="goal-list">
          <p v-if="!categoryBudgets.length">Chưa có budget theo hạng mục.</p>
          <div v-for="budget in enhancedCategoryBudgets" :key="budget.id || budget.category" class="goal-item">
            <strong>{{ budget.category }}</strong>
            <p>Budget: {{ formatMoney(budget.amount) }}</p>
            <p>Đã chi: {{ formatMoney(budget.spent) }}</p>
            <p>Đã dùng: {{ budget.usage }}%</p>
            <div class="budget-progress compact">
              <div class="budget-progress-track">
                <span :class="`level-${budget.priority}`" :style="{ width: `${Math.min(budget.usage, 100)}%` }"></span>
              </div>
            </div>
            <p>Trạng thái: {{ budget.status || '-' }}</p>
          </div>
        </div>
      </div>

      <div class="goal-box">
        <h3>Saving Goal</h3>
        <form id="goal-form" @submit.prevent="submitGoal">
          <label>
            Tên mục tiêu
            <input v-model.trim="goalForm.name" type="text" id="goal-name" placeholder="Ví dụ: Mua laptop" required />
          </label>
          <label>
            Mục tiêu (VND)
            <input v-model.number="goalForm.target" type="number" id="goal-target" min="1" placeholder="5000000" required />
          </label>
          <button type="submit" class="primary-btn" :disabled="loading">
            {{ editingGoalId ? 'Lưu thay đổi' : 'Thêm mục tiêu' }}
          </button>
          <button v-if="editingGoalId" type="button" class="secondary-btn" :disabled="loading" @click="cancelEditGoal">
            Hủy sửa
          </button>
        </form>

        <div id="goal-list" class="goal-list">
          <p v-if="!enhancedGoals.length">Chưa có goal nào.</p>
          <div v-for="goal in enhancedGoals" :key="goal.id" class="goal-item">
            <strong>{{ goal.name }}</strong>
            <p>Target: {{ formatMoney(goal.target) }}</p>
            <div class="budget-progress compact goal-progress" :aria-label="`Tiến độ ${goal.name}`">
              <div class="budget-progress-meta">
                <span>Đã tiết kiệm: {{ formatMoney(goal.savedAmount) }}</span>
                <strong>{{ goal.progress }}%</strong>
              </div>
              <div class="budget-progress-track">
                <span :class="goal.progress >= 100 ? 'level-safe' : 'level-medium'" :style="{ width: `${goal.progressWidth}%` }"></span>
              </div>
            </div>
            <p>{{ goal.remaining > 0 ? `Còn thiếu: ${formatMoney(goal.remaining)}` : 'Đã hoàn thành mục tiêu.' }}</p>
            <div class="goal-actions">
              <button type="button" class="btn-action" :disabled="loading" @click="startEditGoal(goal)">Sửa</button>
              <button type="button" class="btn-delete" :disabled="loading" @click="removeGoal(goal.id)">Xóa</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../stores/useAppStore';
import { getCategoryBudgetUsage } from '../utils/financialAnalysis';

const appStore = useAppStore();
const { user, expenses, budgets, categoryBudgets, goals, categories } = storeToRefs(appStore);
const loading = ref(false);
const message = ref('');
const editingGoalId = ref('');

const budgetForm = reactive({
  amount: null,
  category: '',
  period: 'Tháng'
});

const goalForm = reactive({
  name: '',
  target: null
});

const currentBudget = computed(() => budgets.value[0] || null);
const currentBudgetAmount = computed(() => Number(currentBudget.value?.amount || 0));
const currentBudgetPeriod = computed(() => currentBudget.value?.period || '-');
const enhancedCategoryBudgets = computed(() => getCategoryBudgetUsage(expenses.value, categoryBudgets.value));
const enhancedGoals = computed(() => {
  const savedAmount = Math.max(Number(user.value?.wallet || 0), 0);

  return goals.value.map((goal) => {
    const target = Math.max(Number(goal.target || 0), 0);
    const rawProgress = target > 0 ? (savedAmount / target) * 100 : 0;
    const progress = Math.min(Math.round(rawProgress), 100);

    return {
      ...goal,
      target,
      savedAmount,
      progress,
      progressWidth: Math.min(rawProgress, 100),
      remaining: Math.max(target - savedAmount, 0)
    };
  });
});

onMounted(async () => {
  await Promise.all([
    appStore.fetchExpenses(),
    appStore.fetchBudgets(),
    appStore.fetchCategoryBudgets(),
    appStore.fetchGoals(),
    appStore.fetchCategories()
  ]);
  budgetForm.amount = currentBudgetAmount.value || null;
  budgetForm.period = currentBudgetPeriod.value === '-' ? 'Tháng' : currentBudgetPeriod.value;
});

async function submitBudget() {
  loading.value = true;
  message.value = '';
  try {
    if (budgetForm.category) {
      await appStore.saveCategoryBudget({ ...budgetForm });
    } else {
      await appStore.updateBudget({ amount: budgetForm.amount, period: budgetForm.period });
    }
    message.value = 'Cập nhật ngân sách thành công.';
  } catch (error) {
    console.error('Save budget failed', error);
    message.value = error?.message || error?.error || 'Cập nhật ngân sách không thành công.';
  } finally {
    loading.value = false;
  }
}

async function submitGoal() {
  loading.value = true;
  message.value = '';
  try {
    const payload = { name: goalForm.name, target: Number(goalForm.target || 0) };
    const validationMessage = validateGoal(payload);
    if (validationMessage) {
      message.value = validationMessage;
      return;
    }

    if (editingGoalId.value) {
      await appStore.updateGoal(editingGoalId.value, payload);
      message.value = 'Cập nhật mục tiêu thành công.';
    } else {
      await appStore.addGoal(payload);
      message.value = 'Thêm mục tiêu thành công.';
    }
    resetGoalForm();
  } catch (error) {
    console.error('Add goal failed', error);
    message.value = error?.message || error?.error || 'Không thể lưu mục tiêu.';
  } finally {
    loading.value = false;
  }
}

function startEditGoal(goal) {
  editingGoalId.value = goal.id;
  goalForm.name = goal.name || '';
  goalForm.target = Number(goal.target || 0);
  message.value = '';
}

function cancelEditGoal() {
  resetGoalForm();
  message.value = '';
}

async function removeGoal(id) {
  if (!window.confirm('Bạn có chắc muốn xóa mục tiêu này?')) return;

  loading.value = true;
  message.value = '';
  try {
    await appStore.deleteGoal(id);
    if (editingGoalId.value === id) resetGoalForm();
    message.value = 'Xóa mục tiêu thành công.';
  } catch (error) {
    console.error('Delete goal failed', error);
    message.value = error?.message || error?.error || 'Không thể xóa mục tiêu.';
  } finally {
    loading.value = false;
  }
}

function resetGoalForm() {
  editingGoalId.value = '';
  goalForm.name = '';
  goalForm.target = null;
}

function validateGoal(goal) {
  if (!goal.name?.trim()) return 'Tên mục tiêu không được để trống.';
  if (!Number.isFinite(goal.target) || goal.target <= 0) return 'Số tiền mục tiêu phải lớn hơn 0.';
  return '';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}
</script>
