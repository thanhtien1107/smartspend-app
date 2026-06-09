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

export async function fetchFinancialHealth(
  period = 'monthly',
  locale = 'vi',
  options = {}
) {
  const normalizedLocale = locale === 'en' ? 'en' : 'vi';
  return fetchWithCache(
    getApiCacheKey('financial-health-v2', { period, locale: normalizedLocale }),
    async () => {
      const query = new URLSearchParams({
        period,
        locale: normalizedLocale,
        language: normalizedLocale
      });
      const response = await apiFetch(`/api/financial-health?${query.toString()}`);
      if (!response.ok) return null;
      const report = await response.json();
      if (report?.locale !== normalizedLocale) {
        throw new Error(`Financial report locale mismatch: expected ${normalizedLocale}`);
      }
      return report;
    },
    {
      ttl: 30 * 1000,
      staleTtl: 5 * 60 * 1000,
      forceRefresh: Boolean(options.forceRefresh)
    }
  );
}

export async function askAI(message) {
  const response = await apiFetch('/api/ai-suggestions', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  return response.ok ? await response.json() : { reply: 'Không thể kết nối với AI.' };
}
