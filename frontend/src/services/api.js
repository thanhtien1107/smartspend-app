import { clearCacheByPrefix, createCacheKey } from '../utils/cache';

export const API_BASE = 'http://localhost:4000';
const API_CACHE_PREFIX = 'api';

function hashScope(value = '') {
  let hash = 0;
  const text = String(value || 'guest');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function getApiCacheKey(name, params = {}) {
  const scope = hashScope(localStorage.getItem('authToken') || 'guest');
  return createCacheKey(API_CACHE_PREFIX, scope, name, params);
}

export function clearApiCache() {
  clearCacheByPrefix(`${API_CACHE_PREFIX}:`);
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('authToken');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const method = String(options.method || 'GET').toUpperCase();
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const opts = {
    credentials: 'include',
    ...options,
    headers
  };
  const response = await fetch(url, opts);
  if (response.ok && method !== 'GET') {
    clearApiCache();
  }
  return response;
}
