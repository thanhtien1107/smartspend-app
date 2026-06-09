<template>
  <section id="ai" class="screen active">
    <div class="panel ai-panel">
      <div class="ai-report-heading">
        <div>
          <h2>Financial Health Intelligence</h2>
          <p>{{ text.description }}</p>
        </div>
        <div class="ai-period-tabs">
          <button
            v-for="locale in locales"
            :key="locale"
            type="button"
            class="btn-action"
            :class="{ active: selectedLocale === locale }"
            @click="changeLocale(locale)"
          >
            {{ locale.toUpperCase() }}
          </button>
          <button
            v-for="item in periods"
            :key="item.value"
            type="button"
            class="btn-action"
            :class="{ active: selectedPeriod === item.value }"
            @click="changePeriod(item.value)"
          >
            {{ text.periods[item.value] }}
          </button>
        </div>
      </div>

      <div class="insight-box">
        <p v-if="insightLoading">{{ text.loadingReport }}</p>
        <template v-else-if="report">
          <div class="ai-health-summary">
            <div>
              <span>Financial Health Index</span>
              <strong>{{ report.overallScore }}/100</strong>
              <small>{{ text.risk }}: {{ riskLabel }}</small>
            </div>
            <div>
              <span>Financial Personality</span>
              <strong>{{ personalityLabel }}</strong>
              <small>
                {{ report.engine.triggeredRules }}/{{ report.engine.evaluatedRules }}
                {{ text.triggeredRules }}
              </small>
            </div>
            <div>
              <span>{{ text.confidence }}</span>
              <strong>{{ Math.round(report.engine.confidence * 100) }}%</strong>
              <small>Engine {{ report.engine.version }}</small>
            </div>
          </div>

          <div class="fhi-dimension-grid">
            <article v-for="dimension in dimensions" :key="dimension.key">
              <span>{{ dimension.label }}</span>
              <strong>{{ dimension.value.score }}/{{ dimension.value.maxScore }}</strong>
              <div class="fhi-meter">
                <i :style="{ width: `${dimension.value.percentage}%` }"></i>
              </div>
              <small>{{ dimension.value.percentage }}%</small>
            </article>
          </div>

          <div class="ai-report-columns">
            <div class="ai-advice-section">
              <h3>{{ text.strengths }}</h3>
              <ul class="insight-list">
                <li v-for="item in report.strengths" :key="item">{{ item }}</li>
                <li v-if="!report.strengths.length">{{ text.noStrengths }}</li>
              </ul>
            </div>
            <div class="ai-advice-section">
              <h3>{{ text.weaknesses }}</h3>
              <ul class="insight-list">
                <li v-for="item in report.weaknesses" :key="item">{{ item }}</li>
                <li v-if="!report.weaknesses.length">{{ text.noWeaknesses }}</li>
              </ul>
            </div>
          </div>

          <div v-for="section in messageSections" :key="section.key" class="ai-message-section">
            <h3>{{ section.label }}</h3>
            <div v-if="section.items.length" class="ai-message-grid">
              <article
                v-for="item in section.items"
                :key="item.id"
                class="ai-structured-message"
                :class="`severity-${item.severity}`"
              >
                <h4>{{ item.title }}</h4>
                <p><strong>{{ text.observation }}:</strong> {{ item.observation }}</p>
                <p><strong>{{ text.rootCause }}:</strong> {{ item.rootCause }}</p>
                <p><strong>{{ text.impact }}:</strong> {{ item.impact }}</p>
                <p><strong>{{ text.recommendation }}:</strong> {{ item.recommendation }}</p>
              </article>
            </div>
            <p v-else>{{ text.noContent }}</p>
          </div>
        </template>
        <p v-else>{{ text.loadFailed }}</p>
      </div>

      <div class="chat-box">
        <h2>AI Chat</h2>
        <div id="chat-history" class="chat-history">
          <div v-for="item in messages" :key="item.id" class="chat-message" :class="item.role">
            {{ item.text }}
          </div>
          <div v-if="loading" class="chat-message ai">{{ text.analyzing }}</div>
        </div>
        <form id="chat-form" class="chat-form" @submit.prevent="submitMessage">
          <input
            v-model.trim="message"
            type="text"
            id="chat-message"
            :placeholder="text.chatPlaceholder"
            required
          />
          <button type="submit" class="primary-btn" :disabled="loading">
            {{ loading ? text.sending : text.send }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { askAI, fetchFinancialHealth } from '../services/ai';

const locales = ['vi', 'en'];
const periods = [
  { value: 'weekly' },
  { value: 'monthly' },
  { value: 'quarterly' },
  { value: 'yearly' }
];
const translations = {
  vi: {
    description: 'Phân tích đa chiều dựa trên 120 quy tắc tài chính.',
    periods: { weekly: 'Tuần', monthly: 'Tháng', quarterly: 'Quý', yearly: 'Năm' },
    dimensions: {
      financialDiscipline: 'Kỷ luật tài chính',
      budgetManagement: 'Quản lý ngân sách',
      savingsAbility: 'Khả năng tiết kiệm',
      spendingEfficiency: 'Hiệu quả chi tiêu',
      riskManagement: 'Quản trị rủi ro',
      goalAchievement: 'Hoàn thành mục tiêu',
      financialStability: 'Ổn định tài chính',
      behaviorConsistency: 'Nhất quán hành vi'
    },
    risks: { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Nghiêm trọng' },
    personalities: {
      Saver: 'Người tiết kiệm',
      'Balanced Planner': 'Người lập kế hoạch cân bằng',
      'Impulsive Spender': 'Người chi tiêu bốc đồng',
      'Lifestyle Spender': 'Người chi tiêu theo phong cách sống',
      'Risk Taker': 'Người chấp nhận rủi ro',
      'Goal Driven': 'Người hướng đến mục tiêu',
      'Budget Master': 'Bậc thầy ngân sách',
      'Financial Beginner': 'Người mới quản lý tài chính'
    },
    loadingReport: 'Đang phân tích dữ liệu tài chính...',
    risk: 'Rủi ro',
    confidence: 'Độ tin cậy',
    triggeredRules: 'quy tắc được kích hoạt',
    strengths: 'Điểm mạnh',
    weaknesses: 'Điểm cần cải thiện',
    noStrengths: 'Chưa đủ dữ liệu để xác định điểm mạnh.',
    noWeaknesses: 'Không có điểm yếu nghiêm trọng trong kỳ.',
    sections: {
      warnings: 'Cảnh báo',
      insights: 'Phân tích chuyên sâu',
      recommendations: 'Khuyến nghị hành động',
      forecasts: 'Dự báo',
      achievements: 'Thành tựu'
    },
    observation: 'Quan sát',
    rootCause: 'Nguyên nhân gốc',
    impact: 'Tác động',
    recommendation: 'Khuyến nghị',
    noContent: 'Không có nội dung đáng chú ý trong mục này.',
    loadFailed: 'Không thể tải báo cáo sức khỏe tài chính.',
    analyzing: 'Đang phân tích...',
    chatPlaceholder: 'Hỏi AI: Tôi cần giảm khoản chi nào trước?',
    sending: 'Đang gửi...',
    send: 'Gửi',
    ready: 'Trợ lý tài chính AI đã sẵn sàng.',
    noReply: 'Hệ thống chưa trả lời.',
    aiFailed: 'Không thể kết nối với AI.'
  },
  en: {
    description: 'Multi-dimensional analysis powered by 120 financial rules.',
    periods: { weekly: 'Week', monthly: 'Month', quarterly: 'Quarter', yearly: 'Year' },
    dimensions: {
      financialDiscipline: 'Financial Discipline',
      budgetManagement: 'Budget Management',
      savingsAbility: 'Savings Ability',
      spendingEfficiency: 'Spending Efficiency',
      riskManagement: 'Risk Management',
      goalAchievement: 'Goal Achievement',
      financialStability: 'Financial Stability',
      behaviorConsistency: 'Behavior Consistency'
    },
    risks: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
    personalities: {
      Saver: 'Saver',
      'Balanced Planner': 'Balanced Planner',
      'Impulsive Spender': 'Impulsive Spender',
      'Lifestyle Spender': 'Lifestyle Spender',
      'Risk Taker': 'Risk Taker',
      'Goal Driven': 'Goal Driven',
      'Budget Master': 'Budget Master',
      'Financial Beginner': 'Financial Beginner'
    },
    loadingReport: 'Analyzing financial data...',
    risk: 'Risk',
    confidence: 'Confidence',
    triggeredRules: 'rules triggered',
    strengths: 'Strengths',
    weaknesses: 'Areas for improvement',
    noStrengths: 'There is not enough data to identify strengths.',
    noWeaknesses: 'No serious weakness was detected in this period.',
    sections: {
      warnings: 'Warnings',
      insights: 'Advanced insights',
      recommendations: 'Action recommendations',
      forecasts: 'Forecasts',
      achievements: 'Achievements'
    },
    observation: 'Observation',
    rootCause: 'Root Cause',
    impact: 'Impact',
    recommendation: 'Recommendation',
    noContent: 'There is no notable content in this section.',
    loadFailed: 'The financial health report could not be loaded.',
    analyzing: 'Analyzing...',
    chatPlaceholder: 'Ask AI: Which expense should I reduce first?',
    sending: 'Sending...',
    send: 'Send',
    ready: 'AI Financial Assistant is ready.',
    noReply: 'The system did not return a response.',
    aiFailed: 'Unable to connect to AI.'
  }
};

const selectedLocale = ref('vi');
const selectedPeriod = ref('monthly');
const message = ref('');
const loading = ref(false);
const insightLoading = ref(false);
const report = ref(null);
const messages = ref([]);
let reportRequestId = 0;

const text = computed(() => translations[selectedLocale.value]);
const dimensions = computed(() =>
  Object.entries(report.value?.scoreBreakdown || {}).map(([key, value]) => ({
    key,
    label: text.value.dimensions[key] || key,
    value
  }))
);
const riskLabel = computed(() => text.value.risks[report.value?.riskLevel] || '-');
const personalityLabel = computed(
  () => text.value.personalities[report.value?.financialPersonality] || report.value?.financialPersonality || '-'
);
const messageSections = computed(() =>
  ['warnings', 'insights', 'recommendations', 'forecasts', 'achievements'].map((key) => ({
    key,
    label: text.value.sections[key],
    items: report.value?.[key] || []
  }))
);

onMounted(() => {
  messages.value = [{ id: 1, role: 'ai', text: text.value.ready }];
  loadReport();
});

async function loadReport(options = {}) {
  const requestId = ++reportRequestId;
  const requestedLocale = selectedLocale.value;
  const requestedPeriod = selectedPeriod.value;
  insightLoading.value = true;
  try {
    const nextReport = await fetchFinancialHealth(
      requestedPeriod,
      requestedLocale,
      options
    );
    if (requestId !== reportRequestId) return;
    if (nextReport?.locale !== requestedLocale) {
      report.value = await fetchFinancialHealth(
        requestedPeriod,
        requestedLocale,
        { forceRefresh: true }
      );
      return;
    }
    report.value = nextReport;
  } catch (error) {
    if (requestId !== reportRequestId) return;
    console.error('Fetch financial health report failed', error);
    report.value = null;
  } finally {
    if (requestId === reportRequestId) insightLoading.value = false;
  }
}

function changePeriod(period) {
  selectedPeriod.value = period;
  loadReport();
}

function changeLocale(locale) {
  selectedLocale.value = locale;
  report.value = null;
  messages.value = [{ id: Date.now(), role: 'ai', text: text.value.ready }];
  loadReport({ forceRefresh: true });
}

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
      text: data.reply || data.message || text.value.noReply
    });
  } catch (error) {
    messages.value.push({ id: Date.now() + 2, role: 'ai', text: text.value.aiFailed });
  } finally {
    loading.value = false;
  }
}
</script>
