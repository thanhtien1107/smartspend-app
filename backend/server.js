require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./config/db');
const { createJsonDataRepository } = require('./src/repositories/jsonDataRepository');
const {
  createServerCacheKey,
  fetchWithServerCache,
  getMemoryCacheEntry,
  setMemoryCacheEntry
} = require('./src/utils/serverCache');
const {
  DAY_MS,
  getWeekStart,
  parseExpenseDate,
  sameDay,
  startOfDay
} = require('./src/utils/dateUtils');
const { formatVnd } = require('./src/utils/money');
const { validateExpensePayload } = require('./src/modules/expense/transactionValidation');
const { createCategoryRoutes } = require('./src/modules/category/categoryRoutes');
const { createBudgetRoutes } = require('./src/modules/budget/budgetRoutes');
const { createGoalRoutes } = require('./src/modules/goal/goalRoutes');
const { buildDebtCarryover } = require('./src/modules/finance/debtCarryover');
const {
  getUserNotifications,
  createBudgetOverspendingNotification,
  markAllNotificationsRead
} = require('./src/modules/notification/notificationService');
const { buildFinancialReport, sendReportExport } = require('./src/modules/report/reportExport');


const app = express();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || 'v20.0';
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const FRONTEND_PUBLIC_DIR = path.join(__dirname, '..', 'frontend', 'public');
const { loadData, saveData } = createJsonDataRepository(DB_FILE);
const recoveryCodes = new Map();
const loginRateLimits = new Map();
const facebookOAuthStates = new Map();
const INCOME_CATEGORY_KEYS = new Set([
  'luong',
  'thuong',
  'phu cap',
  'lam them',
  'kinh doanh',
  'dau tu sinh loi',
  'qua tang nhan duoc',
  'hoan tien',
  'thu nhap khac'
]);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'smartspend-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: false
  }
}));
app.use(express.static(FRONTEND_PUBLIC_DIR));

function hasConfiguredKey(value, placeholder) {
  return Boolean(value && value.trim() && value.trim() !== placeholder);
}

function isMultipartRequest(req) {
  return /^multipart\/form-data/i.test(req.headers['content-type'] || '');
}

function getMultipartBoundary(req) {
  const match = String(req.headers['content-type'] || '').match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? match[1] || match[2] : '';
}

function parseContentDisposition(value = '') {
  return value.split(';').reduce((result, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || !rawValue.length) return result;
    result[rawKey] = rawValue.join('=').replace(/^"|"$/g, '');
    return result;
  }, {});
}

