function buildAuthShell() {
  const container = document.getElementById('login-container');
  if (!container) return;
  container.innerHTML = `
    <div class="auth-card">
      <button type="button" id="auth-back" class="auth-back hidden" aria-label="Quay lại">‹</button>
      <h2 id="auth-title">Chào người dùng mới!</h2>
      <p id="auth-subtitle">Chào mừng bạn đến với ứng dụng</p>
      <div id="auth-main">
        <form id="login-form" class="auth-form">
          <div id="register-extra" class="register-extra hidden">
            <input type="text" id="register-fullname" placeholder="Họ Tên" autocomplete="name" />
            <input type="email" id="register-email" placeholder="Email" autocomplete="email" />
            <input type="hidden" id="register-avatar" value="assets/images/male.png" />
            <div class="gender-picker" role="radiogroup" aria-label="Giới tính">
              <button type="button" class="gender-card active" data-avatar="assets/images/male.png" aria-pressed="true">
                <span>Nam</span>
                <img src="assets/images/male.png" alt="Nam" />
              </button>
              <button type="button" class="gender-card" data-avatar="assets/images/female.png" aria-pressed="false">
                <span>Nữ</span>
                <img src="assets/images/female.png" alt="Nữ" />
              </button>
            </div>
            <input type="date" id="register-birthday" value="2022-12-04" />
            <div class="password-field">
              <input type="password" id="register-password" placeholder="Mật Khẩu" autocomplete="new-password" />
              <button type="button" class="password-toggle" data-target="register-password" aria-label="Ẩn hiện mật khẩu">⌧</button>
            </div>
            <input type="password" id="register-password-confirm" placeholder="Xác nhận mật khẩu" autocomplete="new-password" />
          </div>
          <input type="email" id="login-username" placeholder="Email" autocomplete="email" required />
          <div class="password-field">
            <input type="password" id="login-password" placeholder="Mật Khẩu" autocomplete="current-password" required />
            <button type="button" class="password-toggle" data-target="login-password" aria-label="Ẩn hiện mật khẩu">⌧</button>
          </div>
          <button type="submit" class="primary-btn" id="auth-submit">Đăng ký</button>
        </form>
        <button type="button" class="forgot-link hidden" id="forgot-password">Quên Mật Khẩu?</button>
        <div id="social-login" class="social-login hidden">
          <div class="divider"><span>Hoặc tiếp tục với</span></div>
          <div class="social-buttons">
            <div id="google-signin-button" class="google-signin-button"></div>
            <button type="button" id="google-login-fallback" class="social-btn google hidden" data-provider="google">G Google</button>
            <button type="button" class="social-btn facebook" data-provider="facebook">f Facebook</button>
          </div>
          <p id="social-login-status" class="social-login-status"></p>
        </div>
        <p class="auth-switch"><span id="auth-question">Đã có tài khoản?</span> <button type="button" id="toggle-register">Đăng nhập ngay</button></p>
        <p class="login-hint" id="login-hint"></p>
      </div>
      <div id="reset-panel" class="hidden">
        <h3 id="reset-title">Quên Mật Khẩu?</h3>
        <p id="reset-subtitle">Đừng lo! Vui lòng nhập địa chỉ email với tài khoản của bạn.</p>
        <form id="reset-form" class="auth-form">
          <input type="email" id="reset-username" placeholder="Email" autocomplete="email" required />
          <div id="reset-channel-row" class="reset-channel-row">
            <button type="button" class="channel-btn active" data-channel="gmail" aria-pressed="true">Gmail</button>
            <button type="button" class="channel-btn" data-channel="facebook" aria-pressed="false">Facebook</button>
          </div>
          <input type="text" id="reset-code" class="hidden" placeholder="Nhập mã xác minh" inputmode="numeric" />
          <div class="password-field hidden" id="reset-password-wrap">
            <input type="password" id="reset-password" placeholder="Mật Khẩu" autocomplete="new-password" />
            <button type="button" class="password-toggle" data-target="reset-password" aria-label="Ẩn hiện mật khẩu">⌧</button>
          </div>
          <div class="password-field hidden" id="reset-confirm-wrap">
            <input type="password" id="reset-password-confirm" placeholder="Xác nhận mật khẩu" autocomplete="new-password" />
            <button type="button" class="password-toggle" data-target="reset-password-confirm" aria-label="Ẩn hiện mật khẩu">⌧</button>
          </div>
          <button type="submit" class="primary-btn" id="reset-submit">Gửi</button>
          <button type="button" class="secondary-btn hidden" id="reset-cancel">Hủy</button>
          <p id="reset-helper" class="login-hint"></p>
        </form>
      </div>
    </div>
  `;
}

buildAuthShell();

const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const expenseListEl = document.getElementById('expense-list');
const totalExpenseEl = document.getElementById('total-expense');
const budgetAmountEl = document.getElementById('budget-amount');
const budgetStatusEl = document.getElementById('budget-status');
const topCategoryEl = document.getElementById('top-category');
const recommendationsEl = document.getElementById('recommendations');
const categoryTopEl = document.getElementById('category-top');
const averageExpenseEl = document.getElementById('average-expense');
const expenseCountEl = document.getElementById('expense-count');
const categoryChartEl = document.getElementById('category-chart');
const currentBudgetEl = document.getElementById('current-budget');
const budgetPeriodEl = document.getElementById('budget-period');
const goalListEl = document.getElementById('goal-list');
const categorySelect = document.getElementById('expense-category');
const budgetCategorySelect = document.getElementById('budget-category-select');
const categoryBudgetList = document.getElementById('category-budget-list');
const reportInsightsEl = document.getElementById('report-insights');
const forecastSummaryEl = document.getElementById('forecast-summary');
const expenseForm = document.getElementById('expense-form');
const budgetForm = document.getElementById('budget-form');
const goalForm = document.getElementById('goal-form');
const chatForm = document.getElementById('chat-form');
const chatHistory = document.getElementById('chat-history');
const chatMessage = document.getElementById('chat-message');
const notificationBox = document.getElementById('notification-box');
const promotionListEl = document.getElementById('promotion-list');
const voucherGate = document.getElementById('voucher-gate');
const voucherGateList = document.getElementById('voucher-gate-list');
const voucherGateLocation = document.getElementById('voucher-gate-location');
const voucherGateSkip = document.getElementById('voucher-gate-skip');
const promotionPrevButton = document.getElementById('promotion-prev');
const promotionNextButton = document.getElementById('promotion-next');
const promotionLocationButton = document.getElementById('promotion-location-button');
const promotionLocationStatus = document.getElementById('promotion-location-status');
const promotionMapPanel = document.getElementById('promotion-map-panel');
const promotionMap = document.getElementById('promotion-map');
const nearbyStoreList = document.getElementById('nearby-store-list');
const nearbyScanStatus = document.getElementById('nearby-scan-status');
const nearbyRefreshButton = document.getElementById('nearby-refresh-button');
const nearbyKeywordInput = document.getElementById('nearby-keyword');
const nearbyRadiusSelect = document.getElementById('nearby-radius');
const placeDetailPanel = document.getElementById('place-detail-panel');
const badgeListEl = document.getElementById('badge-list');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const userNameEl = document.getElementById('user-name');
const headerAvatar = document.getElementById('header-avatar');
const loginForm = document.getElementById('login-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authBack = document.getElementById('auth-back');
const authSubmit = document.getElementById('auth-submit');
const toggleRegister = document.getElementById('toggle-register');
const authQuestion = document.getElementById('auth-question');
const socialLogin = document.getElementById('social-login');
const socialLoginStatus = document.getElementById('social-login-status');
const loginHint = document.getElementById('login-hint');
const registerExtra = document.getElementById('register-extra');
const forgotPasswordBtn = document.getElementById('forgot-password');
const resetPanel = document.getElementById('reset-panel');
const resetForm = document.getElementById('reset-form');
const resetCancel = document.getElementById('reset-cancel');
const resetTitle = document.getElementById('reset-title');
const resetSubtitle = document.getElementById('reset-subtitle');
const resetChannelRow = document.getElementById('reset-channel-row');
const resetCode = document.getElementById('reset-code');
const resetPasswordWrap = document.getElementById('reset-password-wrap');
const resetConfirmWrap = document.getElementById('reset-confirm-wrap');
const resetSubmit = document.getElementById('reset-submit');
const resetHelper = document.getElementById('reset-helper');
const authMain = document.getElementById('auth-main');
const logoutButton = document.getElementById('logout-button');
const profileForm = document.getElementById('profile-form');
const profileAvatar = document.getElementById('profile-avatar');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileSummary = document.getElementById('profile-summary');
const profileResetPassword = document.getElementById('profile-reset-password');
const profileViewHistory = document.getElementById('profile-view-history');
const profileExportData = document.getElementById('profile-export-data');

const API_BASE = '';

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const opts = {
    credentials: 'include',
    ...options,
    headers
  };
  return fetch(url, opts);
}

