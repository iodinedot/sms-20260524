<script setup>
import { watch, computed } from 'vue'
import { schemas } from '@/schemas'
import BaseForm from '@/components/base/BaseForm.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { WEEKDAY_OPTIONS } from '@/constants/options'

const props = defineProps({
  modelValue: Object,
  errorFields: Object,
  updateField: Function
})

const form = computed(() => props.modelValue)

/* course form only */
// 模式一操作
const addScheduleRow = () => {
  const schedules = props.modelValue.schedules || []

  props.updateField('schedules', [
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

  props.updateField('schedules', schedules)
}

const updateScheduleField = (index, key, value) => {
  const schedules = [...(props.modelValue.schedules || [])]

  schedules[index] = {
    ...schedules[index],
    [key]: value
  }

  props.updateField('schedules', schedules)
}

watch(
  () => form.billingType,
  (newType) => {
    if (!newType) return

    if (newType === 'weekly-by-lesson') {
      props.updateField('fixedTotalAmount', 0)
    }

    if (newType === 'weekly-total' || newType === 'period-total') {
      // ❗只有當目前是空的才補
      if (!form.fixedTotalAmount) {
        props.updateField(
          'fixedTotalAmount',
          form.value.unitPrice || 0
        )
      }
    }
  }
)
/* end course form only */
</script>
<template>
  <BaseForm
    :schema="schemas.courses"
    :errorFields="errorFields"
    :modelValue="form"
    :updateField="updateField"
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
  </BaseForm>
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
