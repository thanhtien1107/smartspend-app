import { API_BASE, apiFetch, clearApiCache } from './api.js';

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
  return { ok: response.ok, status: response.status, data };
}

export async function register(payload) {
  const response = await apiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  if (!response.ok) console.error('Register failed', response.status, data);
  return { ok: response.ok, status: response.status, data };
}


export async function verifyEmailOtp(email, code) {
  const response = await apiFetch('/api/email-verification/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  return { ok: response.ok, status: response.status, data };
}

export async function resendEmailOtp(email) {
  const response = await apiFetch('/api/email-verification/resend', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  const data = await readJson(response);
  return { ok: response.ok, status: response.status, data };
}

export async function socialLogin(payload) {
  const response = await apiFetch('/api/social-login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  if (!response.ok) console.error('Social login failed', response.status, data);
  return { ok: response.ok, status: response.status, data };
}

export async function fetchOAuthConfig() {
  const response = await apiFetch('/api/oauth/config');
  return response.ok ? await response.json() : { googleClientId: '', facebookAppId: '' };
}

export async function loginWithGoogleCredential(credential) {
  const response = await apiFetch('/api/social-login/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
  const data = await readJson(response);
  if (response.ok && data.token) localStorage.setItem('authToken', data.token);
  if (!response.ok) console.error('Google login failed', response.status, data);
  return { ok: response.ok, status: response.status, data };
}

export function startFacebookLogin() {
  window.location.href = `${API_BASE}/api/auth/facebook`;
}

export async function logout() {
  await apiFetch('/api/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
  clearApiCache();
}

export async function checkSession() {
  const response = await apiFetch('/api/session');
  const data = await readJson(response);
  if (!response.ok) console.error('Session check failed', response.status, data);
  return response.ok ? data : { authenticated: false };
}
