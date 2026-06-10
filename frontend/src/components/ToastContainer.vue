<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <button
      v-if="canAskDevicePermission"
      type="button"
      class="toast-permission-btn"
      @click="enableDeviceNotifications"
    >
      Bật thông báo thiết bị
    </button>

    <article
      v-for="toast in toasts"
      :key="toast.id"
      class="smart-toast"
      :class="[`toast-${toast.priority || 'medium'}`]"
    >
      <div class="toast-icon">{{ toast.priority === 'critical' ? '!' : 'i' }}</div>
      <div class="toast-content">
        <strong>{{ toast.title }}</strong>
        <p>{{ toast.message }}</p>
      </div>
      <button type="button" class="toast-close" @click="removeToast(toast.id)">
        ×
      </button>
    </article>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  getToastEventName,
  requestBrowserNotificationPermission,
  showDeviceNotification
} from '../services/toast';

const toasts = ref([]);
const devicePermission = ref(
  typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported'
);
const timers = new Map();

const canAskDevicePermission = computed(() => devicePermission.value === 'default');

function removeToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
  const timer = timers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
}

function addToast(event) {
  const toast = event.detail || {};
  if (!toast.message) return;

  toasts.value = [toast, ...toasts.value.filter((item) => item.id !== toast.id)].slice(0, 4);
  showDeviceNotification(toast);

  const timeout = window.setTimeout(() => removeToast(toast.id), toast.duration || 8000);
  timers.set(toast.id, timeout);
}

async function enableDeviceNotifications() {
  devicePermission.value = await requestBrowserNotificationPermission();
}

onMounted(() => {
  window.addEventListener(getToastEventName(), addToast);
});

onBeforeUnmount(() => {
  window.removeEventListener(getToastEventName(), addToast);
  timers.forEach((timer) => window.clearTimeout(timer));
  timers.clear();
});
</script>