const state = {
  expenses: [],
  budget: { amount: 0, period: 'Tháng' },
  goals: [],
  categories: [],
  categoryBudgets: [],
  editExpenseId: null,
  analysis: null,
  authenticated: false,
  user: null,
  profile: null,
  locationAllowed: false,
  locationName: 'vị trí của bạn',
  coords: null,
  nearbyStores: [],
  realVouchers: [],
  locationWatchId: null,
  lastNearbyScanAt: 0
};

function switchTab(id) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.id === `tab-${id}`));
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.id.replace('tab-', '')));
});

function formatMoney(value) {
  return Number(value).toLocaleString('vi-VN') + 'đ';
}

function renderCategoryOptions() {
  categorySelect.innerHTML = state.categories.map((category) => `<option value="${category}">${category}</option>`).join('');
}

function renderCategoryFilterOptions() {
  const filterSelect = document.getElementById('expense-filter-category');
  filterSelect.innerHTML = `<option value="">Tất cả danh mục</option>` + state.categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('');
}

function getFilteredExpenses() {
  const query = document.getElementById('expense-search').value.toLowerCase();
  const category = document.getElementById('expense-filter-category').value;
  return state.expenses.filter((expense) => {
    const matchText = `${expense.title} ${expense.note}`.toLowerCase();
    const matchesSearch = !query || matchText.includes(query);
    const matchesCategory = !category || expense.category === category;
    return matchesSearch && matchesCategory;
  });
}

function renderExpenses() {
  const expenses = getFilteredExpenses();
  expenseListEl.innerHTML = '';
  if (!expenses.length) {
    expenseListEl.innerHTML = '<p>Không có giao dịch phù hợp.</p>';
    return;
  }
  expenses.slice(0, 12).forEach((expense) => {
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.innerHTML = `
      <div>
        <strong>${expense.title}</strong>
        <span>${expense.category} · ${expense.date}</span>
        <p>${expense.note || ''}</p>
      </div>
      <div class="expense-actions">
        <span>${formatMoney(expense.amount)}</span>
        <button class="btn-action" onclick="startEditExpense('${expense.id}')">Sửa</button>
        <button class="btn-delete" onclick="deleteExpense('${expense.id}')">Xóa</button>
      </div>
    `;
    expenseListEl.appendChild(item);
  });
}

function renderBudget() {
  currentBudgetEl.textContent = formatMoney(state.budget.amount);
  budgetPeriodEl.textContent = state.budget.period;
}

function renderGoals() {
  goalListEl.innerHTML = '';
  if (!state.goals.length) {
    goalListEl.innerHTML = '<p>Chưa có goal nào.</p>';
    return;
  }
  state.goals.forEach((goal) => {
    const node = document.createElement('div');
    node.className = 'goal-item';
    node.innerHTML = `<strong>${goal.name}</strong><p>Target: ${formatMoney(goal.target)}</p>`;
    goalListEl.appendChild(node);
  });
}

function renderCategoryBudgets() {
  categoryBudgetList.innerHTML = '';
  if (!state.categoryBudgets.length) {
    categoryBudgetList.innerHTML = '<p>Chưa có budget theo hạng mục.</p>';
    return;
  }
  state.categoryBudgets.forEach((budget) => {
    const card = document.createElement('div');
    card.className = 'goal-item';
    card.innerHTML = `
      <strong>${budget.category}</strong>
      <p>Budget: ${formatMoney(budget.amount)}</p>
      <p>Đã chi: ${formatMoney(budget.spent)}</p>
      <p>Trạng thái: ${budget.status}</p>
    `;
    categoryBudgetList.appendChild(card);
  });
}

function renderReport() {
  const total = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avg = state.expenses.length ? Math.round(total / state.expenses.length) : 0;
  const group = {};
  state.expenses.forEach((exp) => {
    group[exp.category] = (group[exp.category] || 0) + exp.amount;
  });
  const top = Object.entries(group).sort((a, b) => b[1] - a[1])[0] || ['Chưa có', 0];
  categoryTopEl.textContent = `${top[0]} (${formatMoney(top[1])})`;
  averageExpenseEl.textContent = formatMoney(avg);
  expenseCountEl.textContent = state.expenses.length;

  categoryChartEl.innerHTML = Object.entries(group)
    .map(([key, value]) => `<div class="report-card"><strong>${key}</strong><span>${formatMoney(value)}</span></div>`)
    .join('') || '<p>Chưa có dữ liệu chi tiêu.</p>';

  if (state.analysis) {
    reportInsightsEl.innerHTML = state.analysis.recommendations
      .map((text) => `<p>• ${text}</p>`)
      .join('');
    if (state.analysis.futurePrediction) {
      forecastSummaryEl.innerHTML = `
        <p><strong>Dự báo tháng:</strong> ${state.analysis.futurePrediction.message}</p>
        <p><strong>Tiền đã chi hiện tại:</strong> ${formatMoney(state.analysis.futurePrediction.currentTotal)}</p>
        <p><strong>Tiền dự kiến cuối tháng:</strong> ${formatMoney(state.analysis.futurePrediction.projectedTotal)}</p>
      `;
    } else {
      forecastSummaryEl.innerHTML = '<p>Không đủ dữ liệu để dự báo chính xác. Hiển thị báo cáo cơ bản.</p>';
    }
  } else {
    reportInsightsEl.innerHTML = '<p>Đang tải phân tích...</p>';
    forecastSummaryEl.innerHTML = '';
  }
}

function renderNotification(message) {
  if (!message) {
    notificationBox.style.display = 'none';
    notificationBox.textContent = '';
    return;
  }
  notificationBox.style.display = 'block';
  notificationBox.textContent = message;
}

function renderBadges(badges = []) {
  badgeListEl.innerHTML = badges.length
    ? badges.map((badge) => `<div class="badge-item">${badge}</div>`).join('')
    : '<p>Chưa có huy hiệu nào. Tiếp tục chi tiêu thông minh để nhận huy hiệu!</p>';
}

function renderLocationStatus() {
  promotionLocationStatus.textContent = state.locationAllowed
    ? `Vị trí thời gian thực: ${state.locationName}`
    : 'Bật vị trí để quét cửa hàng thật gần bạn';
}

