<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="manager-toolbar">
        <h3 class="page-title" style="margin: 0; flex: 1">
          {{ localCourse.id ? '編輯課程種類' : '新增課程種類' }}
        </h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">課程名稱</label>
          <input
            v-model="localCourse.name"
            class="base-input"
            placeholder="例如：進階英文寫作"
          />
        </div>

        <div class="form-group">
          <label class="form-label">課程描述</label>
          <textarea
            v-model="localCourse.description"
            class="base-textarea"
            placeholder="簡述課程內容..."
          ></textarea>
        </div>

        <div class="form-grid">
          <!-- 分校 -->
          <div class="form-group" style="margin: 0">
            <label class="form-label">分校</label>
            <select v-model="localCourse.campusId" class="base-select">
              <option value="">-- 請選擇分校 --</option>
              <option v-for="opt in getOptions('campuses')" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- 人數上限 -->
          <div class="form-group" style="margin: 0">
            <label class="form-label">人數上限</label>
            <input
              type="number"
              v-model.number="localCourse.maxStudents"
              class="base-input"
              placeholder="例如：10"
            />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group" style="margin: 0">
            <label class="form-label">排課計費模式</label>
            <select
              v-model="localCourse.billingType"
              class="base-select"
              :disabled="!!localCourse.id"
            >
              <option value="fixed-weekly">
                模式一：每週固定課程 (設定週幾)
              </option>
              <option value="fixed-period">
                模式二：固定期間單次收費 (例如營隊)
              </option>
            </select>
          </div>

          <div class="form-group" style="margin: 0">
            <label class="form-label">授課老師</label>
            <select v-model="localCourse.teacherId" class="base-select">
              <option value="">-- 請選擇授課老師 --</option>
              <option v-for="opt in getOptions('teachers')" :key="opt.id" :value="opt.id">
                {{ opt.name }}
              </option>

            </select>
          </div>
        </div>

        <div v-if="localCourse.billingType === 'fixed-weekly'">
          <div class="form-group">
            <label
              class="form-label"
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
              "
            >
              <input
                type="checkbox"
                v-model="localCourse.isCalculatedByTotal"
              />
              使用學期固定總價計費 (不論上課幾堂)
            </label>
          </div>

          <div v-if="!localCourse.isCalculatedByTotal" class="form-group">
            <label class="form-label">每堂單價</label>
            <input
              type="number"
              v-model.number="localCourse.unitPrice"
              class="base-input"
              placeholder="請輸入單堂價格"
            />
          </div>
          <div v-else class="form-group">
            <label class="form-label">學期固定總金額</label>
            <input
              type="number"
              v-model.number="localCourse.fixedTotalAmount"
              class="base-input"
              placeholder="請輸入整學期總價"
            />
          </div>

          <div class="form-group" style="margin-top: 20px">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
              "
            >
              <span class="font-bold"
                >上課時段 (每週固定 {{ classCountPerWeek }} 堂)</span
              >
              <BaseButton
                variant="outline"
                icon="＋"
                text="新增排課時段"
                @click="addScheduleRow"
                responsive
              />
            </div>

            <div
              v-for="(sch, index) in localCourse.schedules"
              :key="index"
              class="adj-input-group"
              style="margin-top: 8px; padding: 10px"
            >
              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  width: 100%;
                "
              >
                <select
                  v-model.number="sch.dayOfWeek"
                  class="base-select"
                >
                  <option :value="1">星期一</option>
                  <option :value="2">星期二</option>
                  <option :value="3">星期三</option>
                  <option :value="4">星期四</option>
                  <option :value="5">星期五</option>
                  <option :value="6">星期六</option>
                  <option :value="0">星期日</option>
                </select>
                <input
                  type="time"
                  v-model="sch.startTime"
                  step="300"
                  class="base-input"
                />
                <span class="text-small">至</span>
                <input
                  type="time"
                  v-model="sch.endTime"
                  step="300"
                  class="base-input"
                />
                <BaseButton
                  responsive
                  variant="remove"
                  icon="x"
                  text="刪除"
                  @click="removeScheduleRow(index)"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="localCourse.billingType === 'fixed-period'">
          <div class="form-grid">
            <div class="form-group" style="margin: 0">
              <label class="form-label">開始日期</label>
              <input
                type="date"
                v-model="localCourse.startDate"
                class="base-input"
              />
            </div>
            <div class="form-group" style="margin: 0">
              <label class="form-label">結束日期</label>
              <input
                type="date"
                v-model="localCourse.endDate"
                class="base-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">期間固定收費金額 (總額)</label>
            <input
              type="number"
              v-model.number="localCourse.fixedTotalAmount"
              class="base-input"
              placeholder="例如：3000"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <BaseButton variant="outline" text="取消" @click="closeModal" />
        <BaseButton
          variant="primary"
          icon="💾"
          text="儲存變更"
          @click="handleSubmit"
          responsive
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import BaseButton from '../components/BaseButton.vue';
import { useSettings } from '../composables/useSettings.js';
const { getOptions } = useSettings()

const props = defineProps({
  isOpen: Boolean,
  modelValue: Object,
});

const emit = defineEmits(['update:isOpen', 'save']);

const localCourse = ref({});

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return

    if (props.modelValue) {
      localCourse.value = JSON.parse(JSON.stringify(props.modelValue))
    } else {
      localCourse.value = getEmptyCourse()
    }
  },
  { immediate: true }
)

// 計算屬性：自動推算每週堂數
const classCountPerWeek = computed(
  () => localCourse.value.schedules?.length || 0
);

// 模式一操作
const addScheduleRow = () => {
  if (!localCourse.value.schedules) localCourse.value.schedules = [];
  localCourse.value.schedules.push({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '11:00',
  });
};
const removeScheduleRow = (index) => {
  localCourse.value.schedules.splice(index, 1);
};

// 💡 模式二操作優雅瘦身：徹底移除舊有關於 weeklyRates 的操作函式，保持程式碼乾淨無雜質。
const closeModal = () => {
  emit('update:isOpen', false);
};

const handleSubmit = () => {
  if (!localCourse.value.name || !localCourse.value.name.trim()) {
    alert('請輸入課程種類名稱');
    return;
  }

  if (!localCourse.value.teacherId) {
    localCourse.value.teacherId = '';
  }

  emit('save', localCourse.value);
};
</script>
