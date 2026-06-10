<template>
  <section id="profile" class="screen active">
    <div class="panel profile-hero profile-hero-enhanced">
      <img id="profile-avatar" :src="user?.avatar || '/assets/logo/app-logo.svg'" alt="Avatar hồ sơ" />
      <div>
        <h2 id="profile-display-name">{{ displayName }}</h2>
        <p id="profile-email">{{ user?.email || user?.username || 'Chưa có email' }}</p>
        <span class="profile-member-badge">✓ Tài khoản SmartSpend</span>
      </div>
    </div>

    <div class="profile-content-grid">
    <div class="panel profile-panel">
      <h2>Thông tin tài khoản</h2>
      <form id="profile-form" class="profile-form" @submit.prevent>
        <label>
          Họ và tên
          <input type="text" id="profile-fullname" :value="displayName" placeholder="Tên hiển thị" readonly />
        </label>
        <label>
          Email
          <input type="email" id="profile-email-input" :value="user?.email || user?.username || ''" placeholder="ban@example.com" readonly />
        </label>
        <label>
          Ngày sinh
          <input type="date" id="profile-birthday" :value="user?.birthday || ''" readonly />
        </label>
        <label>
          Số điện thoại
          <input type="tel" id="profile-phone" :value="user?.phone || ''" placeholder="09..." readonly />
        </label>
      </form>
    </div>

    <div class="panel profile-panel">
      <h2>Tác vụ tài khoản</h2>
      <div class="profile-actions-grid">
        <button type="button" class="profile-action-card" id="profile-reset-password">Đổi mật khẩu</button>
        <button type="button" class="profile-action-card" id="profile-view-history">Xem lịch sử chi tiêu</button>
        <button type="button" class="profile-action-card" id="profile-export-data">Tải dữ liệu mẫu</button>
        <button type="button" class="profile-action-card" @click="handleLogout">Đăng xuất</button>
      </div>
    </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/useAppStore';

const router = useRouter();
const appStore = useAppStore();
const { user } = storeToRefs(appStore);

const displayName = computed(() => user.value?.fullName || user.value?.name || user.value?.username || 'Hồ sơ cá nhân');

function handleLogout() {
  localStorage.removeItem('authToken');
  appStore.setAuth(null);
  router.push('/login');
}
</script>
