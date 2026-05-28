<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>💰 批次產生繳費單</h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x"  :disabled="isProcessing"/>
      </div>

      <div class="modal-body">
        <p class="text-secondary" style="margin-bottom: 16px">
          即將為已勾選的
          <strong class="text-primary">{{ selectedStudents.length }}</strong>
          位學生建立個別的課程繳費單。請確認以下計費範圍：
        </p>

        <div class="form-group">
          <label class="form-label">計費期別 (標題展示用)</label>
          <input
            v-model="billingPeriod"
            type="text"
            class="base-input"
            placeholder="例如：2026-05 或 2026-Spring"
            :disabled="isProcessing"
          />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">計費開始日期</label>
            <input
              v-model="startDate"
              type="date"
              class="base-input"
              :disabled="isProcessing"
            />
          </div>

          <div class="form-group">
            <label class="form-label">計費結束日期</label>
            <input
              v-model="endDate"
              type="date"
              class="base-input"
              :disabled="isProcessing"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <BaseButton variant="outline" 
          text="取消" 
          @click="closeModal" 
          :disabled="isProcessing" 
        />
      
        <BaseButton
          responsive
          variant="primary"
          icon="✓"
          :text="isProcessing ? '正在產生帳單...' : '確認產生並前往查看'"
          :disabled="isProcessing"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { billingService } from '../services/billingService';
import BaseButton from '../components/BaseButton.vue';


const props = defineProps({
  isOpen: { type: Boolean, required: true },
  selectedStudents: { type: Array, default: () => [] }, // 外層傳入被勾選的學生陣列
  allCourses: { type: Array, default: () => [] }, // 外層傳入的課程清單
});

// 💡 修正：在 emit 中加入 'switch-tab'，用來通知外層的最上層組件（如 App.vue）切換頁面
const emit = defineEmits(['update:isOpen', 'success', 'switch-tab']);

// --- 響應式表單變數 ---
const billingPeriod = ref('');
const startDate = ref('');
const endDate = ref('');
const isProcessing = ref(false);

// 輔助函數：取得當前年月份與日期區間（預設值）
const initDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // 1. 期別預設為當前年月 (例如 "2026-05")
  billingPeriod.value = `${year}-${month}`;

  // 2. 開始日期預設為當月 1 號
  startDate.value = `${year}-${month}-01`;

  // 3. 結束日期預設為當月最後一天
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  endDate.value = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
};

// 監聽彈窗開啟時，初始化預設時間
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      initDefaultDates();
    }
  }
);

const closeModal = () => {
  if (isProcessing.value) return;
  emit('update:isOpen', false);
};

// 提交產單
const handleSubmit = async () => {
  if (!billingPeriod.value.trim() || !startDate.value || !endDate.value) {
    alert('請完整填寫所有欄位！');
    return;
  }

  isProcessing.value = true;
  try {
    // 呼叫 Firebase 批次寫入管線
    await billingService.createBatchBills({
      students: props.selectedStudents,
      allCourses: props.allCourses,
      periodType: 'month',
      billingPeriod: billingPeriod.value.trim(),
      startDate: startDate.value,
      endDate: endDate.value,
    });

    alert(`成功為 ${props.selectedStudents.length} 位學生產生繳費單！`);

    // 🚀【核心體驗優化】改成透過事件，通知 StudentManager 轉發換頁需求
    emit('switch-tab', 'billing');

    emit('success');
    closeModal();
  } catch (error) {
    alert('產生繳費單時發生錯誤，請檢查主控台訊息。');
  } finally {
    isProcessing.value = false;
  }
};
</script>
