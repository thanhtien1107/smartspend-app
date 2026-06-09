const { v4: uuidv4 } = require('uuid');
const { formatVnd } = require('../../utils/money');

function getUserId(user) {
  return user?.id || user?.username || '';
}

function ensureNotificationCollections(data) {
  data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
  data.emailOutbox = Array.isArray(data.emailOutbox) ? data.emailOutbox : [];
}

function getUserNotifications(data, user) {
  ensureNotificationCollections(data);
  const userId = getUserId(user);
  if (!userId) return [];
  return data.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function shouldCreateOverspendingNotification(data, userId, periodKey) {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return !data.notifications.some((notification) => {
    if (notification.userId !== userId) return false;
    if (notification.type !== 'budget_overspending') return false;
    if (notification.periodKey !== periodKey) return false;
    const createdAt = new Date(notification.createdAt || 0).getTime();
    return createdAt >= todayStart.getTime() && createdAt <= now;
  });
}

function createBudgetOverspendingNotification(data, user, insight = {}, triggerExpense = null) {
  ensureNotificationCollections(data);
  const userId = getUserId(user);
  const debtAmount = Number(insight.debt_to_carry_next_period || insight.new_overspending_debt || 0);
  if (!userId || debtAmount <= 0) return null;

  const periodKey = insight.debt_period_key || new Date().toISOString().slice(0, 7);
  if (!shouldCreateOverspendingNotification(data, userId, periodKey)) {
    return null;
  }

  const periodLabel = insight.debt_period_label || 'kỳ hiện tại';
  const message = `Bạn đã vượt ngân sách ${periodLabel} ${formatVnd(debtAmount)}. Khoản này sẽ được chuyển sang kỳ tiếp theo và trừ vào ngân sách khả dụng.`;
  const createdAt = new Date().toISOString();
  const notification = {
    id: uuidv4(),
    userId,
    type: 'budget_overspending',
    title: 'Cảnh báo vượt ngân sách',
    message,
    priority: 'critical',
    read: false,
    periodKey,
    periodLabel,
    debtAmount: Math.round(debtAmount),
    expenseId: triggerExpense?.id || '',
    createdAt
  };

  data.notifications.unshift(notification);

  if (user?.email) {
    data.emailOutbox.unshift({
      id: uuidv4(),
      userId,
      to: user.email,
      subject: 'SmartSpend - Cảnh báo vượt ngân sách',
      body: message,
      status: 'queued_demo',
      notificationId: notification.id,
      createdAt
    });
  }

  return notification;
}

function markAllNotificationsRead(data, user) {
  ensureNotificationCollections(data);
  const userId = getUserId(user);
  let updated = 0;
  data.notifications.forEach((notification) => {
    if (notification.userId === userId && !notification.read) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      updated += 1;
    }
  });
  return updated;
}

module.exports = {
  ensureNotificationCollections,
  getUserNotifications,
  createBudgetOverspendingNotification,
  markAllNotificationsRead
};
