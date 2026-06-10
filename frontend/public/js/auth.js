import { apiFetch } from './api.js';

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return { error: 'Invalid server response' };
  }
}

export async function login(username, password) {
  const response = await apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  if (!response.ok) console.error('Login failed', response.status, data);
  return { ok: response.ok, data };
}

export async function register(payload) {
  const response = await apiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  if (!response.ok) console.error('Register failed', response.status, data);
  return { ok: response.ok, data };
}

export async function socialLogin(payload) {
  const response = await apiFetch('/api/social-login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  if (!response.ok) console.error('Social login failed', response.status, data);
  return { ok: response.ok, data };
}

export async function logout() {
  await apiFetch('/api/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
}

export async function checkSession() {
  const response = await apiFetch('/api/session');
  const data = await readJson(response);
  if (!response.ok) console.error('Session check failed', response.status, data);
  return response.ok ? data : { authenticated: false };
}
