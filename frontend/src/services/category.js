import { apiFetch, getApiCacheKey } from './api.js';
import { fetchWithCache } from '../utils/cache.js';

export async function fetchCategories() {
  return fetchWithCache(
    getApiCacheKey('categories'),
    async () => {
      const response = await apiFetch('/api/categories');
      return response.ok ? await response.json() : [];
    },
    { ttl: 60 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
  );
}
