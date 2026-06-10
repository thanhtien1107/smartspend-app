<template>
  <main class="onboarding-page">
    <section class="onboarding-card">
      <div class="onboarding-brand">
        <img src="/assets/logo/app-logo.svg" alt="SmartSpend" />
        <span>SmartSpend</span>
      </div>

      <div class="onboarding-progress" aria-label="Tiến trình giới thiệu">
        <span v-for="(_, index) in steps" :key="index" :class="{ active: index <= currentStep }"></span>
      </div>

      <div class="onboarding-content">
        <div class="onboarding-visual" :class="`visual-${currentStep + 1}`">
          <span class="visual-icon">{{ activeStep.icon }}</span>
          <div class="visual-card visual-card-main">
            <small>{{ activeStep.previewLabel }}</small>
            <strong>{{ activeStep.previewValue }}</strong>
            <span>{{ activeStep.previewNote }}</span>
          </div>
          <div class="visual-chip chip-one">{{ activeStep.chipOne }}</div>
          <div class="visual-chip chip-two">{{ activeStep.chipTwo }}</div>
        </div>

        <div class="onboarding-copy">
          <span class="eyebrow">BƯỚC {{ currentStep + 1 }} / {{ steps.length }}</span>
          <h1>{{ activeStep.title }}</h1>
          <p>{{ activeStep.description }}</p>

          <div v-if="currentStep === 1" class="onboarding-choice-grid">
            <button
              v-for="goal in goals"
              :key="goal.value"
              type="button"
              :class="['choice-card', { selected: selectedGoal === goal.value }]"
              @click="selectedGoal = goal.value"
            >
              <span>{{ goal.icon }}</span>
              <strong>{{ goal.label }}</strong>
              <small>{{ goal.note }}</small>
            </button>
          </div>

          <label v-if="currentStep === 2" class="onboarding-budget-field">
            <span>Ngân sách dự kiến mỗi tháng</span>
            <div>
              <input v-model.number="monthlyBudget" type="number" min="0" step="100000" inputmode="numeric" />
              <strong>₫</strong>
            </div>
            <small>Bạn có thể thay đổi con số này trong mục Ngân sách.</small>
          </label>
        </div>
      </div>

      <footer class="onboarding-actions">
        <button type="button" class="onboarding-skip" @click="finishOnboarding">Bỏ qua</button>
        <div>
          <button v-if="currentStep > 0" type="button" class="secondary-btn" @click="currentStep--">Quay lại</button>
          <button type="button" class="primary-btn" @click="nextStep">
            {{ currentStep === steps.length - 1 ? 'Bắt đầu sử dụng' : 'Tiếp tục' }}
          </button>
        </div>
      </footer>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentStep = ref(0);
const selectedGoal = ref('control');
const monthlyBudget = ref(8000000);

const goals = [
  { value: 'control', icon: '🎯', label: 'Kiểm soát chi tiêu', note: 'Biết tiền đang đi đâu' },
  { value: 'save', icon: '🐷', label: 'Tăng khoản tiết kiệm', note: 'Đạt mục tiêu nhanh hơn' },
  { value: 'plan', icon: '📊', label: 'Lập kế hoạch tài chính', note: 'Theo dõi tổng thể mỗi tháng' }
];

const steps = [
  {
    icon: '👋',
    title: 'Chào mừng bạn đến với SmartSpend',
    description: 'Theo dõi dòng tiền, quản lý ngân sách và nhận gợi ý thông minh trong một không gian đơn giản, dễ sử dụng.',
    previewLabel: 'Sức khỏe tài chính', previewValue: 'Tốt hơn mỗi ngày', previewNote: 'Mọi con số quan trọng ở cùng một nơi',
    chipOne: 'Thu chi rõ ràng', chipTwo: 'Bảo mật dữ liệu'
  },
  {
    icon: '✨',
    title: 'Bạn muốn SmartSpend giúp điều gì nhất?',
    description: 'Lựa chọn này giúp chúng tôi ưu tiên nội dung phù hợp hơn trên trang tổng quan của bạn.',
    previewLabel: 'Mục tiêu của bạn', previewValue: 'Tài chính chủ động', previewNote: 'Thiết lập trải nghiệm phù hợp với bạn',
    chipOne: 'Cá nhân hóa', chipTwo: 'Dễ thay đổi'
  },
  {
    icon: '💳',
    title: 'Đặt ngân sách khởi đầu',
    description: 'Một mức ngân sách tham khảo giúp bạn nhanh chóng nhận cảnh báo khi chi tiêu gần vượt giới hạn.',
    previewLabel: 'Ngân sách tháng', previewValue: '8.000.000 ₫', previewNote: 'Theo dõi tiến độ theo thời gian thực',
    chipOne: 'Cảnh báo sớm', chipTwo: 'Không áp lực'
  },
  {
    icon: '🚀',
    title: 'Mọi thứ đã sẵn sàng!',
    description: 'Hãy bắt đầu bằng giao dịch đầu tiên. SmartSpend sẽ tự động tổng hợp báo cáo và đưa ra insight cho bạn.',
    previewLabel: 'Bước tiếp theo', previewValue: 'Thêm giao dịch', previewNote: 'Chỉ mất vài giây để ghi lại',
    chipOne: 'Nhanh chóng', chipTwo: 'Thông minh hơn'
  }
];

const activeStep = computed(() => steps[currentStep.value]);

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value += 1;
    return;
  }
  finishOnboarding();
}

function finishOnboarding() {
  localStorage.setItem('smartspendOnboardingCompleted', 'true');
  localStorage.setItem('smartspendPrimaryGoal', selectedGoal.value);
  localStorage.setItem('smartspendSuggestedBudget', String(monthlyBudget.value || 0));
  router.replace('/');
}
</script>
