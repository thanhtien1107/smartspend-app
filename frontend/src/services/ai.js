import { apiFetch, getApiCacheKey } from './api.js';
import { fetchWithCache } from '../utils/cache.js';

export async function fetchInsights() {
  return fetchWithCache(
    getApiCacheKey('insights'),
    async () => {
      const response = await apiFetch('/api/insights');
      return response.ok ? await response.json() : null;
    },
    { ttl: 30 * 1000, staleTtl: 5 * 60 * 1000 }
  );
}

export async function askAI(message) {
  const response = await apiFetch('/api/ai-suggestions', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  return response.ok ? await response.json() : { reply: 'Không thể kết nối với AI.' };
}