function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const boundary = getMultipartBoundary(req);
    if (!boundary) {
      resolve({ fields: {}, files: {} });
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const fields = {};
      const files = {};
      const rawBody = Buffer.concat(chunks).toString('binary');
      const parts = rawBody.split(`--${boundary}`).slice(1, -1);
      const uploadDir = path.join(FRONTEND_PUBLIC_DIR, 'uploads', 'expenses');
      fs.mkdirSync(uploadDir, { recursive: true });

      parts.forEach((part) => {
        const normalizedPart = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
        const separatorIndex = normalizedPart.indexOf('\r\n\r\n');
        if (separatorIndex === -1) return;

        const rawHeaders = normalizedPart.slice(0, separatorIndex);
        const rawContent = normalizedPart.slice(separatorIndex + 4).replace(/\r\n$/, '');
        const headers = rawHeaders.split('\r\n').reduce((result, line) => {
          const [rawKey, ...rawValue] = line.split(':');
          if (!rawKey || !rawValue.length) return result;
          result[rawKey.trim().toLowerCase()] = rawValue.join(':').trim();
          return result;
        }, {});
        const disposition = parseContentDisposition(headers['content-disposition']);
        const fieldName = disposition.name;
        if (!fieldName) return;

        if (disposition.filename) {
          if (!headers['content-type']?.startsWith('image/')) return;
          const extension = path.extname(disposition.filename).replace(/[^.\w-]/g, '') || '.jpg';
          const fileName = `${uuidv4()}${extension}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(rawContent, 'binary'));
          files[fieldName] = {
            originalName: disposition.filename,
            fileName,
            contentType: headers['content-type'],
            url: `/uploads/expenses/${fileName}`
          };
          return;
        }

        fields[fieldName] = Buffer.from(rawContent, 'binary').toString('utf8');
      });

      resolve({ fields, files });
    });
  });
}

function getUserFromToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
  if (!token) return null;
  const data = loadData();
  return (data.users || []).find((item) => item.token === token) || null;
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function findUserByLogin(data, login = '') {
  const normalizedLogin = normalizeEmail(login);
  return (data.users || []).find((item) => {
    return normalizeEmail(item.username) === normalizedLogin || normalizeEmail(item.email) === normalizedLogin;
  }) || null;
}

function findUserByProvider(data, provider, providerId, email) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedProviderId = String(providerId || '').trim();
  const normalizedEmail = normalizeEmail(email);
  return (data.users || []).find((item) => {
    const sameProvider = item.authProvider === normalizedProvider && item.providerId === normalizedProviderId;
    const sameEmail = normalizedEmail && normalizeEmail(item.email) === normalizedEmail;
    return sameProvider || sameEmail;
  }) || null;
}

function upsertSocialUser(data, { provider, providerId, name, email, avatar }) {
  data.users = data.users || [];
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedEmail = normalizeEmail(email);
  const stableProviderId = String(providerId || normalizedEmail).trim();
  let user = findUserByProvider(data, normalizedProvider, stableProviderId, normalizedEmail);
  const token = uuidv4();
  const providerAvatar = avatar || (normalizedProvider === 'facebook' ? 'assets/images/female.png' : 'assets/logo/app-logo.svg');

  if (user) {
    user.fullName = name;
    user.email = normalizedEmail;
    user.avatar = providerAvatar;
    user.authProvider = normalizedProvider;
    user.providerId = stableProviderId;
    user.token = token;
    user.updatedAt = new Date().toISOString();
    return user;
  }

  user = {
    id: uuidv4(),
    username: normalizedEmail,
    password: '',
    fullName: name,
    email: normalizedEmail,
    birthday: '',
    phone: '',
    avatar: providerAvatar,
    wallet: 0,
    authProvider: normalizedProvider,
    providerId: stableProviderId,
    createdAt: new Date().toISOString(),
    token
  };
  data.users.push(user);
  return user;
}

function sanitizeUser(user = {}) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName || '',
    email: user.email || '',
    birthday: user.birthday || '',
    phone: user.phone || '',
    avatar: user.avatar || 'assets/logo/app-logo.svg',
    wallet: Number(user.wallet || 0),
    createdAt: user.createdAt || '',
    authProvider: user.authProvider || 'password'
  };
}

function findCurrentUser(req, data) {
  const tokenUser = getUserFromToken(req);
  if (tokenUser) {
    return (data.users || []).find((item) => item.id === tokenUser.id || item.username === tokenUser.username);
  }
  const username = req.session?.user?.username;
  if (!username) return null;
  return (data.users || []).find((item) => item.username === username);
}

function getUserId(user) {
  return user?.id || user?.username || '';
}

function hasUserOwner(record, user) {
  const userId = getUserId(user);
  return Boolean(userId && record?.userId === userId);
}

function getUserExpenses(data, user) {
  return (data.expenses || []).filter((expense) => hasUserOwner(expense, user));
}

function getUserGoals(data, user) {
  return (data.goals || []).filter((goal) => hasUserOwner(goal, user));
}

function getUserCategoryBudgets(data, user) {
  return (data.categoryBudgets || []).filter((budget) => hasUserOwner(budget, user));
}

function getUserBudget(data, user) {
  const userId = getUserId(user);
  const budget = (data.budgets || []).find((item) => item.userId === userId);
  return budget || { userId, amount: 0, period: 'Tháng' };
}

function buildUserScopedData(data, user) {
  return {
    ...data,
    expenses: getUserExpenses(data, user),
    budget: getUserBudget(data, user),
    goals: getUserGoals(data, user),
    categoryBudgets: getUserCategoryBudgets(data, user)
  };
}

function getCategorySpent(expenses, category) {
  return expenses
    .filter((expense) => expense.category === category)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function getUniqueDays(expenses) {
  const days = new Set(expenses.map((expense) => expense.date));
  return days.size;
}

function getMonthProjection(expenses) {
  if (expenses.length === 0) return null;
  const today = new Date();
  const daysSoFar = getUniqueDays(expenses);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const dailyAvg = totalExpense / Math.max(daysSoFar, 1);
  const projectedTotal = Math.round(dailyAvg * daysInMonth);
  return {
    daysSoFar,
    daysInMonth,
    dailyAvg: Math.round(dailyAvg),
    projectedTotal,
    remainingDays: Math.max(daysInMonth - daysSoFar, 0)
  };
}

function identifySpendingPatterns(expenses) {
  const grouped = {};
  expenses.forEach((e) => {
    grouped[e.category] = (grouped[e.category] || 0) + e.amount;
  });
  const categories = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const topCategories = categories.slice(0, 2).map(([category, amount]) => ({ category, amount }));
  const average = expenses.reduce((sum, item) => sum + item.amount, 0) / Math.max(expenses.length, 1);
  const anomalies = expenses.filter((expense) => expense.amount >= average * 3);
  return { topCategories, anomalies };
}

function normalizeExpense(expense = {}) {
  const category = String(expense.category || 'Khác').trim() || 'Khác';
  const type = expense.type === 'income' || (!expense.type && isIncomeCategoryName(category)) ? 'income' : 'expense';
  return {
    ...expense,
    type,
    amount: Number(expense.amount || 0),
    category,
    date: String(expense.date || '').slice(0, 10),
    dateObject: parseExpenseDate(expense.date) || startOfDay(new Date()),
    time: String(expense.time || '')
  };
}

function sumExpenseAmounts(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function getEffectiveBudgetAmount(baseBudgetAmount, monthlyIncome, carriedDebt = 0) {
  return Math.max(Number(baseBudgetAmount || 0) + Number(monthlyIncome || 0) - Number(carriedDebt || 0), 0);
}

function normalizeVietnameseKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isIncomeCategoryName(category) {
  return INCOME_CATEGORY_KEYS.has(normalizeVietnameseKey(category));
}

function isIncomeTransaction(transaction) {
  return transaction.type === 'income';
}

function isExpenseTransaction(transaction) {
  return transaction.type !== 'income';
}

function getBudgetLevel(usage) {
  if (usage > 100) return { key: 'exceeded', status: 'Vượt ngân sách', priority: 'critical' };
  if (usage > 90) return { key: 'critical', status: 'Nguy cấp', priority: 'high' };
  if (usage >= 70) return { key: 'warning', status: 'Cảnh báo', priority: 'medium' };
  return { key: 'safe', status: 'An toàn', priority: 'low' };
}

function getCategoryTotals(expenses) {
  return expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + expense.amount;
    return result;
  }, {});
}

function buildDailySeries(expenses, startDate, endDate) {
  const totalsByDate = expenses.reduce((result, expense) => {
    result[expense.date] = (result[expense.date] || 0) + expense.amount;
    return result;
  }, {});
  const series = [];
  for (let current = new Date(startDate); current <= endDate; current = new Date(current.getTime() + DAY_MS)) {
    const key = current.toISOString().slice(0, 10);
    series.push({ date: key, amount: Math.round(totalsByDate[key] || 0) });
  }
  return series;
}

function getTrailingIncreaseDays(series) {
  const active = series.filter((item) => item.amount > 0);
  if (active.length < 3) return 0;
  let streak = 1;
  for (let index = active.length - 1; index > 0; index -= 1) {
    if (active[index].amount > active[index - 1].amount) streak += 1;
    else break;
  }
  return streak >= 3 ? streak : 0;
}

function detectRepeatedSmallTransactions(expenses) {
  const groups = expenses.reduce((result, expense) => {
    if (expense.amount > 50000) return result;
    const key = `${expense.date}:${expense.category}`;
    result[key] = result[key] || { date: expense.date, category: expense.category, count: 0, amount: 0 };
    result[key].count += 1;
    result[key].amount += expense.amount;
    return result;
  }, {});
  return Object.values(groups).filter((group) => group.count >= 3);
}

function detectNightSpending(expenses) {
  return expenses.filter((expense) => {
    const hour = Number(String(expense.time || '').split(':')[0]);
    return Number.isFinite(hour) && (hour >= 22 || hour <= 5);
  });
}

function detectCategorySpikes(expenses, today) {
  const currentWeekStart = getWeekStart(today);
  const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * DAY_MS);
  const previousWeekEnd = new Date(currentWeekStart.getTime() - DAY_MS);
  const currentTotals = getCategoryTotals(expenses.filter((expense) => expense.dateObject >= currentWeekStart));
  const previousTotals = getCategoryTotals(expenses.filter((expense) => expense.dateObject >= previousWeekStart && expense.dateObject <= previousWeekEnd));

  return Object.entries(currentTotals)
    .map(([category, amount]) => {
      const previousAmount = previousTotals[category] || 0;
      const ratio = previousAmount > 0 ? amount / previousAmount : amount > 0 ? 2 : 0;
      return { category, amount: Math.round(amount), previousAmount: Math.round(previousAmount), ratio };
    })
    .filter((item) => item.amount >= 100000 && item.ratio >= 1.5)
    .sort((a, b) => b.ratio - a.ratio);
}

function buildCategoryBudgetSummary(data, scopedExpenses = null) {
  const expenses = (scopedExpenses || (data.expenses || []).map(normalizeExpense)).filter(isExpenseTransaction);
  const { categoryBudgets = [] } = data;
  return categoryBudgets.map((budget) => {
    const spent = expenses
      .filter((expense) => expense.category === budget.category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const amount = Number(budget.amount || 0);
    const usage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    const level = getBudgetLevel(usage);
    const alert = usage >= 70 ? `Ngân sách ${budget.category} đã dùng ${usage}%.` : '';
    return {
      ...budget,
      spent: Math.round(spent),
      usage,
      usedRatio: usage / 100,
      status: level.status,
      priority: level.priority,
      alert
    };
  });
}

function buildBadges(data, insight) {
  const badges = [];
  const { expenses, budget, goals } = data;
  if (insight.status === 'Đang trong giới hạn' && expenses.length >= 3) {
    badges.push('Quản lý chi tiêu tốt');
  }
  if (insight.budgetUsed <= 0.3 && expenses.length >= 2) {
    badges.push('Tiết kiệm 30% ngân sách');
  }
  if (goals.length > 0) {
    badges.push('Đã đặt mục tiêu tiết kiệm');
  }
  if (insight.futurePrediction && insight.futurePrediction.projectedTotal <= budget.amount) {
    badges.push('Dự báo trong giới hạn ngân sách');
  }
  if (insight.patterns && insight.patterns.anomalies.length === 0 && expenses.length >= 5) {
    badges.push('Chi tiêu đều đặn');
  }
  return badges.length ? badges : ['Chưa có huy hiệu. Hãy tiếp tục duy trì chi tiêu thông minh.'];
}

function buildInsight(data, currentUser = null) {
  const normalizedTransactions = (data.expenses || []).map(normalizeExpense).filter((expense) => expense.amount > 0);
  const normalizedExpenses = normalizedTransactions.filter(isExpenseTransaction);
  const normalizedIncomes = normalizedTransactions.filter(isIncomeTransaction);
  const budget = data.budget || { amount: 0 };
  const today = startOfDay(new Date());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekStart = getWeekStart(today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.max(today.getDate(), 1);
  const monthlyExpenses = normalizedExpenses.filter((expense) => expense.dateObject >= monthStart && expense.dateObject <= today);
  const weeklyExpenses = normalizedExpenses.filter((expense) => expense.dateObject >= weekStart && expense.dateObject <= today);
  const dailyExpenses = normalizedExpenses.filter((expense) => sameDay(expense.dateObject, today));
  const monthlyIncomes = normalizedIncomes.filter((income) => income.dateObject >= monthStart && income.dateObject <= today);
  const weeklyIncomes = normalizedIncomes.filter((income) => income.dateObject >= weekStart && income.dateObject <= today);
  const dailyIncomes = normalizedIncomes.filter((income) => sameDay(income.dateObject, today));
  const totalExpense = sumExpenseAmounts(normalizedExpenses);
  const totalIncome = sumExpenseAmounts(normalizedIncomes);
  const monthlySpending = sumExpenseAmounts(monthlyExpenses);
  const weeklySpending = sumExpenseAmounts(weeklyExpenses);
  const totalDailySpending = sumExpenseAmounts(dailyExpenses);
  const monthlyIncome = sumExpenseAmounts(monthlyIncomes);
  const weeklyIncome = sumExpenseAmounts(weeklyIncomes);
  const totalDailyIncome = sumExpenseAmounts(dailyIncomes);
  const averageDailySpending = monthlySpending / daysElapsed;
  const baseBudgetAmount = Number(budget.amount || 0);
  const debtCarryover = buildDebtCarryover(data, today);
  const currentDebtPeriod = debtCarryover.current;
  const debtCarriedFromPrevious = Number(currentDebtPeriod.carriedDebtFromPrevious || 0);
  const budgetBeforeDebt = Number(baseBudgetAmount || 0) + Number(monthlyIncome || 0);
  const budgetAmount = getEffectiveBudgetAmount(baseBudgetAmount, monthlyIncome, debtCarriedFromPrevious);
  const budgetUsage = budgetAmount > 0 ? Math.round((monthlySpending / budgetAmount) * 100) : (monthlySpending > 0 ? 100 : 0);
  const budgetLevel = getBudgetLevel(budgetUsage);
  const categoryTotals = getCategoryTotals(monthlyExpenses);
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const categoryBudgets = buildCategoryBudgetSummary(data, monthlyExpenses);
  const dailySeries = buildDailySeries(monthlyExpenses, monthStart, today);
  const continuousIncreaseDays = getTrailingIncreaseDays(dailySeries);
  const abnormalDays = dailySeries.filter((item) => averageDailySpending > 0 && item.amount > averageDailySpending * 1.3);
  const repeatedSmallTransactions = detectRepeatedSmallTransactions(monthlyExpenses);
  const nightSpending = detectNightSpending(monthlyExpenses);
  const categorySpikes = detectCategorySpikes(monthlyExpenses, today);
  const monthlySpendingForecast = Math.round(averageDailySpending * daysInMonth);
  const activeUserWallet = Number(currentUser?.wallet || 0);
  const remainingBalance = Math.max(activeUserWallet + monthlyIncome - monthlySpending, 0);
  const netCashFlow = monthlyIncome - monthlySpending;
  const predictedDaysRemaining = averageDailySpending > 0 ? Math.max(Math.floor(remainingBalance / averageDailySpending), 0) : null;
  const overspendingProbability = Math.min(100, Math.round(
    budgetUsage +
    (continuousIncreaseDays >= 3 ? 15 : 0) +
    (abnormalDays.length ? 10 : 0) +
    (categorySpikes.length ? 10 : 0) +
    (budgetAmount > 0 && monthlySpendingForecast > budgetAmount ? 15 : 0)
  ));
  let financialHealthScore = 100;
  if (budgetUsage > 100) financialHealthScore -= 35;
  else if (budgetUsage > 90) financialHealthScore -= 25;
  else if (budgetUsage >= 70) financialHealthScore -= 12;
  if (continuousIncreaseDays >= 3) financialHealthScore -= 10;
  financialHealthScore -= Math.min(abnormalDays.length * 4, 12);
  financialHealthScore -= Math.min(repeatedSmallTransactions.length * 4, 10);
  if (nightSpending.length >= 2) financialHealthScore -= 8;
  financialHealthScore -= Math.min(categorySpikes.length * 6, 12);
  if (averageDailySpending > 0 && remainingBalance / averageDailySpending <= 7) financialHealthScore -= 15;
  financialHealthScore = Math.max(0, Math.min(Math.round(financialHealthScore), 100));
  const riskLevel = budgetLevel.key === 'exceeded' || financialHealthScore < 45 || overspendingProbability >= 85
    ? 'critical'
    : budgetLevel.key === 'critical' || financialHealthScore < 65 || overspendingProbability >= 70
      ? 'high'
      : budgetLevel.key === 'warning' || financialHealthScore < 80 || overspendingProbability >= 50
        ? 'medium'
        : 'low';
  const alerts = buildFinancialAlerts({
    budgetLevel,
    budgetUsage,
    monthlySpending,
    budgetAmount,
    categoryBudgets,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    predictedDaysRemaining,
    debtCarryover: currentDebtPeriod
  });
  const recommendations = buildFinancialRecommendations({
    topCategory,
    monthlySpending,
    budgetAmount,
    budgetUsage,
    budgetLevel,
    continuousIncreaseDays,
    repeatedSmallTransactions,
    nightSpending,
    predictedDaysRemaining,
    goals: data.goals || [],
    debtCarryover: currentDebtPeriod
  });
  const insights = buildFinancialInsightMessages({
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    monthlySpendingForecast,
    budgetAmount,
    debtCarryover: currentDebtPeriod
  });
  const projection = getMonthProjection(normalizedExpenses);
  const patterns = identifySpendingPatterns(normalizedExpenses);

  const insight = {
    status: budgetLevel.status,
    budget_level: budgetLevel.key,
    budget_usage: budgetUsage,
    budget_amount: budgetAmount,
    budget_before_debt: Math.round(budgetBeforeDebt),
    base_budget_amount: baseBudgetAmount,
    debt_period_type: debtCarryover.periodType,
    debt_period_key: currentDebtPeriod.periodKey,
    debt_period_label: currentDebtPeriod.periodLabel,
    debt_carried_from_previous: Math.round(debtCarriedFromPrevious),
    available_budget_after_debt: Math.round(budgetAmount),
    new_overspending_debt: Math.round(currentDebtPeriod.newOverspendingDebt || 0),
    debt_to_carry_next_period: Math.round(currentDebtPeriod.debtToCarryNextPeriod || 0),
    debt_history: debtCarryover.records,
    remaining_balance: Math.round(remainingBalance),
    total_expense: Math.round(totalExpense),
    total_income: Math.round(totalIncome),
    total_daily_income: Math.round(totalDailyIncome),
    weekly_income: Math.round(weeklyIncome),
    monthly_income: Math.round(monthlyIncome),
    net_cash_flow: Math.round(netCashFlow),
    total_daily_spending: Math.round(totalDailySpending),
    weekly_spending: Math.round(weeklySpending),
    monthly_spending: Math.round(monthlySpending),
    average_daily_spending: Math.round(averageDailySpending),
    predicted_days_remaining: predictedDaysRemaining,
    monthly_spending_forecast: monthlySpendingForecast,
    overspending_probability: overspendingProbability,
    burn_rate_trend: continuousIncreaseDays >= 3 ? 'accelerating' : 'stable',
    risk_level: riskLevel,
    financial_health_score: financialHealthScore,
    alerts,
    recommendations,
    insights,
    category_budget_summaries: categoryBudgets,
    category_totals: categoryTotals,
    daily_series: dailySeries,
    top_category: topCategory ? topCategory[0] : 'Chưa có',
    top_category_amount: Math.round(topCategory ? topCategory[1] : 0),
    totalExpense: Math.round(totalExpense),
    topCategory: topCategory ? topCategory[0] : 'Chưa có',
    progress: Math.min(budgetUsage, 100),
    budgetUsed: budgetUsage / 100,
    alert: alerts[0]?.message || '',
    categoryBudgets,
    personalizedRecommendations: recommendations,
    futurePrediction: projection
      ? {
          projectedTotal: projection.projectedTotal,
          currentTotal: totalExpense,
          dailyAvg: projection.dailyAvg,
          remainingDays: projection.remainingDays,
          message: projection.projectedTotal > budgetAmount
            ? `Nếu tiếp tục chi tiêu hiện tại, bạn có thể chi ${formatVnd(projection.projectedTotal)} trong tháng, vượt ngân sách.`
            : `Dự kiến tháng này bạn sẽ chi ${formatVnd(projection.projectedTotal)}, nằm trong giới hạn ngân sách.`
        }
      : null,
    patterns,
    projection,
    reportType: normalizedExpenses.length >= 6 ? 'advanced' : 'basic'
  };
  insight.badges = buildBadges(data, insight);
  return insight;
}

function buildFinancialAlerts(context) {
  const alerts = [];
  const {
    budgetLevel,
    budgetUsage,
    monthlySpending,
    budgetAmount,
    categoryBudgets,
    continuousIncreaseDays,
    abnormalDays,
    repeatedSmallTransactions,
    nightSpending,
    categorySpikes,
    predictedDaysRemaining,
    debtCarryover
  } = context;

  if (debtCarryover?.debtToCarryNextPeriod > 0) {
    alerts.push({
      priority: 'critical',
      message: `Khoản vượt ngân sách ${formatVnd(debtCarryover.debtToCarryNextPeriod)} sẽ được chuyển sang kỳ tiếp theo.`
    });
  }

  if (debtCarryover?.carriedDebtFromPrevious > 0) {
    alerts.push({
      priority: 'high',
      message: `Ngân sách kỳ này đã bị trừ ${formatVnd(debtCarryover.carriedDebtFromPrevious)} do nợ kỳ trước.`
    });
  }

  if (budgetAmount > 0 && budgetLevel.key === 'exceeded') {
    alerts.push({ priority: 'critical', message: `Bạn đã vượt ngân sách ${formatVnd(monthlySpending - budgetAmount)}.` });
  } else if (budgetAmount > 0 && budgetLevel.key === 'critical') {
    alerts.push({ priority: 'high', message: `Bạn đã dùng ${budgetUsage}% ngân sách tháng này.` });
  } else if (budgetAmount > 0 && budgetLevel.key === 'warning') {
    alerts.push({ priority: 'medium', message: `Bạn đã dùng ${budgetUsage}% ngân sách, cần giảm chi tiêu trước khi vượt hạn mức.` });
  }

  categoryBudgets
    .filter((item) => item.usage >= 70)
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        priority: item.usage > 100 ? 'critical' : item.usage > 90 ? 'high' : 'medium',
        message: `Ngân sách ${item.category} đã dùng ${item.usage}%.`
      });
    });

  if (continuousIncreaseDays >= 3) {
    alerts.push({ priority: 'high', message: `Chi tiêu tăng liên tục ${continuousIncreaseDays} ngày gần đây.` });
  }
  if (abnormalDays.length) {
    alerts.push({ priority: 'medium', message: `${abnormalDays.length} ngày có chi tiêu cao hơn trung bình ít nhất 30%.` });
  }
  if (repeatedSmallTransactions.length) {
    alerts.push({ priority: 'medium', message: 'Có nhiều giao dịch nhỏ lặp lại trong cùng một ngày.' });
  }
  if (nightSpending.length >= 2) {
    alerts.push({ priority: 'medium', message: `Có ${nightSpending.length} giao dịch ban đêm trong tháng này.` });
  }
  if (categorySpikes.length) {
    alerts.push({ priority: 'high', message: `Chi tiêu ${categorySpikes[0].category} tăng mạnh so với tuần trước.` });
  }
  if (predictedDaysRemaining !== null && predictedDaysRemaining <= 7) {
    alerts.push({ priority: 'critical', message: `Với tốc độ hiện tại, số dư có thể hết trong ${predictedDaysRemaining} ngày.` });
  }

  const seen = new Set();
  return alerts.filter((alert) => {
    if (seen.has(alert.message)) return false;
    seen.add(alert.message);
    return true;
  }).slice(0, 5);
}

function buildFinancialRecommendations(context) {
  const {
    topCategory,
    monthlySpending,
    budgetAmount,
    budgetUsage,
    budgetLevel,
    continuousIncreaseDays,
    repeatedSmallTransactions,
    nightSpending,
    predictedDaysRemaining,
    goals,
    debtCarryover
  } = context;
  const recommendations = [];

  if (debtCarryover?.debtToCarryNextPeriod > 0) {
    recommendations.push('Ưu tiên thanh toán khoản vượt ngân sách trước khi tăng chi tiêu ở kỳ tiếp theo.');
  }

  if (topCategory) {
    const percent = monthlySpending > 0 ? Math.round((topCategory[1] / monthlySpending) * 100) : 0;
    recommendations.push(`Bạn chi ${percent}% cho ${topCategory[0]}. Giảm 15%-20% nhóm này sẽ tạo hiệu quả tiết kiệm rõ nhất.`);
  }
  if (budgetAmount > 0 && budgetUsage >= 70) {
    recommendations.push('Đặt hạn mức chi tiêu theo ngày cho phần ngân sách còn lại của tháng.');
  }
  if (budgetLevel.key === 'exceeded') {
    recommendations.push('Tạm dừng các khoản không thiết yếu và rà soát nhóm chi lớn nhất trong 7 ngày gần nhất.');
  }
  if (continuousIncreaseDays >= 3) {
    recommendations.push('Dùng mục tiêu chi tiêu cố định trong 3 ngày tới để ngắt đà tăng chi phí.');
  }
  if (repeatedSmallTransactions.length) {
    recommendations.push('Gộp các khoản mua nhỏ và đặt giới hạn cho đồ uống, ăn vặt hoặc giao hàng.');
  }
  if (nightSpending.length >= 2) {
    recommendations.push('Kiểm tra các khoản chi ban đêm, vì đây thường là nhóm dễ phát sinh ngoài kế hoạch.');
  }
  if (predictedDaysRemaining !== null && predictedDaysRemaining <= 10) {
    recommendations.push('Ưu tiên giữ lại tiền cho hóa đơn cố định trước khi chi cho giải trí hoặc mua sắm.');
  }
  if (!goals.length) {
    recommendations.push('Tạo mục tiêu tiết kiệm để theo dõi phần tiền cần giữ lại mỗi tháng.');
  }

  return [...new Set(recommendations)].slice(0, 5);
}

function buildFinancialInsightMessages(context) {
  const { continuousIncreaseDays, abnormalDays, repeatedSmallTransactions, nightSpending, categorySpikes, monthlySpendingForecast, budgetAmount, debtCarryover } = context;
  const insights = [];
  if (debtCarryover?.carriedDebtFromPrevious > 0) {
    insights.push(`Kỳ này đang gánh nợ kỳ trước ${formatVnd(debtCarryover.carriedDebtFromPrevious)}.`);
  }
  if (debtCarryover?.debtToCarryNextPeriod > 0) {
    insights.push(`Nếu kết thúc kỳ hiện tại, ${formatVnd(debtCarryover.debtToCarryNextPeriod)} sẽ bị carry-over sang kỳ sau.`);
  }
  if (continuousIncreaseDays >= 3) insights.push(`Chi tiêu tăng liên tục ${continuousIncreaseDays} ngày.`);
  if (abnormalDays.length) insights.push(`Phát hiện ${abnormalDays.length} ngày chi tiêu bất thường so với mức trung bình.`);
  if (repeatedSmallTransactions.length) insights.push('Có cụm giao dịch nhỏ lặp lại, có thể là chi tiêu vặt hoặc phí phát sinh.');
  if (nightSpending.length >= 2) insights.push('Chi tiêu ban đêm xuất hiện nhiều lần trong tháng.');
  if (categorySpikes.length) insights.push(`Nhóm ${categorySpikes[0].category} tăng đột biến trong tuần này.`);
  if (budgetAmount > 0 && monthlySpendingForecast > budgetAmount) {
    insights.push(`Dự báo cuối tháng có thể vượt ngân sách ${formatVnd(monthlySpendingForecast - budgetAmount)}.`);
  }
  return insights;
}

function findSimilarExpense(expenses, item) {
  return expenses.find((expense) => {
    return (
      expense.amount === item.amount &&
      expense.category === item.category &&
      (expense.type || 'expense') === (item.type || 'expense') &&
      expense.date === item.date
    );
  });
}

function detectUnusualExpense(data, item) {
  if (item.type === 'income') return [];
  const { expenses, budget } = data;
  const categoryExpenses = expenses.filter((expense) => (expense.type || 'expense') !== 'income' && expense.category === item.category);
  const average = categoryExpenses.length
    ? categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0) / categoryExpenses.length
    : 0;
  const warnings = [];
  if (budget.amount > 0 && item.amount >= budget.amount * 0.25) {
    warnings.push('Giao dịch lớn: chi tiêu này chiếm hơn 25% ngân sách.');
  }
  if (average > 0 && item.amount >= average * 3) {
    warnings.push('Giao dịch bất thường: lớn hơn trung bình hạng mục gấp 3 lần.');
  }
  return warnings;
}

function getLoginRateLimitKey(req, username = '') {
  const login = normalizeEmail(username) || 'unknown';
  const ip = req.ip || req.socket?.remoteAddress || 'local';
  return `${login}:${ip}`;
}

function getLoginRateLimitState(req, username = '') {
  const key = getLoginRateLimitKey(req, username);
  const state = loginRateLimits.get(key) || { attempts: 0, lockUntil: 0 };
  const remainingMs = Math.max(0, state.lockUntil - Date.now());
  return {
    key,
    state,
    retryAfterSeconds: Math.ceil(remainingMs / 1000)
  };
}

function recordFailedLogin(req, username = '') {
  const { key, state } = getLoginRateLimitState(req, username);
  const attempts = Number(state.attempts || 0) + 1;
  const lockSeconds = attempts >= 5 ? (attempts - 4) * 10 : 0;
  const nextState = {
    attempts,
    lockUntil: lockSeconds > 0 ? Date.now() + lockSeconds * 1000 : 0
  };
  loginRateLimits.set(key, nextState);

  return {
    attempts,
    retryAfterSeconds: lockSeconds
  };
}

function clearLoginRateLimit(req, username = '') {
  loginRateLimits.delete(getLoginRateLimitKey(req, username));
}

function requireAuth(req, res, next) {
  const requestPath = (req.originalUrl || req.url).split('?')[0];
  const openRoutes = [
    '/api/login',
    '/api/social-login',
    '/api/social-login/google',
    '/api/oauth/config',
    '/api/auth/facebook',
    '/api/auth/facebook/callback',
    '/api/register',
    '/api/session',
    '/api/maps/config',
    '/api/password-recovery/request',
    '/api/password-recovery/verify',
    '/api/password-recovery/reset'
  ];
  const publicRoutes = ['/api/ai-suggestions', '/api/chat'];
  if (openRoutes.includes(requestPath) || publicRoutes.includes(requestPath)) {
    return next();
  }
  const tokenUser = getUserFromToken(req);
  if (tokenUser) {
    req.session = req.session || {};
    req.session.user = { username: tokenUser.username };
    return next();
  }
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// Test endpoint without auth - placed before auth middleware
app.get('/test/places/search', async (req, res) => {
  try {
    const { query = 'cafe', lat = 10.762622, lng = 106.660172, radius = 2000 } = req.query;

    // Test OSM only for now
    const osmResults = await searchWithOSM({
      query,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radius: parseInt(radius)
    });

    res.json({ places: osmResults });
  } catch (error) {
    console.error('Test search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api', requireAuth);

// Test endpoint without auth - placed after auth middleware but before other routes
app.get('/api/test/places/search', async (req, res) => {
  try {
    const { query = 'cafe', lat = 10.762622, lng = 106.660172, radius = 2000 } = req.query;

    const places = await searchPlaces({
      query,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radius: parseInt(radius)
    });

    res.json({ places });
  } catch (error) {
    console.error('Test search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/oauth/config', (req, res) => {
  res.json({
    googleClientId: hasConfiguredKey(GOOGLE_CLIENT_ID, 'your_google_oauth_client_id.apps.googleusercontent.com') ? GOOGLE_CLIENT_ID : '',
    facebookAppId: hasConfiguredKey(FACEBOOK_APP_ID, 'your_facebook_app_id') ? FACEBOOK_APP_ID : ''
  });
});

app.get('/api/maps/config', (req, res) => {
  res.json({
    googlePlacesApiKey: hasConfiguredKey(GOOGLE_PLACES_API_KEY, 'your_google_places_api_key_here') ? GOOGLE_PLACES_API_KEY : ''
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const rateLimit = getLoginRateLimitState(req, username);
  if (rateLimit.retryAfterSeconds > 0) {
    return res.status(429).json({
      error: `Vui lòng nhập lại sau ${rateLimit.retryAfterSeconds}s`,
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
  }

  const data = loadData();
  const user = findUserByLogin(data, username);
  if (!user || user.password !== password) {
    const failed = recordFailedLogin(req, username);
    if (failed.retryAfterSeconds > 0) {
      return res.status(429).json({
        error: `Vui lòng nhập lại sau ${failed.retryAfterSeconds}s`,
        retryAfterSeconds: failed.retryAfterSeconds,
        failedAttempts: failed.attempts
      });
    }

    return res.status(401).json({
      error: 'Tài khoản hoặc mật khẩu không đúng',
      failedAttempts: failed.attempts
    });
  }

  clearLoginRateLimit(req, username);
  const token = uuidv4();
  user.token = token;
  saveData(data);
  req.session.user = sanitizeUser(user);
  res.json({ authenticated: true, user: sanitizeUser(user), token });
});

app.post('/api/social-login', (req, res) => {
  const { provider, providerId, name, email, avatar } = req.body;
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedEmail = normalizeEmail(email);
  if (!['google', 'facebook'].includes(normalizedProvider)) {
    return res.status(400).json({ error: 'Nhà cung cấp đăng nhập không hợp lệ.' });
  }
  if (!name || !normalizedEmail) {
    return res.status(400).json({ error: 'Tên và email từ Gmail/Facebook là bắt buộc.' });
  }

  const data = loadData();
  const user = upsertSocialUser(data, {
    provider: normalizedProvider,
    providerId,
    name,
    email: normalizedEmail,
    avatar
  });
  saveData(data);
  req.session.user = sanitizeUser(user);
  res.json({ authenticated: true, user: sanitizeUser(user), token: user.token });
});

app.post('/api/social-login/google', async (req, res) => {
  const { credential } = req.body;
  if (!hasConfiguredKey(GOOGLE_CLIENT_ID, 'your_google_oauth_client_id.apps.googleusercontent.com')) {
    return res.status(501).json({ error: 'GOOGLE_CLIENT_ID chưa được cấu hình trong .env.' });
  }
  if (!credential) {
    return res.status(400).json({ error: 'Thiếu Google credential.' });
  }

  try {
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const profile = await verifyRes.json();
    if (!verifyRes.ok) {
      return res.status(401).json({ error: profile.error_description || 'Google credential không hợp lệ.' });
    }
    if (profile.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Google credential không thuộc client id của ứng dụng.' });
    }
    if (profile.email_verified !== 'true' && profile.email_verified !== true) {
      return res.status(401).json({ error: 'Email Google chưa được xác minh.' });
    }

    const data = loadData();
    const user = upsertSocialUser(data, {
      provider: 'google',
      providerId: profile.sub,
      name: profile.name || profile.email,
      email: profile.email,
      avatar: profile.picture || 'assets/logo/app-logo.svg'
    });
    saveData(data);
    req.session.user = sanitizeUser(user);
    res.json({ authenticated: true, user: sanitizeUser(user), token: user.token });
  } catch (error) {
    console.error('Google login verify error:', error);
    res.status(502).json({ error: 'Không thể xác minh tài khoản Google. Vui lòng thử lại.' });
  }
});

function getRequestBaseUrl(req) {
  return process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
}

function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
}

function redirectToFacebookLoginResult(res, params = {}) {
  const url = new URL('/login', getFrontendBaseUrl());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return res.redirect(url.toString());
}

app.get('/api/auth/facebook', (req, res) => {
  if (!hasConfiguredKey(FACEBOOK_APP_ID, 'your_facebook_app_id') || !hasConfiguredKey(FACEBOOK_APP_SECRET, 'your_facebook_app_secret')) {
    return res.status(501).send('FACEBOOK_APP_ID và FACEBOOK_APP_SECRET chưa được cấu hình trong .env.');
  }
  const state = uuidv4();
  req.session.facebookOAuthState = state;
  facebookOAuthStates.set(state, { createdAt: Date.now() });
  const redirectUri = `${getRequestBaseUrl(req)}/api/auth/facebook/callback`;
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'email,public_profile',
    response_type: 'code'
  });
  res.redirect(`https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`);
});

app.get('/api/auth/facebook/callback', async (req, res) => {
  if (!hasConfiguredKey(FACEBOOK_APP_ID, 'your_facebook_app_id') || !hasConfiguredKey(FACEBOOK_APP_SECRET, 'your_facebook_app_secret')) {
    return res.status(501).send('FACEBOOK_APP_ID và FACEBOOK_APP_SECRET chưa được cấu hình trong .env.');
  }
  const state = String(req.query.state || '');
  const hasValidState = Boolean(state && (facebookOAuthStates.has(state) || state === req.session.facebookOAuthState));
  if (hasValidState) facebookOAuthStates.delete(state);
  if (!req.query.code || !hasValidState) {
    return redirectToFacebookLoginResult(res, {
      error: 'Facebook callback khong hop le.'
    });
    return res.status(400).send('Facebook callback không hợp lệ.');
  }

  try {
    const redirectUri = `${getRequestBaseUrl(req)}/api/auth/facebook/callback`;
    const tokenParams = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: redirectUri,
      code: req.query.code
    });
    const tokenRes = await fetch(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?${tokenParams.toString()}`);
    const tokenBody = await tokenRes.json();
    if (!tokenRes.ok) {
      return redirectToFacebookLoginResult(res, {
        error: tokenBody.error?.message || 'Khong lay duoc Facebook access token.'
      });
      return res.status(401).send(tokenBody.error?.message || 'Không lấy được Facebook access token.');
    }

    const profileParams = new URLSearchParams({
      fields: 'id,name,email,picture.width(200).height(200)',
      access_token: tokenBody.access_token
    });
    const profileRes = await fetch(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me?${profileParams.toString()}`);
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      return redirectToFacebookLoginResult(res, {
        error: profile.error?.message || 'Facebook khong tra ve email. Hay cap quyen email cho ung dung.'
      });
      return res.status(401).send(profile.error?.message || 'Facebook không trả về email. Hãy cấp quyền email cho ứng dụng.');
    }

    const data = loadData();
    const user = upsertSocialUser(data, {
      provider: 'facebook',
      providerId: profile.id,
      name: profile.name || profile.email,
      email: profile.email,
      avatar: profile.picture?.data?.url || 'assets/images/female.png'
    });
    saveData(data);
    req.session.user = sanitizeUser(user);
    delete req.session.facebookOAuthState;
    return redirectToFacebookLoginResult(res, {
      social: 'facebook',
      token: user.token,
      user: JSON.stringify(sanitizeUser(user))
    });
  } catch (error) {
    console.error('Facebook login error:', error);
    return redirectToFacebookLoginResult(res, {
      error: 'Khong the dang nhap bang Facebook. Vui long thu lai.'
    });
    res.status(502).send('Không thể đăng nhập bằng Facebook. Vui lòng thử lại.');
  }
});

app.post('/api/register', (req, res) => {
  const { username, password, fullName, email, wallet, avatar, birthday } = req.body;
  const data = loadData();
  const normalizedEmail = normalizeEmail(email || username);
  const normalizedUsername = normalizeEmail(username || email);
  if (!normalizedUsername || !password) {
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
  }
  data.users = data.users || [];
  const existing = data.users.find((item) => {
    return normalizeEmail(item.username) === normalizedUsername || normalizeEmail(item.email) === normalizedEmail;
  });
  if (existing) {
    return res.status(409).json({ error: 'Email này đã có tài khoản.' });
  }
  const user = {
    id: uuidv4(),
    username: normalizedUsername,
    password,
    fullName: fullName || normalizedUsername,
    email: normalizedEmail || '',
    birthday: birthday || '',
    phone: '',
    avatar: avatar || 'assets/logo/app-logo.svg',
    wallet: Number(wallet || 0),
    createdAt: new Date().toISOString(),
    token: uuidv4()
  };
  data.users.push(user);
  saveData(data);
  req.session.user = sanitizeUser(user);
  res.status(201).json({ authenticated: true, user: sanitizeUser(user), token: user.token });
});

app.post('/api/password-recovery/request', (req, res) => {
  const { username, channel = 'gmail' } = req.body;
  const data = loadData();
  const user = findUserByLogin(data, username);
  if (!username) {
    return res.status(400).json({ error: 'Email là bắt buộc.' });
  }
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
  }
  if (channel === 'gmail' && !user.email) {
    return res.status(400).json({ error: 'Tài khoản này chưa liên kết Gmail để nhận mã xác minh.' });
  }
  const normalizedLogin = normalizeEmail(username);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  recoveryCodes.set(normalizedLogin, {
    code,
    channel: channel === 'facebook' ? 'facebook' : 'gmail',
    verified: false,
    expiresAt: Date.now() + 10 * 60 * 1000
  });
  res.json({
    success: true,
    message: `Mã xác minh đã được gửi qua ${channel === 'facebook' ? 'Facebook' : 'Gmail'}.`,
    devCode: code
  });
});

app.post('/api/password-recovery/verify', (req, res) => {
  const { username, code } = req.body;
  const normalizedLogin = normalizeEmail(username);
  const recovery = recoveryCodes.get(normalizedLogin);
  if (!recovery || recovery.expiresAt < Date.now()) {
    recoveryCodes.delete(normalizedLogin);
    return res.status(400).json({ error: 'Mã xác minh đã hết hạn. Vui lòng gửi lại mã.' });
  }
  if (recovery.code !== String(code || '').trim()) {
    return res.status(400).json({ error: 'Mã xác minh không đúng.' });
  }
  recovery.verified = true;
  recoveryCodes.set(normalizedLogin, recovery);
  res.json({ success: true, message: 'Xác minh thành công. Vui lòng đặt mật khẩu mới.' });
});

app.post('/api/password-recovery/reset', (req, res) => {
  const { username, newPassword } = req.body;
  const normalizedLogin = normalizeEmail(username);
  const recovery = recoveryCodes.get(normalizedLogin);
  if (!recovery || recovery.expiresAt < Date.now() || !recovery.verified) {
    recoveryCodes.delete(normalizedLogin);
    return res.status(400).json({ error: 'Bạn cần xác minh mã trước khi đặt mật khẩu mới.' });
  }
  if (!newPassword) {
    return res.status(400).json({ error: 'Mật khẩu mới là bắt buộc.' });
  }
  const data = loadData();
  const user = findUserByLogin(data, username);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
  }
  user.password = newPassword;
  user.token = '';
  saveData(data);
  recoveryCodes.delete(normalizedLogin);
  res.json({ success: true, message: 'Mật khẩu đã được đặt lại thành công.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Đăng xuất không thành công' });
    }
    res.json({ success: true });
  });
});

app.get('/api/session', (req, res) => {
  const tokenUser = getUserFromToken(req);
  if (tokenUser) {
    return res.json({ authenticated: true, user: sanitizeUser(tokenUser) });
  }
  if (req.session && req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  res.json({ authenticated: false });
});

app.get('/api/profile', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
  }
  res.json(sanitizeUser(user));
});

app.put('/api/profile', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
  }

  const allowedFields = ['fullName', 'email', 'birthday', 'phone', 'avatar', 'wallet'];
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = field === 'wallet' ? Number(req.body[field] || 0) : req.body[field];
    }
  });
  saveData(data);
  req.session.user = sanitizeUser(user);
  res.json({ success: true, user: sanitizeUser(user) });
});

app.get('/api/expenses', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  res.json(getUserExpenses(data, user));
});

app.post('/api/expenses', async (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  const userId = getUserId(user);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const multipart = isMultipartRequest(req) ? await parseMultipartForm(req) : null;
  const body = multipart ? multipart.fields : req.body || {};
  const image = multipart?.files?.image;
  const { title, amount, category, date, time, note, location, friends, force } = body;
  const type = body.type === 'income' ? 'income' : 'expense';
  const validationErrors = validateExpensePayload({ amount, category, date, type });
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors[0], errors: validationErrors });
  }
  const item = {
    userId,
    id: uuidv4(),
    type,
    title: title || (type === 'income' ? 'Thu vào mới' : 'Chi tiêu mới'),
    amount: Number(amount) || 0,
    category: String(category).trim(),
    date: String(date).slice(0, 10),
    time: time || '',
    note: note || '',
    location: location || '',
    friends: friends || '',
    imageUrl: image?.url || ''
  };

  data.expenses = data.expenses || [];
  const userExpenses = getUserExpenses(data, user);
  const similar = findSimilarExpense(userExpenses, item);
  if (similar && !force) {
    return res.status(409).json({ issue: 'duplicate', message: 'Phát hiện giao dịch giống với bản ghi trước đó.', similar });
  }

  const warnings = detectUnusualExpense(buildUserScopedData(data, user), item);
  if (warnings.length && !force) {
    return res.status(409).json({ issue: 'unusual', message: warnings.join(' '), warnings });
  }

  data.expenses.unshift(item);
  const scopedAfterSave = buildUserScopedData(data, user);
  const insightAfterSave = buildInsight(scopedAfterSave, user);
  const budgetNotification = type === 'expense'
    ? createBudgetOverspendingNotification(data, user, insightAfterSave, item)
    : null;
  saveData(data);
  res.status(201).json({
    ...item,
    budgetNotification,
    debtCarryover: {
      debtCarriedFromPrevious: insightAfterSave.debt_carried_from_previous,
      debtToCarryNextPeriod: insightAfterSave.debt_to_carry_next_period,
      availableBudgetAfterDebt: insightAfterSave.available_budget_after_debt
    }
  });
});


app.put('/api/expenses/:id', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  const { id } = req.params;
  const index = (data.expenses || []).findIndex((item) => item.id === id && hasUserOwner(item, user));
  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  const merged = {
    ...data.expenses[index],
    ...req.body
  };
  const validationErrors = validateExpensePayload(merged);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors[0], errors: validationErrors });
  }
  const type = merged.type === 'income' ? 'income' : 'expense';
  const { title, amount, category, date, time, note, location, friends } = merged;
  data.expenses[index] = {
    ...data.expenses[index],
    type,
    title: title || data.expenses[index].title,
    amount: Number(amount),
    category: String(category).trim(),
    date: String(date).slice(0, 10),
    time: time || data.expenses[index].time || '',
    note: note || '',
    location: location || '',
    friends: friends || ''
  };
  saveData(data);
  res.json(data.expenses[index]);
});

app.delete('/api/expenses/:id', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  const { id } = req.params;
  const originalLength = (data.expenses || []).length;
  const updated = (data.expenses || []).filter((item) => !(item.id === id && hasUserOwner(item, user)));
  if (updated.length === originalLength) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  data.expenses = updated;
  saveData(data);
  res.json({ success: true });
});

app.use('/api', createBudgetRoutes({
  loadData,
  saveData,
  findCurrentUser,
  getUserId,
  getUserBudget,
  getUserCategoryBudgets
}));

app.use('/api/categories', createCategoryRoutes({ loadData, saveData }));

app.use('/api/goals', createGoalRoutes({
  loadData,
  saveData,
  findCurrentUser,
  getUserId,
  hasUserOwner,
  getUserGoals
}));

app.get('/api/insights', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  res.json(buildInsight(buildUserScopedData(data, user), user));
});

app.get('/api/notifications', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(getUserNotifications(data, user));
});

app.put('/api/notifications/read-all', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const updated = markAllNotificationsRead(data, user);
  saveData(data);
  res.json({ success: true, updated });
});

app.get('/api/reports/export/:format', (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const scopedData = buildUserScopedData(data, user);
  const insight = buildInsight(scopedData, user);
  const report = buildFinancialReport({ scopedData, insight });
  data.reportExports = Array.isArray(data.reportExports) ? data.reportExports : [];
  data.reportExports.unshift({
    id: uuidv4(),
    userId: getUserId(user),
    format: String(req.params.format || '').toLowerCase(),
    fileName: `smartspend-report-${new Date().toISOString().slice(0, 10)}`,
    periodKey: insight.debt_period_key || '',
    createdAt: new Date().toISOString()
  });
  saveData(data);
  return sendReportExport(res, req.params.format, report);
});

app.post('/api/ai-suggestions', async (req, res) => {
  const data = loadData();
  const user = findCurrentUser(req, data);
  const scopedData = buildUserScopedData(data, user);
  const { message } = req.body;
  const insight = buildInsight(scopedData, user);
  const summary = `Tổng chi tiêu: ${insight.totalExpense}đ, budget khả dụng sau debt: ${insight.budget_amount}đ, debt carry-over kỳ sau: ${insight.debt_to_carry_next_period}đ, nhóm chi tiêu lớn nhất: ${insight.topCategory}.`;
  const prompt = `Bạn là trợ lý tài chính. Dựa trên dữ liệu sau:
${summary}

Hãy trả về gợi ý cụ thể cho người dùng:
${message}`;

  if (!OPENAI_API_KEY) {
    return res.json({
      source: 'rule-based',
      reply: `BOT: ${message}"
- Hiện chưa cấu hình OpenAI. Gợi ý rule-based: ${insight.recommendations.slice(0, 3).join(' ')}`
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Bạn là trợ lý tài chính cá nhân, trả lời ngắn gọn và rõ ràng.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: 'OpenAI request failed', details: errorText });
    }

    const payload = await response.json();
    const reply = payload.choices?.[0]?.message?.content || 'Không có phản hồi từ AI.';
    res.json({ source: 'openai', reply });
  } catch (error) {
    res.status(500).json({ error: 'AI service error', details: error.message });
  }
});

app.post('/api/chat', async (req, res) => {

  try {

    const { message } = req.body;

    const data = loadData();
    const user = findCurrentUser(req, data);
    const scopedData = buildUserScopedData(data, user);
    const insight = buildInsight(scopedData, user);

    const summary = `
    Tổng chi tiêu: ${insight.totalExpense}đ
    Ngân sách: ${scopedData.budget.amount}đ
    Nhóm chi nhiều nhất: ${insight.topCategory}
    Trạng thái: ${insight.status}
    `;

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: 'gpt-4.1-mini',

          messages: [

            {
              role: 'system',

              content: `
              Bạn là AI tài chính của SmartSpend.

              Nhiệm vụ:
              - Tư vấn quản lý chi tiêu
              - Giúp tiết kiệm tiền
              - Giải thích đơn giản
              - Phù hợp sinh viên và nhân viên văn phòng
              - Trả lời bằng tiếng Việt
              `
            },

            {
              role: 'system',
              content: summary
            },

            {
              role: 'user',
              content: message
            }
          ],

          max_tokens: 300
        })
      }
    );

    const payload = await response.json();

    const reply =
      payload.choices?.[0]?.message?.content
      || 'Không có phản hồi từ AI';

    res.json({ reply });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: 'AI Chat Error'
    });
  }
});

function mapGooglePlace(place = {}) {
  const legacyLocation = place.geometry?.location || {};
  const lat = place.location?.latitude ?? legacyLocation.lat;
  const lon = place.location?.longitude ?? legacyLocation.lng;
  const name = place.displayName?.text || place.formattedAddress || 'Địa điểm';
  const legacyName = place.name || place.formatted_address || place.vicinity || '';
  const type = Array.isArray(place.types) ? place.types[0] : 'place';
  const priceLevel = place.priceLevel ? place.priceLevel.replace('PRICE_LEVEL_', '') : (Number.isFinite(place.price_level) ? '$'.repeat(Math.max(1, Number(place.price_level))) : '');
  const placeId = place.id || place.place_id;
  return {
    id: placeId,
    source: 'google_places',
    rawPlaceId: placeId,
    name: legacyName || name,
    type,
    typeLabel: 'Google Places',
    address: place.formattedAddress || place.formatted_address || place.vicinity || '',
    lat,
    lon,
    website: place.websiteUri || '',
    googleMapsUrl: place.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : ''),
    phone: place.nationalPhoneNumber || '',
    rating: place.rating || null,
    userRatingCount: place.userRatingCount || place.user_ratings_total || 0,
    price: priceLevel,
    types: place.types || []
  };
}

function mapSerpApiPlace(place = {}) {
  const lat = place.gps_coordinates?.latitude;
  const lon = place.gps_coordinates?.longitude;
  return {
    id: place.place_id || place.data_id || place.data_cid || place.position,
    source: 'serpapi',
    placeId: place.place_id || '',
    dataId: place.data_id || '',
    dataCid: place.data_cid || '',
    name: place.title || 'Địa điểm',
    type: place.type || place.types?.[0] || 'place',
    typeLabel: 'SerpApi Maps',
    address: place.address || '',
    lat,
    lon,
    website: normalizePlaceUrl(place.website || place.links?.website || ''),
    googleMapsUrl: place.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      : '',
    phone: place.phone || '',
    rating: place.rating || null,
    userRatingCount: place.reviews || 0,
    price: place.price || '',
    types: place.types || []
  };
}

async function searchWithSerpApi({ query, latitude, longitude, radius }) {
  const cacheKey = createServerCacheKey('serpapi-search', query, Number(latitude).toFixed(4), Number(longitude).toFixed(4), radius);
  return fetchWithServerCache(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        engine: 'google_maps',
        type: 'search',
        q: query,
        ll: `@${latitude},${longitude},${getSerpApiZoom(radius)}z`,
        num: '20',
        hl: 'vi',
        gl: 'vn',
        api_key: SERPAPI_API_KEY
      });
      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok || payload.error) {
        const error = new Error(payload.error || 'SerpApi search failed');
        error.status = response.status;
        throw error;
      }
      return (payload.local_results || []).map(mapSerpApiPlace);
    },
    { ttl: 10 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
  );
}

function getSerpApiZoom(radius = 10000) {
  const meters = Number(radius) || 10000;
  if (meters <= 500) return 16;
  if (meters <= 1000) return 15;
  if (meters <= 2000) return 14;
  if (meters <= 5000) return 13;
  if (meters <= 10000) return 12;
  if (meters <= 25000) return 11;
  return 10;
}

async function searchWithOSM({ query, latitude, longitude, radius }) {
  return [];
}

function getOSMAmenityLabel(type) {
  if (type === 'cafe' || type === 'coffee_shop') return 'Quán cà phê';
  if (type === 'restaurant') return 'Nhà hàng';
  if (type === 'fast_food') return 'Quán ăn nhanh';
  if (type === 'bar' || type === 'pub') return 'Quán bar';
  if (type === 'ice_cream') return 'Quán kem';
  if (type === 'juice_bar') return 'Quán nước ép';
  if (type === 'food_court') return 'Khu ăn uống';
  if (type === 'bakery') return 'Tiệm bánh';
  if (type === 'confectionery' || type === 'chocolate') return 'Tiệm kẹo';
  return 'Quán ăn';
}

function getDistanceMeters(from, to) {
  const fromLatitude = Number(from.latitude);
  const fromLongitude = Number(from.longitude);
  const toLatitude = Number(to.lat);
  const toLongitude = Number(to.lon);
  if (![fromLatitude, fromLongitude, toLatitude, toLongitude].every(Number.isFinite)) return null;

  const earthRadius = 6371000;
  const lat1 = fromLatitude * Math.PI / 180;
  const lat2 = toLatitude * Math.PI / 180;
  const deltaLat = (toLatitude - fromLatitude) * Math.PI / 180;
  const deltaLon = (toLongitude - fromLongitude) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizePlaceUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizePlaceSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPlaceSearchQueries(query) {
  const normalized = normalizePlaceSearchText(query);
  const variants = [query];
  const add = (...items) => {
    items.forEach((item) => {
      const value = String(item || '').trim();
      const normalizedValue = normalizePlaceSearchText(value);
      if (value && !variants.some((current) => normalizePlaceSearchText(current) === normalizedValue)) {
        variants.push(value);
      }
    });
  };

  if (normalized.includes('cafe') || normalized.includes('coffee') || normalized.includes('ca phe')) {
    add('cafe', 'cà phê', 'coffee', 'quán cà phê', 'coffee shop');
  }

  if (normalized.includes('highlands')) {
    add('Highlands Coffee', 'Highlands cafe');
  }

  if (normalized.includes('restaurant') || normalized.includes('nha hang') || normalized.includes('quan an') || normalized.includes('food')) {
    add('quán ăn', 'nhà hàng', 'restaurant', 'food');
  }

  if (normalized.includes('store') || normalized.includes('shop') || normalized.includes('sieu thi')) {
    add('cửa hàng', 'siêu thị', 'store', 'shop');
  }

  return variants.slice(0, 6);
}

function attachPlaceDistance(place, origin) {
  const distance = getDistanceMeters(origin, { lat: place.lat, lon: place.lon });
  return {
    ...place,
    distance,
    distanceMeters: distance
  };
}

function isPlaceWithinRadius(place, radius) {
  if (!Number.isFinite(place.distance)) return false;
  return place.distance <= Number(radius || 0) + 80;
}

function getPlaceDedupeKey(place) {
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  const name = normalizePlaceSearchText(place.name);
  if (name && Number.isFinite(lat) && Number.isFinite(lon)) {
    return `geo:${name}:${Math.round(lat * 10000)}:${Math.round(lon * 10000)}`;
  }

  const id = place.rawPlaceId || place.placeId || place.dataId || place.dataCid || place.id;
  return id ? `id:${id}` : `fallback:${name}:${normalizePlaceSearchText(place.address)}`;
}

function mergePlaceResult(existing, incoming) {
  const preferred = existing.source === 'serpapi' ? existing : incoming.source === 'serpapi' ? incoming : existing;
  const fallback = preferred === existing ? incoming : existing;
  return {
    ...fallback,
    ...preferred,
    website: preferred.website || fallback.website || '',
    googleMapsUrl: preferred.googleMapsUrl || fallback.googleMapsUrl || '',
    phone: preferred.phone || fallback.phone || '',
    rating: preferred.rating || fallback.rating || null,
    userRatingCount: Math.max(Number(preferred.userRatingCount || 0), Number(fallback.userRatingCount || 0)),
    price: preferred.price || fallback.price || '',
    types: preferred.types?.length ? preferred.types : fallback.types || [],
    distance: Math.min(
      Number.isFinite(preferred.distance) ? preferred.distance : Number.MAX_SAFE_INTEGER,
      Number.isFinite(fallback.distance) ? fallback.distance : Number.MAX_SAFE_INTEGER
    ),
    distanceMeters: Math.min(
      Number.isFinite(preferred.distanceMeters) ? preferred.distanceMeters : Number.MAX_SAFE_INTEGER,
      Number.isFinite(fallback.distanceMeters) ? fallback.distanceMeters : Number.MAX_SAFE_INTEGER
    )
  };
}

function rankNearbyPlace(a, b) {
  const distanceA = Number.isFinite(a.distance) ? a.distance : Number.MAX_SAFE_INTEGER;
  const distanceB = Number.isFinite(b.distance) ? b.distance : Number.MAX_SAFE_INTEGER;
  if (distanceA !== distanceB) return distanceA - distanceB;

  const reviewsA = Number(a.userRatingCount || 0);
  const reviewsB = Number(b.userRatingCount || 0);
  const ratingA = Number(a.rating || 0);
  const ratingB = Number(b.rating || 0);
  return (ratingB * 100 + Math.min(reviewsB, 500)) - (ratingA * 100 + Math.min(reviewsA, 500));
}

function normalizeSerpApiReviews(place = {}) {
  const reviews = [];
  const appendReview = (review = {}, index = reviews.length) => {
    const text = review.text || review.description || review.snippet || review.review || '';
    if (!text) return;
    reviews.push({
      authorName: review.authorName || review.author || review.username || review.name || `Khách hàng ${index + 1}`,
      rating: review.rating || review.stars || 0,
      text,
      time: review.date || review.iso_date || '',
      relativeTime: review.relative_time_description || review.when || ''
    });
  };

  if (Array.isArray(place.user_reviews?.most_relevant)) {
    place.user_reviews.most_relevant.forEach(appendReview);
  }

  if (Array.isArray(place.user_reviews?.summary)) {
    place.user_reviews.summary.forEach(appendReview);
  }

  if (Array.isArray(place.reviews)) {
    place.reviews.forEach(appendReview);
  }

  return reviews.slice(0, 5);
}

function getSerpApiMenuUrl(place = {}) {
  return normalizePlaceUrl(
    place.menu ||
    place.menu_link ||
    place.links?.menu ||
    place.links?.order ||
    place.order_online ||
    ''
  );
}

function mapSerpApiPlaceDetail(place = {}) {
  const reviewCount = Array.isArray(place.reviews)
    ? place.reviews.length
    : Number(place.reviews || place.user_reviews?.total || place.user_reviews?.count || 0);

  return {
    source: 'serpapi',
    name: place.title || 'Địa điểm',
    address: place.address || '',
    website: normalizePlaceUrl(place.website || place.links?.website || ''),
    phone: place.phone || '',
    rating: place.rating || null,
    userRatingCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    price: place.price || '',
    type: place.type || '',
    types: place.types || [],
    thumbnail: place.thumbnail || place.serpapi_thumbnail || '',
    openState: place.open_state || '',
    hours: place.hours || place.operating_hours || {},
    description: place.description || '',
    menuUrl: getSerpApiMenuUrl(place),
    reviews: normalizeSerpApiReviews(place),
    googleMapsUrl: place.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      : ''
  };
}

async function getSerpApiPlaceDetail({ placeId, dataId, dataCid, latitude, longitude }) {
  const cacheKey = createServerCacheKey('serpapi-detail', { placeId, dataId, dataCid, latitude, longitude });
  return fetchWithServerCache(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        engine: 'google_maps',
        type: 'place',
        hl: 'vi',
        gl: 'vn',
        api_key: SERPAPI_API_KEY
      });
      if (placeId) {
        params.set('place_id', placeId);
      } else if (dataCid) {
        params.set('data_cid', dataCid);
      } else if (dataId && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
        params.set('data', `!4m5!3m4!1s${dataId}!8m2!3d${latitude}!4d${longitude}`);
      }
      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok || payload.error) {
        const error = new Error(payload.error || 'SerpApi place detail failed');
        error.status = response.status;
        throw error;
      }
      return mapSerpApiPlaceDetail(payload.place_results || {});
    },
    { ttl: 30 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
  );
}

function mapGooglePlaceDetail(place = {}) {
  // Xử lý reviews
  const reviews = (place.reviews || []).slice(0, 5).map(review => ({
    authorName: review.authorAttribution?.displayName || 'Ẩn danh',
    rating: review.rating || 0,
    text: review.text?.text || '',
    time: review.publishTime || '',
    relativeTime: review.relativePublishTimeDescription || ''
  }));

  // Xử lý photos
  const photos = (place.photos || []).slice(0, 10).map(photo => ({
    name: photo.name,
    widthPx: photo.widthPx,
    heightPx: photo.heightPx,
    authorAttributions: photo.authorAttribution?.displayName || ''
  }));

  // Xử lý services
  const services = [];
  if (place.servesBreakfast) services.push('Phục vụ bữa sáng');
  if (place.servesBrunch) services.push('Phục vụ bữa trưa');
  if (place.servesLunch) services.push('Phục vụ bữa trưa');
  if (place.servesDinner) services.push('Phục vụ bữa tối');
  if (place.servesBeer) services.push('Có bia');
  if (place.servesWine) services.push('Có rượu');
  if (place.servesVegetarianFood) services.push('Có đồ chay');
  if (place.takeout) services.push('Có mang đi');
  if (place.delivery) services.push('Giao tận nơi');
  if (place.dineIn) services.push('Có chỗ ngồi');
  if (place.reservable) services.push('Có đặt bàn');
  if (place.wheelchairAccessibleEntrance) services.push('Phù hợp người khuyết tật');

  return {
    source: 'google_places',
    name: place.displayName?.text || 'Địa điểm',
    address: place.formattedAddress || '',
    website: place.websiteUri || '',
    phone: place.nationalPhoneNumber || '',
    rating: place.rating || null,
    userRatingCount: place.userRatingCount || 0,
    price: place.priceLevel ? place.priceLevel.replace('PRICE_LEVEL_', '') : '',
    type: place.types?.[0] || '',
    types: place.types || [],
    thumbnail: photos.length > 0 ? `https://places.googleapis.com/v1/${photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_PLACES_API_KEY}` : '',
    openState: place.currentOpeningHours?.openNow ? 'Đang mở cửa' : 'Đã đóng cửa',
    hours: place.currentOpeningHours?.weekdayDescriptions || [],
    description: place.editorialSummary?.text || '',
    reviews: reviews,
    photos: photos,
    services: services,
    googleMapsUrl: place.googleMapsUri || ''
  };
}

async function getGooglePlaceDetail(placeId) {
  const cacheKey = createServerCacheKey('google-place-detail', placeId);
  const cached = getMemoryCacheEntry(cacheKey);
  if (cached !== null) return cached;

  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'websiteUri',
    'googleMapsUri',
    'priceLevel',
    'rating',
    'userRatingCount',
    'nationalPhoneNumber',
    'types',
    'currentOpeningHours',
    'reviews',  // Thêm reviews chi tiết
    'photos',   // Thêm photos
    'editorialSummary', // Thêm mô tả
    'servesBeer',
    'servesBreakfast',
    'servesBrunch',
    'servesDinner',
    'servesLunch',
    'servesVegetarianFood',
    'servesWine',
    'takeout',
    'delivery',
    'dineIn',
    'reservable',
    'wheelchairAccessibleEntrance'
  ].join(',');
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=vi`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': fields
    }
  });
  const payload = await response.json();
  if (!response.ok) {
    const stale = getMemoryCacheEntry(cacheKey, { allowExpired: true });
    if (stale !== null) return stale;
    const error = new Error(payload.error?.message || 'Google place detail failed');
    error.status = response.status;
    throw error;
  }
  return setMemoryCacheEntry(cacheKey, mapGooglePlaceDetail(payload), {
    ttl: 30 * 60 * 1000,
    staleTtl: 24 * 60 * 60 * 1000
  });
}

async function searchWithGooglePlaces({ query, latitude, longitude, radius }) {
  const cacheKey = createServerCacheKey('google-places-search', query, Number(latitude).toFixed(4), Number(longitude).toFixed(4), radius);
  return fetchWithServerCache(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        query,
        location: `${latitude},${longitude}`,
        radius: String(Math.min(Math.max(Number(radius || 1000), 100), 50000)),
        language: 'vi',
        region: 'vn',
        key: GOOGLE_PLACES_API_KEY
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok || (payload.status && !['OK', 'ZERO_RESULTS'].includes(payload.status))) {
        const error = new Error(payload.error_message || payload.status || 'Google Places legacy search failed');
        error.status = response.status;
        throw error;
      }
      return (payload.results || []).map(mapGooglePlace);
    },
    { ttl: 10 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
  );
}

async function handleExpandedPlacesSearch(req, res) {
  const hasGooglePlaces = hasConfiguredKey(GOOGLE_PLACES_API_KEY, 'your_google_places_api_key_here');
  const hasSerpApi = hasConfiguredKey(SERPAPI_API_KEY, 'your_serpapi_api_key_here');
  if (!hasGooglePlaces && !hasSerpApi) {
    return res.status(501).json({
      configured: false,
      places: [],
      error: 'GOOGLE_PLACES_API_KEY hoặc SERPAPI_API_KEY chưa được cấu hình'
    });
  }

  const query = String(req.body.query || '').trim();
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  const radius = Math.min(Math.max(Number(req.body.radius || 1000), 100), 50000);
  if (!query || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: 'Thiếu query hoặc tọa độ hợp lệ' });
  }

  try {
    const origin = { latitude, longitude };
    const queryVariants = buildPlaceSearchQueries(query);
    const searchPromises = [];

    queryVariants.forEach((searchQuery) => {
      if (hasGooglePlaces) {
        searchPromises.push(
          searchWithGooglePlaces({ query: searchQuery, latitude, longitude, radius })
            .then(places => places.map(p => ({ ...p, priority: 1, matchedQuery: searchQuery })))
            .catch(err => { console.log(`Google Places error (${searchQuery}):`, err.message); return []; })
        );
      }

      if (hasSerpApi) {
        searchPromises.push(
          searchWithSerpApi({ query: searchQuery, latitude, longitude, radius })
            .then(places => places.map(p => ({ ...p, priority: 0, matchedQuery: searchQuery })))
            .catch(err => { console.log(`SerpAPI error (${searchQuery}):`, err.message); return []; })
        );
      }
    });

    const results = await Promise.all(searchPromises);
    const rawPlaces = results.flat();
    const allPlaces = rawPlaces
      .map((place) => attachPlaceDistance(place, origin))
      .filter((place) => isPlaceWithinRadius(place, radius));

    const uniquePlacesByKey = new Map();
    allPlaces
      .sort(rankNearbyPlace)
      .forEach((place) => {
        const key = getPlaceDedupeKey(place);
        const existing = uniquePlacesByKey.get(key);
        uniquePlacesByKey.set(key, existing ? mergePlaceResult(existing, place) : place);
      });

    const finalPlaces = Array.from(uniquePlacesByKey.values())
      .sort(rankNearbyPlace)
      .slice(0, 20);

    return res.json({
      configured: true,
      source: hasSerpApi ? 'serpapi' : 'google_places',
      searchMeta: {
        queryVariants,
        rawCount: rawPlaces.length,
        inRadiusCount: allPlaces.length,
        returnedCount: finalPlaces.length,
        radius
      },
      places: finalPlaces
    });
  } catch (error) {
    return res.status(500).json({ error: 'Places search service error', details: error.message });
  }
}

app.post('/api/places/search-expanded', handleExpandedPlacesSearch);

app.post('/api/places/search', async (req, res) => {
  const hasGooglePlaces = hasConfiguredKey(GOOGLE_PLACES_API_KEY, 'your_google_places_api_key_here');
  const hasSerpApi = hasConfiguredKey(SERPAPI_API_KEY, 'your_serpapi_api_key_here');
  if (!hasGooglePlaces && !hasSerpApi) {
    return res.status(501).json({
      configured: false,
      places: [],
      error: 'GOOGLE_PLACES_API_KEY hoặc SERPAPI_API_KEY chưa được cấu hình'
    });
  }

  const query = String(req.body.query || '').trim();
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  const radius = Math.min(Number(req.body.radius || 1000), 50000);
  if (!query || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: 'Thiếu query hoặc tọa độ hợp lệ' });
  }

  try {
    // Thu thập kết quả từ tất cả nguồn
    const searchPromises = [];

    if (!hasSerpApi && hasGooglePlaces) {
      searchPromises.push(
        searchWithGooglePlaces({ query, latitude, longitude, radius })
          .then(places => places.map(p => ({ ...p, priority: 1 }))) // Google Places có priority trung bình
          .catch(err => { console.log('Google Places error:', err.message); return []; })
      );
    }

    if (hasSerpApi) {
      searchPromises.push(
        searchWithSerpApi({ query, latitude, longitude, radius })
          .then(places => places.map(p => ({ ...p, priority: 1 }))) // SerpAPI có priority trung bình
          .catch(err => { console.log('SerpAPI error:', err.message); return []; })
      );
    }

    const results = await Promise.all(searchPromises);
    const allPlaces = results.flat();

    // Loại bỏ trùng lặp và ưu tiên quán nhỏ
    const uniquePlaces = [];
    const seen = new Set();

    // Sắp xếp: quán nhỏ (priority = 1) lên trước, sau đó theo khoảng cách
    allPlaces
      .sort((a, b) => {
        // Ưu tiên quán nhỏ hơn
        if (a.priority !== b.priority) return a.priority - b.priority;
        // Sau đó ưu tiên quán gần hơn
        return (a.distance || 0) - (b.distance || 0);
      })
      .forEach(place => {
        const key = `${place.name}-${place.lat?.toFixed(4)}-${place.lon?.toFixed(4)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePlaces.push(place);
        }
      });

    const finalPlaces = uniquePlaces.slice(0, 12);

    res.json({
      configured: true,
      source: hasSerpApi ? 'serpapi' : 'google_places',
      places: finalPlaces
    });
  } catch (error) {
    res.status(500).json({ error: 'Places search service error', details: error.message });
  }
});

