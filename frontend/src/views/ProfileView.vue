<template>
  <section id="profile" class="screen active">
    <div class="panel profile-hero">
      <img
        id="profile-avatar"
        :src="user?.avatar || '/assets/logo/app-logo.svg'"
        alt="Avatar hồ sơ"
      />
      <div>
        <h2 id="profile-display-name">{{ displayName }}</h2>
        <p id="profile-email">{{ user?.email || user?.username || 'Chưa có email' }}</p>
      </div>
    </div>

    <div class="panel profile-panel">
      <div class="profile-section-heading">
        <div>
          <h2>Thông tin tài khoản</h2>
          <p>Cập nhật thông tin cá nhân, Gmail và số điện thoại.</p>
        </div>
        <button
          v-if="!editingProfile"
          type="button"
          class="btn-action"
          @click="startProfileEdit"
        >
          Chỉnh sửa
        </button>
      </div>

      <p
        v-if="profileMessage"
        class="profile-feedback"
        :class="{ error: profileMessageType === 'error' }"
      >
        {{ profileMessage }}
      </p>

      <form id="profile-form" class="profile-form" @submit.prevent="saveProfile">
        <label>
          Họ và tên
          <input
            v-model.trim="profileForm.fullName"
            type="text"
            id="profile-fullname"
            maxlength="120"
            placeholder="Tên hiển thị"
            :readonly="!editingProfile"
            required
          />
        </label>
        <label>
          Email / Gmail
          <input
            v-model.trim="profileForm.email"
            type="email"
            id="profile-email-input"
            maxlength="160"
            placeholder="ban@gmail.com"
            :readonly="!editingProfile"
          />
        </label>
        <label>
          Ngày sinh
          <input
            v-model="profileForm.birthday"
            type="date"
            id="profile-birthday"
            :max="today"
            :readonly="!editingProfile"
          />
        </label>
        <label>
          Số điện thoại
          <input
            v-model.trim="profileForm.phone"
            type="tel"
            id="profile-phone"
            maxlength="16"
            placeholder="09xxxxxxxx"
            :readonly="!editingProfile"
          />
        </label>

        <div v-if="editingProfile" class="profile-form-actions">
          <button
            type="button"
            class="secondary-btn"
            :disabled="profileSaving"
            @click="cancelProfileEdit"
          >
            Hủy
          </button>
          <button type="submit" class="primary-btn" :disabled="profileSaving">
            {{ profileSaving ? 'Đang lưu...' : 'Lưu thông tin' }}
          </button>
        </div>
      </form>
    </div>

    <div class="panel profile-panel invite-panel">
      <div class="invite-heading">
        <div>
          <h2>Mời bạn bè</h2>
          <p>Gửi mã hoặc liên kết để bạn bè mở SmartSpend và đăng ký.</p>
        </div>
        <strong>{{ Number(user?.referralCount || 0) }} người đã tham gia</strong>
      </div>

      <div class="invite-code-row">
        <div>
          <span>Mã mời của bạn</span>
          <strong>{{ inviteCodeStatus }}</strong>
        </div>
        <button
          type="button"
          class="btn-action"
          :disabled="profileLoading || (!user?.inviteCode && !profileError)"
          @click="profileError ? loadProfile() : copyInviteCode()"
        >
          {{ profileError ? 'Thử lại' : 'Sao chép mã' }}
        </button>
      </div>

      <label class="invite-link-field">
        Liên kết web/app
        <input :value="inviteLink" type="text" readonly @focus="$event.target.select()" />
      </label>

      <div class="invite-actions">
        <button type="button" class="primary-btn" :disabled="!user?.inviteCode" @click="shareInvite">
          Chia sẻ lời mời
        </button>
        <button type="button" class="btn-action" :disabled="!user?.inviteCode" @click="copyInviteLink">
          Sao chép liên kết
        </button>
      </div>
      <p v-if="inviteMessage" class="invite-message">{{ inviteMessage }}</p>
    </div>

    <div class="panel profile-panel">
      <h2>Tác vụ tài khoản</h2>
      <div class="profile-actions-grid">
        <button
          type="button"
          class="profile-action-card"
          id="profile-reset-password"
          :disabled="!canChangePassword"
          @click="openPasswordDialog"
        >
          <strong>Đổi mật khẩu</strong>
          <span>
            {{ canChangePassword ? 'Xác nhận mật khẩu hiện tại trước khi đổi' : 'Tài khoản mạng xã hội không dùng mật khẩu' }}
          </span>
        </button>
        <button
          type="button"
          class="profile-action-card"
          id="profile-view-history"
          @click="viewExpenseHistory"
        >
          <strong>Xem lịch sử chi tiêu</strong>
          <span>Mở báo cáo giao dịch theo tuần, tháng và năm</span>
        </button>
        <button
          type="button"
          class="profile-action-card"
          id="profile-export-data"
          :disabled="exportingData"
          @click="exportPersonalData"
        >
          <strong>{{ exportingData ? 'Đang chuẩn bị...' : 'Tải dữ liệu của tôi' }}</strong>
          <span>Xuất hồ sơ, giao dịch, ngân sách và mục tiêu dạng JSON</span>
        </button>
        <button type="button" class="profile-action-card danger" @click="handleLogout">
          <strong>Đăng xuất</strong>
          <span>Kết thúc phiên đăng nhập hiện tại</span>
        </button>
      </div>
      <p v-if="actionMessage" class="profile-feedback">{{ actionMessage }}</p>
    </div>

    <div
      v-if="passwordDialogOpen"
      class="profile-modal-overlay"
      @click.self="closePasswordDialog"
    >
      <form
        class="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
        @keydown.esc="closePasswordDialog"
        @submit.prevent="submitPasswordChange"
      >
        <div class="profile-section-heading">
          <div>
            <h2 id="password-dialog-title">Đổi mật khẩu</h2>
            <p>Mật khẩu mới phải có ít nhất 6 ký tự.</p>
          </div>
          <button
            type="button"
            class="profile-modal-close"
            aria-label="Đóng"
            @click="closePasswordDialog"
          >
            ×
          </button>
        </div>

        <p v-if="passwordMessage" class="profile-feedback error">
          {{ passwordMessage }}
        </p>

        <label>
          Mật khẩu hiện tại
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            v-model="passwordForm.newPassword"
            type="password"
            minlength="6"
            autocomplete="new-password"
            required
          />
        </label>
        <label>
          Xác nhận mật khẩu mới
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            minlength="6"
            autocomplete="new-password"
            required
          />
        </label>

        <div class="profile-form-actions">
          <button
            type="button"
            class="secondary-btn"
            :disabled="passwordSaving"
            @click="closePasswordDialog"
          >
            Hủy
          </button>
          <button type="submit" class="primary-btn" :disabled="passwordSaving">
            {{ passwordSaving ? 'Đang đổi...' : 'Đổi mật khẩu' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import {
  changePassword,
  fetchProfile,
  logout,
  updateProfile
} from '../services/auth';
import { useAppStore } from '../stores/useAppStore';

const router = useRouter();
const appStore = useAppStore();
const { user, expenses, budgets, categoryBudgets, goals } = storeToRefs(appStore);
const inviteMessage = ref('');
const profileLoading = ref(false);
const profileError = ref('');
const profileMessage = ref('');
const profileMessageType = ref('success');
const profileSaving = ref(false);
const editingProfile = ref(false);
const actionMessage = ref('');
const exportingData = ref(false);
const passwordDialogOpen = ref(false);
const passwordSaving = ref(false);
const passwordMessage = ref('');
const today = new Date().toISOString().slice(0, 10);

const profileForm = reactive({
  fullName: '',
  email: '',
  birthday: '',
  phone: ''
});
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const displayName = computed(
  () => user.value?.fullName || user.value?.name || user.value?.username || 'Hồ sơ cá nhân'
);
const canChangePassword = computed(
  () => !user.value?.authProvider || user.value.authProvider === 'password'
);
const inviteCodeStatus = computed(() => {
  if (user.value?.inviteCode) return user.value.inviteCode;
  if (profileError.value) return 'Không thể tải mã';
  return profileLoading.value ? 'Đang tạo...' : 'Chưa có mã';
});
const inviteLink = computed(() => {
  if (!user.value?.inviteCode) return '';
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const url = new URL('/login', baseUrl);
  url.searchParams.set('invite', user.value.inviteCode);
  return url.toString();
});

onMounted(loadProfile);

function fillProfileForm(profile = user.value || {}) {
  profileForm.fullName = profile.fullName || profile.name || profile.username || '';
  profileForm.email = profile.email || '';
  profileForm.birthday = String(profile.birthday || '').slice(0, 10);
  profileForm.phone = profile.phone || '';
}

async function loadProfile() {
  profileLoading.value = true;
  profileError.value = '';
  try {
    const result = await fetchProfile();
    if (result.ok) {
      appStore.setAuth(result.data);
      fillProfileForm(result.data);
      return;
    }
    profileError.value =
      result.status === 401
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : result.data?.error || 'Không thể tải hồ sơ.';
    inviteMessage.value = profileError.value;
  } catch (error) {
    profileError.value = 'Không thể kết nối tới backend.';
    inviteMessage.value = profileError.value;
  } finally {
    profileLoading.value = false;
  }
}

function startProfileEdit() {
  fillProfileForm();
  profileMessage.value = '';
  editingProfile.value = true;
}

function cancelProfileEdit() {
  fillProfileForm();
  profileMessage.value = '';
  editingProfile.value = false;
}

async function saveProfile() {
  profileMessage.value = '';
  if (!profileForm.fullName.trim()) {
    profileMessageType.value = 'error';
    profileMessage.value = 'Họ và tên không được để trống.';
    return;
  }

  profileSaving.value = true;
  try {
    const result = await updateProfile({ ...profileForm });
    if (!result.ok) {
      profileMessageType.value = 'error';
      profileMessage.value = result.data?.error || 'Không thể cập nhật hồ sơ.';
      return;
    }
    appStore.setAuth(result.data.user);
    fillProfileForm(result.data.user);
    editingProfile.value = false;
    profileMessageType.value = 'success';
    profileMessage.value = 'Đã cập nhật thông tin tài khoản.';
  } catch (error) {
    profileMessageType.value = 'error';
    profileMessage.value = 'Không thể kết nối tới backend.';
  } finally {
    profileSaving.value = false;
  }
}

function openPasswordDialog() {
  if (!canChangePassword.value) return;
  passwordMessage.value = '';
  passwordDialogOpen.value = true;
}

function closePasswordDialog() {
  if (passwordSaving.value) return;
  passwordDialogOpen.value = false;
  passwordMessage.value = '';
  passwordForm.currentPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
}

async function submitPasswordChange() {
  passwordMessage.value = '';
  if (passwordForm.newPassword.length < 6) {
    passwordMessage.value = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordMessage.value = 'Xác nhận mật khẩu mới không khớp.';
    return;
  }

  passwordSaving.value = true;
  try {
    const result = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    if (!result.ok) {
      passwordMessage.value = result.data?.error || 'Không thể đổi mật khẩu.';
      return;
    }
    closePasswordDialogAfterSave();
    actionMessage.value = result.data?.message || 'Đổi mật khẩu thành công.';
  } catch (error) {
    passwordMessage.value = 'Không thể kết nối tới backend.';
  } finally {
    passwordSaving.value = false;
  }
}

function closePasswordDialogAfterSave() {
  passwordDialogOpen.value = false;
  passwordMessage.value = '';
  passwordForm.currentPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
}

function viewExpenseHistory() {
  router.push({ name: 'report' });
}

async function exportPersonalData() {
  if (exportingData.value) return;
  exportingData.value = true;
  actionMessage.value = '';
  try {
    await Promise.all([
      appStore.fetchExpenses(),
      appStore.fetchBudgets(),
      appStore.fetchCategoryBudgets(),
      appStore.fetchGoals()
    ]);
    const exportData = {
      exportedAt: new Date().toISOString(),
      application: 'SmartSpend',
      profile: user.value,
      transactions: expenses.value,
      budgets: budgets.value,
      categoryBudgets: categoryBudgets.value,
      goals: goals.value
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartspend-data-${today}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    actionMessage.value = 'Đã tải dữ liệu tài khoản về thiết bị.';
  } catch (error) {
    actionMessage.value = 'Không thể chuẩn bị dữ liệu tải xuống.';
  } finally {
    exportingData.value = false;
  }
}

async function writeClipboard(value, successMessage) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    inviteMessage.value = successMessage;
  } catch (error) {
    inviteMessage.value = 'Không thể sao chép tự động. Hãy chọn và sao chép liên kết.';
  }
}

function copyInviteCode() {
  return writeClipboard(user.value?.inviteCode, 'Đã sao chép mã mời.');
}

function copyInviteLink() {
  return writeClipboard(inviteLink.value, 'Đã sao chép liên kết mời.');
}

async function shareInvite() {
  if (!inviteLink.value) return;
  const shareData = {
    title: 'Tham gia SmartSpend',
    text: `Tham gia SmartSpend cùng tôi. Mã mời: ${user.value.inviteCode}`,
    url: inviteLink.value
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      inviteMessage.value = 'Đã mở ứng dụng chia sẻ.';
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }
  await copyInviteLink();
}

async function handleLogout() {
  await logout();
  appStore.setAuth(null);
  router.push('/login');
}
</script>
