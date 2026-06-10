<template>
  <div id="login-container" class="login-shell active" :class="{ 'register-mode': isRegister }">
    <section class="login-art">
      <div class="brand-row">
        <div class="brand-logo-box"><img src="/assets/logo/app-logo.svg" alt="SmartSpending" /></div>
        <span>SmartSpending</span>
      </div>
      <div class="login-art-main">
        <div class="hero-copy">
          <span class="hero-badge">QUẢN LÝ TÀI CHÍNH CÁ NHÂN</span>
          <h1>Chi tiêu thông minh.<br><em>Tương lai vững vàng.</em></h1>
          <p>Theo dõi dòng tiền, kiểm soát ngân sách và hoàn thành mục tiêu tiết kiệm trong một ứng dụng duy nhất.</p>
          <div class="feature-list">
            <div><b>✓</b><span>Theo dõi chi tiêu theo danh mục</span></div>
            <div><b>✓</b><span>Báo cáo và phân tích trực quan</span></div>
            <div><b>✓</b><span>Lập mục tiêu tiết kiệm rõ ràng</span></div>
          </div>
        </div>

<<<<<<< HEAD
        <div class="auth-dashboard-preview" aria-hidden="true">
          <div class="preview-topbar">
            <div>
              <span>TỔNG QUAN THÁNG NÀY</span>
              <strong>Tài chính của bạn</strong>
            </div>
            <div class="preview-avatar">S</div>
          </div>
          <div class="preview-balance">
            <span>Số dư khả dụng</span>
            <strong>8.450.000đ</strong>
            <small>↑ 12% so với tháng trước</small>
          </div>
          <div class="preview-stat-grid">
            <div><span>Chi tiêu</span><strong>3.250.000đ</strong></div>
            <div><span>Ngân sách</span><strong>6.000.000đ</strong></div>
            <div><span>Tiết kiệm</span><strong>2.750.000đ</strong></div>
          </div>
          <div class="preview-progress-block">
            <div><span>Ngân sách tháng</span><b>54%</b></div>
            <div class="preview-progress"><i></i></div>
          </div>
          <div class="preview-recent">
            <div class="preview-section-title"><strong>Chi tiêu gần đây</strong><span>Xem tất cả</span></div>
            <div class="preview-transaction"><b>🍜</b><div><strong>Ăn uống</strong><span>Hôm nay, 12:30</span></div><em>-65.000đ</em></div>
            <div class="preview-transaction"><b>🚌</b><div><strong>Di chuyển</strong><span>Hôm nay, 08:15</span></div><em>-20.000đ</em></div>
            <div class="preview-transaction"><b>☕</b><div><strong>Cà phê</strong><span>Hôm qua, 19:20</span></div><em>-45.000đ</em></div>
          </div>
        </div>
      </div>
    </section>

    <main class="login-panel auth-phone">
      <button v-if="authView !== 'main'" type="button" id="auth-back" class="auth-back" aria-label="Quay lại" @click="showMainAuth">←</button>

      <div class="auth-tabs" v-if="authView === 'main'">
        <button type="button" :class="{ active: !isRegister }" @click="isRegister = false">Đăng nhập</button>
        <button type="button" :class="{ active: isRegister }" @click="isRegister = true">Đăng ký</button>
      </div>

      <div class="auth-heading">
        <span class="auth-eyebrow">SMARTSPENDING</span>
        <h2 id="auth-title">{{ isRegister ? 'Tạo tài khoản mới' : authTitle }}</h2>
        <p id="auth-subtitle" class="auth-subtitle">{{ authSubtitle }}</p>
      </div>
