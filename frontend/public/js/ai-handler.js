import { apiFetch } from './api.js';

export async function askAI(message) {
  const response = await apiFetch('/api/ai-suggestions', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  return response.ok ? await response.json() : { reply: 'Không thể kết nối với AI.' };
}

export async function chatAI(message) {
  const response = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  return response.ok ? await response.json() : { reply: 'Lỗi AI Chat.' };
}
