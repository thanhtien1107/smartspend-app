<template>
  <div id="login-container" class="login-shell active">
    <div class="login-art">
      <img src="/assets/logo/app-logo.svg" alt="SmartSpending" class="login-logo" />
      <h1>SmartSpending</h1>
      <p>Chi tiêu thông minh, tương lai vững vàng.</p>
      <img src="/assets/logo/app-interface.svg" alt="Giao diện mở app SmartSpending" class="login-splash-art" />
    </div>

    <div class="login-panel auth-phone">
      <button
        v-if="authView !== 'main'"
        type="button"
        id="auth-back"
        class="auth-back"
        aria-label="Quay lại"
        @click="handleBack"
      >
        ←
      </button>

      <h2 id="auth-title">{{ authTitle }}</h2>
      <p id="auth-subtitle" class="auth-subtitle">{{ authSubtitle }}</p>

      <!-- ==================== MAIN (Login/Register) ==================== -->
      <div id="auth-main" :class="{ hidden: authView !== 'main' }">
        <form id="login-form" class="auth-view" @submit.prevent="handleSubmit">
          <template v-if="!isRegister">
            <label class="login-only">
              <input
                v-model.trim="loginForm.username"
                type="text"
                inputmode="email"
                placeholder="Email"
                :disabled="loginLocked || loading"
                required
              />
            </label>
            <label class="login-only password-field">
              <input
                v-model.trim="loginForm.password"
                :type="showLoginPassword ? 'text' : 'password'"
                placeholder="Mật Khẩu"
                :disabled="loginLocked || loading"
                required
              />
              <button
                type="button"
                class="password-toggle"
                aria-label="Hiện mật khẩu"
                :disabled="loginLocked || loading"
                @click="showLoginPassword = !showLoginPassword"
              >
                ⌧
              </button>
            </label>
          </template>

          <div id="register-extra" class="register-extra" :class="{ hidden: !isRegister }">
            <label>
              <input v-model.trim="registerForm.fullName" type="text" placeholder="Họ Tên" :required="isRegister" />
            </label>
            <label>
              <input v-model.trim="registerForm.email" type="email" placeholder="Email" :required="isRegister" />
            </label>
            <div class="gender-select" role="group" aria-label="Giới tính">
              <label class="gender-card" :class="{ selected: registerForm.gender === 'Nam', active: registerForm.gender === 'Nam' }">
                <input v-model="registerForm.gender" type="radio" name="register-gender" value="Nam" />
                <span>Nam</span>
                <img src="/assets/images/male.png" alt="Nam" />
              </label>
              <label class="gender-card" :class="{ selected: registerForm.gender === 'Nữ', active: registerForm.gender === 'Nữ' }">
                <input v-model="registerForm.gender" type="radio" name="register-gender" value="Nữ" />
                <span>Nữ</span>
                <img src="/assets/images/female.png" alt="Nữ" />
              </label>
            </div>
            <label>
              <input v-model="registerForm.birthday" type="date" />
            </label>
            <label>
              <input
                v-model.trim="registerForm.inviteCode"
                type="text"
                inputmode="text"
                maxlength="12"
                placeholder="Mã mời (không bắt buộc)"
                autocomplete="off"
                @input="normalizeRegisterInviteCode"
              />
            </label>
            <label class="password-field">
              <input
                v-model.trim="registerForm.password"
                :type="showRegisterPassword ? 'text' : 'password'"
                placeholder="Mật Khẩu"
                :required="isRegister"
              />
              <button type="button" class="password-toggle" aria-label="Hiện mật khẩu" @click="showRegisterPassword = !showRegisterPassword">⌧</button>
            </label>
            <label class="password-field">
              <input
                v-model.trim="registerForm.confirmPassword"
                :type="showRegisterConfirm ? 'text' : 'password'"
                placeholder="Xác nhận mật khẩu"
                :required="isRegister"
              />
              <button type="button" class="password-toggle" aria-label="Hiện mật khẩu" @click="showRegisterConfirm = !showRegisterConfirm">⌧</button>
            </label>
          </div>

          <button v-if="!isRegister" type="button" class="text-link auth-forgot-link login-only" id="forgot-password" @click="authView = 'forgot'">
            Quên Mật Khẩu?
          </button>
          <button type="submit" class="primary-btn" id="auth-submit" :disabled="loading || (!isRegister && loginLocked)">
            {{ !isRegister && loginLocked ? `Chờ ${loginCooldownRemaining}s` : loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng Nhập' }}
          </button>
        </form>

        <div id="social-login-row" class="social-login">
          <div class="auth-divider"><span>Hoặc tiếp tục với</span></div>
          <div class="social-buttons">
            <div ref="googleButtonSlot" class="google-signin-button"></div>
            <button
              v-if="!googleReady"
              type="button"
              class="social-btn google-btn"
              :disabled="loading || loginLocked"
              @click="handleSocialClick('Google')"
            >
              G Google
            </button>
            <button type="button" class="social-btn facebook-btn" :disabled="loginLocked || loading" @click="handleSocialClick('Facebook')">f Facebook</button>
          </div>
        </div>

        <p v-if="message" class="login-hint" :class="{ 'login-error': messageType === 'error' }">{{ message }}</p>
        <p class="login-hint" id="login-hint">
          {{ isRegister ? 'Đã có tài khoản?' : 'Không có tài khoản?' }}
          <button type="button" id="toggle-register" @click="toggleRegister">
            {{ isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay' }}
          </button>
        </p>
      </div>

      <!-- ==================== STEP 1: Enter Email ==================== -->
      <div id="forgot-panel" :class="{ hidden: authView !== 'forgot' }">
        <form id="forgot-form" class="auth-view" @submit.prevent="handleForgotRequest">
          <label>
            <input
              v-model.trim="forgotEmail"
              type="email"
              id="forgot-email-input"
              placeholder="Nhập email tài khoản của bạn"
              :disabled="loading"
              required
            />
          </label>

          <!-- Gmail / channel selector -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 0">
            <label
              style="display:flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.93rem;border:1.5px solid;"
              :style="resetChannel === 'gmail' ? 'border-color:#6366f1;color:#6366f1;background:#f0f0ff' : 'border-color:#ddd;color:#555;background:#fff'"
            >
              <input v-model="resetChannel" type="radio" name="reset-channel" value="gmail" style="display:none" />
              ✉️ Gmail
            </label>
            <label
              style="display:flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.93rem;border:1.5px solid;"
              :style="resetChannel === 'facebook' ? 'border-color:#6366f1;color:#6366f1;background:#f0f0ff' : 'border-color:#ddd;color:#555;background:#fff'"
            >
              <input v-model="resetChannel" type="radio" name="reset-channel" value="facebook" style="display:none" />
              📘 Facebook
            </label>
          </div>

          <button type="submit" class="primary-btn" id="forgot-submit-btn" :disabled="loading">
            {{ loading ? 'Đang gửi...' : 'Gửi mã xác minh' }}
          </button>
        </form>
        <p v-if="message" class="login-hint" :class="{ 'login-error': messageType === 'error' }">{{ message }}</p>
      </div>

      <!-- ==================== STEP 2: Enter OTP ==================== -->
      <div id="verify-panel" :class="{ hidden: authView !== 'verify' }">
        <form id="verify-form" class="auth-view" @submit.prevent="handleVerifyOtp">
          <p class="otp-sent-hint">
            Mã xác minh 6 chữ số đã được gửi đến <strong>{{ forgotEmail }}</strong>
          </p>

          <!-- 6 individual OTP digit boxes -->
          <div style="display:flex;gap:8px;justify-content:center;margin:14px 0 10px">
            <input
              v-for="(_, idx) in otpDigits"
              :key="idx"
              :id="`otp-digit-${idx}`"
              v-model="otpDigits[idx]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              :disabled="loading"
              style="width:44px;height:52px;flex:0 0 44px;padding:0;text-align:center;font-size:1.4rem;font-weight:800;border-radius:10px;border:2px solid #d1d5db;outline:none;"
              @input="onOtpInput(idx, $event)"
              @keydown="onOtpKeydown(idx, $event)"
              @paste="onOtpPaste($event)"
            />
          </div>

          <button type="submit" class="primary-btn" id="verify-submit-btn" :disabled="loading || otpValue.length < 6">
            {{ loading ? 'Đang xác minh...' : 'Xác minh mã' }}
          </button>
        </form>

        <!-- Resend OTP -->
        <div class="resend-row">
          <span class="resend-hint">Không nhận được mã?</span>
          <button
            type="button"
            class="text-link"
            id="resend-otp-btn"
            :disabled="resendCooldown > 0 || loading"
            @click="handleResendOtp"
          >
            {{ resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã' }}
          </button>
        </div>

        <p v-if="message" class="login-hint" :class="{ 'login-error': messageType === 'error' }">{{ message }}</p>
      </div>

      <!-- ==================== STEP 3: New Password ==================== -->
      <div id="reset-panel" :class="{ hidden: authView !== 'reset' }">
        <form id="reset-password-form" class="auth-view" @submit.prevent="handleResetPassword">
          <label class="password-field">
            <input
              v-model.trim="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              id="new-password-input"
              placeholder="Mật khẩu mới"
              :disabled="loading"
              required
            />
            <button type="button" class="password-toggle" aria-label="Hiện mật khẩu" @click="showNewPassword = !showNewPassword">⌧</button>
          </label>
          <label class="password-field">
            <input
              v-model.trim="confirmNewPassword"
              :type="showConfirmNewPassword ? 'text' : 'password'"
              id="confirm-new-password-input"
              placeholder="Xác nhận mật khẩu mới"
              :disabled="loading"
              required
            />
            <button type="button" class="password-toggle" aria-label="Hiện mật khẩu" @click="showConfirmNewPassword = !showConfirmNewPassword">⌧</button>
          </label>

          <button type="submit" class="primary-btn" id="reset-submit-btn" :disabled="loading">
            {{ loading ? 'Đang cập nhật...' : 'Đặt mật khẩu mới' }}
          </button>
        </form>
        <p v-if="message" class="login-hint" :class="{ 'login-error': messageType === 'error' }">{{ message }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  fetchOAuthConfig,
  login,
  loginWithGoogleCredential,
  register,
  requestPasswordRecovery,
  resetPassword,
  startFacebookLogin,
  verifyRecoveryCode,
} from '../services/auth.js';
import { useAppStore } from '../stores/useAppStore';

const appStore = useAppStore();
const router = useRouter();
const route = useRoute();

// ── Auth view state ──────────────────────────────────────────────────────────
const isRegister = ref(false);
// authView: 'main' | 'forgot' | 'verify' | 'reset'
const authView = ref('main');
const loading = ref(false);
const message = ref('');
const messageType = ref('info');

// ── Login form ───────────────────────────────────────────────────────────────
const showLoginPassword = ref(false);
const loginCooldownRemaining = ref(0);
let loginCooldownTimer = null;

const loginForm = reactive({
  username: '',
  password: ''
});

// ── Register form ────────────────────────────────────────────────────────────
const showRegisterPassword = ref(false);
const showRegisterConfirm = ref(false);

const registerForm = reactive({
  fullName: '',
  email: '',
  gender: 'Nam',
  birthday: '2022-12-04',
  inviteCode: '',
  password: '',
  confirmPassword: ''
});

// ── Google OAuth ─────────────────────────────────────────────────────────────
const googleButtonSlot = ref(null);
const googleReady = ref(false);
const googleClientId = ref('');
let googleInitPromise = null;

// ── Forgot Password — Step 1 ─────────────────────────────────────────────────
const forgotEmail = ref('');
const resetChannel = ref('gmail');

// ── Forgot Password — Step 2 (OTP) ──────────────────────────────────────────
/** Array of 6 single-digit strings for OTP input boxes */
const otpDigits = ref(['', '', '', '', '', '']);
/** Concatenated OTP value */
const otpValue = computed(() => otpDigits.value.join(''));
/** devCode returned by backend (only in dev mode) */
const devCode = ref('');
/** Resend cooldown timer (seconds) */
const resendCooldown = ref(0);
let resendTimer = null;

// ── Forgot Password — Step 3 (New Password) ──────────────────────────────────
const newPassword = ref('');
const confirmNewPassword = ref('');
const showNewPassword = ref(false);
const showConfirmNewPassword = ref(false);

// ── Computed ─────────────────────────────────────────────────────────────────
const authTitle = computed(() => {
  if (isRegister.value) return 'Chào người dùng mới!';
  if (authView.value === 'forgot') return 'Quên Mật Khẩu?';
  if (authView.value === 'verify') return 'Xác Minh Mã OTP';
  if (authView.value === 'reset') return 'Đặt Mật Khẩu Mới';
  return 'Chào mừng trở lại!';
});

const authSubtitle = computed(() => {
  if (isRegister.value) return 'Chào mừng bạn đến với ứng dụng';
  if (authView.value === 'forgot') return 'Vui lòng nhập email để nhận mã xác minh';
  if (authView.value === 'verify') return 'Kiểm tra hộp thư Gmail và nhập mã 6 chữ số';
  if (authView.value === 'reset') return 'Tạo mật khẩu mới cho tài khoản của bạn';
  return 'Chào mừng trở lại bạn đã bị bỏ lỡ!';
});

const loginLocked = computed(() => loginCooldownRemaining.value > 0);

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  const inviteCode = normalizeInviteCode(route.query.invite);
  if (inviteCode) {
    registerForm.inviteCode = inviteCode;
    isRegister.value = true;
  }
  if (consumeFacebookCallback()) return;
  initializeGoogleLogin().catch((error) => {
    console.error('Google Identity initialization error', error);
  });
});

onBeforeUnmount(() => {
  clearLoginCooldownTimer();
  clearResendTimer();
});

watch([isRegister, authView], () => {
  initializeGoogleLogin().catch((error) => {
    console.error('Google Identity initialization error', error);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────
function handleBack() {
  setMessage('', 'info');
  if (authView.value === 'verify') {
    // Go back to email step
    authView.value = 'forgot';
    clearResendTimer();
    resetOtpDigits();
    devCode.value = '';
  } else if (authView.value === 'reset') {
    // Go back to OTP step
    authView.value = 'verify';
  } else {
    authView.value = 'main';
  }
}

function toggleRegister() {
  isRegister.value = !isRegister.value;
  authView.value = 'main';
  setMessage('', 'info');
}

function normalizeInviteCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

function normalizeRegisterInviteCode(event) {
  registerForm.inviteCode = normalizeInviteCode(event?.target?.value);
}

// ── OTP helpers ───────────────────────────────────────────────────────────────
function resetOtpDigits() {
  otpDigits.value = ['', '', '', '', '', ''];
}

function focusOtpDigit(idx) {
  nextTick(() => {
    const el = document.getElementById(`otp-digit-${idx}`);
    if (el) el.focus();
  });
}

function onOtpInput(idx, event) {
  const val = (event.target.value || '').replace(/\D/g, '').slice(-1);
  otpDigits.value[idx] = val;
  event.target.value = val;
  if (val && idx < 5) {
    focusOtpDigit(idx + 1);
  }
}

function onOtpKeydown(idx, event) {
  if (event.key === 'Backspace' && !otpDigits.value[idx] && idx > 0) {
    focusOtpDigit(idx - 1);
  }
  if (event.key === 'ArrowLeft' && idx > 0) {
    focusOtpDigit(idx - 1);
  }
  if (event.key === 'ArrowRight' && idx < 5) {
    focusOtpDigit(idx + 1);
  }
}

function onOtpPaste(event) {
  event.preventDefault();
  const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
  pasted.split('').forEach((char, i) => {
    if (i < 6) otpDigits.value[i] = char;
  });
  focusOtpDigit(Math.min(pasted.length, 5));
}

// ── Resend cooldown ───────────────────────────────────────────────────────────
function startResendCooldown(seconds = 60) {
  clearResendTimer();
  resendCooldown.value = seconds;
  resendTimer = window.setInterval(() => {
    resendCooldown.value = Math.max(0, resendCooldown.value - 1);
    if (resendCooldown.value <= 0) clearResendTimer();
  }, 1000);
}

function clearResendTimer() {
  if (resendTimer) {
    window.clearInterval(resendTimer);
    resendTimer = null;
  }
  resendCooldown.value = 0;
}

// ── STEP 1: Request OTP ────────────────────────────────────────────────────────
async function handleForgotRequest() {
  setMessage('', 'info');
  loading.value = true;
  try {
    const result = await requestPasswordRecovery(forgotEmail.value, resetChannel.value);
    if (!result.ok) {
      setMessage(result.data?.error || 'Không thể gửi mã xác minh. Vui lòng thử lại.', 'error');
      return;
    }
    // Store devCode if present (non-production / Gmail not configured)
    devCode.value = result.data?.devCode || '';
    // Move to OTP verification step
    resetOtpDigits();
    authView.value = 'verify';
    startResendCooldown(60);
    setMessage('', 'info');
    nextTick(() => focusOtpDigit(0));
  } catch (error) {
    console.error('Forgot request error', error);
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

// ── STEP 2: Verify OTP ────────────────────────────────────────────────────────
async function handleVerifyOtp() {
  setMessage('', 'info');
  if (otpValue.value.length < 6) {
    setMessage('Vui lòng nhập đủ 6 chữ số.', 'error');
    return;
  }
  loading.value = true;
  try {
    const result = await verifyRecoveryCode(forgotEmail.value, otpValue.value);
    if (!result.ok) {
      setMessage(result.data?.error || 'Mã xác minh không đúng hoặc đã hết hạn.', 'error');
      return;
    }
    // OTP verified — move to password reset step
    clearResendTimer();
    authView.value = 'reset';
    newPassword.value = '';
    confirmNewPassword.value = '';
    setMessage('', 'info');
  } catch (error) {
    console.error('OTP verify error', error);
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

// ── STEP 2 (resend): Resend OTP ───────────────────────────────────────────────
async function handleResendOtp() {
  if (resendCooldown.value > 0 || loading.value) return;
  setMessage('', 'info');
  loading.value = true;
  try {
    const result = await requestPasswordRecovery(forgotEmail.value, resetChannel.value);
    if (!result.ok) {
      setMessage(result.data?.error || 'Không thể gửi lại mã. Vui lòng thử lại.', 'error');
      return;
    }
    devCode.value = result.data?.devCode || '';
    resetOtpDigits();
    startResendCooldown(60);
    setMessage('Mã mới đã được gửi!', 'info');
    nextTick(() => focusOtpDigit(0));
  } catch (error) {
    console.error('Resend OTP error', error);
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

// ── STEP 3: Reset Password ────────────────────────────────────────────────────
async function handleResetPassword() {
  setMessage('', 'info');
  if (!newPassword.value) {
    setMessage('Vui lòng nhập mật khẩu mới.', 'error');
    return;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    setMessage('Mật khẩu và xác nhận mật khẩu không khớp.', 'error');
    return;
  }
  if (newPassword.value.length < 6) {
    setMessage('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
    return;
  }
  loading.value = true;
  try {
    const result = await resetPassword(forgotEmail.value, newPassword.value);
    if (!result.ok) {
      setMessage(result.data?.error || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.', 'error');
      return;
    }
    // Success — back to login with success message
    authView.value = 'main';
    setMessage('Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.', 'info');
    // Clear sensitive state
    forgotEmail.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
    devCode.value = '';
    resetOtpDigits();
  } catch (error) {
    console.error('Reset password error', error);
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

// ── Login / Register ──────────────────────────────────────────────────────────
async function handleSubmit() {
  setMessage('', 'info');
  if (!isRegister.value && loginLocked.value) {
    setMessage(`Vui lòng nhập lại sau ${loginCooldownRemaining.value}s`, 'error');
    return;
  }
  loading.value = true;

  try {
    if (isRegister.value) {
      if (registerForm.password !== registerForm.confirmPassword) {
        setMessage('Mật khẩu và xác nhận mật khẩu không khớp.', 'error');
        return;
      }

      const avatar = registerForm.gender === 'Nữ' ? 'assets/images/female.png' : 'assets/images/male.png';
      const result = await register({
        username: registerForm.email,
        email: registerForm.email,
        password: registerForm.password,
        fullName: registerForm.fullName,
        birthday: registerForm.birthday,
        gender: registerForm.gender,
        avatar,
        wallet: 0,
        inviteCode: registerForm.inviteCode
      });

      if (!result.ok) {
        setMessage(result.data?.error || 'Đăng ký thất bại.', 'error');
        console.error('Register failed', result.data);
        return;
      }

      console.log('Register success', result.data);
      if (result.data?.user) {
        appStore.setAuth(result.data.user);
        setMessage('Đăng ký thành công.', 'info');
        router.push('/');
        return;
      }

      const loginResult = await login(registerForm.email, registerForm.password);
      if (!loginResult.ok) {
        setMessage(loginResult.data?.error || 'Đăng ký thành công nhưng tự động đăng nhập thất bại.', 'error');
        console.error('Auto login after register failed', loginResult.data);
        return;
      }

      appStore.setAuth(loginResult.data.user);
      setMessage('Đăng ký và đăng nhập thành công.', 'info');
      router.push('/');
      return;
    }

    const result = await login(loginForm.username, loginForm.password);
    if (!result.ok) {
      if (result.data?.retryAfterSeconds) {
        startLoginCooldown(Number(result.data.retryAfterSeconds));
      } else {
        setMessage('Tài khoản hoặc mật khẩu không đúng', 'error');
      }
      console.error('Login failed', result.data);
      return;
    }

    console.log('Login success', result.data);
    stopLoginCooldown();
    appStore.setAuth(result.data.user);
    setMessage('Đăng nhập thành công.', 'info');
    router.push('/');
  } catch (error) {
    console.error('Auth request error', error);
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

// ── Social Login ──────────────────────────────────────────────────────────────
async function handleSocialClick(provider) {
  if (provider === 'Google') {
    setMessage('', 'info');
    await initializeGoogleLogin();
    if (!googleReady.value || !window.google?.accounts?.id) {
      setMessage('Không thể tải Google Login. Hãy kiểm tra GOOGLE_CLIENT_ID và cấu hình JavaScript origin.', 'error');
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        setMessage('Nếu popup Google không hiện, hãy bấm nút Google chính thức vừa được tải trong form.', 'info');
      }
    });
    return;
  }

  if (provider === 'Facebook') {
    setMessage('Dang chuyen sang Facebook...', 'info');
    startFacebookLogin(normalizeInviteCode(route.query.invite || registerForm.inviteCode));
  }
}

function consumeFacebookCallback() {
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  const userPayload = typeof route.query.user === 'string' ? route.query.user : '';
  const provider = typeof route.query.social === 'string' ? route.query.social : '';
  const callbackError = typeof route.query.error === 'string' ? route.query.error : '';

  if (callbackError) {
    setMessage(callbackError, 'error');
    router.replace('/login');
    return true;
  }

  if (provider !== 'facebook' || !token || !userPayload) {
    return false;
  }

  try {
    const userData = JSON.parse(userPayload);
    localStorage.setItem('authToken', token);
    localStorage.setItem('hasSmartSpendAccount', 'true');
    appStore.setAuth(userData);
    setMessage('Dang nhap Facebook thanh cong.', 'info');
    router.replace('/');
    return true;
  } catch (error) {
    console.error('Facebook callback parse error', error);
    setMessage('Khong the doc du lieu dang nhap Facebook.', 'error');
    router.replace('/login');
    return true;
  }
}

// ── Google Identity ───────────────────────────────────────────────────────────
async function initializeGoogleLogin() {
  if (authView.value !== 'main') return;
  await nextTick();
  if (!googleButtonSlot.value) return;

  if (!googleInitPromise) {
    googleInitPromise = setupGoogleIdentity();
  }

  await googleInitPromise;
  renderGoogleButton();
}

async function setupGoogleIdentity() {
  const config = await fetchOAuthConfig();
  googleClientId.value = config.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  if (!googleClientId.value) {
    googleReady.value = false;
    setMessage('Chưa cấu hình GOOGLE_CLIENT_ID trong .env backend.', 'error');
    return;
  }

  await loadGoogleIdentityScript();
  window.google.accounts.id.initialize({
    client_id: googleClientId.value,
    callback: handleGoogleCredentialResponse,
    cancel_on_tap_outside: true,
    ux_mode: 'popup'
  });
  googleReady.value = true;
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function renderGoogleButton() {
  if (!googleReady.value || !googleButtonSlot.value || googleButtonSlot.value.dataset.rendered === 'true') return;

  googleButtonSlot.value.innerHTML = '';
  window.google.accounts.id.renderButton(googleButtonSlot.value, {
    theme: 'outline',
    size: 'large',
    type: 'standard',
    shape: 'rectangular',
    text: 'continue_with',
    locale: 'vi',
    width: googleButtonSlot.value.clientWidth || 190
  });
  googleButtonSlot.value.dataset.rendered = 'true';
}

async function handleGoogleCredentialResponse(credentialResponse) {
  if (!credentialResponse?.credential) {
    setMessage('Google không trả về credential đăng nhập.', 'error');
    return;
  }

  loading.value = true;
  setMessage('', 'info');
  try {
    const result = await loginWithGoogleCredential(
      credentialResponse.credential,
      normalizeInviteCode(route.query.invite || registerForm.inviteCode)
    );
    if (!result.ok) {
      setMessage(result.data?.error || 'Đăng nhập bằng Google thất bại.', 'error');
      return;
    }

    appStore.setAuth(result.data.user);
    setMessage('Đăng nhập Google thành công.', 'info');
    router.push('/');
  } catch (error) {
    console.error('Google login request error', error);
    setMessage('Không thể đăng nhập bằng Google. Vui lòng thử lại.', 'error');
  } finally {
    loading.value = false;
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function setMessage(text, type = 'info') {
  message.value = text;
  messageType.value = type;
}

function startLoginCooldown(seconds) {
  clearLoginCooldownTimer();
  loginCooldownRemaining.value = Math.max(1, Math.ceil(Number(seconds || 0)));
  setMessage(`Vui lòng nhập lại sau ${loginCooldownRemaining.value}s`, 'error');
  loginCooldownTimer = window.setInterval(() => {
    loginCooldownRemaining.value = Math.max(0, loginCooldownRemaining.value - 1);
    if (loginCooldownRemaining.value <= 0) {
      stopLoginCooldown();
      setMessage('', 'info');
      return;
    }
    setMessage(`Vui lòng nhập lại sau ${loginCooldownRemaining.value}s`, 'error');
  }, 1000);
}

function stopLoginCooldown() {
  clearLoginCooldownTimer();
  loginCooldownRemaining.value = 0;
}

function clearLoginCooldownTimer() {
  if (loginCooldownTimer) {
    window.clearInterval(loginCooldownTimer);
    loginCooldownTimer = null;
  }
}
</script>
