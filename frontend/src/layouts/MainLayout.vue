<template>
  <div id="app-container" class="app-shell modern-shell">
    <aside class="desktop-sidebar">
      <router-link to="/" class="sidebar-brand">
        <img src="/assets/logo/app-logo.svg" alt="SmartSpend" />
        <div><strong>SmartSpend</strong><span>Money made simple</span></div>
      </router-link>

      <nav class="sidebar-nav" aria-label="Điều hướng chính">
        <router-link v-for="item in navigation" :key="item.to" :to="item.to" class="sidebar-link">
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-tip">
        <span>✨</span>
        <strong>Mẹo hôm nay</strong>
        <p>Ghi lại giao dịch ngay khi thanh toán để báo cáo luôn chính xác.</p>
      </div>

      <button type="button" class="sidebar-user" @click="router.push('/profile')">
        <img :src="avatarUrl" alt="Ảnh đại diện" />
        <span><strong>{{ displayName }}</strong><small>Xem hồ sơ</small></span>
        <span>›</span>
      </button>
    </aside>

    <div class="app-workspace">
      <header class="modern-header">
        <div>
          <p class="header-kicker">{{ greeting }},</p>
          <h1>{{ displayName }} <span aria-hidden="true">👋</span></h1>
          <p class="header-description">Cùng xem tình hình tài chính của bạn hôm nay.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="icon-button" aria-label="Thông báo"><span>🔔</span><i></i></button>
          <button type="button" class="header-avatar-button" @click="router.push('/profile')">
            <img :src="avatarUrl" alt="Mở hồ sơ" />
          </button>
        </div>
      </header>

      <main class="modern-main"><router-view /></main>
    </div>

    <nav class="mobile-bottom-nav" aria-label="Điều hướng di động">
      <router-link to="/" class="mobile-tab"><span v-html="navigation[0].icon"></span><small>Trang chủ</small></router-link>
      <router-link to="/report" class="mobile-tab"><span v-html="navigation[2].icon"></span><small>Báo cáo</small></router-link>
      <router-link to="/add" class="mobile-add" aria-label="Thêm giao dịch"><span>＋</span></router-link>
      <router-link to="/budget" class="mobile-tab"><span v-html="navigation[3].icon"></span><small>Ngân sách</small></router-link>
      <router-link to="/profile" class="mobile-tab"><span v-html="navigation[5].icon"></span><small>Hồ sơ</small></router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/useAppStore';

const router = useRouter();
const appStore = useAppStore();
const { user } = storeToRefs(appStore);

const navigation = [
  { to: '/', label: 'Tổng quan', icon: '<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"/></svg>' },
  { to: '/add', label: 'Giao dịch', icon: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg>' },
  { to: '/report', label: 'Báo cáo', icon: '<svg viewBox="0 0 24 24"><path d="M5 19V9m7 10V5m7 14v-7"/></svg>' },
  { to: '/budget', label: 'Ngân sách', icon: '<svg viewBox="0 0 24 24"><path d="M3 7h18v12H3zM16 12h5v4h-5a2 2 0 0 1 0-4ZM6 7V5h11v2"/></svg>' },
  { to: '/ai', label: 'Smart AI', icon: '<svg viewBox="0 0 24 24"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/></svg>' },
  { to: '/profile', label: 'Hồ sơ', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>' }
];

const displayName = computed(() => user.value?.fullName || user.value?.username || 'Người dùng');
const avatarUrl = computed(() => {
  const avatar = user.value?.avatar;
  if (!avatar) return '/assets/logo/app-logo.svg';
  return avatar.startsWith('http') || avatar.startsWith('/') ? avatar : `/${avatar}`;
});
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
});
</script>