=======
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
>>>>>>> a135e40b5284221842f47107669608b3db4871bc

      <div id="auth-main" :class="{ hidden: authView !== 'main' }">
        <form id="login-form" class="auth-view" @submit.prevent="handleSubmit">
          <template v-if="!isRegister">
            <label class="field-label">Email</label>
            <label class="input-wrap login-only">
              <span class="input-icon">✉</span>
              <input v-model.trim="loginForm.username" type="text" inputmode="email" placeholder="ban@example.com" :disabled="loginLocked || loading" required />
            </label>
            <div class="password-label-row"><label class="field-label">Mật khẩu</label><button type="button" class="text-link auth-forgot-link login-only" id="forgot-password" @click="authView = 'forgot'">Quên mật khẩu?</button></div>
            <label class="input-wrap login-only password-field">
              <span class="input-icon">⌕</span>
              <input v-model.trim="loginForm.password" :type="showLoginPassword ? 'text' : 'password'" placeholder="Nhập mật khẩu" :disabled="loginLocked || loading" required />
              <button type="button" class="password-toggle" :aria-label="showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" :disabled="loginLocked || loading" @click="showLoginPassword = !showLoginPassword">{{ showLoginPassword ? '◉' : '◎' }}</button>
            </label>
          </template>

          <div id="register-extra" class="register-extra" :class="{ hidden: !isRegister }">
            <div class="name-field"><label class="field-label" for="register-full-name">Họ tên</label><label class="input-wrap"><span class="input-icon">♙</span><input id="register-full-name" v-model.trim="registerForm.fullName" type="text" name="fullName" autocomplete="name" placeholder="Nguyễn Văn A" :required="isRegister" /></label></div>
            <div><label class="field-label">Ngày sinh</label><label class="input-wrap"><span class="input-icon">□</span><input v-model="registerForm.birthday" type="date" /></label></div>
            <div class="full-field"><label class="field-label">Email</label><label class="input-wrap"><span class="input-icon">✉</span><input v-model.trim="registerForm.email" type="email" placeholder="ban@example.com" :required="isRegister" /></label></div>
            <div class="full-field"><label class="field-label">Giới tính</label><div class="gender-select" role="group" aria-label="Giới tính"><label class="gender-card" :class="{ selected: registerForm.gender === 'Nam' }"><input v-model="registerForm.gender" type="radio" name="register-gender" value="Nam" /><span>Nam</span><img src="/assets/images/male.png" alt="Nam" /></label><label class="gender-card" :class="{ selected: registerForm.gender === 'Nữ' }"><input v-model="registerForm.gender" type="radio" name="register-gender" value="Nữ" /><span>Nữ</span><img src="/assets/images/female.png" alt="Nữ" /></label></div></div>
            <div class="full-field"><label class="field-label">Mật khẩu</label><label class="input-wrap password-field"><span class="input-icon">⌕</span><input v-model.trim="registerForm.password" :type="showRegisterPassword ? 'text' : 'password'" placeholder="Tối thiểu 8 ký tự" :required="isRegister" /><button type="button" class="password-toggle" @click="showRegisterPassword = !showRegisterPassword">{{ showRegisterPassword ? '◉' : '◎' }}</button></label></div>
            <div class="full-field"><label class="field-label">Xác nhận mật khẩu</label><label class="input-wrap password-field"><span class="input-icon">⌕</span><input v-model.trim="registerForm.confirmPassword" :type="showRegisterConfirm ? 'text' : 'password'" placeholder="Nhập lại mật khẩu" :required="isRegister" /><button type="button" class="password-toggle" @click="showRegisterConfirm = !showRegisterConfirm">{{ showRegisterConfirm ? '◉' : '◎' }}</button></label></div>
          </div>

          <button type="submit" class="primary-btn" id="auth-submit" :disabled="loading || (!isRegister && loginLocked)">{{ !isRegister && loginLocked ? `Chờ ${loginCooldownRemaining}s` : loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký miễn phí' : 'Đăng nhập' }}</button>
        </form>

        <div v-if="!isRegister" id="social-login-row" class="social-login">
          <div class="auth-divider"><span>Hoặc tiếp tục với</span></div>
          <div class="social-buttons">
            <div ref="googleButtonSlot" class="google-signin-button"></div>
            <button v-if="!googleReady" type="button" class="social-btn google-btn" :disabled="loading || loginLocked" @click="handleSocialClick('Google')"><strong>G</strong> Google</button>
            <button type="button" class="social-btn facebook-btn" :disabled="loginLocked || loading" @click="handleSocialClick('Facebook')"><strong>f</strong> Facebook</button>
          </div>
        </div>

        <p v-if="message" class="login-hint status-message" :class="{ 'login-error': messageType === 'error' }">{{ message }}</p>
        <p class="login-hint" id="login-hint">{{ isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?' }} <button type="button" id="toggle-register" @click="toggleRegister">{{ isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay' }}</button></p>
      </div>

<<<<<<< HEAD

      <div id="verify-panel" :class="{ hidden: authView !== 'verify' }">
        <form class="auth-view verification-view" @submit.prevent="handleVerifyEmail">
          <label class="field-label">Mã OTP</label>
          <label class="input-wrap otp-wrap"><span class="input-icon">✉</span><input v-model.trim="verificationCode" type="text" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="Nhập 6 chữ số" required /></label>
          <p v-if="devVerificationCode" class="dev-otp-note">Chế độ demo: mã OTP là <strong>{{ devVerificationCode }}</strong></p>
          <button type="submit" class="primary-btn" :disabled="loading">{{ loading ? 'Đang xác minh...' : 'Xác minh email' }}</button>
          <button type="button" class="resend-otp-btn" :disabled="loading" @click="handleResendOtp">Gửi lại mã OTP</button>
        </form>
      </div>

      <div id="reset-panel" :class="{ hidden: authView !== 'forgot' }">
        <form id="reset-form" class="auth-view" @submit.prevent="handleForgotPassword">
          <label class="field-label">Email</label><label class="input-wrap"><span class="input-icon">✉</span><input v-model.trim="forgotEmail" type="email" placeholder="ban@example.com" required /></label>
          <div class="reset-channel-row"><label><input v-model="resetChannel" type="radio" name="reset-channel" value="gmail" /> Gmail</label><label><input v-model="resetChannel" type="radio" name="reset-channel" value="facebook" /> Facebook</label></div>
          <button type="submit" class="primary-btn">Gửi mã xác minh</button>
        </form>
      </div>
    </main>
=======
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
>>>>>>> a135e40b5284221842f47107669608b3db4871bc
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
<<<<<<< HEAD
import { fetchOAuthConfig, login, loginWithGoogleCredential, register, resendEmailOtp, startFacebookLogin, verifyEmailOtp } from '../services/auth.js';
=======
import { fetchOAuthConfig, login, loginWithGoogleCredential, register, startFacebookLogin } from '../services/auth.js';
>>>>>>> a135e40b5284221842f47107669608b3db4871bc
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
<<<<<<< HEAD
const facebookAppId = ref('');
const oauthConfigLoaded = ref(false);
const loginCooldownRemaining = ref(0);
const verificationEmail = ref('');
const verificationCode = ref('');
const devVerificationCode = ref('');
=======
const loginCooldownRemaining = ref(0);
>>>>>>> a135e40b5284221842f47107669608b3db4871bc

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

<<<<<<< HEAD
const authTitle = computed(() => authView.value === 'verify' ? 'Xác minh email' : (authView.value === 'forgot' ? 'Quên Mật Khẩu?' : 'Chào mừng trở lại!'));
=======
const authTitle = computed(() => (authView.value === 'forgot' ? 'Quên Mật Khẩu?' : 'Chào mừng trở lại!'));
>>>>>>> a135e40b5284221842f47107669608b3db4871bc
const authSubtitle = computed(() => {
  if (authView.value === 'verify') return `Nhập mã OTP 6 số đã gửi đến ${verificationEmail.value}`;
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
      if (result.data?.requiresVerification) {
        verificationEmail.value = result.data.email || registerForm.email;
        devVerificationCode.value = result.data.devCode || '';
        verificationCode.value = '';
        authView.value = 'verify';
        setMessage(result.data.message || 'Vui lòng nhập mã OTP để xác minh email.', 'info');
        return;
      }

      if (result.data?.user) {
        appStore.setAuth(result.data.user);
        router.push('/');
      }
      return;
    }

    const result = await login(loginForm.username, loginForm.password);
    if (!result.ok) {
      if (result.data?.requiresVerification) {
        verificationEmail.value = result.data.email || loginForm.username;
        verificationCode.value = '';
        devVerificationCode.value = '';
        authView.value = 'verify';
        setMessage(result.data.error, 'error');
        return;
      }
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

<<<<<<< HEAD
async function handleVerifyEmail() {
  loading.value = true;
  setMessage('', 'info');
  try {
    const result = await verifyEmailOtp(verificationEmail.value, verificationCode.value);
    if (!result.ok) {
      setMessage(result.data?.error || 'Xác minh email thất bại.', 'error');
      return;
    }
    appStore.setAuth(result.data.user);
    setMessage('Xác minh email thành công.', 'info');
    router.push('/');
  } catch (error) {
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleResendOtp() {
  loading.value = true;
  setMessage('', 'info');
  try {
    const result = await resendEmailOtp(verificationEmail.value);
    if (!result.ok) {
      setMessage(result.data?.error || 'Không thể gửi lại mã OTP.', 'error');
      return;
    }
    devVerificationCode.value = result.data?.devCode || '';
    setMessage(result.data?.message || 'Đã gửi lại mã OTP.', 'info');
  } catch (error) {
    setMessage('Không thể kết nối tới server.', 'error');
  } finally {
    loading.value = false;
  }
}

=======
>>>>>>> a135e40b5284221842f47107669608b3db4871bc
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
      setMessage('Đăng nhập Google chưa được cấu hình. Hãy thêm GOOGLE_CLIENT_ID vào file .env và khai báo http://localhost:5173 trong Authorized JavaScript origins.', 'error');
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
    await ensureOAuthConfig();
    if (!facebookAppId.value) {
      setMessage('Đăng nhập Facebook chưa được cấu hình. Hãy thêm FACEBOOK_APP_ID và FACEBOOK_APP_SECRET vào file .env.', 'error');
      return;
    }
    setMessage('Đang chuyển sang Facebook...', 'info');
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
    setMessage('Đăng nhập Facebook thành công.', 'info');
    router.replace('/');
    return true;
  } catch (error) {
    console.error('Facebook callback parse error', error);
    setMessage('Không thể đọc dữ liệu đăng nhập Facebook.', 'error');
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

async function ensureOAuthConfig() {
  if (oauthConfigLoaded.value) return;
  const config = await fetchOAuthConfig();
  googleClientId.value = config.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  facebookAppId.value = config.facebookAppId || import.meta.env.VITE_FACEBOOK_APP_ID || '';
  oauthConfigLoaded.value = true;
}

async function setupGoogleIdentity() {
  await ensureOAuthConfig();

  if (!googleClientId.value) {
    googleReady.value = false;
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
