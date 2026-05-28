<template>
  <section id="ai" class="screen active">
    <div class="panel ai-panel">
      <h2>AI Chat</h2>
      <div class="insight-box">
        <h3>AI Financial Insights</h3>
        <div id="report-insights">
          <p v-if="insightLoading">Đang phân tích dữ liệu chi tiêu...</p>
          <template v-else-if="insights">
            <p>Tổng chi tiêu: {{ formatMoney(insights.total_expense ?? insights.totalExpense) }}</p>
            <p>Số dư còn lại: {{ formatMoney(insights.remaining_balance) }}</p>
            <p>Đã dùng ngân sách: {{ insights.budget_usage ?? insights.progress ?? 0 }}%</p>
            <p>Trạng thái: {{ insights.status || '-' }}</p>
            <p>Hạng mục lớn nhất: {{ insights.top_category || insights.topCategory || '-' }}</p>
            <p>Điểm sức khỏe tài chính: {{ insights.financial_health_score ?? '-' }}/100</p>
            <ul v-if="insightAlerts.length" class="insight-list">
              <li v-for="alert in insightAlerts" :key="alert">{{ alert }}</li>
            </ul>
          </template>
          <p v-else>Chưa có insight.</p>
        </div>
      </div>

      <div class="chat-box">
        <div id="chat-history" class="chat-history">
          <div v-for="item in messages" :key="item.id" class="chat-message" :class="item.role">
            {{ item.text }}
          </div>
          <div v-if="loading" class="chat-message ai">Đang phân tích...</div>
        </div>
        <form id="chat-form" class="chat-form" @submit.prevent="submitMessage">
          <input
            v-model.trim="message"
            type="text"
            id="chat-message"
            placeholder="Hỏi AI ví dụ: Tôi có vượt ngân sách không?"
            required
          />
          <button type="submit" class="primary-btn" :disabled="loading">
            {{ loading ? 'Đang gửi...' : 'Gửi' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { askAI, fetchInsights } from '../services/ai';

const message = ref('');
const loading = ref(false);
const insightLoading = ref(false);
const insights = ref(null);
const messages = ref([
  { id: 1, role: 'ai', text: 'AI Insight đang sẵn sàng.' }
]);
const insightAlerts = computed(() => {
  const alerts = insights.value?.alerts || insights.value?.recommendations || [];
  return alerts.slice(0, 3).map((item) => (typeof item === 'string' ? item : item.message));
});

onMounted(async () => {
  insightLoading.value = true;
  try {
    insights.value = await fetchInsights();
  } catch (error) {
    console.error('Fetch insights failed', error);
  } finally {
    insightLoading.value = false;
  }
});

async function submitMessage() {
  if (!message.value || loading.value) return;

  const userMessage = message.value;
  messages.value.push({ id: Date.now(), role: 'user', text: userMessage });
  message.value = '';
  loading.value = true;

  try {
    const data = await askAI(userMessage);
    messages.value.push({
      id: Date.now() + 1,
      role: 'ai',
      text: data.reply || data.message || 'Hệ thống chưa trả lời.'
    });
  } catch (error) {
    console.error('AI request failed', error);
    messages.value.push({ id: Date.now() + 2, role: 'ai', text: 'Không thể kết nối với AI.' });
  } finally {
    loading.value = false;
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}
</script>