function renderPromotionMap() {
  if (!state.coords) {
    promotionMapPanel.classList.add('hidden');
    return;
  }

  const { latitude, longitude } = state.coords;
  const radius = Number(nearbyRadiusSelect.value || 1000);
  const zoom = radius >= 50000 ? 10 : radius >= 25000 ? 11 : radius >= 10000 ? 12 : radius >= 5000 ? 13 : 15;
  const keyword = nearbyKeywordInput.value.trim();
  const mapQuery = keyword ? `${keyword} near ${latitude},${longitude}` : `${latitude},${longitude}`;

  promotionMap.src = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&ll=${latitude},${longitude}&z=${zoom}&output=embed`;
  promotionMapPanel.classList.remove('hidden');
}

function getStoreWebsite(tags = {}) {
  return tags.website || tags['contact:website'] || tags.facebook || tags['contact:facebook'] || '';
}

function getExternalUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function normalizeText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function getSearchCorpus(store) {
  const tags = store.tags || {};
  return normalizeText([
    store.name,
    store.type,
    store.typeLabel,
    Array.isArray(store.types) ? store.types.join(' ') : '',
    tags.cuisine,
    tags.brand,
    tags.operator,
    tags.description,
    tags['name:vi'],
    tags['alt_name']
  ].filter(Boolean).join(' '));
}

function getKeywordIntent(keyword = '') {
  const value = normalizeText(keyword);
  if (!value) return 'general';
  if (/(cafe|coffee|ca phe|caphe|tra sua|milk tea|bubble tea|tea|espresso|roastery)/.test(value)) return 'cafe';
  if (/(cgv|cinema|phim|rap)/.test(value)) return 'cinema';
  if (/(pho|com|bun|banh mi|restaurant|nha hang|quan an|food|sushi|bbq|lau|nuong)/.test(value)) return 'food';
  return 'general';
}

function isCafeStore(store) {
  const corpus = getSearchCorpus(store);
  const type = normalizeText(store.type || '');
  const cafeTerms = [
    'cafe',
    'coffee',
    'coffee shop',
    'ca phe',
    'caphe',
    'espresso',
    'roastery',
    'milk tea',
    'bubble tea',
    'tra sua',
    'tea house',
    'highlands',
    'phuc long',
    'the coffee house',
    'starbucks',
    'trung nguyen',
    'cong ca phe',
    'gong cha',
    'koi',
    'tocotoco',
    'mixue'
  ];
  const restaurantOnlyTerms = ['restaurant', 'nha hang', 'sushi', 'bbq', 'lau', 'nuong', 'izakaya', 'quan nhau'];
  const hasCafeSignal = cafeTerms.some((term) => corpus.includes(term));
  const isCafeType = /(cafe|coffee|tea|bubble_tea|coffee_shop)/.test(type);
  const isRestaurantOnly = restaurantOnlyTerms.some((term) => corpus.includes(term)) && !hasCafeSignal && !isCafeType;
  return (hasCafeSignal || isCafeType) && !isRestaurantOnly;
}

function matchesFoodKeyword(store, keyword) {
  if (!keyword) return true;
  const normalizedKeyword = normalizeText(keyword);
  const corpus = getSearchCorpus(store);
  const intent = getKeywordIntent(keyword);

  if (intent === 'cafe') {
    return isCafeStore(store);
  }

  if (intent === 'cinema') {
    return /(cinema|movie|rap|phim|cgv|lotte cinema|galaxy cinema)/.test(corpus);
  }

  const foodAliases = {
    pho: ['pho', 'phở'],
    'com tam': ['com tam', 'cơm tấm', 'broken rice'],
    'tra sua': ['tra sua', 'trà sữa', 'milk tea', 'bubble tea', 'tea'],
    bun: ['bun', 'bún'],
    banhmi: ['banh mi', 'bánh mì', 'sandwich'],
    cafe: ['cafe', 'coffee', 'ca phe', 'cà phê']
  };

  const aliases = foodAliases[normalizedKeyword];
  if (!aliases) {
    return normalizedKeyword
      .split(/\s+/)
      .filter(Boolean)
      .some((token) => corpus.includes(token));
  }
  return aliases.some((item) => corpus.includes(normalizeText(item)));
}

function getStorePrice(store, keyword = '') {
  const tags = store.tags || {};
  const publicPrice =
    tags.price ||
    tags['price:range'] ||
    tags['payment:price'] ||
    tags['menu:price'];

  
  if (
  publicPrice &&
  !publicPrice.includes('1-') &&
  publicPrice !== '₫' &&
  publicPrice !== 'đ' &&
  publicPrice !== '₫₫'
)
 {
  return {
    label: publicPrice,
    numeric: 0,
    source: 'Giá công khai từ dữ liệu địa điểm'
  };
}if (
  publicPrice &&
  (publicPrice.includes('1-') || publicPrice.startsWith('1 '))
) {
  return {
    label: '30k-55k/ly',
    numeric: 65000,
    source: 'Ước tính theo quán cà phê'
  };
}

  const text = `${normalizeText(keyword)} ${getSearchCorpus(store)}`;
  const rating = Number(store.tags?.rating || 0);
const reviews = Number(store.tags?.userRatingCount || 0);

  // KHÔNG hiển thị giá cho chợ / market
  if (
    text.includes('cho') ||
    text.includes('market') ||
    store.type === 'market'
  ) {
    return {
      label: 'Nhiều mức giá',
      numeric: 999999,
      source: 'Giá thay đổi theo từng gian hàng'
    };
  }

  // QUÁN NƯỚC / TRÀ SỮA / CAFE
  // QUÁN TRÀ SỮA
if (
  text.includes('tra sua') ||
  text.includes('milk tea') ||
  text.includes('bubble tea')
) {
  return {
    label: '35k-60k/ly',
    numeric: 47500,
    source: 'Ước tính theo trà sữa'
  };
}

// CAFE THƯƠNG HIỆU
if (
  text.includes('highlands') ||
  text.includes('the coffee house') ||
  text.includes('trung nguyen') ||
  text.includes('cong ca phe') ||
  text.includes('phuc long') ||
  text.includes('starbucks') ||
  text.includes('king coffee') ||
  text.includes('aha cafe') ||
  text.includes('viva star') ||
  text.includes('milano') ||
  text.includes('kafa')
) {
  return {
    label: '35k-100k/ly',
    numeric: 55000,
    source: 'Ước tính theo thương hiệu cà phê'
  };
}

// QUÁN CAFE VIEW ĐẸP / CHECK-IN
if (
  rating >= 4.2 &&
  reviews >= 100 &&
  (
    text.includes('rooftop') ||
    text.includes('lounge') ||
    text.includes('studio') ||
    text.includes('specialty') ||
    text.includes('sunset') ||
    text.includes('garden') ||
    text.includes('view')
  )
) {
  return {
    label: '60k-100k/ly',
    numeric: 80000,
    source: 'Ước tính theo quán cà phê view đẹp'
  };
}

// QUÁN CAFE MÁY LẠNH / DECOR ĐẸP
if (
  rating >= 3.5 &&
  reviews >= 50 &&
  (
    text.includes('coffee') ||
    text.includes('cafe') ||
    text.includes('espresso') ||
    text.includes('specialty') ||
    text.includes('roastery')
  )
) {
  return {
    label: '30k-55k/ly',
    numeric: 45000,
    source: 'Ước tính theo quán cà phê máy lạnh'
  };
}

// QUÁN CAFE BÌNH DÂN
if (
  text.includes('coffee') ||
  text.includes('cafe') ||
  text.includes('ca phe')
) {
  return {
    label: '15k-25k/ly',
    numeric: 20000,
    source: 'Ước tính theo quán cà phê bình dân'
  };
}

  // MÓN ĂN
  if (text.includes('pho')) {
    return {
      label: '45k-70k/tô',
      numeric: 57500,
      source: 'Ước tính theo món phở'
    };
  }

  if (text.includes('com tam') || text.includes('broken rice')) {
    return {
      label: '40k-65k/phần',
      numeric: 52500,
      source: 'Ước tính theo cơm tấm'
    };
  }

  // TYPE
  if (store.type === 'fast_food') {
    return {
      label: '45k-90k/phần',
      numeric: 67500,
      source: 'Ước tính theo quán ăn nhanh'
    };
  }

  if (store.type === 'restaurant') {
    return {
      label: '60k-150k/người',
      numeric: 105000,
      source: 'Ước tính theo nhà hàng'
    };
  }

  if (store.type === 'cinema') {
    return {
      label: '70k-120k/vé',
      numeric: 95000,
      source: 'Ước tính theo rạp chiếu phim'
    };
  }

  return {
    label: 'Chưa có giá',
    numeric: 999999,
    source: 'Chưa có dữ liệu giá phù hợp'
  };
}

 

function getValueScore(store, price) {
  if (!price.numeric || price.numeric >= 999999) return 'Cần xem menu';
  if (store.distance <= 500 && price.numeric <= 60000) return 'Đáng chọn';
  if (store.distance <= 1000 && price.numeric <= 80000) return 'Hợp lý';
  return 'So sánh thêm';
}

function getRadiusBounds(coords, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(coords.latitude * Math.PI / 180));
  return {
    minLat: coords.latitude - latDelta,
    maxLat: coords.latitude + latDelta,
    minLon: coords.longitude - lonDelta,
    maxLon: coords.longitude + lonDelta
  };
}

function getGooglePriceLabel(price = '') {
  const levels = {
    FREE: 'Miễn phí',
    INEXPENSIVE: 'Giá thấp',
    MODERATE: 'Giá vừa',
    EXPENSIVE: 'Giá cao',
    VERY_EXPENSIVE: 'Rất cao'
  };
  return levels[price] || '';
}

function mapGooglePlace(place, coords) {
  if (!place.lat || !place.lon || !place.name) return null;
  const source = place.source || 'google_places';
  const type = place.types?.find((item) => /cafe|coffee|tea|restaurant|food|cinema/i.test(item))
    || place.types?.[0]
    || place.type
    || 'place';
  const apiTypeLabel = place.typeLabel || '';
  const typeLabel = apiTypeLabel && !/Google Places|SerpApi Maps/i.test(apiTypeLabel)
    ? apiTypeLabel
    : getAmenityLabel(type);
  return {
    id: `${source}-${place.id}`,
    source,
    rawPlaceId: place.rawPlaceId || place.id,
    placeId: place.placeId || '',
    dataId: place.dataId || '',
    dataCid: place.dataCid || '',
    name: place.name,
    type,
    types: place.types || [],
    typeLabel,
    tags: {
      name: place.name,
      website: place.website,
      phone: place.phone,
      price: getGooglePriceLabel(place.price) || place.price,
      description: place.address,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      types: place.types?.join(' ') || place.type || ''
    },
    lat: place.lat,
    lon: place.lon,
    googleMapsUrl: place.googleMapsUrl,
    distance: getDistanceMeters(coords, { lat: place.lat, lon: place.lon })
  };
}

async function searchGooglePlaces(keyword, radius, coords) {
  const searchQuery = keyword || 'nhà hàng quán cà phê trà sữa rạp chiếu phim';
  try {
    const response = await apiFetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.places || [])
      .map((place) => mapGooglePlace(place, coords))
      .filter(Boolean)
      .filter((place) => place.distance <= radius)
      .filter((place) => matchesFoodKeyword(place, keyword));
  } catch (error) {
    console.error('Google Places search error', error);
    return [];
  }
}

function getRealVoucherFromStore(store) {
  const tags = store.tags || {};
  const sourceText = [
    tags.offer,
    tags.voucher,
    tags.discount,
    tags.promotion,
    tags.description
  ].filter(Boolean).join(' ');
  const normalized = normalizeText(sourceText);

  if (!normalized || !/(voucher|khuyen mai|uu dai|discount|sale|giam|promo|promotion)/.test(normalized)) {
    return null;
  }

  return {
    storeId: store.id,
    title: store.name,
    description: sourceText,
    tag: store.typeLabel || 'Ưu đãi cửa hàng',
    mapUrl: getGoogleMapsUrl(store),
    website: getExternalUrl(getStoreWebsite(tags)),
    distance: store.distance
  };
}

function updateRealVouchersFromStores() {
  state.realVouchers = state.nearbyStores
    .map(getRealVoucherFromStore)
    .filter(Boolean);
  renderPromotions();
  if (state.realVouchers.length) {
    showVoucherGate();
  } else {
    hideVoucherGate(false);
  }
}

function mapNominatimPlace(place, coords) {
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  if (!lat || !lon || !place.display_name) return null;

  const type = place.type === 'cinema' ? 'cinema' : place.type || place.category || 'place';
  const shortName = place.name || place.display_name.split(',')[0];
  const tags = {
    name: shortName,
    website: place.extratags?.website,
    cuisine: place.extratags?.cuisine,
    brand: place.extratags?.brand,
    operator: place.extratags?.operator,
    description: place.display_name,
    price: place.extratags?.price || place.extratags?.['price:range']
  };

  return {
    id: `nominatim-${place.osm_type}-${place.osm_id}`,
    source: 'nominatim',
    name: shortName,
    type,
    typeLabel: getAmenityLabel(type),
    tags,
    lat,
    lon,
    distance: getDistanceMeters(coords, { lat, lon })
  };
}

function mapOSMPlace(place, coords) {
  return {
    id: place.id,
    source: 'osm',
    name: place.name,
    type: place.type,
    typeLabel: place.typeLabel,
    address: place.address,
    lat: place.lat,
    lon: place.lon,
    website: place.website,
    phone: place.phone,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    price: place.price,
    tags: place.tags,
    distance: place.distance,
    priority: place.priority
  };
}

async function searchPlacesByKeyword(keyword, radius, coords) {
  if (!keyword) return [];

  const bounds = getRadiusBounds(coords, radius);
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: keyword,
    limit: '20',
    bounded: '1',
    addressdetails: '1',
    extratags: '1',
    viewbox: `${bounds.minLon},${bounds.maxLat},${bounds.maxLon},${bounds.minLat}`
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) return [];
  const places = await response.json();
  return places
    .map((place) => mapNominatimPlace(place, coords))
    .filter(Boolean)
    .filter((place) => place.distance <= radius);
}

function dedupeStores(stores) {
  const seen = new Set();
  return stores.filter((store) => {
    const key = normalizeText(`${store.name}-${store.lat.toFixed(4)}-${store.lon.toFixed(4)}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getGoogleMapsUrl(store) {
  // Ưu tiên URL từ API (đã chính xác)
  if (store.googleMapsUrl) {
    return store.googleMapsUrl;
  }

  // Nếu có placeId, tạo URL với place_id (chính xác nhất)
  if (store.placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${store.placeId}`;
  }

  // Nếu có rawPlaceId (từ Google Places), tạo URL với place_id
  if (store.rawPlaceId) {
    return `https://www.google.com/maps/place/?q=place_id:${store.rawPlaceId}`;
  }

  // Fallback: dùng tọa độ (có thể hiện nhiều kết quả)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.lat},${store.lon}`)}`;
}

function getRadiusLabel() {
  const radius = Number(nearbyRadiusSelect.value || 1000);
  return radius < 1000 ? `${radius}m` : `${(radius / 1000).toLocaleString('vi-VN')}km`;
}

function renderNearbyStores() {
  if (!nearbyStoreList) return;
  if (!state.locationAllowed) {
    nearbyStoreList.innerHTML = '';
    nearbyScanStatus.textContent = 'Đang chờ bật vị trí để quét nhà hàng, quán ăn và quán nước.';
    state.realVouchers = [];
    renderPromotions();
    return;
  }
  if (!state.nearbyStores.length) {
    const keyword = nearbyKeywordInput.value.trim();
    const price = getStorePrice({ type: 'place', typeLabel: 'Google Maps', tags: {}, name: keyword }, keyword);
    nearbyStoreList.innerHTML = `
      <div class="nearby-store-card google-fallback-card">
        <div>
          <span class="store-type">Google Maps</span>
          <strong>${keyword ? `Kết quả cho "${keyword}" gần bạn` : 'Địa điểm gần bạn'}</strong>
          <p>Google Maps có thể có địa điểm trong phạm vi ${getRadiusLabel()}, nhưng nguồn dữ liệu nội bộ chưa có đủ chi tiết để liệt kê tên quán.</p>
        </div>
        <div class="store-price">
          <span>${price.label}</span>
          <small>${price.source}</small>
          <strong>Mở để xem</strong>
        </div>
        <div class="store-actions">
          <a href="${getGoogleSearchUrl()}" target="_blank" rel="noopener">Xem kết quả trên Google Maps</a>
        </div>
      </div>
    `;
    return;
  }

  nearbyStoreList.innerHTML = state.nearbyStores
    .map((store) => {
      const price = getStorePrice(store, nearbyKeywordInput.value.trim());
      const score = getValueScore(store, price);
      const website = getExternalUrl(getStoreWebsite(store.tags));

      // Tạo Google Maps URL chính xác
      const mapUrl = getGoogleMapsUrl(store);

      const rating = store.tags?.rating
        ? `<p>${Number(store.tags.rating).toLocaleString('vi-VN')} sao · ${Number(store.tags.userRatingCount || 0).toLocaleString('vi-VN')} đánh giá</p>`
        : '';
      const canShowDetail = store.source === 'google_places' || store.source === 'serpapi' || store.source === 'osm';
      return `
        <div class="nearby-store-card">
          <div>
            <span class="store-type">${store.typeLabel} ${store.source === 'osm' ? '🏪' : store.source === 'google_places' ? '🌐' : '🔍'}</span>
            <strong>${store.name}</strong>
            <p>${store.distance}m từ vị trí hiện tại</p>
            ${rating}
          </div>
          <div class="store-price">
            <span>${price.label}</span>
            <small>${price.source}</small>
            <strong>${score}</strong>
          </div>
          <div class="store-actions">
            ${website ? `<a href="${website}" target="_blank" rel="noopener">Website</a>` : '<span>Chưa có website</span>'}
            <a href="${mapUrl}" target="_blank" rel="noopener">Google Maps</a>
            ${canShowDetail ? `<button type="button" class="place-detail-btn" data-store-id="${store.id}">Chi tiết</button>` : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderPlaceDetail(detail) {
  const hours = Array.isArray(detail.hours)
    ? detail.hours.join('<br>')
    : Object.entries(detail.hours || {}).map(([day, value]) => `${day}: ${value}`).join('<br>');
  const rating = detail.rating
    ? `<p>${Number(detail.rating).toLocaleString('vi-VN')} sao · ${Number(detail.userRatingCount || 0).toLocaleString('vi-VN')} đánh giá</p>`
    : '';

  // Render reviews section
  const reviewsHtml = (detail.reviews && detail.reviews.length > 0)
    ? `<div class="place-reviews">
        <h5>Đánh giá gần đây (${detail.reviews.length})</h5>
        ${detail.reviews.map(review => `
          <div class="review-item">
            <div class="review-header">
              <strong>${review.authorName}</strong>
              <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
            </div>
            ${review.relativeTime ? `<small>${review.relativeTime}</small>` : ''}
            ${review.text ? `<p class="review-text">${review.text}</p>` : ''}
          </div>
        `).join('')}
      </div>`
    : '';

  // Render photos gallery
  const photosHtml = (detail.photos && detail.photos.length > 0)
    ? `<div class="place-photos">
        <h5>Hình ảnh (${detail.photos.length})</h5>
        <div class="photos-grid">
          ${detail.photos.slice(0, 6).map((photo, index) => `
            <img src="https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=200&maxWidthPx=200&key=${detail.source === 'google_places' ? 'AIzaSyBEXouNdnzMeu4OdQhFdeL_A4sitCJhYXE' : ''}"
                 alt="Photo ${index + 1}"
                 class="place-photo"
                 loading="lazy" />
          `).join('')}
        </div>
      </div>`
    : '';

  // Render services
  const servicesHtml = (detail.services && detail.services.length > 0)
    ? `<div class="place-services">
        <h5>Dịch vụ & Tiện ích</h5>
        <div class="services-list">
          ${detail.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
        </div>
      </div>`
    : '';

  placeDetailPanel.innerHTML = `
    <div class="place-detail-card">
      <div class="place-detail-heading">
        <div>
          <span>${detail.source === 'serpapi' ? 'SerpApi Place Result' : 'Google Places Detail'}</span>
          <h4>${detail.name}</h4>
          ${rating}
        </div>
        <button type="button" id="place-detail-close" class="btn-action">Đóng</button>
      </div>
      ${detail.thumbnail ? `<img src="${detail.thumbnail}" alt="${detail.name}" class="place-detail-image" />` : ''}
      <div class="place-detail-grid">
        ${detail.address ? `<p><strong>Địa chỉ:</strong> ${detail.address}</p>` : ''}
        ${detail.phone ? `<p><strong>Điện thoại:</strong> ${detail.phone}</p>` : ''}
${
  detail.price &&
  detail.price !== '₫' &&
  detail.price !== 'đ' &&
  detail.price !== '₫₫'
    ? `<p><strong>Mức giá:</strong> ${getGooglePriceLabel(detail.price) || detail.price}</p>`
    : ''
}        ${detail.openState ? `<p><strong>Trạng thái:</strong> ${detail.openState}</p>` : ''}
        ${hours ? `<p><strong>Giờ mở cửa:</strong><br>${hours}</p>` : ''}
        ${detail.description ? `<p><strong>Mô tả:</strong> ${detail.description}</p>` : ''}
      </div>
      ${servicesHtml}
      ${photosHtml}
      ${reviewsHtml}
      <div class="store-actions">
        ${detail.website ? `<a href="${getExternalUrl(detail.website)}" target="_blank" rel="noopener">🌐 Website</a>` : ''}
        ${detail.googleMapsUrl ? `<a href="${detail.googleMapsUrl}" target="_blank" rel="noopener">🗺️ Google Maps</a>` : ''}
      </div>
    </div>
  `;
  placeDetailPanel.classList.remove('hidden');
  document.getElementById('place-detail-close').addEventListener('click', () => {
    placeDetailPanel.classList.add('hidden');
  });
}

async function showPlaceDetail(storeId) {
  const store = state.nearbyStores.find((item) => item.id === storeId);
  if (!store) return;

  placeDetailPanel.classList.remove('hidden');

  // Nếu là OSM place, hiển thị thông tin cơ bản luôn
  if (store.source === 'osm') {
    renderPlaceDetail({
      source: 'osm',
      name: store.name,
      address: store.address || '',
      website: store.website || '',
      phone: store.phone || '',
      rating: store.rating,
      userRatingCount: store.userRatingCount,
      price: store.price || '',
      type: store.type,
      typeLabel: store.typeLabel,
      thumbnail: '',
      openState: 'Thông tin từ OpenStreetMap',
      hours: [],
      description: `Quán nhỏ địa phương - ${store.typeLabel}`,
      reviews: [],
      photos: [],
      services: [],
      googleMapsUrl: getGoogleMapsUrl(store)
    });
    return;
  }

  // Với Google Places và SerpAPI, gọi API để lấy chi tiết
  placeDetailPanel.innerHTML = '<div class="place-detail-card"><p>Đang tải chi tiết địa điểm...</p></div>';
  try {
    const response = await apiFetch('/api/places/detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: store.source,
        placeId: store.rawPlaceId || store.placeId,
        dataId: store.dataId,
        dataCid: store.dataCid,
        latitude: store.lat,
        longitude: store.lon
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không tải được chi tiết');
    renderPlaceDetail(payload.detail);
  } catch (error) {
    placeDetailPanel.innerHTML = `<div class="place-detail-card"><p>${error.message}</p></div>`;
  }
}

function getDistanceMeters(from, to) {
  const earthRadius = 6371000;
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const deltaLat = (to.lat - from.latitude) * Math.PI / 180;
  const deltaLon = (to.lon - from.longitude) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getAmenityLabel(type) {
  const normalizedType = normalizeText(type || '');
  if (normalizedType.includes('nha hang') || normalizedType.includes('restaurant')) return 'Nhà hàng';
  if (normalizedType.includes('coffee') || normalizedType.includes('cafe') || normalizedType.includes('ca phe')) return 'Quán cà phê';
  if (normalizedType.includes('tea') || normalizedType.includes('tra sua') || normalizedType.includes('bubble')) return 'Quán nước';
  if (type === 'cinema') return 'Giải trí';
  if (type === 'bar' || type === 'pub') return 'Quán nước';
  if (type === 'amusement_arcade' || type === 'bowling_alley') return 'Khu vui chơi';
  if (type === 'attraction') return 'Địa điểm vui chơi';
  if (type === 'cafe' || type === 'coffee_shop') return 'Quán cà phê';
  if (type === 'fast_food') return 'Quán ăn nhanh';
  if (type === 'restaurant') return 'Nhà hàng';
  if (type === 'ice_cream') return 'Quán kem';
  if (type === 'juice_bar') return 'Quán nước ép';
  if (type === 'food_court') return 'Khu ăn uống';
  if (type === 'bakery') return 'Tiệm bánh';
  if (type === 'confectionery' || type === 'chocolate') return 'Tiệm kẹo';
  return 'Quán ăn';
}

async function scanNearbyStores() {
  if (!state.coords) return;

  state.lastNearbyScanAt = Date.now();
  const radius = Math.min(Number(nearbyRadiusSelect.value || 1000), 50000);
  const keyword = nearbyKeywordInput.value.trim();
  nearbyScanStatus.textContent = keyword
    ? `Đang tìm "${keyword}" trong phạm vi ${(radius / 1000).toLocaleString('vi-VN')}km...`
    : `Đang quét địa điểm trong phạm vi ${(radius / 1000).toLocaleString('vi-VN')}km...`;
  nearbyRefreshButton.disabled = true;
  renderPromotionMap();

  const { latitude, longitude } = state.coords;
  const keywordRegex = keyword
    ? normalizeText(keyword)
      .split(/\s+/)
      .filter(Boolean)
      .join('|')
    : '';
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream|cinema"](around:${radius},${latitude},${longitude});
      way["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream|cinema"](around:${radius},${latitude},${longitude});
      relation["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream|cinema"](around:${radius},${latitude},${longitude});
      node["leisure"~"amusement_arcade|bowling_alley|park"](around:${radius},${latitude},${longitude});
      way["leisure"~"amusement_arcade|bowling_alley|park"](around:${radius},${latitude},${longitude});
      node["tourism"~"attraction"](around:${radius},${latitude},${longitude});
      way["tourism"~"attraction"](around:${radius},${latitude},${longitude});
      ${keywordRegex ? `node["name"~"${keywordRegex}",i](around:${radius},${latitude},${longitude});` : ''}
      ${keywordRegex ? `way["name"~"${keywordRegex}",i](around:${radius},${latitude},${longitude});` : ''}
      ${keywordRegex ? `node["cuisine"~"${keywordRegex}",i](around:${radius},${latitude},${longitude});` : ''}
      ${keywordRegex ? `way["cuisine"~"${keywordRegex}",i](around:${radius},${latitude},${longitude});` : ''}
    );
    out center tags 80;
  `;

  try {
    const [googleResult, overpassResult, keywordResult] = await Promise.allSettled([
      searchGooglePlaces(keyword, radius, state.coords),
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      }),
      searchPlacesByKeyword(keyword, radius, state.coords)
    ]);

    let overpassPlaces = [];
    if (overpassResult.status === 'fulfilled' && overpassResult.value.ok) {
      const data = await overpassResult.value.json();
      overpassPlaces = data.elements
      .map((item) => {
        const lat = item.lat || item.center?.lat;
        const lon = item.lon || item.center?.lon;
        const type = item.tags?.amenity || item.tags?.leisure || item.tags?.tourism || 'store';
        if (!lat || !lon || !item.tags?.name) return null;
        return {
          id: item.id,
          name: item.tags.name,
          type,
          typeLabel: getAmenityLabel(type),
          tags: item.tags || {},
          lat,
          lon,
          distance: getDistanceMeters(state.coords, { lat, lon })
        };
      })
      .filter(Boolean);
    }

    const googlePlaces = googleResult.status === 'fulfilled' ? googleResult.value : [];
    const keywordPlaces = keywordResult.status === 'fulfilled' ? keywordResult.value : [];
    state.nearbyStores = dedupeStores([...googlePlaces, ...keywordPlaces, ...overpassPlaces])
     .filter((store) => matchesFoodKeyword(store, keyword))

      .sort((a, b) => {
        const googleA = a.source === 'google_places' || a.source === 'serpapi' ? 0 : 1;
        const googleB = b.source === 'google_places' || b.source === 'serpapi' ? 0 : 1;
        if (googleA !== googleB) return googleA - googleB;
       const ratingA = Number(a.tags?.rating || 0);
const ratingB = Number(b.tags?.rating || 0);

if (ratingA !== ratingB) {
  return ratingB - ratingA;
}
        return a.distance - b.distance;
      })
      .slice(0, 12);

    nearbyScanStatus.textContent = keyword
      ? state.nearbyStores.length
        ? `Tìm thấy ${state.nearbyStores.length} kết quả cho "${keyword}" trong phạm vi ${getRadiusLabel()}.`
        : `Google Maps đang hiển thị kết quả cho "${keyword}". Mở Google Maps để xem tên quán chi tiết.`
      : `Đã quét ${state.nearbyStores.length} địa điểm trong phạm vi tối đa ${getRadiusLabel()}.`;
    renderNearbyStores();
    updateRealVouchersFromStores();
  } catch (error) {
    console.error('Nearby store scan error', error);
    nearbyScanStatus.textContent = 'Không quét được dữ liệu cửa hàng lúc này. Vui lòng thử lại sau.';
  } finally {
    nearbyRefreshButton.disabled = false;
  }
}

function renderPromotions() {
  const vouchers = state.realVouchers || [];
  if (!vouchers.length) {
    const empty = `
      <div class="promotion-empty">
        <strong>Chưa có voucher thực từ cửa hàng gần bạn</strong>
        <p>Bật vị trí hoặc quét lại để lấy địa điểm thật từ Google Places/SerpAPI. SmartSpend chỉ hiện voucher khi dữ liệu cửa hàng có thông tin ưu đãi rõ ràng.</p>
      </div>
    `;
    promotionListEl.innerHTML = empty;
    if (voucherGateList) voucherGateList.innerHTML = empty;
    return;
  }

  const markup = vouchers
    .map((promo) => `
      <div class="promotion-card real-voucher-card">
        <div class="promo-poster-content">
          <div class="promo-topline">
            <span class="promo-badge">${promo.tag}</span>
            <span class="promo-chip">${promo.distance}m</span>
          </div>
          <strong>${promo.title}</strong>
          <p>${promo.description}</p>
          <div class="promo-footer">
            <span class="promo-discount">Voucher</span>
            <a class="promo-claim-btn" href="${promo.website || promo.mapUrl}" target="_blank" rel="noopener">Mở cửa hàng</a>
          </div>
        </div>
      </div>
    `)
    .join('');
  promotionListEl.innerHTML = markup;
  if (voucherGateList) {
    voucherGateList.innerHTML = markup;
  }
  enablePromotionDrag();
}

function enablePromotionDrag() {
  if (promotionListEl.dataset.dragReady === 'true') return;
  promotionListEl.dataset.dragReady = 'true';

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  promotionListEl.addEventListener('pointerdown', (event) => {
    isDown = true;
    startX = event.clientX;
    scrollLeft = promotionListEl.scrollLeft;
    promotionListEl.classList.add('is-dragging');
    promotionListEl.setPointerCapture(event.pointerId);
  });

  promotionListEl.addEventListener('pointermove', (event) => {
    if (!isDown) return;
    event.preventDefault();
    const walk = event.clientX - startX;
    promotionListEl.scrollLeft = scrollLeft - walk;
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
    promotionListEl.addEventListener(eventName, () => {
      isDown = false;
      promotionListEl.classList.remove('is-dragging');
    });
  });
}

function scrollPromotions(direction) {
  promotionListEl.scrollBy({
    left: direction * Math.max(240, promotionListEl.clientWidth * 0.86),
    behavior: 'smooth'
  });
}

function showVoucherGate() {
  if (!voucherGate || sessionStorage.getItem('voucherGateSkipped') === 'true') return;
  if (!state.realVouchers.length) return;
  voucherGate.classList.remove('hidden');
}

function hideVoucherGate(remember = true) {
  if (!voucherGate) return;
  if (remember) {
    sessionStorage.setItem('voucherGateSkipped', 'true');
  }
  voucherGate.classList.add('hidden');
}

function setAuthenticated(authenticated, user = null) {
  state.authenticated = authenticated;
  state.user = user;
  state.profile = user || null;
  const displayName = user?.fullName || user?.username || 'Khách';
  const avatar = user?.avatar || 'assets/logo/app-logo.svg';
  userNameEl.textContent = displayName;
  if (headerAvatar) headerAvatar.src = avatar;
  renderProfile();
  if (authenticated) {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    hideVoucherGate(false);
  } else {
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    hideVoucherGate(false);
  }
}

function renderProfile() {
  if (!profileForm) return;
  const profile = state.profile || state.user || {};
  const displayName = profile.fullName || profile.username || 'Hồ sơ cá nhân';
  const email = profile.email || 'Chưa thêm email';
  const avatar = profile.avatar || 'assets/logo/app-logo.svg';

  profileDisplayName.textContent = displayName;
  profileEmail.textContent = email;
  profileAvatar.src = avatar;
  document.getElementById('profile-fullname').value = profile.fullName || '';
  document.getElementById('profile-email-input').value = profile.email || '';
  document.getElementById('profile-birthday').value = profile.birthday || '';
  document.getElementById('profile-phone').value = profile.phone || '';
  document.getElementById('profile-avatar-select').value = avatar;
  if (headerAvatar) headerAvatar.src = avatar;

  const total = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const wallet = Number(profile.wallet || 0);
  profileSummary.innerHTML = `
    <div><span>Tài khoản</span><strong>${profile.username || '-'}</strong></div>
    <div><span>Số giao dịch</span><strong>${state.expenses.length}</strong></div>
    <div><span>Tổng đã chi</span><strong>${formatMoney(total)}</strong></div>
    <div><span>Số dư khai báo</span><strong>${formatMoney(wallet)}</strong></div>
  `;
}

async function loadProfile() {
  const res = await apiFetch('/api/profile');
  if (!res.ok) return;
  const profile = await res.json();
  state.profile = profile;
  state.user = { ...(state.user || {}), ...profile };
  renderProfile();
}

async function checkSession() {
  try {
    const response = await apiFetch('/api/session');
    if (!response.ok) {
      setAuthenticated(false);
      return;
    }
    const data = await response.json();
    setAuthenticated(data.authenticated, data.user);
    if (data.authenticated) {
      await initializeApp();
    }
  } catch (error) {
    console.error('Session check error', error);
    setAuthenticated(false);
  }
}

function updateLocationState(coords) {
  const lat = coords.latitude;
  const lon = coords.longitude;
  const area = lat >= 16.0 ? 'khu vực phía Nam' : 'khu vực phía Bắc';
  state.locationAllowed = true;
  state.coords = { latitude: lat, longitude: lon };
  state.locationName = `${area} (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
  renderLocationStatus();
  renderPromotionMap();
      renderPromotions();
      if (!state.nearbyStores.length || Date.now() - state.lastNearbyScanAt > 30000) {
    scanNearbyStores();
  }
}

async function requestLocationForPromotions() {
  if (!navigator.geolocation) {
    alert('Trình duyệt của bạn không hỗ trợ định vị vị trí.');
    return;
  }
  promotionLocationButton.disabled = true;
  promotionLocationButton.textContent = 'Đang theo dõi vị trí...';

  if (state.locationWatchId !== null) {
    navigator.geolocation.clearWatch(state.locationWatchId);
  }

  state.locationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      updateLocationState(position.coords);
      promotionLocationButton.textContent = 'Đang cập nhật vị trí live';
      promotionLocationButton.disabled = false;
    },
    (error) => {
      console.error('Geolocation error', error);
      promotionLocationButton.textContent = 'Bật vị trí để quét cửa hàng gần bạn';
      promotionLocationButton.disabled = false;
      alert('Không thể lấy vị trí hiện tại. Vui lòng bật vị trí trên trình duyệt và thử lại.');
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
}

async function initializeApp() {
  await loadProfile();
  await loadCategories();
  await loadData();
}

promotionLocationButton.addEventListener('click', requestLocationForPromotions);
nearbyRefreshButton.addEventListener('click', scanNearbyStores);
nearbyKeywordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    scanNearbyStores();
  }
});
nearbyRadiusSelect.addEventListener('change', scanNearbyStores);
nearbyStoreList.addEventListener('click', (event) => {
  const button = event.target.closest('.place-detail-btn');
  if (!button) return;
  showPlaceDetail(button.dataset.storeId);
});
promotionPrevButton.addEventListener('click', () => scrollPromotions(-1));
promotionNextButton.addEventListener('click', () => scrollPromotions(1));
voucherGateSkip.addEventListener('click', () => hideVoucherGate());
voucherGateLocation.addEventListener('click', async () => {
  hideVoucherGate();
  await requestLocationForPromotions();
});

window.startEditExpense = function (id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) return;
  document.getElementById('expense-title').value = expense.title;
  document.getElementById('expense-amount').value = expense.amount;
  document.getElementById('expense-category').value = expense.category;
  document.getElementById('expense-date').value = expense.date;
  document.getElementById('expense-note').value = expense.note;
  document.getElementById('expense-form-submit').textContent = 'Cập nhật chi tiêu';
  state.editExpenseId = id;
  switchTab('add');
};

window.deleteExpense = async function (id) {
  if (!confirm('Bạn có chắc muốn xóa giao dịch này không?')) return;
  const response = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    alert('Xóa thất bại. Vui lòng thử lại.');
    return;
  }
  await loadData();
};

async function loadData() {
  const [expensesRes, budgetRes, goalsRes, categoryBudgetsRes, categoriesRes] = await Promise.all([
    apiFetch('/api/expenses'),
    apiFetch('/api/budget'),
    apiFetch('/api/goals'),
    apiFetch('/api/category-budgets'),
    apiFetch('/api/categories')
  ]);
  state.expenses = await expensesRes.json();
  state.budget = await budgetRes.json();
  state.goals = await goalsRes.json();
  state.categoryBudgets = await categoryBudgetsRes.json();
  state.categories = await categoriesRes.json();
  const insightRes = await apiFetch('/api/insights');
  const insights = await insightRes.json();
  state.analysis = insights;
  totalExpenseEl.textContent = formatMoney(insights.totalExpense);
  budgetAmountEl.textContent = formatMoney(state.budget.amount);
  budgetStatusEl.textContent = insights.status;
  topCategoryEl.textContent = insights.topCategory;
  recommendationsEl.innerHTML = insights.recommendations.map((text) => `<p>• ${text}</p>`).join('');
  renderExpenses();
  renderBudget();
  renderGoals();
  renderReport();
  renderCategoryOptions();
  renderCategoryFilterOptions();
  renderCategoryBudgets();
  renderBadges(insights.badges);
  renderPromotions();
  renderLocationStatus();
  renderNotification(insights.alert);
  renderProfile();
}

async function loadCategories() {
  const res = await apiFetch('/api/categories');
  if (res.ok) {
    state.categories = await res.json();
  } else {
    const expensesRes = await apiFetch('/api/expenses');
    const expenses = expensesRes.ok ? await expensesRes.json() : [];
    const categories = new Set(expenses.map((item) => item.category || ''));
    state.categories = [...categories, 'Shopping', 'Health', 'Other'];
  }
  renderCategoryOptions();
  renderCategoryFilterOptions();
}

async function createExpense(payload) {
  return apiFetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

expenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = document.getElementById('expense-title').value;
  const amount = Number(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const note = document.getElementById('expense-note').value;
  const payload = { title, amount, category, date, note };

  let response;
  if (state.editExpenseId) {
    response = await apiFetch(`/api/expenses/${state.editExpenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    response = await createExpense(payload);
  }

  if (response.status === 409 && !state.editExpenseId) {
    const body = await response.json();
    if (body.issue === 'duplicate') {
      const confirmed = window.confirm(`Đã phát hiện giao dịch giống trước đó: [${body.similar.title}] ${body.similar.amount.toLocaleString('vi-VN')}đ, ${body.similar.category}. Bạn có muốn tạo thêm?`);
      if (!confirmed) return;
      response = await createExpense({ ...payload, force: true });
    } else if (body.issue === 'unusual') {
      const confirmed = window.confirm(`${body.message} Bạn có muốn tiếp tục lưu?`);
      if (!confirmed) return;
      response = await createExpense({ ...payload, force: true });
    }
  }

  if (!response.ok) {
    alert('Lưu chi tiêu không thành công. Vui lòng thử lại.');
    return;
  }

  expenseForm.reset();
  document.getElementById('expense-form-submit').textContent = 'Lưu chi tiêu';
  state.editExpenseId = null;
  await loadData();
  switchTab('dashboard');
});

budgetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('budget-input').value);
  const category = budgetCategorySelect.value;
  const period = document.getElementById('budget-period-select').value;
  const payload = category ? { category, amount, period } : { amount, period };
  const url = category ? '/api/category-budgets' : '/api/budget';

  let response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.status === 409) {
    const body = await response.json();
    if (body.issue === 'budget_exists') {
      const confirmed = window.confirm(`${body.message} Bạn muốn cập nhật ngân sách hiện tại không?`);
      if (!confirmed) return;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, force: true })
      });
    }
  }

  if (!response.ok) {
    alert('Cập nhật ngân sách không thành công. Vui lòng thử lại.');
    return;
  }
  await loadData();
});

goalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('goal-name').value;
  const target = Number(document.getElementById('goal-target').value);
  await apiFetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, target })
  });
  goalForm.reset();
  await loadData();
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = chatMessage.value.trim();
  if (!message) return;
  const userNode = document.createElement('div');
  userNode.className = 'chat-message user';
  userNode.textContent = message;
  chatHistory.appendChild(userNode);
  chatMessage.value = '';

  const res = await apiFetch('/api/ai-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json();

  const aiNode = document.createElement('div');
  aiNode.className = 'chat-message ai';
  aiNode.textContent = data.reply || 'Hệ thống chưa trả lời.';
  chatHistory.appendChild(aiNode);
  chatHistory.scrollTop = chatHistory.scrollHeight;
});

let registerMode = false;
let resetStep = 'request';
let resetChannel = 'gmail';
let resetLogin = '';

function setAuthMode(isRegister) {
  registerMode = isRegister;
  if (resetPanel && authMain && authBack) showAuthMain();
  authTitle.textContent = isRegister ? 'Chào người dùng mới!' : 'Chào mừng trở lại!';
  authSubtitle.textContent = isRegister ? 'Chào mừng bạn đến với ứng dụng' : 'Chào mừng trở lại bạn đã bị bỏ lỡ!';
  authSubmit.textContent = isRegister ? 'Đăng ký' : 'Đăng Nhập';
  registerExtra.classList.toggle('hidden', !isRegister);
  forgotPasswordBtn.classList.toggle('hidden', isRegister);
  socialLogin.classList.toggle('hidden', isRegister);
  authQuestion.textContent = isRegister ? 'Đã có tài khoản?' : 'Không có tài khoản?';
  toggleRegister.textContent = isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay';
  document.getElementById('register-fullname').required = isRegister;
  document.getElementById('register-email').required = isRegister;
  document.getElementById('register-password').required = isRegister;
  document.getElementById('register-password-confirm').required = isRegister;
  document.getElementById('login-username').classList.toggle('hidden', isRegister);
  document.getElementById('login-username').required = !isRegister;
  document.getElementById('login-password').closest('.password-field').classList.toggle('hidden', isRegister);
  document.getElementById('login-password').required = !isRegister;
  document.getElementById('login-password').autocomplete = isRegister ? 'new-password' : 'current-password';
  loginHint.textContent = '';
  if (loginForm) loginForm.reset();
}

