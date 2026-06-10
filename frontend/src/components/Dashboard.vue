<template>
  <div id="app-container" class="app-shell">
    <header>
      <div class="header-profile">
        <img id="header-avatar" src="/assets/logo/app-logo.svg" alt="Avatar người dùng" />
        <div>
          <h1>SmartSpend</h1>
          <p>Quản lý chi tiêu, ngân sách và insight thông minh</p>
          <p class="user-greeting">Xin chào, <strong id="user-name">{{ user?.fullName || user?.username || 'Khách' }}</strong></p>
        </div>
      </div>
      <div class="header-actions">
        <button id="logout-button" class="btn-action">Đăng xuất</button>
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
      <section id="dashboard" class="screen" :class="{ active: currentView === 'dashboard' }">
        <div class="panel summary-panel">
          <h2>Dashboard</h2>
          <div class="summary-grid">
            <div class="card">
              <span>Tổng chi tiêu</span>
              <strong id="total-expense">{{ formatMoney(totalExpense) }}</strong>
            </div>
            <div class="card">
              <span>Budget</span>
              <strong id="budget-amount">{{ formatMoney(currentBudgetAmount) }}</strong>
            </div>
            <div class="card">
              <span>Trạng thái</span>
              <strong id="budget-status">{{ budgetStatus }}</strong>
            </div>
            <div class="card">
              <span>Hạng mục lớn nhất</span>
              <strong id="top-category">{{ topCategory }}</strong>
            </div>
          </div>
          <div class="dashboard-controls">
            <input id="expense-search" type="text" placeholder="Tìm giao dịch..." />
            <select id="expense-filter-category">
              <option value="">Tất cả danh mục</option>
            </select>
          </div>
          <div id="promotion-panel" class="promotion-panel">
            <div class="panel-heading">
              <h3>Ưu đãi thông minh</h3>
              <span>SmartSpend chỉ hiện voucher khi Google Places/SerpAPI trả về cửa hàng thật có thông tin ưu đãi</span>
            </div>
            <div class="promotion-action-row">
              <button id="promotion-location-button" class="secondary-btn">Bật vị trí để quét cửa hàng gần bạn</button>
              <span id="promotion-location-status">Vị trí hiện tại chưa bật</span>
            </div>
            <div class="promotion-carousel">
              <button type="button" id="promotion-prev" class="carousel-arrow" aria-label="Voucher trước">‹</button>
              <div id="promotion-list" class="promotion-list"></div>
              <button type="button" id="promotion-next" class="carousel-arrow" aria-label="Voucher tiếp theo">›</button>
            </div>
            <div id="promotion-map-panel" class="promotion-map-panel hidden">
              <div class="nearby-filter-row">
                <input id="nearby-keyword" type="text" placeholder="Tìm: phở, trà sữa, CGV, khu vui chơi..." />
                <select id="nearby-radius">
                  <option value="500">500m</option>
                  <option value="1000">1km</option>
                  <option value="2000">2km</option>
                  <option value="3000">3km</option>
                  <option value="5000">5km</option>
                  <option value="10000">10km</option>
                  <option value="25000">25km</option>
                  <option value="50000">50km</option>
                </select>
              </div>
              <div class="map-frame-wrap">
                <iframe id="promotion-map" title="Bản đồ ưu đãi gần bạn" loading="lazy"></iframe>
              </div>
              <div class="nearby-heading">
                <div>
                  <h4>Cửa hàng gần bạn</h4>
                  <p id="nearby-scan-status">Đang chờ bật vị trí để quét nhà hàng, quán ăn và quán nước.</p>
                </div>
                <button type="button" id="nearby-refresh-button" class="btn-action">Quét lại</button>
              </div>
              <div id="nearby-store-list" class="nearby-store-list"></div>
              <div id="place-detail-panel" class="place-detail-panel hidden"></div>
            </div>
          </div>
          <div id="notification-box" class="notification-box"></div>
          <div class="badge-panel">
            <h3>Huy hiệu</h3>
            <div id="badge-list" class="badge-list"></div>
          </div>
          <div class="insight-box">
            <h3>AI Insight</h3>
            <div id="recommendations"></div>
          </div>
        </div>

        <div class="panel list-panel">
          <h2>Chi tiêu gần đây</h2>
          <p v-if="expenseError" class="notification-box expense-error">{{ expenseError }}</p>
          <div id="expense-list" class="expense-list">
            <p v-if="!recentExpenses.length">Không có giao dịch phù hợp.</p>
            <div v-for="expense in recentExpenses" :key="expense.id" class="expense-item">
              <div>
                <strong>{{ expense.title }}</strong>
                <span>{{ expense.category }} · {{ formatDate(expense.date) }}</span>
                <p>{{ expense.note || '' }}</p>
              </div>
              <div class="expense-actions">
                <span>{{ formatMoney(expense.amount) }}</span>
                <button type="button" class="btn-action" @click="editExpense(expense.id)">Sửa</button>
                <button type="button" class="btn-delete" @click="removeExpense(expense.id)">Xóa</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="add" class="screen" :class="{ active: currentView === 'add' }">
        <div class="panel form-panel">
          <h2>Thêm chi tiêu</h2>
          <form id="expense-form" @submit.prevent="submitExpense">
            <label>
              Tên chi tiêu
              <input v-model.trim="expenseForm.title" type="text" id="expense-title" placeholder="Ví dụ: Ăn sáng" required />
            </label>
            <label>
              Số tiền (VND)
              <input v-model.number="expenseForm.amount" type="number" id="expense-amount" placeholder="85000" required />
            </label>
            <label>
              Hạng mục
              <select v-model="expenseForm.category" id="expense-category">
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Ngày
              <input v-model="expenseForm.date" type="date" id="expense-date" required />
            </label>
            <label>
              Ghi chú
              <textarea v-model.trim="expenseForm.note" id="expense-note" placeholder="Mô tả thêm"></textarea>
            </label>
            <button type="submit" class="primary-btn" id="expense-form-submit">Lưu chi tiêu</button>
          </form>
        </div>
      </section>

      <section id="report" class="screen" :class="{ active: currentView === 'report' }">
        <div class="panel report-panel">
          <h2>Báo cáo</h2>
          <div class="report-card">
            <strong id="category-top">-</strong>
            <span>Hạng mục chi tiêu nhiều nhất</span>
          </div>
          <div class="report-card">
            <strong id="average-expense">-</strong>
            <span>Chi tiêu trung bình mỗi khoản</span>
          </div>
          <div class="report-card">
            <strong id="expense-count">-</strong>
            <span>Tổng số giao dịch</span>
          </div>
          <div class="chart-box">
            <h3>Phân bổ theo nhóm</h3>
            <div id="category-chart"></div>
          </div>
          <div class="insight-box">
            <h3>AI Financial Insights</h3>
            <div id="report-insights"></div>
            <div id="forecast-summary"></div>
          </div>
        </div>
      </section>

      <section id="budget" class="screen" :class="{ active: currentView === 'budget' }">
        <div class="panel budget-panel">
          <h2>Ngân sách & Mục tiêu</h2>
          <div class="budget-summary">
            <div>
              <span>Budget hiện tại</span>
              <strong id="current-budget">{{ formatMoney(currentBudgetAmount) }}</strong>
            </div>
            <div>
              <span>Chu kỳ</span>
              <strong id="budget-period">{{ currentBudgetPeriod }}</strong>
            </div>
          </div>
          <form id="budget-form" class="budget-form">
            <label>
              Số tiền ngân sách
              <input type="number" id="budget-input" placeholder="10000000" required />
            </label>
            <label>
              Hạng mục ngân sách (tùy chọn)
              <select id="budget-category-select">
                <option value="">Tổng chung</option>
              </select>
            </label>
            <label>
              Chu kỳ
              <select id="budget-period-select">
                <option>Tháng</option>
                <option>Tuần</option>
              </select>
            </label>
            <button type="submit" class="primary-btn">Cập nhật ngân sách</button>
          </form>
          <div class="category-form">
            <h3>Quản lý danh mục</h3>
            <form id="category-form">
              <label>
                Tên danh mục mới
                <input type="text" id="category-name" placeholder="Ví dụ: Giải trí" required />
              </label>
              <button type="submit" class="primary-btn">Thêm danh mục</button>
            </form>
          </div>
          <div class="category-budget-box">
            <h3>Budget theo hạng mục</h3>
            <div id="category-budget-list" class="goal-list"></div>
          </div>
          <div class="goal-box">
            <h3>Saving Goal</h3>
            <form id="goal-form">
              <label>
                Tên mục tiêu
                <input type="text" id="goal-name" placeholder="Ví dụ: Mua laptop" required />
              </label>
              <label>
                Mục tiêu (VND)
                <input type="number" id="goal-target" placeholder="5000000" required />
              </label>
              <button type="submit" class="primary-btn">Thêm mục tiêu</button>
            </form>
            <div id="goal-list" class="goal-list"></div>
          </div>
        </div>
      </section>

      <section id="ai" class="screen" :class="{ active: currentView === 'ai' }">
        <div class="panel ai-panel">
          <h2>AI Chat</h2>
          <div class="chat-box">
            <div id="chat-history" class="chat-history"></div>
            <form id="chat-form" class="chat-form">
              <input type="text" id="chat-message" placeholder="Hỏi AI ví dụ: Tôi có vượt ngân sách không?" required />
              <button type="submit" class="primary-btn">Gửi</button>
            </form>
          </div>
        </div>
      </section>

      <section id="profile" class="screen" :class="{ active: currentView === 'profile' }">
        <div class="panel profile-hero">
          <img id="profile-avatar" src="/assets/logo/app-logo.svg" alt="Avatar hồ sơ" />
          <div>
            <h2 id="profile-display-name">Hồ sơ cá nhân</h2>
            <p id="profile-email">Cập nhật thông tin để SmartSpend cá nhân hóa trải nghiệm tốt hơn.</p>
          </div>
        </div>
        <div class="panel profile-panel">
          <h2>Thông tin tài khoản</h2>
          <form id="profile-form" class="profile-form">
            <label>
              Họ và tên
              <input type="text" id="profile-fullname" placeholder="Tên hiển thị" />
            </label>
            <label>
              Email
              <input type="email" id="profile-email-input" placeholder="ban@example.com" />
            </label>
            <label>
              Ngày sinh
              <input type="date" id="profile-birthday" />
            </label>
            <label>
              Số điện thoại
              <input type="tel" id="profile-phone" placeholder="09..." />
            </label>
            <label>
              Avatar
              <select id="profile-avatar-select">
                <option value="assets/images/male.png">Nam</option>
                <option value="assets/images/female.png">Nữ</option>
                <option value="assets/logo/app-logo.svg">SmartSpend</option>
              </select>
            </label>
            <button type="submit" class="primary-btn">Lưu hồ sơ</button>
          </form>
        </div>
        <div class="panel profile-panel">
          <h2>Tác vụ tài khoản</h2>
          <div class="profile-actions-grid">
            <button type="button" class="profile-action-card" id="profile-reset-password">Đổi mật khẩu</button>
            <button type="button" class="profile-action-card" id="profile-view-history">Xem lịch sử chi tiêu</button>
            <button type="button" class="profile-action-card" id="profile-export-data">Tải dữ liệu mẫu</button>
          </div>
          <div id="profile-summary" class="profile-summary"></div>
        </div>
      </section>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/useAppStore';

