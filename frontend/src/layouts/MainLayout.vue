<template>
  <div id="app-container" class="app-shell">
    <header>
      <div class="header-profile">
        <img id="header-avatar" src="/assets/logo/app-logo.svg" alt="Avatar người dùng" />
        <div>
          <h1>SmartSpend</h1>
          <p>Quản lý chi tiêu, ngân sách và insight thông minh</p>
          <p class="user-greeting">
            Xin chào,
            <strong id="user-name">{{ user?.fullName || user?.username || 'Khách' }}</strong>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button id="logout-button" class="btn-action" @click="logout">Đăng xuất</button>
      </div>
    </header>

    <section id="voucher-gate" class="voucher-gate hidden">
      <div class="voucher-gate-content">
        <div class="voucher-gate-heading">
          <span>Ưu đãi trước khi vào trang chính</span>
          <h2>Voucher thật gần bạn</h2>
          <p>Chỉ hiển thị khi cửa hàng thật trong dữ liệu quét có thông tin ưu đãi rõ ràng.</p>
        </div>
        <div id="voucher-gate-list" class="promotion-list gate-promotion-list"></div>
        <div class="voucher-gate-actions">
          <button type="button" id="voucher-gate-location" class="primary-btn">Bật vị trí và quét cửa hàng</button>
          <button type="button" id="voucher-gate-skip" class="text-link">Đóng thông báo</button>
        </div>
      </div>
    </section>

    <main>
      <router-view />
    </main>

    <nav class="bottom-nav">
      <router-link id="tab-dashboard" class="tab" to="/">Trang chủ</router-link>
      <router-link id="tab-add" class="tab" to="/add">Thêm</router-link>
      <router-link id="tab-report" class="tab" to="/report">Báo cáo</router-link>
      <router-link id="tab-budget" class="tab" to="/budget">Ngân sách</router-link>
      <router-link id="tab-ai" class="tab" to="/ai">AI</router-link>
      <router-link id="tab-profile" class="tab" to="/profile">Hồ sơ</router-link>
    </nav>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/useAppStore';

const router = useRouter();
const appStore = useAppStore();
const { user } = storeToRefs(appStore);

function logout() {
  localStorage.removeItem('authToken');
  appStore.setAuth(null);
  router.push('/login');
}
</script>
