const TOAST_EVENT_NAME = 'smartspend:toast';

function normalizeToast(payload = {}) {
  return {
    id: payload.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: payload.title || 'Thông báo SmartSpend',
    message: payload.message || '',
    type: payload.type || 'info',
    priority: payload.priority || 'medium',
    duration: Number(payload.duration || 8000),
    createdAt: payload.createdAt || new Date().toISOString()
  };
}

export function showToast(payload = {}) {
  const toast = normalizeToast(payload);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: toast }));
  }
  return toast;
}

export function showBudgetNotificationToast(notification) {
  if (!notification) return null;
  return showToast({
    id: notification.id,
    title: notification.title || 'Cảnh báo vượt ngân sách',
    message: notification.message,
    type: 'budget_overspending',
    priority: notification.priority || 'critical',
    duration: 10000,
    createdAt: notification.createdAt
  });
}

export function getToastEventName() {
  return TOAST_EVENT_NAME;
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

export function showDeviceNotification(payload = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const toast = normalizeToast(payload);
  try {
    new Notification(toast.title, {
      body: toast.message,
      tag: toast.id,
      icon: '/favicon.ico'
    });
    return true;
  } catch (error) {
    console.error('Show device notification failed', error);
    return false;
  }
}