const appStore = useAppStore();
const route = useRoute();
const { user, expenses, budgets, goals } = storeToRefs(appStore);
const expenseError = ref('');

const expenseForm = reactive({
  title: '',
  amount: null,
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  note: ''
});

const totalExpense = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
});

const currentView = computed(() => route.name || 'dashboard');

const recentExpenses = computed(() => {
  return [...expenses.value]
    .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
    .slice(0, 5);
});

const currentBudget = computed(() => budgets.value[0] || null);

const currentBudgetAmount = computed(() => Number(currentBudget.value?.amount || 0));

const currentBudgetPeriod = computed(() => currentBudget.value?.period || '-');

const budgetStatus = computed(() => {
  if (!currentBudgetAmount.value) return '-';
  return totalExpense.value > currentBudgetAmount.value ? 'Vượt ngân sách' : 'Trong ngân sách';
});

const topCategory = computed(() => {
  if (!expenses.value.length) return '-';

  const totals = expenses.value.reduce((result, expense) => {
    const category = expense.category || 'Other';
    result[category] = (result[category] || 0) + Number(expense.amount || 0);
    return result;
  }, {});

  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
});

onMounted(async () => {
  try {
    await Promise.all([
      appStore.fetchExpenses(),
      appStore.fetchBudgets(),
      appStore.fetchGoals()
    ]);
  } catch (error) {
    console.error('Fetch dashboard data failed', error);
    expenseError.value = 'Không thể tải danh sách chi tiêu.';
  }
});

async function submitExpense() {
  expenseError.value = '';
  try {
    await appStore.addExpense({
      title: expenseForm.title,
      amount: Number(expenseForm.amount || 0),
      category: expenseForm.category,
      date: expenseForm.date,
      note: expenseForm.note
    });
    resetExpenseForm();
  } catch (error) {
    console.error('Add expense failed', error);
    expenseError.value = error?.message || error?.error || 'Không thể thêm chi tiêu.';
  }
}

function resetExpenseForm() {
  expenseForm.title = '';
  expenseForm.amount = null;
  expenseForm.category = 'Food';
  expenseForm.date = new Date().toISOString().slice(0, 10);
  expenseForm.note = '';
}

function editExpense(id) {
  console.log('Edit expense', id);
}

async function removeExpense(id) {
  expenseError.value = '';
  try {
    await appStore.deleteExpense(id);
  } catch (error) {
    console.error('Delete expense failed', error);
    expenseError.value = error?.message || error?.error || 'KhĂ´ng thá»ƒ xĂ³a chi tiĂªu.';
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '';
}
</script>