app.post('/api/places/detail', async (req, res) => {
  const source = req.body.source;
  const hasGooglePlaces = hasConfiguredKey(GOOGLE_PLACES_API_KEY, 'your_google_places_api_key_here');
  const hasSerpApi = hasConfiguredKey(SERPAPI_API_KEY, 'your_serpapi_api_key_here');

  try {
    if (source === 'google_places') {
      if (!hasGooglePlaces) return res.status(501).json({ error: 'GOOGLE_PLACES_API_KEY chưa được cấu hình' });
      if (!req.body.placeId) return res.status(400).json({ error: 'Thiếu placeId' });
      return res.json({ detail: await getGooglePlaceDetail(req.body.placeId) });
    }
    if (source === 'serpapi') {
      if (!hasSerpApi) return res.status(501).json({ error: 'SERPAPI_API_KEY chưa được cấu hình' });
      if (!req.body.placeId && !req.body.dataId && !req.body.dataCid) {
        return res.status(400).json({ error: 'Thiếu placeId/dataId/dataCid' });
      }
      return res.json({
        detail: await getSerpApiPlaceDetail({
          placeId: req.body.placeId,
          dataId: req.body.dataId,
          dataCid: req.body.dataCid,
          latitude: req.body.latitude,
          longitude: req.body.longitude
        })
      });
    }
    return res.status(400).json({ error: 'Nguồn địa điểm không hỗ trợ chi tiết' });
  } catch (error) {
    res.status(500).json({ error: 'Place detail service error', details: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PUBLIC_DIR, 'index.html'));
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend Server đang chạy tại http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('SmartSpend server startup failed:', error);
  process.exit(1);
});
