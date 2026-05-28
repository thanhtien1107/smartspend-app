import { apiFetch, getApiCacheKey } from './api.js';
import { fetchWithCache } from '../utils/cache.js';

export async function fetchBudget() {
  return fetchWithCache(
    getApiCacheKey('budget'),
    async () => {
      const response = await apiFetch('/api/budget');
      return response.ok ? await response.json() : null;
    },
    { ttl: 30 * 1000, staleTtl: 5 * 60 * 1000 }
  );
}

export async function fetchGoals() {
  return fetchWithCache(
    getApiCacheKey('goals'),
    async () => {
      const response = await apiFetch('/api/goals');
      return response.ok ? await response.json() : [];
    },
    { ttl: 30 * 1000, staleTtl: 5 * 60 * 1000 }
  );
}

export async function updateBudget(payload) {
  return apiFetch('/api/budget', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchCategoryBudgets() {
  return fetchWithCache(
    getApiCacheKey('category-budgets'),
    async () => {
      const response = await apiFetch('/api/category-budgets');
      return response.ok ? await response.json() : [];
    },
    { ttl: 30 * 1000, staleTtl: 5 * 60 * 1000 }
  );
}

export async function saveCategoryBudget(payload) {
  return apiFetch('/api/category-budgets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function addGoal(payload) {
  return apiFetch('/api/goals', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateGoal(id, payload) {
  return apiFetch(`/api/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteGoal(id) {
  const response = await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
  return response.ok;
}