toggleRegister.addEventListener('click', () => {
  setAuthMode(!registerMode);
});

document.querySelectorAll('.gender-card').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.gender-card').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
    });
    document.getElementById('register-avatar').value = button.dataset.avatar;
  });
});

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

document.querySelectorAll('.channel-btn').forEach((button) => {
  button.addEventListener('click', () => {
    resetChannel = button.dataset.channel;
    document.querySelectorAll('.channel-btn').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
    });
  });
});

function showAuthMain() {
  resetPanel.classList.add('hidden');
  authMain.classList.remove('hidden');
  authBack.classList.add('hidden');
}

function showResetStep(step) {
  resetStep = step;
  authMain.classList.add('hidden');
  resetPanel.classList.remove('hidden');
  authBack.classList.remove('hidden');
  const isVerify = step === 'verify';
  const isNewPassword = step === 'new-password';
  resetTitle.textContent = isNewPassword ? 'Nhập mật khẩu mới' : isVerify ? 'Nhập mã xác minh' : 'Quên Mật Khẩu?';
  resetSubtitle.textContent = isNewPassword
    ? 'Vui lòng nhập vào mật khẩu mới của bạn'
    : isVerify
      ? `Mã xác minh đã được gửi qua ${resetChannel === 'facebook' ? 'Facebook' : 'Gmail'}.`
      : 'Đừng lo! Vui lòng nhập địa chỉ email với tài khoản của bạn.';
  document.getElementById('reset-username').classList.toggle('hidden', isNewPassword);
  resetChannelRow.classList.toggle('hidden', step !== 'request');
  resetCode.classList.toggle('hidden', !isVerify);
  resetPasswordWrap.classList.toggle('hidden', !isNewPassword);
  resetConfirmWrap.classList.toggle('hidden', !isNewPassword);
  document.getElementById('reset-username').required = step === 'request';
  resetCode.required = isVerify;
  document.getElementById('reset-password').required = isNewPassword;
  document.getElementById('reset-password-confirm').required = isNewPassword;
  resetSubmit.textContent = 'Gửi';
  resetHelper.textContent = '';
}

