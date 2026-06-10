import { apiFetch, getApiCacheKey } from './api.js';
import { fetchWithCache } from '../utils/cache.js';

export async function fetchExpenses() {
  return fetchWithCache(
    getApiCacheKey('expenses'),
    async () => {
      const response = await apiFetch('/api/expenses');
      return response.ok ? await response.json() : [];
    },
    { ttl: 30 * 1000, staleTtl: 5 * 60 * 1000 }
  );
}

export async function postExpense(payload) {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  return await apiFetch('/api/expenses', {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload)
  });
}

export async function putExpense(id, payload) {
  return await apiFetch(`/api/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteExpense(id) {
  const response = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
  return response.ok;
}
