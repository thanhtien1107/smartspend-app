import { apiFetch } from './api.js';

export async function fetchExpenses() {
  const response = await apiFetch('/api/expenses');
  return response.ok ? await response.json() : [];
}

export async function postExpense(payload) {
  return await apiFetch('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload)
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
