const API_BASE = window.location.host.includes('4000') ? '' : 'http://localhost:4000';

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const opts = {
    credentials: 'include',
    ...options,
    headers
  };
  return fetch(url, opts);
}
