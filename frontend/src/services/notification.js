import { apiFetch, getApiCacheKey } from './api.js';
import { fetchWithCache } from '../utils/cache.js';

export async function fetchNotifications() {
  return fetchWithCache(
    getApiCacheKey('notifications'),
    async () => {
      const response = await apiFetch('/api/notifications');
      return response.ok ? await response.json() : [];
    },
    { ttl: 15 * 1000, staleTtl: 60 * 1000 }
  );
}

export async function markNotificationsRead() {
  const response = await apiFetch('/api/notifications/read-all', { method: 'PUT' });
  return response.ok ? await response.json() : { success: false };
}
