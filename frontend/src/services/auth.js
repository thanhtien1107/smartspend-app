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

/**
 * Request a password recovery OTP to be sent to the user's email.
 * @param {string} username - The email/username of the account.
 * @param {string} channel  - 'gmail' (default) or 'facebook'.
 * @returns {Promise<{ok: boolean, status: number, data: object}>}
 *   data.success  — true if OTP was generated.
 *   data.message  — human-readable status message.
 *   data.devCode  — OTP code (only present in dev/non-production mode).
 */
export async function requestPasswordRecovery(username, channel = 'gmail') {
  const response = await apiFetch('/api/password-recovery/request', {
    method: 'POST',
    body: JSON.stringify({ username, channel })
  });
  const data = await readJson(response);
  if (!response.ok) console.error('Password recovery request failed', response.status, data);
  return { ok: response.ok, status: response.status, data };
}

/**
 * Verify the OTP code entered by the user.
 * @param {string} username - The email/username of the account.
 * @param {string} code     - The 6-digit OTP code.
 * @returns {Promise<{ok: boolean, status: number, data: object}>}
 *   data.success — true if code matches.
 *   data.message — human-readable result.
 */
export async function verifyRecoveryCode(username, code) {
  const response = await apiFetch('/api/password-recovery/verify', {
    method: 'POST',
    body: JSON.stringify({ username, code })
  });
  const data = await readJson(response);
  if (!response.ok) console.error('Recovery code verify failed', response.status, data);
  return { ok: response.ok, status: response.status, data };
}

/**
 * Reset the user's password after successful OTP verification.
 * @param {string} username    - The email/username of the account.
 * @param {string} newPassword - The new password to set.
 * @returns {Promise<{ok: boolean, status: number, data: object}>}
 *   data.success — true if password was reset.
 *   data.message — human-readable result.
 */
export async function resetPassword(username, newPassword) {
  const response = await apiFetch('/api/password-recovery/reset', {
    method: 'POST',
    body: JSON.stringify({ username, newPassword })
  });
  const data = await readJson(response);
  if (!response.ok) console.error('Password reset failed', response.status, data);
  return { ok: response.ok, status: response.status, data };
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