function getProviderLabel(provider) {
  return provider === 'facebook' ? 'Facebook' : 'Google';
}

let oauthConfigPromise = null;
let googleIdentityReady = false;

async function getOauthConfig() {
  if (!oauthConfigPromise) {
    oauthConfigPromise = apiFetch('/api/oauth/config').then((response) => response.json()).catch((error) => {
      console.error('OAuth config error', error);
      return { googleClientId: '', facebookAppId: '' };
    });
  }
  return oauthConfigPromise;
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

async function handleGoogleCredentialResponse(credentialResponse) {
  if (!credentialResponse?.credential) {
    alert('Google không trả về credential đăng nhập.');
    return;
  }
  let apiResponse;
  let body;
  try {
    apiResponse = await apiFetch('/api/social-login/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credentialResponse.credential })
    });
    body = await apiResponse.json();
  } catch (error) {
    console.error('Google login request error', error);
    alert('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
    return;
  }

  if (!apiResponse.ok) {
    alert(body.error || 'Đăng nhập bằng Google thất bại.');
    return;
  }

  localStorage.setItem('authToken', body.token);
  localStorage.setItem('hasSmartSpendAccount', 'true');
  showAuthMain();
  setAuthenticated(true, body.user);
  await initializeApp();
}

async function initializeGoogleLogin() {
  const slot = document.getElementById('google-signin-button');
  const fallback = document.getElementById('google-login-fallback');
  if (!slot || googleIdentityReady || registerMode) return;

  const config = await getOauthConfig();
  if (!config.googleClientId) {
    slot.classList.add('hidden');
    fallback?.classList.remove('hidden');
    if (socialLoginStatus) {
      socialLoginStatus.textContent = 'Google/Facebook cần cấu hình GOOGLE_CLIENT_ID, FACEBOOK_APP_ID và FACEBOOK_APP_SECRET trong .env rồi restart server.';
    }
    return;
  }

  try {
    await loadGoogleIdentityScript();
  } catch (error) {
    console.error('Google Identity script load error', error);
    slot.classList.add('hidden');
    fallback?.classList.remove('hidden');
    if (socialLoginStatus) {
      socialLoginStatus.textContent = 'Không tải được Google Identity Services. Kiểm tra kết nối mạng hoặc cấu hình trình duyệt.';
    }
    return;
  }
  window.google.accounts.id.initialize({
    client_id: config.googleClientId,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  slot.innerHTML = '';
  window.google.accounts.id.renderButton(slot, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: Math.min(340, slot.clientWidth || 220)
  });
  fallback?.classList.add('hidden');
  if (socialLoginStatus) socialLoginStatus.textContent = '';
  googleIdentityReady = true;
}

async function handleSocialLogin(provider) {
  const label = getProviderLabel(provider);
  if (provider === 'google') {
    const config = await getOauthConfig();
    if (!config.googleClientId) {
      alert('Chưa cấu hình GOOGLE_CLIENT_ID trong .env nên chưa thể gọi API đăng nhập thật của Google.');
      return;
    }
    await initializeGoogleLogin();
    window.google.accounts.id.prompt();
    return;
  }
  if (provider === 'facebook') {
    const config = await getOauthConfig();
    if (!config.facebookAppId) {
      alert('Chưa cấu hình FACEBOOK_APP_ID và FACEBOOK_APP_SECRET trong .env nên chưa thể đăng nhập Facebook thật.');
      return;
    }
    window.location.href = '/api/auth/facebook';
    return;
  }
  alert(`Nhà cung cấp ${label} chưa được hỗ trợ.`);
}

document.querySelectorAll('.social-btn').forEach((button) => {
  button.addEventListener('click', () => handleSocialLogin(button.dataset.provider));
});

forgotPasswordBtn.addEventListener('click', () => {
  setAuthMode(false);
  showResetStep('request');
});

resetCancel.addEventListener('click', () => {
  showAuthMain();
});

authBack.addEventListener('click', () => {
  if (resetStep === 'request') {
    showAuthMain();
    return;
  }
  showResetStep(resetStep === 'new-password' ? 'verify' : 'request');
});

resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('reset-username').value.trim();
  const code = resetCode.value.trim();
  const newPassword = document.getElementById('reset-password').value.trim();
  const confirmPassword = document.getElementById('reset-password-confirm').value.trim();

  if (resetStep === 'request' && !username) {
    alert('Vui lòng nhập email để nhận mã xác minh.');
    return;
  }
  if (resetStep === 'verify' && !code) {
    alert('Vui lòng nhập mã xác minh.');
    return;
  }
  if (resetStep === 'new-password' && (!newPassword || !confirmPassword)) {
    alert('Vui lòng nhập đủ mật khẩu mới và xác nhận mật khẩu.');
    return;
  }
  if (resetStep === 'new-password' && newPassword !== confirmPassword) {
    alert('Mật khẩu mới và xác nhận mật khẩu không khớp.');
    return;
  }

  let response;
  let body;
  try {
    const endpoint = resetStep === 'request'
      ? '/api/password-recovery/request'
      : resetStep === 'verify'
        ? '/api/password-recovery/verify'
        : '/api/password-recovery/reset';
    const payload = resetStep === 'request'
      ? { username, channel: resetChannel }
      : resetStep === 'verify'
        ? { username: resetLogin, code }
        : { username: resetLogin, newPassword };
    response = await apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    body = await response.json();
  } catch (error) {
    console.error('Reset password request error', error);
    alert('Không thể kết nối tới server. Vui lòng thử lại.');
    return;
  }

  if (!response.ok) {
    alert(body.error || 'Đặt lại mật khẩu thất bại.');
    return;
  }

  if (resetStep === 'request') {
    resetLogin = username;
    resetHelper.textContent = body.devCode ? `Mã demo: ${body.devCode}` : body.message || '';
    showResetStep('verify');
    if (body.devCode) resetHelper.textContent = `Mã demo: ${body.devCode}`;
    return;
  }
  if (resetStep === 'verify') {
    showResetStep('new-password');
    return;
  }

  alert(body.message || 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.');
  showAuthMain();
  setAuthMode(false);
  localStorage.setItem('hasSmartSpendAccount', 'true');
  document.getElementById('login-username').value = resetLogin;
  document.getElementById('login-password').value = '';
  resetForm.reset();
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const registerEmail = document.getElementById('register-email').value.trim().toLowerCase();
  const username = registerMode ? registerEmail : document.getElementById('login-username').value.trim().toLowerCase();
  const password = registerMode
    ? document.getElementById('register-password').value.trim()
    : document.getElementById('login-password').value.trim();
  if (!username || !password) {
    alert('Vui lòng nhập đủ email và mật khẩu.');
    return;
  }
  if (registerMode) {
    const confirmPassword = document.getElementById('register-password-confirm').value.trim();
    if (password !== confirmPassword) {
      alert('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }
  }

  const url = registerMode ? '/api/register' : '/api/login';
  const registerPayload = registerMode
    ? {
        fullName: document.getElementById('register-fullname').value.trim(),
        email: registerEmail,
        birthday: document.getElementById('register-birthday').value,
        avatar: document.getElementById('register-avatar').value,
        wallet: 0
      }
    : {};
  let response;
  let body;
  try {
    response = await apiFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, ...registerPayload })
    });
    body = await response.json();
  } catch (error) {
    console.error('Auth request error', error);
    alert('Không thể kết nối tới server. Vui lòng kiểm tra lại kết nối và thử lại.');
    return;
  }
  if (!response.ok) {
    alert(body.error || 'Đăng nhập/đăng ký thất bại.');
    return;
  }

  if (registerMode) {
    alert('Đăng ký thành công. Vui lòng đăng nhập lại với tài khoản mới.');
    localStorage.setItem('hasSmartSpendAccount', 'true');
    localStorage.removeItem('authToken');
    setAuthMode(false);
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = '';
    return;
  }

  if (body.token) {
    localStorage.setItem('authToken', body.token);
  }
  localStorage.setItem('hasSmartSpendAccount', 'true');
  setAuthenticated(true, body.user);
  await initializeApp();
});

