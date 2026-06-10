import { apiFetch } from './api.js';

export async function applyDebtCarryoverDecision(payload) {
  const response = await apiFetch('/api/debt-carryover/decision', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw data;
  return data;
}
