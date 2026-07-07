<script setup>
import { watch, computed } from 'vue'
import { schemas } from '@/schemas'
import BaseButton from '@/components/base/BaseButton.vue';
import FormRenderer from '@/components/shared/FormRenderer.vue'
import { WEEKDAY_OPTIONS } from '@/constants/options'

const courseFields = schemas.courses.fields
const props = defineProps({
  errorFields: Object,
  modelValue: Object,
  isOpen: Boolean
})

const emit = defineEmits([
  'update:modelValue',
  'update:isOpen',
  'save'
])

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const updateField = (field, value) => {
  console.log("update", field, value)
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleSave = () => {
  console.log("handleSave in CourseForm:", props.modelValue)
  emit('save', props.modelValue)
}

const closeModal = () => {
  emit('update:isOpen', false);
};

/* course form only */
// 模式一操作
const addScheduleRow = () => {
  const schedules = props.modelValue.schedules || []

  updateField('schedules', [
    ...schedules,
    {
      dayOfWeek: 1,
      startTime: '13:00',
      endTime: '15:00',
    }
  ])
}

const removeScheduleRow = (index) => {
  const schedules = [...(props.modelValue.schedules || [])]
  schedules.splice(index, 1)

  updateField('schedules', schedules)
}

const updateScheduleField = (index, key, value) => {
  const schedules = [...(props.modelValue.schedules || [])]

  schedules[index] = {
    ...schedules[index],
    [key]: value
  }

  updateField('schedules', schedules)
}

watch(
  () => form.billingType,
  (newType) => {
    if (!newType) return

    if (newType === 'weekly-by-lesson') {
      form.fixedTotalAmount = 0
    }

    if (newType === 'weekly-total' || newType === 'period-total') {
      // ❗只有當目前是空的才補
      if (!form.fixedTotalAmount) {
        form.fixedTotalAmount = form.unitPrice || 0
      }
    }
  }
)
/* end course form only */
</script>
<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h3>編輯課程</h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <FormRenderer
          :fields="courseFields"
          v-model="form"
          :errorFields="errorFields"
        >

          <div class="form-group col-2" v-if="['weekly-by-lesson', 'weekly-total'].includes(modelValue.billingType)" >
            <!-- 只有 weekly-by-lesson 才顯示 -->
            <label class="form-label">上課時間</label>
            <div class="schedule-list">
              <div
                v-for="(row, index) in modelValue.schedules || []"
                :key="index"
                class="time-row"
              >
                <!-- 星期 -->
                <select
                  :value="row.dayOfWeek"
                  @change="updateScheduleField(index, 'dayOfWeek', Number($event.target.value))"
                  class="base-select"
                >
                  <option
                    v-for="opt in WEEKDAY_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>

                <!-- 開始時間 -->
                <input
                  type="time"
                  :value="row.startTime"
                  @input="updateScheduleField(index, 'startTime', $event.target.value)"
                  class="base-input"
                />

                <!-- 結束時間 -->
                <input
                  type="time"
                  :value="row.endTime"
                  @input="updateScheduleField(index, 'endTime', $event.target.value)"
                  class="base-input"
                />

                <!-- 刪除 -->
                <BaseButton variant="outline" text="×" @click="removeScheduleRow(index)" class="close-x" />
              </div>

              <!-- 新增 -->
              <BaseButton
                responsive
                variant="primary"
                icon="＋"
                text="新增上課時段"
                title="新增上課時段"
                @click="addScheduleRow"
              />
            </div>
          </div>
        </FormRenderer>
      </div>

      <div class="modal-footer">
        <BaseButton
          variant="outline"
          text="取消"
          @click="emit('update:isOpen', false)"
        />
        <BaseButton
          variant="primary"
          icon="💾"
          text="儲存變更"
          @click="handleSave"
          responsive
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-row {
  display: grid;
  grid-template-columns: 110px 1fr 1fr auto;

  gap: 8px;
  align-items: stretch; /* ⭐ 關鍵 */
}

.time-row > * {
  height: 100%;
}

.time-row .btn {
  height: 100%;
  min-height: 36px;
}

.time-row .base-input,
.time-row .base-select {
  width: 100%;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
