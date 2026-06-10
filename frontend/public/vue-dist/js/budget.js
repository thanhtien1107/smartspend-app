import { apiFetch } from './api.js';

export async function getBudget() {
  const response = await apiFetch('/api/budget');
  return response.ok ? await response.json() : { amount: 0, period: 'Tháng' };
}

export async function updateBudget(payload) {
  return apiFetch('/api/budget', {
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
