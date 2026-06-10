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
        @click="showMainAuth"
      >
        ←
      </button>

      <h2 id="auth-title">{{ isRegister ? 'Chào người dùng mới!' : authTitle }}</h2>
      <p id="auth-subtitle" class="auth-subtitle">{{ authSubtitle }}</p>

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

        <div v-if="!isRegister" id="social-login-row" class="social-login">
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

      <div id="reset-panel" :class="{ hidden: authView !== 'forgot' }">
        <form id="reset-form" class="auth-view" @submit.prevent="handleForgotPassword">
          <label>
            <input v-model.trim="forgotEmail" type="email" placeholder="Email" required />
          </label>
          <div class="reset-channel-row">
            <label><input v-model="resetChannel" type="radio" name="reset-channel" value="gmail" /> Gmail</label>
            <label><input v-model="resetChannel" type="radio" name="reset-channel" value="facebook" /> Facebook</label>
          </div>
          <button type="submit" class="primary-btn">Gửi</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchOAuthConfig, login, loginWithGoogleCredential, register, startFacebookLogin } from '../services/auth.js';
import { useAppStore } from '../stores/useAppStore';

const appStore = useAppStore();
const router = useRouter();
const route = useRoute();

const isRegister = ref(false);
const authView = ref('main');
const loading = ref(false);
const message = ref('');
const messageType = ref('info');
const forgotEmail = ref('');
const resetChannel = ref('gmail');
const showLoginPassword = ref(false);
const showRegisterPassword = ref(false);
const showRegisterConfirm = ref(false);
const googleButtonSlot = ref(null);
const googleReady = ref(false);
const googleClientId = ref('');
const loginCooldownRemaining = ref(0);

let googleInitPromise = null;
let loginCooldownTimer = null;

const loginForm = reactive({
  username: '',
  password: ''
});

const registerForm = reactive({
  fullName: '',
  email: '',
  gender: 'Nam',
  birthday: '2022-12-04',
  password: '',
  confirmPassword: ''
});

const authTitle = computed(() => (authView.value === 'forgot' ? 'Quên Mật Khẩu?' : 'Chào mừng trở lại!'));
const authSubtitle = computed(() => {
  if (isRegister.value) return 'Chào mừng bạn đến với ứng dụng';
  if (authView.value === 'forgot') return 'Vui lòng nhập email để nhận mã xác minh';
  return 'Chào mừng trở lại bạn đã bị bỏ lỡ!';
});
const loginLocked = computed(() => loginCooldownRemaining.value > 0);

onMounted(() => {
  if (consumeFacebookCallback()) return;
  initializeGoogleLogin().catch((error) => {
    console.error('Google Identity initialization error', error);
  });
});

onBeforeUnmount(() => {
  clearLoginCooldownTimer();
});

watch([isRegister, authView], () => {
  initializeGoogleLogin().catch((error) => {
    console.error('Google Identity initialization error', error);
  });
});

function toggleRegister() {
  isRegister.value = !isRegister.value;
  authView.value = 'main';
  setMessage('', 'info');
}

function showMainAuth() {
  authView.value = 'main';
  setMessage('', 'info');
}

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
        wallet: 0
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

function handleForgotPassword() {
  console.log('Forgot password requested', {
    email: forgotEmail.value,
    channel: resetChannel.value
  });
  setMessage('Luồng quên mật khẩu sẽ được migrate ở bước tiếp theo.', 'info');
  authView.value = 'main';
}

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
    startFacebookLogin();
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

async function initializeGoogleLogin() {
  if (isRegister.value || authView.value !== 'main') return;
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
    const result = await loginWithGoogleCredential(credentialResponse.credential);
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