logoutButton.addEventListener('click', async () => {
  await apiFetch('/api/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
  localStorage.setItem('hasSmartSpendAccount', 'true');
  setAuthMode(false);
  showAuthMain();
  setAuthenticated(false);
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    fullName: document.getElementById('profile-fullname').value.trim(),
    email: document.getElementById('profile-email-input').value.trim(),
    birthday: document.getElementById('profile-birthday').value,
    phone: document.getElementById('profile-phone').value.trim(),
    avatar: document.getElementById('profile-avatar-select').value
  };

  const response = await apiFetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  if (!response.ok) {
    alert(body.error || 'Không thể lưu hồ sơ.');
    return;
  }
  state.profile = body.user;
  state.user = { ...(state.user || {}), ...body.user };
  userNameEl.textContent = body.user.fullName || body.user.username;
  renderProfile();
  alert('Đã lưu hồ sơ cá nhân.');
});

profileResetPassword.addEventListener('click', () => {
  switchTab('profile');
  loginContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');
  showResetStep('request');
  document.getElementById('reset-username').value = state.user?.email || state.user?.username || '';
});

profileViewHistory.addEventListener('click', () => {
  switchTab('dashboard');
});

profileExportData.addEventListener('click', () => {
  const data = {
    user: state.profile,
    expenses: state.expenses,
    budget: state.budget,
    goals: state.goals
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'smartspend-data.json';
  link.click();
  URL.revokeObjectURL(url);
});

window.addEventListener('load', async () => {
  const today = new Date().toISOString().slice(0, 10);
  setAuthMode(registerMode);
  initializeGoogleLogin().catch((error) => {
    console.error('Google Identity initialization error', error);
  });
  document.getElementById('expense-date').value = today;
  document.getElementById('expense-form-submit').textContent = 'Lưu chi tiêu';
  document.getElementById('expense-search').addEventListener('input', renderExpenses);
  document.getElementById('expense-filter-category').addEventListener('change', renderExpenses);
  await checkSession();
});
