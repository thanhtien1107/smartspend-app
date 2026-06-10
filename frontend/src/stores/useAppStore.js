import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  fetchExpenses as fetchExpensesApi,
  postExpense,
  putExpense,
  deleteExpense as deleteExpenseApi
} from '../services/expense';
import {
  fetchBudget as fetchBudgetApi,
  fetchGoals as fetchGoalsApi,
  updateBudget as updateBudgetApi,
  fetchCategoryBudgets as fetchCategoryBudgetsApi,
  saveCategoryBudget as saveCategoryBudgetApi,
  addGoal as addGoalApi,
  updateGoal as updateGoalApi,
  deleteGoal as deleteGoalApi
} from '../services/budget';
import { fetchCategories as fetchCategoriesApi } from '../services/category';
import { showBudgetNotificationToast } from '../services/toast';

export const useAppStore = defineStore('app', () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const expenses = ref([]);
  const budgets = ref([]);
  const categoryBudgets = ref([]);
  const goals = ref([]);
  const categories = ref([]);

  function setAuth(userData) {
    user.value = userData || null;
    isAuthenticated.value = Boolean(userData);
  }

  async function fetchExpenses() {
    expenses.value = await fetchExpensesApi();
    return expenses.value;
  }

  async function fetchBudgets() {
    const budget = await fetchBudgetApi();
    budgets.value = Array.isArray(budget) ? budget : budget ? [budget] : [];
    return budgets.value;
  }

  async function fetchGoals() {
    goals.value = await fetchGoalsApi();
    return goals.value;
  }

  async function fetchCategoryBudgets() {
    categoryBudgets.value = await fetchCategoryBudgetsApi();
    return categoryBudgets.value;
  }

  async function updateBudget(payload) {
    const response = await updateBudgetApi(payload);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw data;
    budgets.value = [data];
    return data;
  }

  async function saveCategoryBudget(payload) {
    let response = await saveCategoryBudgetApi(payload);
    let data = await response.json().catch(() => ({}));

    if (response.status === 409 && data.issue === 'budget_exists') {
      response = await saveCategoryBudgetApi({ ...payload, force: true });
      data = await response.json().catch(() => ({}));
    }

    if (!response.ok) throw data;
    await fetchCategoryBudgets();
    return data;
  }

  async function addGoal(payload) {
    const response = await addGoalApi(payload);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw data;
    goals.value.unshift(data);
    return data;
  }

  async function updateGoal(id, payload) {
    const response = await updateGoalApi(id, payload);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw data;

    const index = goals.value.findIndex((goal) => goal.id === id);
    if (index >= 0) {
      goals.value.splice(index, 1, data);
    } else {
      goals.value.unshift(data);
    }
    return data;
  }

  async function deleteGoal(id) {
    const ok = await deleteGoalApi(id);
    if (!ok) {
      throw new Error('Không thể xóa mục tiêu tiết kiệm.');
    }

    goals.value = goals.value.filter((goal) => goal.id !== id);
    return true;
  }

  async function fetchCategories() {
    const data = await fetchCategoriesApi();
    categories.value = data.map((category) => (typeof category === 'string' ? category : category.name)).filter(Boolean);
    return categories.value;
  }

  async function addExpense(payload) {
    let response = await postExpense(payload);
    let data = await response.json().catch(() => ({}));

    if (response.status === 409 && ['duplicate', 'unusual'].includes(data.issue)) {
      response = await postExpense(withForce(payload));
      data = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      throw data;
    }

    expenses.value.unshift(data);
    if (data.budgetNotification) {
      showBudgetNotificationToast(data.budgetNotification);
    }
    await refreshFinancialContext();
    return data;
  }

  function withForce(payload) {
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      const retryPayload = new FormData();
      payload.forEach((value, key) => retryPayload.append(key, value));
      retryPayload.set('force', 'true');
      return retryPayload;
    }

    return { ...payload, force: true };
  }

  async function deleteExpense(id) {
    const ok = await deleteExpenseApi(id);
    if (!ok) {
      throw new Error('Không thể xóa chi tiêu.');
    }

    expenses.value = expenses.value.filter((expense) => expense.id !== id);
    await refreshFinancialContext();
    return true;
  }

  async function updateExpense(id, payload) {
    const response = await putExpense(id, payload);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw data;
    }

    const index = expenses.value.findIndex((expense) => expense.id === id);
    if (index >= 0) {
      expenses.value.splice(index, 1, data);
    } else {
      expenses.value.unshift(data);
    }
    await refreshFinancialContext();
    return data;
  }

  async function refreshFinancialContext() {
    await Promise.allSettled([
      fetchBudgets(),
      fetchCategoryBudgets()
    ]);
  }

  return {
    user,
    isAuthenticated,
    expenses,
    budgets,
    categoryBudgets,
    goals,
    categories,
    setAuth,
    fetchExpenses,
    fetchBudgets,
    fetchGoals,
    fetchCategoryBudgets,
    fetchCategories,
    updateBudget,
    saveCategoryBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addExpense,
    updateExpense,
    deleteExpense
  };
});
